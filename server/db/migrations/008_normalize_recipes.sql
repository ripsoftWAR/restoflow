-- ============================================================
-- 008_normalize_recipes.sql
-- Migrasi dari schema FLAT (menu_name + ingredient_id jadi 1 tabel)
-- ke schema NORMALIZED (recipes + recipe_ingredients terpisah).
--
-- IDEMPOTENT: bisa dijalankan berkali-kali tanpa merusak data.
-- ============================================================

DO $$
DECLARE
  has_ingredient_id_col boolean;
  flat_count integer;
BEGIN

  -- Deteksi apakah masih schema flat (ada kolom ingredient_id di recipes)
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'recipes'
      AND column_name  = 'ingredient_id'
  ) INTO has_ingredient_id_col;

  -- Kalau sudah normalized (tidak ada ingredient_id), skip
  IF NOT has_ingredient_id_col THEN
    RAISE NOTICE '[008] Schema sudah normalized — skip.';
    RETURN;
  END IF;

  SELECT COUNT(*) INTO flat_count FROM recipes;
  RAISE NOTICE '[008] Schema FLAT terdeteksi — % baris akan dimigrasi.', flat_count;

  -- ========================================================
  -- STEP 1: Backup data flat ke tabel temporary
  -- ========================================================
  CREATE TEMP TABLE recipes_flat_backup AS
  SELECT * FROM recipes;

  -- ========================================================
  -- STEP 2: Bersihkan FK & tabel recipe_ingredients (idempotent)
  -- ========================================================
  -- Hapus FK di sale_items dulu (biar bisa drop recipes)
  ALTER TABLE IF EXISTS sale_items DROP CONSTRAINT IF EXISTS sale_items_recipe_id_fkey;

  -- Hapus semua FK di recipe_ingredients (kalau ada dari partial run)
  ALTER TABLE IF EXISTS recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_fk;
  ALTER TABLE IF EXISTS recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_ingredient_fk;
  ALTER TABLE IF EXISTS recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_recipe_id_fkey;
  ALTER TABLE IF EXISTS recipe_ingredients DROP CONSTRAINT IF EXISTS recipe_ingredients_ingredient_id_fkey;

  -- Drop & recreate dari nol (biar FK bersih)
  DROP TABLE IF EXISTS recipe_ingredients CASCADE;
  CREATE TABLE recipe_ingredients (
    id              SERIAL PRIMARY KEY,
    recipe_id       INTEGER NOT NULL,
    ingredient_id   INTEGER NOT NULL,
    quantity        NUMERIC(12,3) NOT NULL DEFAULT 0,
    unit            VARCHAR(50),
    created_at      TIMESTAMPTZ DEFAULT NOW()
  );

  -- ========================================================
  -- STEP 3: Buat tabel recipes baru (normalized)
  -- ========================================================
  DROP TABLE IF EXISTS recipes_new CASCADE;
  CREATE TABLE recipes_new (
    id                  SERIAL PRIMARY KEY,
    restaurant_id       INTEGER NOT NULL,
    name                VARCHAR(200) NOT NULL,
    description         TEXT,
    price               NUMERIC(15,2) DEFAULT 0,
    category            VARCHAR(100),
    is_active           BOOLEAN DEFAULT true,
    spice_level_option  INTEGER DEFAULT 0,
    sugar_level_option  INTEGER DEFAULT 0,
    custom_options      TEXT DEFAULT '',
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW()
  );

  -- ========================================================
  -- STEP 4: Migrasi data — satu row per unique menu_name
  -- ========================================================
  INSERT INTO recipes_new (restaurant_id, name, category, price, is_active)
  SELECT DISTINCT
    restaurant_id,
    menu_name,
    COALESCE(category, 'Makanan'),
    COALESCE(price, 0),
    true
  FROM recipes_flat_backup
  WHERE menu_name IS NOT NULL
  ORDER BY menu_name;

  -- ========================================================
  -- STEP 5: Migrasi recipe_ingredients
  -- ========================================================
  INSERT INTO recipe_ingredients (recipe_id, ingredient_id, quantity)
  SELECT
    rn.id,
    fb.ingredient_id,
    COALESCE(fb.amount, 0)
  FROM recipes_flat_backup fb
  JOIN recipes_new rn
    ON rn.name = fb.menu_name
   AND rn.restaurant_id = fb.restaurant_id
  WHERE fb.ingredient_id IS NOT NULL;

  -- ========================================================
  -- STEP 6: Tambahkan FK, index, dan ganti tabel
  -- ========================================================
  ALTER TABLE recipes_new
    ADD CONSTRAINT recipes_new_restaurant_fk
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE CASCADE;

  ALTER TABLE recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_recipe_fk
    FOREIGN KEY (recipe_id) REFERENCES recipes_new(id) ON DELETE CASCADE;

  ALTER TABLE recipe_ingredients
    ADD CONSTRAINT recipe_ingredients_ingredient_fk
    FOREIGN KEY (ingredient_id) REFERENCES ingredients(id) ON DELETE CASCADE;

  -- Ganti tabel lama dengan baru
  DROP TABLE IF EXISTS recipes CASCADE;
  ALTER TABLE recipes_new RENAME TO recipes;

  -- Re-attach FK dari sale_items (safeguard kalau sudah ada)
  ALTER TABLE IF EXISTS sale_items DROP CONSTRAINT IF EXISTS sale_items_recipe_id_fkey;
  ALTER TABLE sale_items
    ADD CONSTRAINT sale_items_recipe_id_fkey
    FOREIGN KEY (recipe_id) REFERENCES recipes(id);

  -- Unique constraint biar ON CONFLICT di seeder/chat bisa jalan
  ALTER TABLE recipes ADD CONSTRAINT recipes_restaurant_name_unique
    UNIQUE (restaurant_id, name);
  ALTER TABLE recipe_ingredients ADD CONSTRAINT recipe_ingredients_recipe_ingredient_unique
    UNIQUE (recipe_id, ingredient_id);

  -- Index
  CREATE INDEX IF NOT EXISTS idx_recipes_restaurant_id ON recipes(restaurant_id);
  CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_recipe_id ON recipe_ingredients(recipe_id);
  CREATE INDEX IF NOT EXISTS idx_recipe_ingredients_ingredient_id ON recipe_ingredients(ingredient_id);

  -- ========================================================
  -- STEP 7: Reset sequence
  -- ========================================================
  PERFORM setval(pg_get_serial_sequence('recipes', 'id'), COALESCE((SELECT MAX(id) FROM recipes), 1));
  PERFORM setval(pg_get_serial_sequence('recipe_ingredients', 'id'), COALESCE((SELECT MAX(id) FROM recipe_ingredients), 1));

  -- ========================================================
  -- STEP 8: Bersihkan & verifikasi
  -- ========================================================
  DROP TABLE IF EXISTS recipes_flat_backup;

  RAISE NOTICE '[008] ✅ Normalisasi selesai.';
  RAISE NOTICE '[008]    recipes: % menu', (SELECT COUNT(*) FROM recipes);
  RAISE NOTICE '[008]    recipe_ingredients: % baris', (SELECT COUNT(*) FROM recipe_ingredients);

END $$;
