-- =====================================================
-- MIGRASI: Tambah kolom refresh token ke shift_sessions
-- Jalankan di Supabase SQL Editor atau psql
-- =====================================================

-- Tambah kolom token_family untuk refresh token rotation
ALTER TABLE shift_sessions 
  ADD COLUMN IF NOT EXISTS token_family VARCHAR(128);

-- Tambah counter refresh (untuk audit + deteksi anomali)
ALTER TABLE shift_sessions 
  ADD COLUMN IF NOT EXISTS refresh_count INTEGER DEFAULT 0;

-- Index untuk lookup cepat by token_family
CREATE INDEX IF NOT EXISTS idx_shift_sessions_token_family ON shift_sessions(token_family);

-- =====================================================
-- VERIFIKASI
-- =====================================================
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'shift_sessions' 
  AND column_name IN ('token_family', 'refresh_count');
