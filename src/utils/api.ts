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

export const makeApiFetch = (sessionId: number | null) =>
  (url: string, options: RequestInit = {}) =>
    fetch(resolveApiUrl(url), {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...(sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {}),
      },
    });

export const formatIDR = (num: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num);