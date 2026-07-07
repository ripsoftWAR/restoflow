import { Router } from 'express';
import db from '../db/database';
import { requireAuth, requireRole } from '../utils/authMiddleware';
import { hasColumn } from '../utils/dbHelpers';
import { convertBuyUnitToBase } from '../utils/conversion';

const router = Router();
// Tambahkan requireAuth sebagai middleware utama
router.use(requireAuth);
router.use(requireRole('Kasir', 'Pemilik'));

// GET all ingredients (with optional search)
router.get('/', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  try {
    const searchTerm = req.query.search ? `%${req.query.search}%` : '%';
    // PostgreSQL menggunakan ILIKE untuk case-insensitive dan $1, $2 untuk parameter
    const result = await db.query(
      'SELECT * FROM ingredients WHERE name ILIKE $1 AND restaurant_id = $2 ORDER BY name ASC',
      [searchTerm, restaurantId]
    );
    res.json(result.rows);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════
// GET /api/ingredients/rekomendasi — rekomendasi belanja otomatis
// Harus di ATAS route /:id agar tidak bentrok
// ═══════════════════════════════════════════════════════════════
router.get('/rekomendasi', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const thresholdMul = Math.max(1.0, Math.min(3.0, Number(req.query.threshold_multiplier) || 1.3));
  const restockFactor = Math.max(1.0, Math.min(5.0, Number(req.query.restock_factor) || 1.5));

  try {
    const result = await db.query(
      `SELECT id, name, category, supplier, stock, base_unit, min_stock,
              unit_price, buy_unit, conversion_factor
       FROM ingredients
       WHERE restaurant_id = $1
         AND min_stock > 0
         AND stock < (min_stock * $2)
       ORDER BY
         CASE WHEN stock <= min_stock THEN 0 ELSE 1 END ASC,
         (stock::numeric / NULLIF(min_stock, 0)::numeric) ASC`,
      [restaurantId, thresholdMul]
    );

    const items = result.rows.map((ing: any) => {
      const currentStock = Number(ing.stock) || 0;
      const minStock = Number(ing.min_stock) || 0;
      const targetStock = Math.round(minStock * restockFactor * 10) / 10;
      const buyQty = Math.max(
        Math.round(minStock * 0.5 * 10) / 10,
        Math.round((targetStock - currentStock) * 10) / 10,
      );
      const unitPrice = Number(ing.unit_price) || 0;
      const conversionFactor = Number(ing.conversion_factor) || 1;
      const estCost = conversionFactor > 0
        ? (buyQty / conversionFactor) * unitPrice
        : buyQty * unitPrice;

      return {
        ingredient: {
          id: ing.id,
          name: ing.name,
          category: ing.category,
          supplier: ing.supplier,
          stock: currentStock,
          base_unit: ing.base_unit,
          min_stock: minStock,
          unit_price: unitPrice,
          buy_unit: ing.buy_unit,
          conversion_factor: conversionFactor,
        },
        currentStock,
        minStock,
        buyQty: Math.max(0, Math.round(buyQty * 10) / 10),
        estCost: Math.round(estCost * 100) / 100,
        status: currentStock <= 0 ? 'habis' : currentStock <= minStock ? 'kritis' : 'akan_habis',
      };
    });

    const grandTotal = items.reduce((sum, i) => sum + i.estCost, 0);
    const criticalCount = items.filter(i => i.currentStock <= i.minStock).length;

    res.json({
      items,
      grandTotal: Math.round(grandTotal * 100) / 100,
      criticalCount,
      totalItems: items.length,
    });
  } catch (err: any) {
    console.error('[GET /api/ingredients/rekomendasi] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST create new ingredient
router.post('/', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const { name, category, supplier, stock, base_unit, min_stock, unit_price, buy_unit, conversion_factor } = req.body;

  const normalizedStock = Number(stock) || 0;
  const normalizedMinStock = Number(min_stock) || 0;
  const normalizedPrice = Number(unit_price) || 0;
  const normalizedUnit = typeof base_unit === 'string' ? base_unit : 'gram';
  const normalizedBuyUnit = typeof buy_unit === 'string' ? buy_unit : normalizedUnit;
  const normalizedConversionFactor = Number(conversion_factor) || 1;
  
  // Convert stock from buy_unit to base_unit
  const { amount: convertedStock } = convertBuyUnitToBase(normalizedStock, normalizedBuyUnit, normalizedConversionFactor);

  // Note: unit_price sudah diterima dalam satuan per-base-unit dari frontend.
  // Frontend bertanggung jawab mengkonversi harga dari per-unit-beli ke per-base-unit.

  if (!name || !supplier || !normalizedUnit || !normalizedBuyUnit) {
    return res.status(400).json({ error: 'Nama bahan, supplier, base_unit, dan buy_unit wajib diisi.' });
  }

  try {
    const hasCategory = await hasColumn('ingredients', 'category');
    const columns = ['restaurant_id', 'name', 'supplier', 'stock', 'base_unit', 'min_stock', 'unit_price', 'buy_unit', 'conversion_factor'];
    const values = [restaurantId, name, supplier, convertedStock, normalizedUnit, normalizedMinStock, normalizedPrice, normalizedBuyUnit, normalizedConversionFactor];
    if (hasCategory) {
      columns.splice(2, 0, 'category');
      values.splice(2, 0, category || 'Lainnya');
    }

    const insertRes = await db.query(
      `INSERT INTO ingredients (${columns.join(', ')}) VALUES (${columns.map((_, idx) => `$${idx + 1}`).join(', ')}) RETURNING id`,
      values
    );
    const insertedId = insertRes.rows[0].id;
    res.status(201).json({ id: insertedId, name, category: hasCategory ? category || 'Lainnya' : undefined, supplier, stock: convertedStock, base_unit: normalizedUnit, min_stock: normalizedMinStock, unit_price: normalizedPrice, buy_unit: normalizedBuyUnit, conversion_factor: normalizedConversionFactor });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update ingredient
router.put('/:id', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const { id } = req.params;
  const { name, category, supplier, min_stock, unit_price, buy_unit, conversion_factor } = req.body;
  try {
    const hasCategory = await hasColumn('ingredients', 'category');

    let query: string;
    let values: any[];

    if (hasCategory) {
      query = `
        UPDATE ingredients
        SET name = $1, category = $2, supplier = $3, min_stock = $4, unit_price = $5,
            buy_unit = $6::text, conversion_factor = $7::numeric
        WHERE id = $8 AND restaurant_id = $9
        RETURNING *
      `;
      values = [
        name,
        category || 'Lainnya',
        supplier,
        Number(min_stock) || 0,
        Number(unit_price) || 0,
        buy_unit ?? null,
        Number(conversion_factor) || 1,
        id,
        restaurantId,
      ];
    } else {
      query = `
        UPDATE ingredients
        SET name = $1, supplier = $2, min_stock = $3, unit_price = $4,
            buy_unit = $5::text, conversion_factor = $6::numeric
        WHERE id = $7 AND restaurant_id = $8
        RETURNING *
      `;
      values = [
        name,
        supplier,
        Number(min_stock) || 0,
        Number(unit_price) || 0,
        buy_unit ?? null,
        Number(conversion_factor) || 1,
        id,
        restaurantId,
      ];
    }

    const result = await db.query(query, values);

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Bahan tidak ditemukan atau akses dilarang' });
    }
    res.json(result.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE ingredient
router.delete('/:id', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const { id } = req.params;
  try {
    const ingRes = await db.query('SELECT id, name FROM ingredients WHERE id = $1 AND restaurant_id = $2', [id, restaurantId]);
    const ing = ingRes.rows[0];
    if (!ing) return res.status(404).json({ error: 'Bahan tidak ditemukan' });

    const recipeCheck = await db.query(
      'SELECT COUNT(*) FROM recipe_ingredients WHERE ingredient_id = $1',
      [id]
    );
    if (parseInt(recipeCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: `Bahan "${ing.name}" masih digunakan di resep.` });
    }

    // Hapus log terkait dulu, lalu hapus bahan
    await db.query('DELETE FROM stock_movements WHERE ingredient_id = $1 AND restaurant_id = $2', [id, restaurantId]);
    await db.query('DELETE FROM ingredients WHERE id = $1 AND restaurant_id = $2', [id, restaurantId]);

    res.json({ success: true, message: `Bahan "${ing.name}" berhasil dihapus.` });
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// POST stock opname / manual adjustment
router.post('/:id/adjust', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const { id } = req.params;
  const { adjustStockInBaseUnit, notes } = req.body;
  try {
    const ingRes = await db.query('SELECT stock FROM ingredients WHERE id = $1 AND restaurant_id = $2', [id, restaurantId]);
    const ing = ingRes.rows[0];
    if (!ing) return res.status(404).json({ error: 'Bahan tidak ditemukan' });

    const diff = Number(adjustStockInBaseUnit) - Number(ing.stock);
    if (diff !== 0) {
      await db.query('UPDATE ingredients SET stock = $1 WHERE id = $2 AND restaurant_id = $3', [adjustStockInBaseUnit, id, restaurantId]);
      await db.query(`
        INSERT INTO stock_movements (restaurant_id, ingredient_id, type, quantity, notes)
        VALUES ($1, $2, 'ADJUST', $3, $4)
      `, [restaurantId, id, diff, notes || 'Opname Stok Manual']);
    }

    const updated = await db.query('SELECT * FROM ingredients WHERE id = $1 AND restaurant_id = $2', [id, restaurantId]);
    res.json(updated.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/ingredients/:id/usage — daily usage aggregation for chart
router.get('/:id/usage', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const { id } = req.params;
  const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 365);

  try {
    // Pastikan ingredient ada
    const ingRes = await db.query(
      'SELECT id FROM ingredients WHERE id = $1 AND restaurant_id = $2',
      [id, restaurantId],
    );
    if (ingRes.rowCount === 0) {
      return res.status(404).json({ error: 'Bahan tidak ditemukan' });
    }

    const result = await db.query(
      `SELECT
         gs.date::text AS date,
         COALESCE(SUM(CASE WHEN m.type = 'in' THEN m.quantity ELSE 0 END), 0)::float AS total_in,
         COALESCE(SUM(CASE WHEN m.type = 'out' THEN ABS(m.quantity) ELSE 0 END), 0)::float AS total_out
       FROM generate_series(
         CURRENT_DATE - ($3::int - 1),
         CURRENT_DATE,
         '1 day'::interval
       ) AS gs(date)
       LEFT JOIN stock_movements m
         ON m.ingredient_id = $1::int
         AND m.restaurant_id = $2::int
         AND m.type IN ('in', 'out')
         AND DATE(m.created_at) = gs.date
       GROUP BY gs.date
       ORDER BY gs.date ASC`,
      [id, restaurantId, days],
    );

    // Pastikan total_in/total_out sebagai number, bukan string
    const rows = result.rows.map((row: any) => ({
      date: row.date,
      total_in: Number(row.total_in),
      total_out: Number(row.total_out),
    }));

    res.json(rows);
  } catch (err: any) {
    console.error('[GET /api/ingredients/:id/usage] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST quick restock
router.post('/:id/restock', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const { id } = req.params;
  const { amountInBaseUnit, unitPrice, totalPrice, notes } = req.body;
  try {
    const ingRes = await db.query('SELECT stock, name FROM ingredients WHERE id = $1 AND restaurant_id = $2', [id, restaurantId]);
    const ing = ingRes.rows[0];
    if (!ing) return res.status(404).json({ error: 'Bahan tidak ditemukan' });

    const nextStock = Number(ing.stock) + Number(amountInBaseUnit);

    await db.query('UPDATE ingredients SET stock = $1, unit_price = $2 WHERE id = $3 AND restaurant_id = $4', 
      [nextStock, unitPrice, id, restaurantId]);

    await db.query(`
      INSERT INTO stock_movements (restaurant_id, ingredient_id, type, quantity, notes)
      VALUES ($1, $2, 'in', $3, $4)
    `, [restaurantId, id, amountInBaseUnit, notes || `Restock Cepat: ${ing.name}`]);

    const updated = await db.query('SELECT * FROM ingredients WHERE id = $1 AND restaurant_id = $2', [id, restaurantId]);
    res.json(updated.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;