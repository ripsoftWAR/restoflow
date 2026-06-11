import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import userRoutes from './routes/users';

// Import Routes
import dashboardRoutes from './routes/dashboard';
import ingredientRoutes from './routes/ingredients';
import movementRoutes from './routes/movements';
import recipeRoutes from './routes/recipes';
import salesRoutes from './routes/sales';
import ocrRoutes from './routes/ocr';
import chatRoutes from './routes/chat';
import authRoutes from './routes/auth';
import { requireAuth, requireRole } from './utils/authMiddleware';
import voucherRoutes from './routes/vouchers';

dotenv.config();

const app = express();
// Railway biasanya memberikan port otomatis lewat process.env.PORT
const PORT = process.env.PORT || 8080;

// ==========================================
// 1. KONFIGURASI CORS (Penyebab Error Sebelumnya)
// ==========================================
const allowedOrigins = [
  'http://localhost:5173',           // Frontend Lokal
  'https://restoflow-ruddy.vercel.app', // Frontend Vercel (sesuaikan dengan URL kamu)
  'https://restoflow-production-fee9.up.railway.app' // URL Backend itu sendiri
];

// Menambahkan origin dari Environment Variable jika ada
if (process.env.CORS_ALLOWED_ORIGINS) {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (seperti mobile apps, curl, atau Postman)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`[CORS Error] Origin ${origin} tidak diizinkan.`);
      callback(null, false); // Jangan kirim error, biarkan browser yang blokir
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Handle Preflight Request (Sangat penting untuk Railway)
app.options('*', cors());

// ==========================================
// 2. MIDDLEWARE UMUM
// ==========================================
// Logger sederhana untuk memantau request masuk di Railway Logs
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} - From: ${req.headers.origin || 'Unknown'}`);
  next();
});

app.use(express.json({ limit: '15mb' }));

// ==========================================
// 3. API ROUTES
// ==========================================
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', requireAuth, requireRole('Pemilik'), dashboardRoutes);
app.use('/api/ingredients', requireAuth, ingredientRoutes);
app.use('/api/movements', requireAuth, movementRoutes);
app.use('/api/recipes', requireAuth, recipeRoutes);
app.use('/api/sales', requireAuth, requireRole('Kasir', 'Pemilik', 'Dapur'), salesRoutes);
app.use('/api/ocr', requireAuth, requireRole('Kasir', 'Pemilik'), ocrRoutes);
app.use('/api/gemini/chat', requireAuth, chatRoutes);
app.use('/api/vouchers', requireAuth, requireRole('Pemilik', 'Kasir'), voucherRoutes);
app.use('/api/users', requireAuth, requireRole('Pemilik'), userRoutes);
// ==========================================
// 4. HEALTH CHECK & ERROR HANDLING
// ==========================================
// Health check agar Railway tahu service ini berjalan
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Restoflow Backend is running' });
});

// Error handling global
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('[Global Error]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ==========================================
// 5. JALANKAN SERVER
// ==========================================
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`
  🚀 RESTOFLOW Backend is ready!
  📡 Port: ${PORT}
  🔗 URL: https://restoflow-production-fee9.up.railway.app
  `);
});