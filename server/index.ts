import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors'; // Tambahkan cors
import { createServer as createViteServer } from 'vite';

import dashboardRoutes from './routes/dashboard';
import ingredientRoutes from './routes/ingredients';
import movementRoutes from './routes/movements';
import recipeRoutes from './routes/recipes';
import salesRoutes from './routes/sales';
import ocrRoutes from './routes/ocr';
import chatRoutes from './routes/chat';
import authRoutes from './routes/auth';
import { requireAuth, requireRole } from './utils/authMiddleware';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Railway memberikan PORT secara otomatis lewat process.env.PORT
const PORT = process.env.PORT || 3000;

// 1. MIDDLEWARE UTAMA
// Izinkan akses dari Frontend (Vercel)
app.use(cors({
  origin: '*', // Untuk awal gunakan '*', nanti ganti dengan URL Vercel Anda demi keamanan
  credentials: true
}));

app.use(express.json({ limit: '15mb' }));

// 2. MOUNT ROUTES (API)
// Rute Auth tidak pakai requireAuth karena dipakai untuk Login/Daftar
app.use('/api/auth', authRoutes);

// SEMUA RUTE DI BAWAH INI WAJIB LOGIN (requireAuth)
// Ini krusial agar backend tahu restaurant_id si user
app.use('/api/dashboard', requireAuth, requireRole('Pemilik'), dashboardRoutes);
app.use('/api/ingredients', requireAuth, ingredientRoutes);
app.use('/api/movements', requireAuth, movementRoutes); // Tambahkan requireAuth
app.use('/api/recipes', requireAuth, recipeRoutes);       // Tambahkan requireAuth
app.use('/api/sales', requireAuth, requireRole('Kasir', 'Pemilik', 'Dapur'), salesRoutes);
app.use('/api/ocr', requireAuth, requireRole('Kasir', 'Pemilik'), ocrRoutes);
app.use('/api/gemini/chat', requireAuth, chatRoutes);    // Tambahkan requireAuth

// 3. SERVE FRONTEND (Vite / Static)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // Gunakan 0.0.0.0 agar bisa diakses di Cloud (Railway)
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[RESTOFLOW SAAS] Backend running on port ${PORT}`);
    console.log(`[DATABASE] Connected to Supabase PostgreSQL`);
  });
}

startServer();