import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import db from '../db/database';
import { requireAuth } from '../utils/authMiddleware';

const router = Router();
router.use(requireAuth);

// ── Helper: log aktivitas ─────────────────────────────────────────────────────
const logActivity = async (
  userId: number,
  restaurantId: number,
  action: string,
  targetType?: string,
  targetId?: string,
  detail?: object
) => {
  try {
    await db.query(
      `INSERT INTO activity_logs (user_id, restaurant_id, action, target_type, target_id, detail)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, restaurantId, action, targetType || null, targetId || null, detail ? JSON.stringify(detail) : null]
    );
  } catch (e) {
    console.error('Log activity error:', e);
  }
};

// ── Helper: insert default features ──────────────────────────────────────────
const FEATURE_KEYS_DEFAULT: Record<string, string[]> = {
  Pemilik: [], // Pemilik tidak butuh row — selalu full access
  Manajer: [
    'pos.view', 'pos.create_transaction', 'pos.view_history', 'pos.export_csv', 'pos.export_pdf',
    'pos.thermal_print', 'pos.generate_voucher', 'pos.apply_voucher',
    'sales.view_log', 'sales.view_stats', 'sales.export_csv', 'sales.export_pdf', 'sales.filter_date',
    'inventory.view', 'inventory.add', 'inventory.edit', 'inventory.delete', 'inventory.adjust_stock', 'inventory.view_logs',
    'recipes.view', 'recipes.add', 'recipes.edit', 'recipes.delete',
    'dashboard.view', 'dashboard.view_stats', 'dashboard.view_insights',
    'ai.chat', 'ocr.scan', 'ocr.confirm',
    'users.view',
    'settings.view',
  ],
  Kasir: [
    'pos.view', 'pos.create_transaction', 'pos.view_history',
    'pos.apply_voucher',
    'sales.view_log',
    'ocr.scan', 'ocr.confirm',
  ],
  Dapur: [
    'recipes.view',
    'inventory.view',
  ],
};

const ALL_FEATURE_KEYS = [
  // POS
  'pos.view', 'pos.create_transaction', 'pos.view_history', 'pos.export_csv', 'pos.export_pdf',
  'pos.thermal_print', 'pos.generate_voucher', 'pos.apply_voucher',
  // Sales
  'sales.view_log', 'sales.view_stats', 'sales.export_csv', 'sales.export_pdf', 'sales.filter_date',
  // Inventory
  'inventory.view', 'inventory.add', 'inventory.edit', 'inventory.delete', 'inventory.adjust_stock', 'inventory.view_logs',
  // Recipes
  'recipes.view', 'recipes.add', 'recipes.edit', 'recipes.delete',
  // Dashboard
  'dashboard.view', 'dashboard.view_stats', 'dashboard.view_insights',
  // AI
  'ai.chat',
  // OCR
  'ocr.scan', 'ocr.confirm',
  // Users
  'users.view', 'users.add', 'users.edit', 'users.toggle_active', 'users.reset_pin', 'users.manage_permissions',
  // Settings
  'settings.view',
];

const insertDefaultFeatures = async (userId: number, restaurantId: number, role: string) => {
  const allowed = FEATURE_KEYS_DEFAULT[role] || [];
  for (const key of ALL_FEATURE_KEYS) {
    const enabled = allowed.includes(key);
    await db.query(
      `INSERT INTO user_features (user_id, restaurant_id, feature_key, enabled)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, feature_key) DO UPDATE SET enabled = $4`,
      [userId, restaurantId, key, enabled]
    );
  }
};

// ── GET /api/users — Daftar semua user di restoran ───────────────────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id;

    const result = await db.query(
      `SELECT 
         u.id, u.username, u.nama, u.role, u.phone,
         u.is_active, u.last_login, u.created_at, u.invited_by,
         inv.nama as invited_by_name
       FROM users u
       LEFT JOIN users inv ON u.invited_by = inv.id
       WHERE u.restaurant_id = $1
       ORDER BY 
         CASE u.role WHEN 'Pemilik' THEN 0 ELSE 1 END,
         u.created_at ASC`,
      [restaurantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('GET users error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
});

// ── GET /api/users/:id/features — Ambil features user ────────────────────────
router.get('/:id/features', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id;
    const { id } = req.params;

    const result = await db.query(
      `SELECT feature_key, enabled
       FROM user_features
       WHERE user_id = $1 AND restaurant_id = $2
       ORDER BY feature_key`,
      [id, restaurantId]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('GET features error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil fitur' });
  }
});

// ── POST /api/users — Tambah user baru (oleh Owner) ──────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id;
    const ownerId      = req.user?.id;
    const { nama, username, role, phone } = req.body;

    if (!nama || !username || !role) {
      return res.status(400).json({ error: 'Nama, username, dan role wajib diisi' });
    }

    // Cek username sudah ada
    const existing = await db.query(
      'SELECT id FROM users WHERE username = $1 AND restaurant_id = $2',
      [username, restaurantId]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    // Generate PIN 6 digit
    const pin = Math.floor(100000 + Math.random() * 900000).toString();
    const pinHash = bcrypt.hashSync(pin, 10);

    // Password default = PIN (bisa diganti nanti)
    const passwordHash = bcrypt.hashSync(pin, 10);

    const result = await db.query(
      `INSERT INTO users (restaurant_id, username, password, role, nama, phone, pin, is_active, invited_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true, $8)
       RETURNING id, username, nama, role, phone, is_active, created_at`,
      [restaurantId, username, passwordHash, role, nama, phone || null, pinHash, ownerId]
    );

    const newUser = result.rows[0];

    // Insert default features
    await insertDefaultFeatures(newUser.id, restaurantId, role);

    // Log aktivitas
    await logActivity(ownerId, restaurantId, 'ADD_USER', 'user', String(newUser.id), { username, role });

    res.status(201).json({
      success: true,
      data: newUser,
      pin, // Tampilkan PIN sekali saja ke Owner
    });

  } catch (error: any) {
    console.error('POST user error:', error.message);
    res.status(500).json({ error: 'Gagal menambah pengguna' });
  }
});

// ── PATCH /api/users/:id — Edit user ─────────────────────────────────────────
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id;
    const ownerId      = req.user?.id;
    const { id }       = req.params;
    const { nama, phone, role, is_active } = req.body;

    const result = await db.query(
      `UPDATE users SET
         nama       = COALESCE($1, nama),
         phone      = COALESCE($2, phone),
         role       = COALESCE($3, role),
         is_active  = COALESCE($4, is_active),
         updated_at = NOW()
       WHERE id = $5 AND restaurant_id = $6
       RETURNING id, username, nama, role, phone, is_active`,
      [nama, phone, role, is_active, id, restaurantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    await logActivity(ownerId, restaurantId, 'EDIT_USER', 'user', id, req.body);

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('PATCH user error:', error.message);
    res.status(500).json({ error: 'Gagal mengubah pengguna' });
  }
});

// ── POST /api/users/:id/reset-pin — Reset PIN user ───────────────────────────
router.post('/:id/reset-pin', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id;
    const ownerId      = req.user?.id;
    const { id }       = req.params;

    const pin     = Math.floor(100000 + Math.random() * 900000).toString();
    const pinHash = bcrypt.hashSync(pin, 10);

    const result = await db.query(
      `UPDATE users SET pin = $1, updated_at = NOW()
       WHERE id = $2 AND restaurant_id = $3
       RETURNING id, username, nama`,
      [pinHash, id, restaurantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    await logActivity(ownerId, restaurantId, 'RESET_PIN', 'user', id, { username: result.rows[0].username });

    res.json({ success: true, pin }); // Tampilkan PIN baru ke Owner
  } catch (error: any) {
    console.error('Reset PIN error:', error.message);
    res.status(500).json({ error: 'Gagal reset PIN' });
  }
});

// ── PATCH /api/users/:id/features — Update features user ────────────────────
router.patch('/:id/features', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id;
    const ownerId      = req.user?.id;
    const { id }       = req.params;
    const { features } = req.body;
    // features: [{ feature_key: string, enabled: boolean }]

    if (!Array.isArray(features)) {
      return res.status(400).json({ error: 'Format features tidak valid' });
    }

    for (const f of features) {
      await db.query(
        `INSERT INTO user_features (user_id, restaurant_id, feature_key, enabled)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (user_id, feature_key)
         DO UPDATE SET enabled = $4`,
        [id, restaurantId, f.feature_key, f.enabled]
      );
    }

    await logActivity(ownerId, restaurantId, 'EDIT_FEATURES', 'user', id, { features_count: features.length });

    res.json({ success: true });
  } catch (error: any) {
    console.error('PATCH features error:', error.message);
    res.status(500).json({ error: 'Gagal update features' });
  }
});

// ── DELETE /api/users/:id — Nonaktifkan user (soft delete) ───────────────────
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id;
    const ownerId      = req.user?.id;
    const { id }       = req.params;

    // Tidak boleh hapus diri sendiri
    if (Number(id) === ownerId) {
      return res.status(400).json({ error: 'Tidak bisa menonaktifkan akun sendiri' });
    }

    const result = await db.query(
      `UPDATE users SET is_active = false, updated_at = NOW()
       WHERE id = $1 AND restaurant_id = $2
       RETURNING id, username, nama`,
      [id, restaurantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    }

    await logActivity(ownerId, restaurantId, 'DEACTIVATE_USER', 'user', id, { username: result.rows[0].username });

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error('DELETE user error:', error.message);
    res.status(500).json({ error: 'Gagal menonaktifkan pengguna' });
  }
});

// ── GET /api/users/activity-logs — Log aktivitas restoran ────────────────────
router.get('/activity-logs', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id;
    const limit  = Number(req.query.limit)  || 50;
    const offset = Number(req.query.offset) || 0;

    const result = await db.query(
      `SELECT 
         al.id, al.action, al.target_type, al.target_id,
         al.detail, al.created_at,
         u.nama as user_nama, u.role as user_role
       FROM activity_logs al
       LEFT JOIN users u ON al.user_id = u.id
       WHERE al.restaurant_id = $1
       ORDER BY al.created_at DESC
       LIMIT $2 OFFSET $3`,
      [restaurantId, limit, offset]
    );

    res.json({ success: true, data: result.rows });
  } catch (error: any) {
    console.error('GET activity logs error:', error.message);
    res.status(500).json({ error: 'Gagal mengambil log aktivitas' });
  }
});

export default router;
