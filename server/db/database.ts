import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_URL;
if (!connectionString) {
  throw new Error('Missing database connection string. Set DATABASE_URL or SUPABASE_DB_URL in .env');
}

// Deteksi environment
const isSupabasePooler = connectionString.includes('pooler.supabase.com');
const useSsl = process.env.DATABASE_SSL === 'true'
  || connectionString.includes('sslmode=require')
  || connectionString.includes('.supabase.co');

const db = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined,
  // Supabase PgBouncer (transaction mode) hanya support 1 koneksi aktif
  // per session — jangan pakai prepared statements
  max: isSupabasePooler ? 3 : 10,
  idleTimeoutMillis: isSupabasePooler ? 10000 : 30000,
  connectionTimeoutMillis: 10000,
  // Nonaktifkan prepared statements untuk PgBouncer compatibility
  // (pg library akan fallback ke text query kalau prepared statement gagal)
  ...(isSupabasePooler ? {
    statement_timeout: 30000,
  } : {}),
});

/**
 * Jalankan semua file migrasi SQL dari folder migrations/ secara berurutan.
 * File dijalankan berdasarkan urutan nama (001_, 002_, dst).
 * Idempotent — bisa dijalankan berkali-kali (pakai IF NOT EXISTS).
 */
export const runMigrations = async (): Promise<string[]> => {
  // Gunakan process.cwd() karena di production (bundled), __dirname mengarah ke dist/
  // tapi file migrasi ada di server/db/migrations/
  const migrationsDir = path.join(process.cwd(), 'server', 'db', 'migrations');
  const results: string[] = [];

  if (!fs.existsSync(migrationsDir)) {
    console.log('[MIGRATION] Folder migrations/ tidak ditemukan — skip');
    return results;
  }

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort(); // urutkan: 000_..., 001_..., 002_...

  if (files.length === 0) {
    console.log('[MIGRATION] Tidak ada file .sql di migrations/ — skip');
    return results;
  }

  for (const file of files) {
    const filePath = path.join(migrationsDir, file);
    const sql = fs.readFileSync(filePath, 'utf-8');

    try {
      console.log(`[MIGRATION] Running: ${file}...`);
      await db.query(sql);
      results.push(`✅ ${file}`);
      console.log(`[MIGRATION] ✅ ${file} — OK`);
    } catch (err: any) {
      console.error(`[MIGRATION] ❌ ${file} — ${err.message}`);
      // Kalau error bukan "already exists" atau "duplicate", lempar
      if (
        !err.message.includes('already exists') &&
        !err.message.includes('duplicate') &&
        !err.message.includes('IF NOT EXISTS')
      ) {
        results.push(`❌ ${file}: ${err.message}`);
        // Jangan throw — biarkan server tetap jalan meski ada yang gagal
        // Karena tabel mungkin sudah dibuat manual
      } else {
        results.push(`⚠️ ${file}: ${err.message} (skip — already exists)`);
      }
    }
  }

  return results;
};

/**
 * Test koneksi database — dipakai oleh health check.
 */
export const testConnection = async (): Promise<boolean> => {
  try {
    const result = await db.query('SELECT 1 AS ok');
    return result.rows[0]?.ok === 1;
  } catch {
    return false;
  }
};

/**
 * Fungsi untuk menginisialisasi restoran baru (Seed Data)
 * Dipanggil saat seseorang mendaftar akun restoran baru
 */
export const initializeNewRestaurant = async (restaurantId: number, pemilikNama: string) => {
  // 1. Masukkan Shift Default untuk restoran baru ini
  await db.query(
    `INSERT INTO shifts (restaurant_id, nama, jam_mulai, jam_akhir) 
     VALUES ($1, 'Shift 1', '08:00', '16:00'), ($1, 'Shift 2', '16:00', '24:00')`,
    [restaurantId]
  );
  
  console.log(`[SEED] Default shifts created for Restaurant ID: ${restaurantId}`);
};

export default db;