// API.ts

const rawApiUrl = (import.meta as any).env.VITE_API_URL || '';

/**
 * Auto-detect API base URL:
 *   1. Pakai VITE_API_URL kalau diset (production di Vercel/Railway)
 *   2. Fallback ke http://localhost:3000 saat development
 *   3. Fallback ke path relatif (same origin)
 */
const detectApiBase = (): string => {
  if (rawApiUrl) return rawApiUrl.replace(/\/$/, '');
  // Vite injects import.meta.env.DEV = true saat `npm run dev`
  if ((import.meta as any).env.DEV) return 'http://localhost:3000';
  return '';
};

const API_BASE = detectApiBase();

const normalizeApiUrl = (url: string) => {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url.replace(/\/$/, '');
  return `https://${url.replace(/\/$/, '')}`;
};

export const resolveApiUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  const safeApiUrl = API_BASE ? normalizeApiUrl(API_BASE) : '';
  return safeApiUrl ? `${safeApiUrl}${url}` : url;
};

export const makeApiFetch = (authToken: string | null) =>
  (url: string, options: RequestInit = {}) => {
    
    // 1. Gabungkan Headers
    const headers = new Headers(options.headers || {});

    // 2. Tambahkan Authorization jika ada token
    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    // 3. Tambahkan Content-Type JSON jika ada body dan bukan kirim file (FormData)
    if (options.body && !(options.body instanceof FormData)) {
      if (!headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
    }

    // 4. Kembalikan fetch secara standar (tetap mengembalikan Response object)
    return fetch(resolveApiUrl(url), {
      ...options,
      headers: headers,
    });
  };

export const formatIDR = (num: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', 
    currency: 'IDR',
    minimumFractionDigits: 0, 
    maximumFractionDigits: 0,
  }).format(num);

/**
 * Ambil token auth dari localStorage.
 * Satu-satunya tempat yang tahu key penyimpanan.
 * Semua komponen yang butuh auth wajib pakai ini — jangan localStorage langsung.
 */
const AUTH_STORAGE_KEY = 'restoflow_session_id';

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_STORAGE_KEY);
};

export const setAuthToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, token);
};

export const removeAuthToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
};

/**
 * Convenience: fetch dengan auto-inject auth token + resolveApiUrl.
 * Pengganti fetch() mentah yang rawan lupa header.
 *
 * Token di-refresh dari localStorage SETIAP request — aman untuk login/logout.
 *
 * @example
 * const res = await apiFetch('/api/ingredients');
 * const data = await res.json();
 */
export const apiFetch = (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  const token = getAuthToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }
  return fetch(resolveApiUrl(url), { ...options, headers });
};