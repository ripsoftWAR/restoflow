import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database';
import { generateToken, verifyToken, generateRefreshToken, generateTokenFamily, verifyRefreshToken } from '../utils/jwt';

const router = Router();

/**
 * POST /api/auth/register
 * Pendaftaran RESTORAN BARU dan PEMILIK pertama.
 */
router.post('/register', async (req: Request, res: Response) => {
  const { restaurant_name, username, password, role } = req.body;

  if (!restaurant_name || !username || !password || !role) {
    return res.status(400).json({ error: 'Mohon isi semua data: Nama Restoran, Username, Password, dan Role.' });
  }

  try {
    await db.query('BEGIN');

    // Buat entitas Restoran baru
    const restoInsert = await db.query(
      'INSERT INTO restaurants (name) VALUES ($1) RETURNING id',
      [restaurant_name]
    );
    const newRestoId = restoInsert.rows[0].id;

    // Hash Password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Buat User Pemilik
    await db.query(
      'INSERT INTO users (restaurant_id, username, password, role, nama) VALUES ($1, $2, $3, $4, $5)',
      [newRestoId, username, hashedPassword, role, username]
    );

    // Buat Shift default
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
 * POST /api/auth/login
 * Login dengan password → return JWT token.
 */
router.post('/login', async (req: Request, res: Response) => {
  const { username, password, shift_id } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  try {
    // Cari user (case-insensitive)
    const userSearch = await db.query(
      'SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND is_active = true',
      [username]
    );
    const user = userSearch.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Username atau password salah.' });
    }

    // Validasi Password
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

    // Buat Sesi Login
    const today = new Date().toISOString().split('T')[0];
    const tokenFamily = generateTokenFamily();

    const sessionInsert = await db.query(
      `INSERT INTO shift_sessions (restaurant_id, user_id, shift_id, login_at, date, token_family, refresh_count) 
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, 0) RETURNING id`,
      [user.restaurant_id, user.id, shift.id, today, tokenFamily]
    );

    const sessionId = sessionInsert.rows[0].id;

    // Update last_login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate JWT access token
    const token = generateToken({
      session_id: sessionId,
      user_id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
      restaurant_id: user.restaurant_id,
      shift_id: shift.id,
      shift_nama: shift.nama,
    });

    // Generate refresh token
    const refreshToken = generateRefreshToken({
      session_id: sessionId,
      user_id: user.id,
      token_family: tokenFamily,
    });

    // Ambil features user
    const features = await db.query(
      `SELECT feature_key, enabled FROM user_features WHERE user_id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      token,
      refresh_token: refreshToken,
      session_id: sessionId,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nama: user.nama,
        restaurant_id: user.restaurant_id,
      },
      shift: {
        id: shift.id,
        nama: shift.nama,
      },
      features: features.rows,
      login_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error('Login Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada sistem login.' });
  }
});

/**
 * POST /api/auth/login-pin
 * Login dengan PIN (untuk staff) → return JWT token.
 */
router.post('/login-pin', async (req: Request, res: Response) => {
  const { username, pin, shift_id } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ error: 'Username dan PIN wajib diisi' });
  }

  try {
    // Cari user aktif (case-insensitive)
    const userSearch = await db.query(
      `SELECT * FROM users WHERE LOWER(username) = LOWER($1) AND is_active = true`,
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
    const tokenFamily = generateTokenFamily();

    const sessionInsert = await db.query(
      `INSERT INTO shift_sessions (restaurant_id, user_id, shift_id, login_at, date, token_family, refresh_count)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP, $4, $5, 0) RETURNING id`,
      [user.restaurant_id, user.id, shift.id, today, tokenFamily]
    );

    const sessionId = sessionInsert.rows[0].id;

    // Update last_login
    await db.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate JWT access token
    const token = generateToken({
      session_id: sessionId,
      user_id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
      restaurant_id: user.restaurant_id,
      shift_id: shift.id,
      shift_nama: shift.nama,
    });

    // Generate refresh token
    const refreshToken = generateRefreshToken({
      session_id: sessionId,
      user_id: user.id,
      token_family: tokenFamily,
    });

    // Ambil features user
    const features = await db.query(
      `SELECT feature_key, enabled FROM user_features WHERE user_id = $1`,
      [user.id]
    );

    res.json({
      success: true,
      token,
      refresh_token: refreshToken,
      session_id: sessionId,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nama: user.nama,
        restaurant_id: user.restaurant_id,
      },
      shift: { id: shift.id, nama: shift.nama },
      features: features.rows,
      login_at: new Date().toISOString(),
    });

  } catch (err) {
    console.error('PIN Login Error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada sistem login' });
  }
});

/**
 * GET /api/auth/me
 * Cek session via JWT — return user data.
 */
router.get('/me', async (req: Request, res: Response) => {
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
  }

  try {
    // Cek session masih aktif
    const checkSession = await db.query(
      `SELECT id FROM shift_sessions WHERE id = $1 AND logout_at IS NULL`,
      [payload.session_id]
    );

    if (!checkSession.rows[0]) {
      return res.status(401).json({ error: 'Sesi telah berakhir atau tidak valid' });
    }

    // Cek user masih aktif
    const userCheck = await db.query(
      'SELECT is_active FROM users WHERE id = $1',
      [payload.user_id]
    );

    if (!userCheck.rows[0]?.is_active) {
      return res.status(403).json({ error: 'Akun telah dinonaktifkan' });
    }

    res.json({
      success: true,
      user: {
        id: payload.user_id,
        username: payload.username,
        role: payload.role,
        nama: payload.nama,
        restaurant_id: payload.restaurant_id,
      },
      shift: {
        id: payload.shift_id,
        nama: payload.shift_nama,
      },
    });
  } catch (err) {
    console.error('Check Session Error:', err);
    res.status(500).json({ error: 'Server gagal memvalidasi sesi' });
  }
});

/**
 * GET /api/auth/me-with-permissions
 * Cek session + return user features (untuk permission matrix).
 */
router.get('/me-with-permissions', async (req: Request, res: Response) => {
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
  }

  try {
    const checkSession = await db.query(
      `SELECT id FROM shift_sessions WHERE id = $1 AND logout_at IS NULL`,
      [payload.session_id]
    );

    if (!checkSession.rows[0]) {
      return res.status(401).json({ error: 'Sesi telah berakhir atau tidak valid' });
    }

    const userCheck = await db.query(
      'SELECT is_active FROM users WHERE id = $1',
      [payload.user_id]
    );

    if (!userCheck.rows[0]?.is_active) {
      return res.status(403).json({ error: 'Akun telah dinonaktifkan' });
    }

    // Ambil features
    const features = await db.query(
      `SELECT feature_key, enabled FROM user_features WHERE user_id = $1`,
      [payload.user_id]
    );

    res.json({
      success: true,
      user: {
        id: payload.user_id,
        username: payload.username,
        role: payload.role,
        nama: payload.nama,
        restaurant_id: payload.restaurant_id,
      },
      features: features.rows,
    });

  } catch (err) {
    console.error('Check Session Error:', err);
    res.status(500).json({ error: 'Server gagal memvalidasi sesi' });
  }
});

/**
 * GET /api/auth/shifts-by-username/:username
 * PUBLIC — digunakan halaman login untuk menampilkan pilihan shift.
 */
router.get('/shifts-by-username/:username', async (req: Request, res: Response) => {
  const { username } = req.params;

  if (!username || username.trim().length === 0) {
    return res.status(400).json({ error: 'Username tidak boleh kosong' });
  }

  try {
    const userResult = await db.query(
      'SELECT id, restaurant_id FROM users WHERE LOWER(username) = LOWER($1)',
      [username.trim()]
    );

    if (!userResult.rows[0]) {
      return res.json([]);
    }

    const { restaurant_id } = userResult.rows[0];

    const shiftsResult = await db.query(
      'SELECT id, nama, jam_mulai, jam_akhir FROM shifts WHERE restaurant_id = $1 ORDER BY id',
      [restaurant_id]
    );

    return res.json(shiftsResult.rows);

  } catch (err: any) {
    console.error('[shifts-by-username] Error:', {
      message: err?.message || err,
      code: err?.code,
    });

    if (err?.code === '42P01') {
      return res.status(500).json({
        error: 'Database belum siap (tabel shifts tidak ditemukan)',
        hint: 'Jalankan CREATE TABLE shifts di Supabase SQL Editor'
      });
    }

    return res.status(500).json({
      error: 'Gagal mengambil shift',
      detail: process.env.NODE_ENV !== 'production' ? err?.message : undefined
    });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token menggunakan refresh token.
 * Menerapkan token rotation — refresh token lama langsung invalid setelah dipakai.
 */
router.post('/refresh', async (req: Request, res: Response) => {
  const { refresh_token } = req.body;

  if (!refresh_token) {
    return res.status(400).json({ error: 'Refresh token diperlukan' });
  }

  // 1. Verify refresh token
  const refreshPayload = verifyRefreshToken(refresh_token);
  if (!refreshPayload) {
    return res.status(401).json({ error: 'Refresh token tidak valid atau sudah kadaluarsa. Silakan login ulang.' });
  }

  try {
    // 2. Cek session masih aktif
    const sessionResult = await db.query(
      `SELECT id, user_id, shift_id, token_family, refresh_count, logout_at 
       FROM shift_sessions WHERE id = $1`,
      [refreshPayload.session_id]
    );

    const session = sessionResult.rows[0];

    if (!session) {
      return res.status(401).json({ error: 'Sesi tidak ditemukan' });
    }

    // 3. Cek apakah session sudah logout
    if (session.logout_at) {
      return res.status(401).json({ error: 'Sesi telah berakhir. Silakan login ulang.' });
    }

    // 4. Cek token family match (deteksi reuse/replay attack)
    if (session.token_family !== refreshPayload.token_family) {
      // Token family mismatch — possible token theft! Invalidate seluruh family.
      await db.query(
        'UPDATE shift_sessions SET logout_at = CURRENT_TIMESTAMP WHERE id = $1',
        [refreshPayload.session_id]
      );
      console.warn(`⚠️ Token family mismatch untuk session ${refreshPayload.session_id} — session dihentikan.`);
      return res.status(401).json({ error: 'Token mencurigakan. Sesi dihentikan demi keamanan.' });
    }

    // 5. Ambil data user terkini
    const userResult = await db.query(
      `SELECT u.*, s.nama as shift_nama 
       FROM users u 
       JOIN shifts s ON s.id = $2 
       WHERE u.id = $1 AND u.is_active = true`,
      [session.user_id, session.shift_id]
    );

    const user = userResult.rows[0];
    if (!user) {
      return res.status(403).json({ error: 'Akun telah dinonaktifkan' });
    }

    // 6. Generate token family BARU (rotate!)
    const newTokenFamily = generateTokenFamily();

    // Update session dengan family baru + increment counter
    await db.query(
      `UPDATE shift_sessions 
       SET token_family = $1, refresh_count = refresh_count + 1 
       WHERE id = $2`,
      [newTokenFamily, refreshPayload.session_id]
    );

    // 7. Generate access token baru
    const newAccessToken = generateToken({
      session_id: session.id,
      user_id: user.id,
      username: user.username,
      role: user.role,
      nama: user.nama,
      restaurant_id: user.restaurant_id,
      shift_id: session.shift_id,
      shift_nama: user.shift_nama,
    });

    // 8. Generate refresh token baru
    const newRefreshToken = generateRefreshToken({
      session_id: session.id,
      user_id: user.id,
      token_family: newTokenFamily,
    });

    res.json({
      success: true,
      token: newAccessToken,
      refresh_token: newRefreshToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        nama: user.nama,
        restaurant_id: user.restaurant_id,
      },
    });

  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Gagal memperbarui token' });
  }
});

/**
 * POST /api/auth/logout
 * Menutup sesi kerja. Client kirim token, kita update shift_sessions.
 */
router.post('/logout', async (req: Request, res: Response) => {
  // Coba ambil session_id dari body ATAU dari JWT token
  const authHeader = String(req.headers.authorization || '');
  const token = authHeader.replace('Bearer ', '').trim();
  const payload = verifyToken(token);
  const session_id = req.body.session_id || payload?.session_id;

  if (!session_id) {
    return res.status(400).json({ error: 'Session ID diperlukan.' });
  }

  try {
    await db.query(
      'UPDATE shift_sessions SET logout_at = CURRENT_TIMESTAMP WHERE id = $1',
      [session_id]
    );
    res.json({ success: true, message: 'Berhasil keluar.' });
  } catch (err) {
    console.error('Logout Error:', err);
    res.status(500).json({ error: 'Gagal melakukan logout.' });
  }
});

export default router;
