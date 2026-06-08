import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import cors from 'cors';

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

const app = express();
const PORT = process.env.PORT || 8080;

// 1. MIDDLEWARE
const frontendOrigin = process.env.APP_URL || process.env.FRONTEND_URL || '*';
app.use(cors({
  origin: frontendOrigin,
  credentials: true
}));
app.use(express.json({ limit: '15mb' }));

// 2. API ROUTES
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', requireAuth, requireRole('Pemilik'), dashboardRoutes);
app.use('/api/ingredients', requireAuth, ingredientRoutes);
app.use('/api/movements', requireAuth, movementRoutes);
app.use('/api/recipes', requireAuth, recipeRoutes);
app.use('/api/sales', requireAuth, requireRole('Kasir', 'Pemilik', 'Dapur'), salesRoutes);
app.use('/api/ocr', requireAuth, requireRole('Kasir', 'Pemilik'), ocrRoutes);
app.use('/api/gemini/chat', requireAuth, chatRoutes);

// 3. HEALTH CHECK (Untuk Railway agar tidak dianggap mati)
app.get('/health', (req, res) => res.send('OK'));

// 4. JALANKAN SERVER (Cukup Sekali)
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[RESTOFLOW] Backend running on port ${PORT}`);
});