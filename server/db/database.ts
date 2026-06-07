import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

// Koneksi ke Supabase
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
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