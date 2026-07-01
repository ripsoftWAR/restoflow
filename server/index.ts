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
app.use('/api/dashboard', apiLimiter, requireAuth, requireRole('Pemilik'), dashboardRoutes);
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
// 6. JALANKAN SERVER
// ==========================================
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`
  🚀 RESTOFLOW Backend is ready!
  📡 Port: ${PORT}
  🔗 URL: https://restoflow-production-fee9.up.railway.app
  `);
});