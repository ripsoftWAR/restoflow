-- ============================================================
-- 005_scan_history.sql
-- Tabel riwayat scan struk belanja (OCR receipt scanner)
-- ============================================================

CREATE TABLE IF NOT EXISTS scan_history (
  id              SERIAL PRIMARY KEY,
  restaurant_id   INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  source          VARCHAR(50) DEFAULT 'upload',
  image_url       TEXT,
  total_amount    NUMERIC(12,2),
  items_detected  JSONB,
  status          VARCHAR(20) DEFAULT 'verified',
  verified_at     TIMESTAMPTZ DEFAULT NOW(),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scan_history_restaurant
  ON scan_history(restaurant_id, created_at DESC);

COMMENT ON COLUMN scan_history.source         IS 'upload | camera';
COMMENT ON COLUMN scan_history.total_amount   IS 'Total nilai belanja dari struk (Rp)';
COMMENT ON COLUMN scan_history.items_detected IS 'Array item hasil scan: [{ rawName, quantity, unit, pricePerUnit, totalPrice, convertedQuantity, convertedUnit, ... }]';
COMMENT ON COLUMN scan_history.status         IS 'verified (default) | pending | rejected';
