import { Router } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database'; // Pastikan file ini menggunakan Pool dari library 'pg'

const router = Router();

/**
 * 1. POST /api/auth/register
 * Digunakan untuk pendaftaran RESTORAN BARU dan PEMILIK pertama.
 */
router.post('/register', async (req, res) => {
  const { restaurant_name, username, password, role } = req.body;

  if (!restaurant_name || !username || !password || !role) {
    return res.status(400).json({ error: 'Mohon isi semua data: Nama Restoran, Username, Password, dan Role.' });
  }

  try {
    // Gunakan transaksi agar jika salah satu gagal, semua dibatalkan
    await db.query('BEGIN');

    // TAHAP A: Buat entitas Restoran baru
    const restoInsert = await db.query(
      'INSERT INTO restaurants (name) VALUES ($1) RETURNING id',
      [restaurant_name]
    );
    const newRestoId = restoInsert.rows[0].id;

    // TAHAP B: Hash Password (Keamanan)
    const hashedPassword = bcrypt.hashSync(password, 10);

    // TAHAP C: Buat User Pemilik yang terkunci ke ID Restoran tersebut
    await db.query(
      'INSERT INTO users (restaurant_id, username, password, role, nama) VALUES ($1, $2, $3, $4, $5)',
      [newRestoId, username, hashedPassword, role, username]
    );

    // TAHAP D: Buat Shift default (Shift 1 & 2) untuk restoran baru ini
    await db.query(
      `INSERT INTO shifts (restaurant_id, nama, jam_mulai, jam_akhir) 
       VALUES ($1, 'Shift 1', '08:00', '16:00'), ($1, 'Shift 2', '16:00', '24:00')`,
      [newRestoId]
    );

    await db.query('COMMIT');
    res.status(201).json({ success: true, message: 'Restoran dan Akun berhasil didaftarkan!' });

  } catch (err: any) {
    await db.query('ROLLBACK');
    console.error('Register Error:', err);
    if (err.message.includes('unique constraint')) {
      return res.status(400).json({ error: 'Username sudah digunakan, silakan pilih nama lain.' });
    }
    res.status(500).json({ error: 'Gagal mendaftar ke server.' });
  }
});

/**
 * 2. POST /api/auth/login
 * Mencocokkan kredensial dan membuat sesi kerja (Shift Session)
 */
router.post('/login', async (req, res) => {
  const { username, password, shift_id } = req.body;

  try {
    // Cari user di database
    const userSearch = await db.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = userSearch.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Validasi Password (Bcrypt)
    const isMatch = bcrypt.compareSync(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Ambil data Shift
    const shiftSearch = await db.query('SELECT * FROM shifts WHERE id = $1', [shift_id]);
    const shift = shiftSearch.rows[0];

    if (!shift) {
      return res.status(400).json({ error: 'Shift tidak valid.' });
    }

    // Buat Sesi Login baru di tabel shift_sessions
    const today = new Date().toISOString().split('T')[0];
    const sessionInsert = await db.query(
      `INSERT INTO shift_sessions (restaurant_id, user_id, shift_id, login_at, date) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING id`,
      [user.restaurant_id, user.id, shift.id, today]
    );

    // Kirim data lengkap ke Frontend
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nama: user.nama,
        restaurant_id: user.restaurant_id
      },
      shift: {
        id: shift.id,
        nama: shift.nama
      },
      session_id: sessionInsert.rows[0].id,
      login_at: new Date().toISOString()
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada sistem login.' });
  }
});

/**
 * 3. GET /api/auth/me
 * Mengecek apakah session ID di localStorage masih aktif di database
 */
router.get('/me-with-permissions', async (req, res) => {
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace('Bearer ', '').trim();
  const sessionId = Number(token);
 
  if (!sessionId) {
    return res.status(401).json({ error: 'Sesi tidak ditemukan' });
  }
 
  try {
    const checkSession = await db.query(
      `SELECT ss.id as session_id, u.id as user_id, u.username, u.role, 
              u.nama, u.restaurant_id, u.is_active
       FROM shift_sessions ss
       JOIN users u ON ss.user_id = u.id
       WHERE ss.id = $1 AND ss.logout_at IS NULL`,
      [sessionId]
    );
 
    const session = checkSession.rows[0];
    if (!session) {
      return res.status(401).json({ error: 'Sesi telah berakhir atau tidak valid' });
    }
 
    if (!session.is_active) {
      return res.status(403).json({ error: 'Akun telah dinonaktifkan' });
    }
 
    // Ambil permissions
    const permissions = await db.query(
      `SELECT menu, can_view, can_add, can_edit, can_delete
       FROM user_permissions WHERE user_id = $1`,
      [session.user_id]
    );
 
    res.json({
      user: {
        id: session.user_id,
        username: session.username,
        role: session.role,
        nama: session.nama,
        restaurant_id: session.restaurant_id,
      },
      session_id: session.session_id,
      permissions: permissions.rows,
    });
 
  } catch (err) {
    console.error('Check Session Error:', err);
    res.status(500).json({ error: 'Server gagal memvalidasi sesi' });
  }
});
/**
 * 4. POST /api/auth/logout
 * Menutup sesi kerja
 */
router.post('/logout', async (req, res) => {
  const { session_id } = req.body;
  if (!session_id) return res.status(400).json({ error: 'Session ID diperlukan.' });

  try {
    await db.query(
      'UPDATE shift_sessions SET logout_at = CURRENT_TIMESTAMP WHERE id = $1',
      [session_id]
    );
    res.json({ success: true, message: 'Berhasil keluar.' });
  } catch (err) {
    res.status(500).json({ error: 'Gagal melakukan logout.' });
  }
});
router.post('/login-pin', async (req, res) => {
  const { username, pin, shift_id } = req.body;
 
  if (!username || !pin) {
    return res.status(400).json({ error: 'Username dan PIN wajib diisi' });
  }
 
  try {
    // Cari user aktif
    const userSearch = await db.query(
      `SELECT * FROM users 
       WHERE username = $1 AND is_active = true`,
      [username]
    );
    const user = userSearch.rows[0];
 
    if (!user) {
      return res.status(401).json({ error: 'Username tidak ditemukan atau akun nonaktif' });
    }
 
    // Pemilik tidak boleh login via PIN
    if (user.role === 'Pemilik') {
      return res.status(403).json({ error: 'Owner harus login dengan password' });
    }
 
    // Validasi PIN
    if (!user.pin) {
      return res.status(401).json({ error: 'PIN belum diset, hubungi Owner' });
    }
 
    const isPinValid = bcrypt.compareSync(String(pin), user.pin);
    if (!isPinValid) {
      return res.status(401).json({ error: 'PIN salah' });
    }
 
    // Ambil shift
    const shiftSearch = await db.query(
      'SELECT * FROM shifts WHERE id = $1 AND restaurant_id = $2',
      [shift_id, user.restaurant_id]
    );
    const shift = shiftSearch.rows[0];
 
    if (!shift) {
      return res.status(400).json({ error: 'Shift tidak valid' });
    }
 
    // Buat sesi baru
    const today = new Date().toISOString().split('T')[0];
    const sessionInsert = await db.query(
      `INSERT INTO shift_sessions (restaurant_id, user_id, shift_id, login_at, date)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4) RETURNING id`,
      [user.restaurant_id, user.id, shift.id, today]
    );
 
    // Update last_login
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );
 
    // Ambil permissions user
    const permissions = await db.query(
      `SELECT menu, can_view, can_add, can_edit, can_delete
       FROM user_permissions
       WHERE user_id = $1`,
      [user.id]
    );
 
    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nama: user.nama,
        restaurant_id: user.restaurant_id,
      },
      shift: { id: shift.id, nama: shift.nama },
      session_id: sessionInsert.rows[0].id,
      permissions: permissions.rows,
      login_at: new Date().toISOString(),
    });
 
  } catch (err) {
    console.error('PIN Login Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada sistem login' });
  }
});

// PENTING: Export default agar bisa di-import di index.ts
export default router;