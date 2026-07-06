import { Request, Response, Router } from 'express';
import db from "../db/database";
import { requireAuth } from '../utils/authMiddleware';

const router = Router();

// ── POST /api/vouchers — Buat voucher baru ────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    const restaurantId = req.user?.restaurant_id || body.restaurant_id;

    const query = `
      INSERT INTO vouchers (
        restaurant_id, code, type, value, min_purchase, max_discount,
        is_active, valid_from, valid_until, max_usage, usage_count
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const values = [
      restaurantId,
      body.code,
      body.type,
      Number(body.value),
      Number(body.min_purchase || 0),
      body.max_discount ? Number(body.max_discount) : null,
      body.is_active === true || body.is_active === 'true',
      body.valid_from || null,
      body.valid_until || null,
      body.max_usage ? Number(body.max_usage) : null,
      0,
    ];

    const result = await db.query(query, values);
    res.status(201).json({ success: true, data: result.rows[0] });

  } catch (error: any) {
    console.error("Voucher API Error Detail:", {
      message: error.message,
      detail: error.detail,
      column: error.column,
      constraint: error.constraint,
    });
    res.status(500).json({ error: "Gagal menyimpan voucher", message: error.message });
  }
});

// ── GET /api/vouchers — Load semua voucher aktif milik restoran ───────────────
router.get('/', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id || req.query.restaurant_id;

    const result = await db.query(
      `SELECT * FROM vouchers
       WHERE restaurant_id = $1
       ORDER BY created_at DESC`,
      [restaurantId]
    );

    res.json({ success: true, data: result.rows });

  } catch (error: any) {
    console.error("GET Vouchers Error:", error.message);
    res.status(500).json({ error: "Gagal mengambil data voucher" });
  }
});

// ── GET /api/vouchers/validate?code=XXX — Validasi kode voucher ──────────────
router.get('/validate', async (req: Request, res: Response) => {
  try {
    const restaurantId = req.user?.restaurant_id;
    const code = (req.query.code as string)?.trim().toUpperCase();

    if (!code) {
      return res.status(400).json({ valid: false, message: 'Kode tidak boleh kosong' });
    }

    const result = await db.query(
      `SELECT * FROM vouchers
       WHERE restaurant_id = $1
         AND code = $2
         AND is_active = true
         AND (valid_from IS NULL OR valid_from <= CURRENT_DATE)
         AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)
         AND (max_usage IS NULL OR usage_count < max_usage)
       LIMIT 1`,
      [restaurantId, code]
    );

    if (result.rows.length === 0) {
      return res.json({ valid: false, message: 'Kode voucher tidak valid atau sudah kadaluarsa' });
    }

    const v = result.rows[0];
    res.json({
      valid: true,
      id: v.id,
      code: v.code,
      type: v.type,        // 'PERCENTAGE' | 'FIXED'
      value: Number(v.value),
      min_purchase: Number(v.min_purchase),
      label: v.type === 'PERCENTAGE'
        ? `Diskon ${v.value}%`
        : `Diskon Rp ${new Intl.NumberFormat('id-ID').format(Number(v.value))}`,
    });

  } catch (error: any) {
    console.error("Validate Voucher Error:", error.message);
    res.status(500).json({ valid: false, message: 'Gagal validasi voucher' });
  }
});

// ── PATCH /api/vouchers/:id — Edit/toggle voucher ────────────────────────────
router.patch('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = req.body;

    // Build dynamic SET clause
    const allowedFields = ['code', 'type', 'value', 'min_purchase', 'max_discount', 'is_active', 'valid_from', 'valid_until', 'max_usage'];
    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        setClauses.push(`${field} = ${paramIdx}`);
        values.push(body[field]);
        paramIdx++;
      }
    }

    if (setClauses.length === 0) {
      return res.status(400).json({ error: 'Tidak ada field yang diupdate' });
    }

    values.push(id);
    const query = `UPDATE vouchers SET ${setClauses.join(', ')} WHERE id = ${paramIdx} RETURNING *`;
    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Voucher tidak ditemukan' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (error: any) {
    console.error("PATCH Voucher Error:", error.message);
    res.status(500).json({ error: "Gagal update voucher", message: error.message });
  }
});

// ── PATCH /api/vouchers/:id/use — Tambah current_usage saat transaksi ─────────
router.patch('/:id/use', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE vouchers SET usage_count = usage_count + 1 WHERE id = $1`,
      [id]
    );

    res.json({ success: true });

  } catch (error: any) {
    console.error("Use Voucher Error:", error.message);
    res.status(500).json({ error: "Gagal update pemakaian voucher" });
  }
});

export default router;