import { Request, Response, NextFunction } from 'express';
import db from '../db/database'; // Pastikan ini mengarah ke file pool pg Anda

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        username: string;
        role: string;
        nama: string;
        restaurant_id: number; // Kunci utama SaaS
        created_at?: string;
      };
      sessionId?: number;
    }
  }
}

const parseSessionId = (req: Request) => {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  const sessionId = Number(token);
  return Number.isInteger(sessionId) ? sessionId : null;
};

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const sessionId = parseSessionId(req);
  if (!sessionId) {
    return res.status(401).json({ error: 'Authorization header invalid atau session tidak diberikan' });
  }

  try {
    // 1. Ganti ke PostgreSQL Query dengan $1
    // 2. Tambahkan u.restaurant_id ke dalam SELECT
    const result = await db.query(
      `SELECT ss.id as session_id, u.id as user_id, u.username, u.role, u.nama, u.restaurant_id, u.created_at as user_created_at
       FROM shift_sessions ss
       JOIN users u ON ss.user_id = u.id
       WHERE ss.id = $1 AND ss.logout_at IS NULL`,
      [sessionId]
    );

    const session = result.rows[0];

    if (!session) {
      return res.status(401).json({ error: 'Session tidak aktif atau tidak ditemukan' });
    }

    // 3. Masukkan restaurant_id ke dalam req.user agar bisa dipakai di rute lain
    req.user = {
      id: session.user_id,
      username: session.username,
      role: session.role,
      nama: session.nama,
      restaurant_id: session.restaurant_id, 
      created_at: session.user_created_at,
    };
    
    req.sessionId = session.session_id;
    next();
  } catch (err) {
    console.error('Auth Error:', err);
    return res.status(500).json({ error: 'Database error pada saat autentikasi' });
  }
};

export const requireRole = (...roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const run = () => {
      if (!req.user) {
        return res.status(401).json({ error: 'Akses ditolak, user belum terautentikasi' });
      }
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Akses dilarang untuk role ini' });
      }
      next();
    };

    if (req.user) {
      return run();
    }
    
    // Jika requireAuth belum dijalankan, jalankan secara asinkron
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