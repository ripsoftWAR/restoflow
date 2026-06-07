import { Router } from 'express';
import db from '../db/database';
import { requireAuth } from '../utils/authMiddleware';

const router = Router();
// Tambahkan requireAuth agar kita bisa mengambil restaurant_id
router.use(requireAuth);

// GET all recipes grouped by menu name
router.get('/', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;

  try {
    // JOIN dengan ingredients dan FILTER berdasarkan restaurant_id
    const result = await db.query(`
      SELECT r.*, i.name as ingredient_name, i.base_unit
      FROM recipes r
      JOIN ingredients i ON r.ingredient_id = i.id
      WHERE r.restaurant_id = $1
      ORDER BY r.menu_name ASC
    `, [restaurantId]);

    const allItems = result.rows;

    // Grouping logic (TETAP SAMA SEPERTI ASLINYA)
    const grouped: Record<string, any> = {};
    allItems.forEach(item => {
      if (!grouped[item.menu_name]) {
        grouped[item.menu_name] = {
          menu_name: item.menu_name,
          category: item.category || 'Makanan',
          spice_level_option: item.spice_level_option || 0,
          sugar_level_option: item.sugar_level_option || 0,
          custom_options: item.custom_options || '',
          items: []
        };
      }
      grouped[item.menu_name].items.push({
        id: item.id,
        menu_name: item.menu_name,
        ingredient_id: item.ingredient_id,
        amount: item.amount,
        ingredient_name: item.ingredient_name,
        base_unit: item.base_unit
      });
    });

    res.json(Object.values(grouped));
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST create or replace recipe (BOM)
router.post('/', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const { menu_name, category, spice_level_option, sugar_level_option, custom_options, items } = req.body;

  try {
    // Mulai Transaksi PostgreSQL
    await db.query('BEGIN');

    // 1. Hapus resep lama hanya milik restoran ini
    await db.query(
      'DELETE FROM recipes WHERE menu_name = $1 AND restaurant_id = $2', 
      [menu_name, restaurantId]
    );

    // 2. Insert item resep baru satu per satu
    for (const item of items) {
      await db.query(`
        INSERT INTO recipes (restaurant_id, menu_name, category, spice_level_option, sugar_level_option, custom_options, ingredient_id, amount)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        restaurantId,
        menu_name,
        category || 'Makanan',
        spice_level_option ? 1 : 0,
        sugar_level_option ? 1 : 0,
        custom_options || '',
        item.ingredient_id,
        item.amount
      ]);
    }

    // Commit Transaksi
    await db.query('COMMIT');

    res.status(201).json({ status: 'success', menu_name, updatedItemsCount: items.length });
  } catch (err: any) {
    // Batalkan jika ada error
    await db.query('ROLLBACK');
    console.error('Recipe Post Error:', err);
    res.status(400).json({ error: err.message });
  }
});

export default router;