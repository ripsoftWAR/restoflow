import { Request, Response, Router } from 'express';
import db from "../db/database"; 
// Import middleware auth agar lebih aman
import { requireAuth } from '../utils/authMiddleware';

const router = Router();

// Pasang middleware auth agar bisa ambil restaurant_id dari token (opsional tapi disarankan)
router.use(requireAuth);

router.post('/', async (req: Request, res: Response) => {
  try {
    const body = req.body;
    
    // 1. Ambil restaurant_id dari user login (req.user) agar lebih aman, 
    // atau tetap dari body jika memang itu kebutuhan Anda.
    const restaurantId = req.user?.restaurant_id || body.restaurant_id;

    // 2. Query
    const query = `
      INSERT INTO vouchers (
        restaurant_id, 
        code, 
        type, 
        value, 
        min_purchase, 
        is_active, 
        start_at, 
        end_at, 
        max_usage, 
        current_usage
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `;

    // 3. Sanitasi Data (Mencegah Error 500 karena tipe data salah)
    const values = [
      restaurantId,
      body.code,
      body.type,
      Number(body.value),                  // Paksa jadi angka
      Number(body.min_purchase || 0),      // Paksa jadi angka
      body.is_active === true || body.is_active === 'true', // Paksa jadi boolean
      body.start_at || null,               // Jika string kosong, jadikan null
      body.end_at || null,                 // Jika string kosong, jadikan null
      body.max_usage ? Number(body.max_usage) : null, // Angka atau null
      0 
    ];

    const result = await db.query(query, values);

    res.status(201).json({ 
      success: true, 
      data: result.rows[0] 
    });

  } catch (error: any) {
    // Tampilkan log yang detail di terminal server Anda untuk tahu error aslinya
    console.error("Voucher API Error Detail:", {
      message: error.message,
      detail: error.detail, // Detail dari PostgreSQL
      column: error.column,
      constraint: error.constraint
    });
    
    res.status(500).json({ 
      error: "Gagal menyimpan voucher", 
      message: error.message 
    });
  }
});

export default router;