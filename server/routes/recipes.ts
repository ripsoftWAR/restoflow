import { Router } from 'express';
import db from '../db/database';
import { requireAuth } from '../utils/authMiddleware';

const router = Router();
router.use(requireAuth);

/* ═══════════════════════════════════════════════════════════════
   GET /api/recipes
   Ambil semua resep + detail bahan (recipe_ingredients).
   Response shape SAMA seperti sebelumnya (backward-compatible).
   ═══════════════════════════════════════════════════════════════ */
router.get('/', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;

  try {
    const result = await db.query(
      `SELECT
         r.id            AS recipe_id,
         r.name          AS menu_name,
         r.category,
         r.price,
         r.description,
         r.is_active,
         r.spice_level_option,
         r.sugar_level_option,
         r.custom_options,
         ri.id           AS item_id,
         ri.ingredient_id,
         ri.quantity     AS amount,
         ri.unit,
         i.name          AS ingredient_name,
         i.base_unit
       FROM recipes r
       LEFT JOIN recipe_ingredients ri ON ri.recipe_id = r.id
       LEFT JOIN ingredients i    ON ri.ingredient_id = i.id
       WHERE r.restaurant_id = $1
         AND r.is_active = true
       ORDER BY r.name ASC, ri.id ASC`,
      [restaurantId],
    );

    const rows = result.rows;

    /* ── Grouping: recipe → items[] ── */
    const grouped: Record<number, any> = {};

    for (const row of rows) {
      const rid = row.recipe_id;
      if (!grouped[rid]) {
        grouped[rid] = {
          menu_name: row.menu_name,
          category: row.category || 'Makanan',
          price: Number(row.price) || 0,
          description: row.description || '',
          is_active: row.is_active,
          spice_level_option: row.spice_level_option || 0,
          sugar_level_option: row.sugar_level_option || 0,
          custom_options: row.custom_options || '',
          items: [],
        };
      }

      // Hanya tambahkan item jika ada ingredient terkait (LEFT JOIN bisa null)
      if (row.item_id !== null) {
        grouped[rid].items.push({
          id: row.item_id,
          menu_name: row.menu_name,
          ingredient_id: row.ingredient_id,
          amount: Number(row.amount) || 0,
          ingredient_name: row.ingredient_name || '',
          base_unit: row.base_unit || 'gram',
        });
      }
    }

    res.json(Object.values(grouped));
  } catch (err: any) {
    console.error('[GET /api/recipes] Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   POST /api/recipes
   Buat atau update resep (upsert by name).
   Insert ke recipes, lalu replace recipe_ingredients.
   ═══════════════════════════════════════════════════════════════ */
router.post('/', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const {
    menu_name, category, price,
    spice_level_option, sugar_level_option, custom_options,
    items,
  } = req.body;

  const normalizedPrice = Number(price) || 0;
  const spiceOpt = spice_level_option ? 1 : 0;
  const sugarOpt = sugar_level_option ? 1 : 0;
  const customOpts = custom_options || '';

  if (!menu_name || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'menu_name dan items wajib diisi.' });
  }

  try {
    await db.query('BEGIN');

    /* ── 1. Cek apakah resep sudah ada ── */
    const existing = await db.query(
      'SELECT id FROM recipes WHERE name = $1 AND restaurant_id = $2',
      [menu_name, restaurantId],
    );

    let recipeId: number;

    if (existing.rowCount && existing.rowCount > 0) {
      /* Update resep yang sudah ada */
      recipeId = existing.rows[0].id;
      await db.query(
        `UPDATE recipes
         SET category = $1, price = $2,
             spice_level_option = $3, sugar_level_option = $4,
             custom_options = $5, updated_at = NOW()
         WHERE id = $6 AND restaurant_id = $7`,
        [category || 'Makanan', normalizedPrice, spiceOpt, sugarOpt, customOpts, recipeId, restaurantId],
      );

      /* Hapus recipe_ingredients lama */
      await db.query('DELETE FROM recipe_ingredients WHERE recipe_id = $1', [recipeId]);
    } else {
      /* Insert resep baru */
      const ins = await db.query(
        `INSERT INTO recipes (restaurant_id, name, category, price, spice_level_option, sugar_level_option, custom_options)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [restaurantId, menu_name, category || 'Makanan', normalizedPrice, spiceOpt, sugarOpt, customOpts],
      );
      recipeId = ins.rows[0].id;
    }

    /* ── 2. Bulk insert recipe_ingredients ── */
    for (const item of items) {
      await db.query(
        `INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
         VALUES ($1, $2, $3)`,
        [recipeId, item.ingredient_id, Number(item.amount) || 0],
      );
    }

    await db.query('COMMIT');

    res.status(201).json({
      status: 'success',
      menu_name,
      recipe_id: recipeId,
      updatedItemsCount: items.length,
    });
  } catch (err: any) {
    await db.query('ROLLBACK');
    console.error('[POST /api/recipes] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

/* ═══════════════════════════════════════════════════════════════
   DELETE /api/recipes/:menu_name
   Soft-delete: set is_active = false.
   ═══════════════════════════════════════════════════════════════ */
router.delete('/:menu_name', async (req, res) => {
  const restaurantId = req.user!.restaurant_id;
  const menuName = decodeURIComponent(req.params.menu_name || '');

  if (!menuName.trim()) {
    return res.status(400).json({ error: 'Nama resep tidak valid.' });
  }

  try {
    const result = await db.query(
      'UPDATE recipes SET is_active = false, updated_at = NOW() WHERE name = $1 AND restaurant_id = $2',
      [menuName, restaurantId],
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Resep tidak ditemukan.' });
    }

    res.json({ status: 'success', menu_name: menuName });
  } catch (err: any) {
    console.error('[DELETE /api/recipes] Error:', err.message);
    res.status(400).json({ error: err.message });
  }
});

export default router;
