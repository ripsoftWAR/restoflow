-- ============================================================
-- 007_add_recipe_options.sql
-- Menambahkan kolom spice/sugar/custom_options ke tabel recipes
-- agar sesuai dengan kebutuhan frontend RecipeWithDetails
-- ============================================================

-- 1. spice_level_option — opsi level pedas (0/1)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS spice_level_option INTEGER DEFAULT 0;

-- 2. sugar_level_option — opsi level gula (0/1)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS sugar_level_option INTEGER DEFAULT 0;

-- 3. custom_options — opsi kustom dalam format string (JSON/text)
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS custom_options TEXT DEFAULT '';

-- Verifikasi
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'recipes'
  AND column_name IN ('spice_level_option', 'sugar_level_option', 'custom_options');
