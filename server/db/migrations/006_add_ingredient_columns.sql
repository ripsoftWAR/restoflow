-- ============================================================
-- 006_add_ingredient_columns.sql
-- Menambahkan kolom yang dipakai oleh frontend & route ingredients
-- Kolom: supplier, base_unit, unit_price, buy_unit, conversion_factor
-- ============================================================

-- 1. supplier — nama supplier/pemasok bahan
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS supplier VARCHAR(200);

-- 2. base_unit — satuan dasar (gram, ml, pcs, dll)
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS base_unit VARCHAR(50) DEFAULT 'gram';

-- 3. unit_price — harga per base_unit (menggantikan cost_per_unit dari skema awal)
--    cost_per_unit tetap dipertahankan untuk backward compatibility
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS unit_price NUMERIC(15,2) DEFAULT 0;

-- 4. buy_unit — satuan pembelian (kg, liter, karton, dll)
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS buy_unit VARCHAR(50);

-- 5. conversion_factor — faktor konversi dari buy_unit ke base_unit
--    contoh: buy_unit='kg', base_unit='gram', conversion_factor=1000
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS conversion_factor NUMERIC(12,3) DEFAULT 1;

-- 6. Sinkronisasi: isi base_unit dengan 'gram' untuk data yang belum punya
UPDATE ingredients SET base_unit = 'gram' WHERE base_unit IS NULL;

-- 7. Index untuk pencarian supplier
CREATE INDEX IF NOT EXISTS idx_ingredients_supplier
  ON ingredients(supplier, restaurant_id)
  WHERE supplier IS NOT NULL AND supplier != '';
