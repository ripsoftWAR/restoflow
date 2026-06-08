import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL || process.env.SUPABASE_URL;
if (!connectionString) {
  throw new Error('Missing database connection string. Set DATABASE_URL or SUPABASE_DB_URL in .env');
}

const useSsl = process.env.DATABASE_SSL === 'true'
  || connectionString.includes('sslmode=require')
  || connectionString.includes('.supabase.co');

const db = new Pool({
  connectionString,
  ssl: useSsl ? { rejectUnauthorized: false } : undefined
});

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