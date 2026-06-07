import { Router } from 'express';
import db from '../db/database';
import { requireAuth } from '../utils/authMiddleware';

const router = Router();

// GET stock movement log (Filtered by restaurant_id)
// Tambahkan requireAuth agar kita bisa mengambil restaurant_id
router.get('/', requireAuth, async (req, res) => {
  const restaurantId = req.user!.restaurant_id;

  try {
    // 1. Gunakan await db.query (PostgreSQL)
    // 2. Tambahkan WHERE m.restaurant_id = $1
    const result = await db.query(`
      SELECT m.*, i.name as ingredient_name, i.base_unit
      FROM movement_log m
      JOIN ingredients i ON m.ingredient_id = i.id
      WHERE m.restaurant_id = $1
      ORDER BY m.created_at DESC, m.id DESC
      LIMIT 100
    `, [restaurantId]);

    // Hasil data di PostgreSQL ada di dalam properti .rows
    res.json(result.rows);
  } catch (err: any) {
    console.error('Movement Log Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Pastikan export default ada di baris paling bawah
export default router;