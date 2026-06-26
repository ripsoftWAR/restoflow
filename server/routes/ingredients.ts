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
    const setClauses = ['name = $1', 'supplier = $2', 'min_stock = $3', 'unit_price = $4'];
    const values: any[] = [name, supplier, min_stock, unit_price || 0];
    
    if (hasCategory) {
      setClauses.splice(1, 0, 'category = $2');
      values.splice(1, 0, category || 'Lainnya');
    }

    // Update unit beli & faktor konversi jika dikirim
    let paramIdx = values.length;
    if (buy_unit !== undefined) {
      paramIdx++;
      setClauses.push(`buy_unit = $${paramIdx}`);
      values.push(buy_unit);
    }
    if (conversion_factor !== undefined) {
      paramIdx++;
      setClauses.push(`conversion_factor = $${paramIdx}`);
      values.push(Number(conversion_factor) || 1);
    }

    values.push(id, restaurantId);
    const query = `
      UPDATE ingredients
      SET ${setClauses.join(', ')}
      WHERE id = ${values.length - 1} AND restaurant_id = ${values.length}
      RETURNING *
    `;

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

    const recipeCheck = await db.query('SELECT COUNT(*) FROM recipes WHERE ingredient_id = $1 AND restaurant_id = $2', [id, restaurantId]);
    if (parseInt(recipeCheck.rows[0].count) > 0) {
      return res.status(400).json({ error: `Bahan "${ing.name}" masih digunakan di resep.` });
    }

    // Hapus log terkait dulu, lalu hapus bahan
    await db.query('DELETE FROM movement_log WHERE ingredient_id = $1 AND restaurant_id = $2', [id, restaurantId]);
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
        INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes)
        VALUES ($1, $2, 'ADJUST', $3, $4, $5)
      `, [restaurantId, id, diff, adjustStockInBaseUnit, notes || 'Opname Stok Manual']);
    }

    const updated = await db.query('SELECT * FROM ingredients WHERE id = $1 AND restaurant_id = $2', [id, restaurantId]);
    res.json(updated.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
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
      INSERT INTO movement_log (restaurant_id, ingredient_id, type, amount, balance, notes, unit_price, total_price)
      VALUES ($1, $2, 'IN', $3, $4, $5, $6, $7)
    `, [restaurantId, id, amountInBaseUnit, nextStock, notes || `Restock Cepat: ${ing.name}`, unitPrice, totalPrice]);

    const updated = await db.query('SELECT * FROM ingredients WHERE id = $1 AND restaurant_id = $2', [id, restaurantId]);
    res.json(updated.rows[0]);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router;