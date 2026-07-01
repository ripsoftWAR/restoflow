import type { Sale } from '../../types';

/**
 * Format angka ke format Rupiah singkat (compact)
 * Contoh: 1200000 -> "1,2jt", 5000 -> "5rb", 100 -> "100"
 */
export function formatIDRCompact(num: number): string {
  if (num === 0) return '0';
  if (num >= 1_000_000) {
    const val = num / 1_000_000;
    return val % 1 === 0 ? `${val.toLocaleString('id-ID')}jt` : `${val.toFixed(1).replace('.', ',')}jt`;
  }
  if (num >= 1_000) {
    return `${Math.round(num / 1_000)}rb`;
  }
  return Math.round(num).toLocaleString('id-ID');
}

export function parseDashboardDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const raw = String(value).trim();
  if (!raw) return null;

  const candidates = [raw, raw.replace(' ', 'T')];
  for (const candidate of candidates) {
    const parsed = new Date(candidate);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }

  return null;
}

export function getSafeNumber(value: unknown): number {
  const parsed = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildSalesChartData(
  sales: Sale[],
  dateRange: 'today' | '7d' | '30d' | 'custom',
  fallbackTrend: Array<{ date: string; amount: number }> = []
) {
  const dayMap: Record<string, number> = {};
  const useFallback = sales.length === 0 && fallbackTrend.length > 0;

  if (useFallback) {
    fallbackTrend.forEach(item => {
      const date = String(item.date || '').trim();
      if (!date) return;
      dayMap[date] = (dayMap[date] || 0) + getSafeNumber(item.amount);
    });
  } else {
    sales.forEach(sale => {
      const d = parseDashboardDate(sale.created_at);
      if (!d) return;
      const key = dateRange === 'today'
        ? d.toISOString().slice(0, 13)
        : d.toISOString().split('T')[0];
      dayMap[key] = (dayMap[key] || 0) + getSafeNumber(sale.total_price);
    });
  }

  return Object.entries(dayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, val]) => {
      const d = new Date(date);
      const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
      let label: string;
      if (dateRange === 'today') {
        label = d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      } else if (dateRange === '7d') {
        label = dayNames[d.getDay()];
      } else {
        label = d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      }
      return { time: label, val, date };
    });
}