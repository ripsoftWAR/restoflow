import { Request, Response, NextFunction } from 'express';
import db from '../db/database';
import { verifyToken, JwtPayload } from './jwt';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
        nama: string;
        restaurant_id: number;
        created_at?: string;
      };
      sessionId?: number;
      shiftId?: number;
    }
  }
}

/**
 * Extract Bearer token dari Authorization header.
 */
const extractToken = (req: Request): string | null => {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) return null;
  return authHeader.replace('Bearer ', '').trim();
};

/**
 * Middleware: Verifikasi JWT + cek session masih aktif.
 * 
 * Flow:
 * 1. Extract JWT dari Authorization header
 * 2. Verify signature → dapatkan payload (user data + session_id)
 * 3. Cek ke DB: session masih aktif? (logout_at IS NULL)
 * 4. Inject req.user + req.sessionId + req.shiftId
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);
  
  if (!token) {
    return res.status(401).json({ error: 'Token tidak ditemukan. Silakan login ulang.' });
  }

  // 1. Verify JWT
  const payload: JwtPayload | null = verifyToken(token);
  
  if (!payload) {
    return res.status(401).json({ error: 'Token tidak valid atau sudah kadaluarsa. Silakan login ulang.' });
  }

  // 2. Cek session masih aktif di DB (logout_at IS NULL)
  try {
    const result = await db.query(
      `SELECT id FROM shift_sessions 
       WHERE id = $1 AND logout_at IS NULL`,
      [payload.session_id]
    );

    if (!result.rows[0]) {
      return res.status(401).json({ error: 'Sesi telah berakhir. Silakan login ulang.' });
    }

    // 3. Inject user data dari JWT payload
    req.user = {
      id: payload.user_id,
      username: payload.username,
      role: payload.role,
      nama: payload.nama,
      restaurant_id: payload.restaurant_id,
    };
    req.sessionId = payload.session_id;
    req.shiftId = payload.shift_id;

    next();
  } catch (err) {
    console.error('Auth DB Error:', err);
    return res.status(500).json({ error: 'Gagal memverifikasi sesi.' });
  }
};

/**
 * Middleware: Role-based access control.
 * Pemilik selalu lolos.
 */
export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const run = () => {
      if (!req.user) {
        return res.status(401).json({ error: 'Akses ditolak, user belum terautentikasi' });
      }
      // Pemilik selalu lolos
      if (req.user.role === 'Pemilik') return next();
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Akses dilarang untuk role ini' });
      }
      next();
    };

    if (req.user) {
      return run();
    }
    
    try {
      await requireAuth(req, res, (err?: any) => {
        if (err) return next(err);
        run();
      });
    } catch (e) {
      next(e);
    }
  };
};

/**
 * Middleware: Feature-based access control (granular).
 */
export const requireFeature = (featureKey: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      try {
        await requireAuth(req, res, (err?: any) => {
          if (err) return next(err);
          checkFeature(req, res, next, featureKey);
        });
        return;
      } catch (e) {
        return next(e);
      }
    }
    await checkFeature(req, res, next, featureKey);
  };
};

const checkFeature = async (req: Request, res: Response, next: NextFunction, featureKey: string) => {
  try {
    if (req.user?.role === 'Pemilik') return next();

    const result = await db.query(
      `SELECT enabled FROM user_features
       WHERE user_id = $1 AND feature_key = $2`,
      [req.user?.id, featureKey]
    );

    const feature = result.rows[0];
    if (!feature || !feature.enabled) {
      return res.status(403).json({
        error: 'Akses ditolak',
        detail: `Fitur "${featureKey}" tidak diaktifkan untuk user ini`,
      });
    }

    next();
  } catch (err) {
    console.error('Feature check error:', err);
    return res.status(500).json({ error: 'Gagal memeriksa izin fitur' });
  }
};
