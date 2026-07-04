import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
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
import appRoutes from './routes/app';
import { requireAuth, requireRole } from './utils/authMiddleware';
import voucherRoutes from './routes/vouchers';
import { runMigrations, testConnection } from './db/database';

dotenv.config();

const app = express();

// Railway menggunakan reverse proxy — Express harus percaya header X-Forwarded-For
// Nilai 1 = percaya 1 proxy pertama (Railway load balancer)
app.set('trust proxy', 1);

// ── Port: Railway inject PORT, local default 3000 ──
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENV;

// ── Cek JWT_SECRET ──
if (!process.env.JWT_SECRET) {
  console.warn('⚠️  JWT_SECRET tidak diset — menggunakan fallback (tidak aman untuk production!)');
}
if (!process.env.JWT_REFRESH_SECRET) {
  console.warn('⚠️  JWT_REFRESH_SECRET tidak diset — menggunakan fallback (tidak aman untuk production!)');
}

// ==========================================
// 1. KONFIGURASI CORS
// ==========================================
const allowedOrigins = [
  'http://localhost:5173',           // Frontend Lokal (Vite)
  'http://localhost:3000',           // Local backend itself
];

// Tambahkan origin dari environment variable (production)
if (process.env.CORS_ALLOWED_ORIGINS) {
  const envOrigins = process.env.CORS_ALLOWED_ORIGINS.split(',').map(o => o.trim());
  allowedOrigins.push(...envOrigins);
}

// Di production, kalau tidak ada CORS_ALLOWED_ORIGINS, izinkan semua origin
// (Supaya tidak pusing dengan URL Vercel/Railway yang berubah-ubah)
if (isProduction && !process.env.CORS_ALLOWED_ORIGINS) {
  console.warn('⚠️  CORS_ALLOWED_ORIGINS tidak diset — mengizinkan semua origin (production mode)');
}

app.use(cors({
  origin: (origin, callback) => {
    // Izinkan request tanpa origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    
    // Production tanpa whitelist → izinkan semua
    if (isProduction && !process.env.CORS_ALLOWED_ORIGINS) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`[CORS Error] Origin ${origin} tidak diizinkan.`);
      callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Handle Preflight Request
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

// ── Static: serve APK files publicly (for download button) ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/apk', express.static(path.join(__dirname, 'apk'), {
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.apk')) {
      res.setHeader('Content-Type', 'application/vnd.android.package-archive');
      res.setHeader('Content-Disposition', 'attachment; filename="RestoFlow-Kasir.apk"');
    }
  },
}));

// ==========================================
// 3. RATE LIMITER (Hardening Step 1)
// ==========================================
// Limiter ketat untuk endpoint auth (cegah brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 20, // max 20 percobaan login/register per window
  message: { error: 'Terlalu banyak percobaan. Coba lagi 15 menit lagi.', retryAfter: 15 },
  standardHeaders: true,
  legacyHeaders: false,
});

// Limiter umum untuk seluruh API
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 menit
  max: 300, // max 300 request per window (rata-rata 1 req/3 detik)
  message: { error: 'Terlalu banyak request. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ==========================================
// 4. API ROUTES
// ==========================================
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/app', apiLimiter, appRoutes);  // APK download + version check
app.use('/api/dashboard', apiLimiter, requireAuth, dashboardRoutes);
app.use('/api/ingredients', apiLimiter, requireAuth, ingredientRoutes);
app.use('/api/movements', apiLimiter, requireAuth, movementRoutes);
app.use('/api/recipes', apiLimiter, requireAuth, recipeRoutes);
app.use('/api/sales', apiLimiter, requireAuth, requireRole('Kasir', 'Pemilik', 'Dapur'), salesRoutes);
app.use('/api/ocr', apiLimiter, requireAuth, requireRole('Kasir', 'Pemilik'), ocrRoutes);
app.use('/api/gemini/chat', apiLimiter, requireAuth, chatRoutes);
app.use('/api/vouchers', apiLimiter, requireAuth, requireRole('Pemilik', 'Kasir'), voucherRoutes);
app.use('/api/users', apiLimiter, requireAuth, requireRole('Pemilik'), userRoutes);
// ==========================================
// 5. HEALTH CHECK & ERROR HANDLING
// ==========================================
// Health check — cek koneksi database juga
app.get('/health', async (_req, res) => {
  const dbOk = await testConnection();
  res.status(dbOk ? 200 : 503).json({
    status: dbOk ? 'OK' : 'DEGRADED',
    message: dbOk ? 'Restoflow Backend is running' : 'Database connection failed',
    database: dbOk ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

// Simple ping (tanpa DB check — untuk Railway health check yang cepat)
app.get('/ping', (_req, res) => {
  res.status(200).send('pong');
});

// Error handling global
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[Global Error]:', err.stack);
  res.status(500).json({ error: 'Internal Server Error', message: err.message });
});

// ==========================================
// 6. JALANKAN SERVER (dengan migrasi auto)
// ==========================================
const startServer = async () => {
  console.log('🔄 Menjalankan migrasi database...');
  const migrationResults = await runMigrations();
  if (migrationResults.length > 0) {
    console.log('📋 Hasil migrasi:');
    migrationResults.forEach(r => console.log(`   ${r}`));
  }

  // Cek koneksi database sebelum listen
  const dbOk = await testConnection();
  if (!dbOk) {
    console.error('❌ GAGAL terkoneksi ke database!');
    console.error('   Pastikan DATABASE_URL sudah benar di environment variables.');
    // Tetap listen — Railway akan restart kalau crash
  } else {
    console.log('✅ Database connected');
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log('');
    console.log('  🚀 RESTOFLOW Backend is ready!');
    console.log(`  📡 Port: ${PORT}`);
    console.log(`  🌍 Environment: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    console.log(`  💾 Database: ${dbOk ? '✅ Connected' : '❌ Disconnected'}`);
    console.log('');
  });
};

startServer();