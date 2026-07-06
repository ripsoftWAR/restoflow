-- ============================================================
-- 004_inventory_enhance.sql
-- Menambahkan field untuk Master-Detail Inventory Layout
-- ============================================================

-- 1. Tambah kolom baru untuk enhanced inventory management
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS sku                 VARCHAR(50);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS reorder_point       NUMERIC(12,3) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS storage_capacity    NUMERIC(12,3) DEFAULT 0;
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS storage_capacity_unit VARCHAR(20);
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS updated_at          TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE ingredients ADD COLUMN IF NOT EXISTS created_at          TIMESTAMPTZ DEFAULT NOW();

-- 2. Index untuk lookup cepat by SKU per restoran
CREATE UNIQUE INDEX IF NOT EXISTS idx_ingredients_sku
  ON ingredients(sku, restaurant_id)
  WHERE sku IS NOT NULL AND sku != '';

-- 3. Hapus kolom 'unit' yang tidak terpakai (selalu null, vestigial dari schema awal)
-- Aman: tidak ada referensi di kode TypeScript maupun server routes
ALTER TABLE ingredients DROP COLUMN IF EXISTS unit;
