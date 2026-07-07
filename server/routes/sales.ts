import { Request, Response, Router } from 'express';
import db from '../db/database';
import { requireAuth, requireRole } from '../utils/authMiddleware';

const router = Router();
router.use(requireAuth);
router.use(requireRole('Kasir', 'Pemilik', 'Dapur'));

/* ═══════════════════════════════════════════════════════════════
   HELPER: generate invoice_id
   Format: INV-YYYYMMDD-XXXX (XXXX = id padded 4 digit)
   ═══════════════════════════════════════════════════════════════ */
const generateInvoiceId = async (saleId: number, saleDate: string): Promise<string> => {
  const datePart = saleDate.replace(/-/g, '');
  return `INV-${datePart}-${String(saleId).padStart(4, '0')}`;
};

/* ═══════════════════════════════════════════════════════════════
   GET /api/sales — FLAT (backward-compat untuk Dashboard analytics)
   Return 1 row per sale_item, JOIN dengan sales header
   ═══════════════════════════════════════════════════════════════ */
router.get('/', async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurant_id;
  try {
    // Cek apakah sale_items sudah ada isinya
    const hasItems = await db.query(
      `SELECT EXISTS(SELECT 1 FROM sale_items si JOIN sales s ON s.id = si.sale_id WHERE s.restaurant_id = $1 LIMIT 1) AS has`,
      [restaurantId],
    );

    if (hasItems.rows[0]?.has) {
      // Skema baru: JOIN sales + sale_items → return flat
      const result = await db.query(
        `SELECT
          s.id,
          s.restaurant_id,
          si.menu_name,
          si.quantity,
          si.subtotal AS total_price,
          si.selected_options,
          s.payment_method,
          s.cash_paid,
          s.cash_change,
          s.invoice_id,
          s.discount,
          s.user_id,
          s.shift_session_id,
          s.notes,
          s.sale_date,
          s.created_at
        FROM sales s
        JOIN sale_items si ON si.sale_id = s.id
        WHERE s.restaurant_id = $1
        ORDER BY s.created_at DESC`,
        [restaurantId],
      );
      res.json(result.rows);
    } else {
      // Fallback: data lama (sebelum migrasi sale_items)
      const result = await db.query(
        `SELECT * FROM sales WHERE restaurant_id = $1 ORDER BY created_at DESC`,
        [restaurantId],
      );
      res.json(result.rows);
    }
  } catch (err: any) {
    console.error('[GET /api/sales] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   GET /api/sales/invoices — GROUPED (untuk Tab Log / Invoice view)
   Return array of SaleHeader dengan items[] di dalamnya
   ═══════════════════════════════════════════════════════════════ */
router.get('/invoices', async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurant_id;
  try {
    // Ambil semua sale_items dengan JOIN ke sales header
    const result = await db.query(
      `SELECT
        s.id                AS sale_id,
        s.invoice_id,
        s.restaurant_id,
        s.user_id,
        s.shift_session_id,
        s.total             AS total_price,
        COALESCE(s.discount, 0) AS discount,
        s.payment_method,
        COALESCE(s.cash_paid, 0)   AS cash_paid,
        COALESCE(s.cash_change, 0) AS cash_change,
        s.notes,
        s.sale_date,
        s.created_at,
        si.id               AS item_id,
        si.recipe_id,
        si.menu_name,
        si.quantity,
        si.price,
        si.subtotal,
        si.selected_options
      FROM sales s
      JOIN sale_items si ON si.sale_id = s.id
      WHERE s.restaurant_id = $1
      ORDER BY s.created_at DESC, si.id ASC`,
      [restaurantId],
    );

    // Group by invoice_id
    const invoiceMap = new Map<string, any>();
    for (const row of result.rows) {
      const key = row.invoice_id || `LEGACY-${row.sale_id}`;
      if (!invoiceMap.has(key)) {
        invoiceMap.set(key, {
          id: row.sale_id,
          invoice_id: key,
          restaurant_id: row.restaurant_id,
          user_id: row.user_id,
          shift_session_id: row.shift_session_id,
          total_price: Number(row.total_price) || 0,
          discount: Number(row.discount) || 0,
          payment_method: row.payment_method || 'CASH',
          cash_paid: Number(row.cash_paid) || 0,
          cash_change: Number(row.cash_change) || 0,
          notes: row.notes,
          sale_date: row.sale_date || row.created_at?.toString().split('T')[0],
          created_at: row.created_at,
          items: [],
        });
      }
      invoiceMap.get(key).items.push({
        id: row.item_id,
        recipe_id: row.recipe_id,
        menu_name: row.menu_name,
        quantity: Number(row.quantity) || 0,
        price: Number(row.price) || 0,
        subtotal: Number(row.subtotal) || 0,
        selected_options: row.selected_options || '',
      });
    }

    const invoices = Array.from(invoiceMap.values());
    res.json({ success: true, data: invoices, total: invoices.length });
  } catch (err: any) {
    console.error('[GET /api/sales/invoices] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   POST /api/sales — Record sale (header + items) & auto-deplete
   ═══════════════════════════════════════════════════════════════ */
router.post('/', async (req: Request, res: Response) => {
  const restaurantId = req.user!.restaurant_id;
  const userId = req.user!.id;

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
    items, // opsional: array item untuk transaksi multi-item (future)
  } = req.body;

  // ── Validasi ──────────────────────────────────────
  if (!menu_name && (!items || items.length === 0)) {
    return res.status(400).json({ error: 'Data menu_name atau items wajib diisi' });
  }

  if (!payment_method || !['CASH', 'QRIS'].includes(payment_method)) {
    return res.status(400).json({ error: 'payment_method wajib (CASH atau QRIS)' });
  }

  if (payment_method === 'CASH') {
    if (cash_paid === undefined || cash_paid === null || Number(cash_paid) < Number(total_price)) {
      return res.status(400).json({ error: 'Untuk CASH, cash_paid wajib >= total_price' });
    }
  }

  try {
    await db.query('BEGIN');

    // ── Build item list ──────────────────────────────
    const lineItems: { menu_name: string; quantity: number; price: number; subtotal: number; selected_options: string }[] = [];

    if (items && Array.isArray(items) && items.length > 0) {
      for (const it of items) {
        lineItems.push({
          menu_name: it.menu_name,
          quantity: Number(it.quantity) || 1,
          price: Number(it.price) || 0,
          subtotal: Number(it.subtotal) || (Number(it.price) * Number(it.quantity)),
          selected_options: it.selected_options || '',
        });
      }
    } else {
      // Single item (backward compat)
      const qty = Number(quantity) || 1;
      const total = Number(total_price) || 0;
      lineItems.push({
        menu_name,
        quantity: qty,
        price: qty > 0 ? Math.round(total / qty) : total,
        subtotal: total,
        selected_options: selected_options || '',
      });
    }

    const grandTotal = lineItems.reduce((sum, it) => sum + it.subtotal, 0);
    const discount = Number(discount_amount) || 0;
    const finalTotal = Math.max(0, grandTotal - discount);

    // ── Voucher meta ─────────────────────────────────
    const voucherMeta = voucher_code
      ? `[Voucher: ${String(voucher_code).toUpperCase()}${voucher_label ? ` • ${voucher_label}` : ''}${discount > 0 ? ` • Diskon Rp ${discount.toLocaleString('id-ID')}` : ''}]`
      : '';

    const saleNotes = [voucherMeta].filter(Boolean).join(' ');
    const today = new Date().toISOString().split('T')[0];

    // ── 1. Insert header ─────────────────────────────
    const headerResult = await db.query(
      `INSERT INTO sales (
        restaurant_id, user_id, invoice_id,
        total, discount, payment_method,
        cash_paid, cash_change, notes, sale_date,
        menu_name, quantity, total_price, selected_options
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id`,
      [
        restaurantId,
        userId,
        'TEMP', // akan di-update setelah dapat id
        finalTotal,
        discount,
        payment_method,
        payment_method === 'CASH' ? Number(cash_paid) : null,
        payment_method === 'CASH' ? Number(cash_change) : null,
        saleNotes || null,
        today,
        // backward-compat columns (agar GET / flat tetap jalan)
        lineItems[0]?.menu_name || '',
        lineItems[0]?.quantity || 1,
        finalTotal,
        lineItems[0]?.selected_options || '',
      ],
    );

    const saleId = headerResult.rows[0].id;
    const invoiceId = await generateInvoiceId(saleId, today);

    // Update invoice_id dari TEMP → real
    await db.query('UPDATE sales SET invoice_id = $1 WHERE id = $2', [invoiceId, saleId]);

    // ── 2. Insert line items ─────────────────────────
    for (const item of lineItems) {
      await db.query(
        `INSERT INTO sale_items (sale_id, menu_name, quantity, price, subtotal, selected_options)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [saleId, item.menu_name, item.quantity, item.price, item.subtotal, item.selected_options],
      );
    }

    // ── 3. Update voucher usage ──────────────────────
    if (voucher_id) {
      await db.query(
        'UPDATE vouchers SET usage_count = usage_count + 1 WHERE id = $1',
        [voucher_id],
      );
    }

    // ── 4. Deplete stock (pakai schema normalized: recipes + recipe_ingredients) ──
    for (const item of lineItems) {
      const recipeRes = await db.query(
        `SELECT ri.ingredient_id, ri.quantity AS amount
         FROM recipes r
         JOIN recipe_ingredients ri ON ri.recipe_id = r.id
         WHERE r.name = $1 AND r.restaurant_id = $2`,
        [item.menu_name, restaurantId],
      );
      const recipeItems = recipeRes.rows;

      for (const ri of recipeItems) {
        const requiredAmount = Number(ri.amount) * Number(item.quantity);

        const ingRes = await db.query(
          'SELECT stock, name FROM ingredients WHERE id = $1 AND restaurant_id = $2',
          [ri.ingredient_id, restaurantId],
        );
        const currentIng = ingRes.rows[0];

        if (currentIng) {
          const nextStock = Number(currentIng.stock) - requiredAmount;

          await db.query(
            'UPDATE ingredients SET stock = $1 WHERE id = $2 AND restaurant_id = $3',
            [nextStock, ri.ingredient_id, restaurantId],
          );

          const optStr = item.selected_options ? ` (${item.selected_options})` : '';
          const paymentTag = ` [${payment_method}]`;

          await db.query(
            `INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes)
             VALUES ($1, $2, 'OUT', $3, $4, $5)`,
            [
              restaurantId,
              ri.ingredient_id,
              -requiredAmount,
              nextStock,
              `Deduction: Penjualan ${item.quantity} porsi ${item.menu_name}${optStr}${paymentTag}`,
            ],
          );
        }
      }
    }

    await db.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Transaksi berhasil dicatat',
      data: { invoice_id: invoiceId, id: saleId },
    });
  } catch (err: any) {
    await db.query('ROLLBACK');
    console.error('[POST /api/sales] Error:', err);
    res.status(500).json({ error: 'Gagal mencatat transaksi: ' + err.message });
  }
});

export default router;
