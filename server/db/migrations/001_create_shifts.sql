-- =====================================================
-- MIGRASI: Pastikan tabel shifts ada
-- Jalankan di Supabase SQL Editor atau psql
-- =====================================================

-- Cek apakah tabel shifts sudah ada, kalau belum → buat
CREATE TABLE IF NOT EXISTS shifts (
  id            SERIAL PRIMARY KEY,
  restaurant_id INTEGER NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  nama          VARCHAR(100) NOT NULL,
  jam_mulai     TIME NOT NULL DEFAULT '08:00',
  jam_akhir     TIME NOT NULL DEFAULT '16:00',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Index untuk lookup cepat
CREATE INDEX IF NOT EXISTS idx_shifts_restaurant_id ON shifts(restaurant_id);

-- =====================================================
-- SEED: Insert shift default untuk restoran yang belum punya
-- =====================================================
INSERT INTO shifts (restaurant_id, nama, jam_mulai, jam_akhir)
SELECT 
  r.id,
  'Shift 1',
  '08:00'::TIME,
  '16:00'::TIME
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM shifts s WHERE s.restaurant_id = r.id
);

INSERT INTO shifts (restaurant_id, nama, jam_mulai, jam_akhir)
SELECT 
  r.id,
  'Shift 2',
  '16:00'::TIME,
  '24:00'::TIME
FROM restaurants r
WHERE NOT EXISTS (
  SELECT 1 FROM shifts s WHERE s.restaurant_id = r.id AND s.nama = 'Shift 2'
);

-- =====================================================
-- VERIFIKASI
-- =====================================================
SELECT 
  r.name AS restoran,
  COUNT(s.id) AS jumlah_shift,
  STRING_AGG(s.nama || ' (' || s.jam_mulai::TEXT || ' - ' || s.jam_akhir::TEXT || ')', ', ') AS shifts
FROM restaurants r
LEFT JOIN shifts s ON s.restaurant_id = r.id
GROUP BY r.id, r.name
ORDER BY r.id;
