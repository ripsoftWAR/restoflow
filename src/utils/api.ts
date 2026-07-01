// API.ts

const rawApiUrl = (import.meta as any).env.VITE_API_URL || '';
export const API_URL = rawApiUrl ? rawApiUrl.replace(/\/$/, '') : '';

const normalizeApiUrl = (url: string) => {
  if (!url) return '';
  if (/^https?:\/\//.test(url)) return url.replace(/\/$/, '');
  return `https://${url.replace(/\/$/, '')}`;
};

export const resolveApiUrl = (url: string) => {
  if (url.startsWith('http')) return url;
  const safeApiUrl = API_URL ? normalizeApiUrl(API_URL) : '';
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