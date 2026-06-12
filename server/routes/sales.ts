import { Router } from 'express';
import db from '../db/database';
import { requireAuth, requireRole } from '../utils/authMiddleware';

const router = Router();
// Tambahkan requireAuth sebelum requireRole
router.use(requireAuth);
router.use(requireRole('Kasir', 'Pemilik', 'Dapur'));

// GET all sales (Filtered by restaurant_id)
router.get('/', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  try {
    const result = await db.query(
      'SELECT * FROM sales WHERE restaurant_id = $1 ORDER BY created_at DESC',
      [restaurantId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST record sale & auto-deplete ingredients
router.post('/', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const {
    menu_name,
    quantity,
    total_price,
    selected_options,
    payment_method,
    cash_paid,
    cash_change,
    voucher_code,
    voucher_id,
    voucher_label,
    discount_amount,
  } = req.body;

  // 1. VALIDASI (Tetap sama dengan logic asli Anda)
  if (!menu_name || !quantity || total_price === undefined) {
    return res.status(400).json({ error: "Data menu_name, quantity, dan total_price wajib diisi" });
  }

  if (!payment_method || !['CASH', 'QRIS'].includes(payment_method)) {
    return res.status(400).json({ error: "payment_method wajib (CASH atau QRIS)" });
  }

  if (payment_method === 'CASH') {
    if (cash_paid === undefined || cash_paid === null || cash_paid < total_price) {
      return res.status(400).json({ error: "Untuk CASH payment, cash_paid wajib >= total_price" });
    }
    if (cash_change === undefined || cash_change === null) {
      return res.status(400).json({ error: "cash_change wajib diisi untuk pembayaran CASH" });
    }
  }

  try {
    // 2. TRANSACTION HANDLING (PostgreSQL Style)
    await db.query('BEGIN');

    const voucherMeta = voucher_code
      ? ` [Voucher: ${voucher_code.toUpperCase()}${voucher_label ? ` • ${voucher_label}` : ''}${discount_amount ? ` • Diskon Rp ${Number(discount_amount).toLocaleString('id-ID')}` : ''}]`
      : '';
    const saleOptions = [selected_options || '', voucherMeta].filter(Boolean).join(' ').trim();

    // A. Log sale record (Tambah restaurant_id)
    await db.query(`
      INSERT INTO sales (
        restaurant_id,
        menu_name,
        quantity,
        total_price,
        selected_options,
        payment_method,
        cash_paid,
        cash_change
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      restaurantId,
      menu_name,
      quantity,
      Number(total_price) || 0,
      saleOptions,
      payment_method,
      payment_method === 'CASH' ? cash_paid : null,
      payment_method === 'CASH' ? cash_change : null
    ]);

    if (voucher_id) {
      await db.query('UPDATE vouchers SET current_usage = current_usage + 1 WHERE id = $1', [voucher_id]);
    }

    // B. Cari resep (Filter by restaurant_id)
    const recipeRes = await db.query(
      'SELECT * FROM recipes WHERE menu_name = $1 AND restaurant_id = $2', 
      [menu_name, restaurantId]
    );
    const recipeItems = recipeRes.rows;

    // C. Potong stok untuk setiap bahan di resep
    for (const item of recipeItems) {
      const requiredAmount = Number(item.amount) * Number(quantity);

      // Ambil stok sekarang (Filter by restaurant_id)
      const ingRes = await db.query(
        'SELECT stock, name FROM ingredients WHERE id = $1 AND restaurant_id = $2', 
        [item.ingredient_id, restaurantId]
      );
      const currentIng = ingRes.rows[0];
      
      if (currentIng) {
        const nextStock = Number(currentIng.stock) - requiredAmount;

        // Update Stok (Filter by restaurant_id)
        await db.query(
          'UPDATE ingredients SET stock = $1 WHERE id = $2 AND restaurant_id = $3', 
          [nextStock, item.ingredient_id, restaurantId]
        );

        // D. Log movement log (Tambah restaurant_id)
        const optStr = selected_options ? ` (${selected_options})` : "";
        const paymentTag = ` [${payment_method}]`;
        
        await db.query(`
          INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes)
          VALUES ($1, $2, 'OUT', $3, $4, $5)
        `, [
          restaurantId,
          item.ingredient_id, 
          -requiredAmount, 
          nextStock, 
          `Deduction: Penjualan ${quantity} porsi ${menu_name}${optStr}${paymentTag}`
        ]);
      }
    }

    await db.query('COMMIT');

    res.status(201).json({ 
      success: true, 
      message: "Sale recorded and stock updated successfully"
    });

  } catch (err: any) {
    await db.query('ROLLBACK');
    console.error("Sales API Error:", err);
    res.status(500).json({ error: "Internal Server Error: " + err.message });
  }
});

export default router;