-- =====================================================
-- MIGRASI 003: Refactor sales ke skema invoice
--   • Tambah kolom header (invoice_id, total, discount, dll)
--   • Buat tabel sale_items
--   • Backfill data lama → setiap row jadi 1 invoice 1 item
--   • Idempotent — aman dijalankan berkali-kali
-- =====================================================

-- ── 1. Kolom baru di sales (header invoice) ──────────
ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id         INTEGER REFERENCES users(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS shift_session_id INTEGER REFERENCES shift_sessions(id);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS total            NUMERIC(15,2);
ALTER TABLE sales ADD COLUMN IF NOT EXISTS discount         NUMERIC(15,2) DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS notes            TEXT;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS sale_date        DATE;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS invoice_id       VARCHAR(50);

-- ── 2. Backfill data lama → kolom baru ──────────────
UPDATE sales SET sale_date  = created_at::date               WHERE sale_date IS NULL;
UPDATE sales SET total      = COALESCE(total_price, 0)       WHERE total IS NULL;
UPDATE sales SET invoice_id = 'INV-' || TO_CHAR(COALESCE(sale_date, created_at::date), 'YYYYMMDD') || '-' || LPAD(id::TEXT, 4, '0')
  WHERE invoice_id IS NULL;

-- ── 3. Unique index untuk invoice_id ────────────────
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_invoice_id ON sales(invoice_id);
CREATE INDEX IF NOT EXISTS idx_sales_sale_date      ON sales(sale_date);

-- ── 4. Tabel sale_items (line items per invoice) ────
CREATE TABLE IF NOT EXISTS sale_items (
  id                SERIAL PRIMARY KEY,
  sale_id           INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
  recipe_id         INTEGER REFERENCES recipes(id),
  menu_name         VARCHAR(200) NOT NULL,
  quantity          INTEGER NOT NULL DEFAULT 1,
  price             NUMERIC(15,2) NOT NULL,
  subtotal          NUMERIC(15,2) NOT NULL,
  selected_options  TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id ON sale_items(sale_id);

-- ── 5. Backfill sale_items dari data flat lama ──────
INSERT INTO sale_items (sale_id, menu_name, quantity, price, subtotal, selected_options)
SELECT
  s.id,
  COALESCE(s.menu_name, 'Unknown Item'),
  COALESCE(s.quantity, 1),
  CASE WHEN COALESCE(s.quantity, 1) > 0
    THEN COALESCE(s.total_price, 0) / s.quantity
    ELSE COALESCE(s.total_price, 0)
  END,
  COALESCE(s.total_price, 0),
  COALESCE(s.selected_options, '')
FROM sales s
WHERE s.menu_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM sale_items si WHERE si.sale_id = s.id
  );

-- ── 6. Tambah index untuk lookup cepat ──────────────
CREATE INDEX IF NOT EXISTS idx_sales_restaurant_id ON sales(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales(payment_method);

-- =====================================================
-- VERIFIKASI
-- =====================================================
SELECT 
  'sales'              AS tabel,
  COUNT(*)             AS total_rows,
  COUNT(invoice_id)    AS punya_invoice,
  COUNT(total)         AS punya_total
FROM sales
UNION ALL
SELECT 
  'sale_items',
  COUNT(*), 0, 0
FROM sale_items;
