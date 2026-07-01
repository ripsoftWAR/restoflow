import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'restoflow-dev-secret-change-in-production';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'restoflow-refresh-secret-change-in-production';
const JWT_EXPIRES_IN = '12h'; // Access token: sesuai durasi shift kerja
const JWT_REFRESH_EXPIRES_IN = '30d'; // Refresh token: 30 hari

export interface JwtPayload {
  session_id: number;
  user_id: number;
  username: string;
  role: string;
  nama: string;
  restaurant_id: number;
  shift_id: number;
  shift_nama: string;
}

export interface RefreshPayload {
  session_id: number;
  user_id: number;
  token_family: string;
}

/**
 * Generate JWT access token (short-lived) dari data session login.
 * Dipakai untuk autentikasi API calls.
 */
export const generateToken = (payload: JwtPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate refresh token (long-lived) untuk memperpanjang session.
 * Rotated setiap kali dipakai — mencegah replay attack.
 */
export const generateRefreshToken = (payload: RefreshPayload): string => {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Generate token family ID untuk refresh token rotation.
 */
export const generateTokenFamily = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Verify dan decode JWT access token.
 * Return null jika token invalid atau expired.
 */
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
};

/**
 * Verify dan decode refresh token.
 * Return null jika token invalid atau expired.
 */
export const verifyRefreshToken = (token: string): RefreshPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET) as RefreshPayload;
    return decoded;
  } catch {
    return null;
  }
};
