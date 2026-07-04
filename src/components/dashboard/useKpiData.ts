import { useMemo } from 'react';
import {
  startOfDay, endOfDay, subDays, startOfMonth, endOfMonth,
  subMonths, startOfYear, isWithinInterval, format,
} from 'date-fns';
import type { Sale, Ingredient } from '../../types';
import type { KpiDataPoint, KpiPeriod, KpiComparePeriod } from './PremiumKPICard';

/* ═══════════════════════════════════════════════════════════════
   KPI Data Helpers — per-card period & comparison
   
   Each KPI card has ONE combined dropdown (period + compare).
   This hook computes ONE card's data at a time.
   ═══════════════════════════════════════════════════════════════ */

/* ── Combined period options (single dropdown) ─── */
export interface CombinedPeriodOption {
  period: KpiPeriod;
  comparePeriod: KpiComparePeriod;
  label: string;
}

export const COMBINED_PERIOD_OPTIONS: CombinedPeriodOption[] = [
  { period: 'today', comparePeriod: 'yesterday', label: 'Hari ini vs kemarin' },
  { period: '7d', comparePeriod: 'lastWeek', label: '7 hari vs minggu lalu' },
  { period: '30d', comparePeriod: 'lastMonth', label: '30 hari vs bulan lalu' },
  { period: 'thisMonth', comparePeriod: 'lastMonth', label: 'Bulan ini vs bulan lalu' },
  { period: '3months', comparePeriod: 'lastMonth', label: '3 bulan vs bulan lalu' },
  { period: '1year', comparePeriod: 'lastYear', label: '1 tahun vs tahun lalu' },
];

/* ── Match combined option from period ────────── */
export function findCombinedOption(period: KpiPeriod, comparePeriod: KpiComparePeriod): CombinedPeriodOption {
  const found = COMBINED_PERIOD_OPTIONS.find(
    o => o.period === period && o.comparePeriod === comparePeriod,
  );
  return found || COMBINED_PERIOD_OPTIONS[2]; // fallback: 30 hari vs bulan lalu
}

function parseDate(d: string | undefined): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/* ── Period label ─────────────────────────────── */
export function getPeriodLabel(period: KpiPeriod): string {
  const labels: Record<KpiPeriod, string> = {
    today:     'Hari ini',
    yesterday: 'Kemarin',
    '7d':      '7 hari',
    '30d':     '30 hari',
    thisMonth: 'Bulan ini',
    lastMonth: 'Bulan lalu',
    '3months': '3 bulan',
    '1year':   '1 tahun',
    custom:    'Custom',
  };
  return labels[period];
}

/* ── Global → per-card period sync ──────────── */
export function mapGlobalToKpiPeriod(preset: string): KpiPeriod {
  switch (preset) {
    case 'today':     return 'today';
    case 'yesterday': return 'yesterday';
    case '7d':        return '7d';
    case '30d':       return '30d';
    case 'thisMonth': return 'thisMonth';
    case 'lastMonth': return 'lastMonth';
    case '3months':   return '3months';
    case '1year':     return '1year';
    default:          return '30d';
  }
}

/* ── Compare label ────────────────────────────── */
export function getCompareLabel(period: KpiPeriod, comparePeriod: KpiComparePeriod): string {
  const labels: Record<KpiComparePeriod, string> = {
    yesterday: 'vs kemarin',
    lastWeek:  'vs minggu lalu',
    lastMonth: 'vs bulan lalu',
    lastYear:  'vs tahun lalu',
  };
  return labels[comparePeriod] || 'vs bulan lalu';
}

/* ── Auto-derive compare period ───────────────── */
export function deriveComparePeriod(period: KpiPeriod): KpiComparePeriod {
  switch (period) {
    case 'today':     case 'yesterday': return 'yesterday';
    case '7d':        return 'lastWeek';
    case '30d':       case 'thisMonth': case 'lastMonth':
    case '3months':   return 'lastMonth';
    case '1year':     return 'lastYear';
    default:          return 'lastMonth';
  }
}

/* ── Date range for period ────────────────────── */
export function getPeriodRange(period: KpiPeriod) {
  const now = new Date();
  let from: Date;
  let to: Date;

  switch (period) {
    case 'today':
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case 'yesterday': {
      const y = subDays(now, 1);
      from = startOfDay(y);
      to = endOfDay(y);
      break;
    }
    case '7d':
      from = startOfDay(subDays(now, 6));
      to = endOfDay(now);
      break;
    case '30d':
      from = startOfDay(subDays(now, 29));
      to = endOfDay(now);
      break;
    case 'thisMonth':
      from = startOfMonth(now);
      to = endOfMonth(now);
      break;
    case 'lastMonth': {
      const lm = subMonths(now, 1);
      from = startOfMonth(lm);
      to = endOfMonth(lm);
      break;
    }
    case '3months':
      from = startOfDay(subDays(now, 89));
      to = endOfDay(now);
      break;
    case '1year':
      from = startOfYear(now);
      to = endOfDay(now);
      break;
    default:
      from = startOfDay(subDays(now, 29));
      to = endOfDay(now);
  }

  return { from, to };
}

/* ── Comparison date range ────────────────────── */
export function getCompareRange(compare: KpiComparePeriod) {
  const now = new Date();
  switch (compare) {
    case 'yesterday': {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
    case 'lastWeek': {
      const to = subDays(now, 7);
      return { from: subDays(to, 6), to: endOfDay(to) };
    }
    case 'lastMonth': {
      const lm = subMonths(now, 1);
      return { from: startOfMonth(lm), to: endOfMonth(lm) };
    }
    case 'lastYear': {
      const ly = new Date();
      ly.setFullYear(ly.getFullYear() - 1);
      return { from: startOfYear(ly), to: endOfDay(ly) };
    }
    default: {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
  }
}

/* ── Daily data points ────────────────────────── */
function computeDailyPoints(sales: Sale[], from: Date, to: Date): KpiDataPoint[] {
  const dayMap = new Map<string, { value: number; txCount: number }>();
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = format(cursor, 'yyyy-MM-dd');
    dayMap.set(key, { value: 0, txCount: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }

  for (const s of sales) {
    const d = parseDate(s.created_at);
    if (!d) continue;
    if (!isWithinInterval(d, { start: from, end: to })) continue;
    const key = format(d, 'yyyy-MM-dd');
    const entry = dayMap.get(key);
    if (entry) {
      entry.value += Number(s.total_price) || 0;
      entry.txCount += 1;
    }
  }

  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, { value, txCount }]) => ({
      date: new Date(dateStr),
      value,
      txCount,
      label: format(new Date(dateStr), 'dd MMM yyyy'),
    }));
}

/* ── Profit = 42% of revenue ──────────────────── */
function computeProfitPoints(sales: Sale[], from: Date, to: Date): KpiDataPoint[] {
  return computeDailyPoints(sales, from, to).map(dp => ({
    ...dp,
    value: Math.round(dp.value * 0.42),
  }));
}

/* ── Transaction count ────────────────────────── */
function computeTxPoints(sales: Sale[], from: Date, to: Date): KpiDataPoint[] {
  return computeDailyPoints(sales, from, to).map(dp => ({
    ...dp,
    value: dp.txCount || 0,
  }));
}

/* ── Stock value ──────────────────────────────── */
function computeStockValuePoints(
  ingredients: Ingredient[],
  from: Date,
  to: Date,
): KpiDataPoint[] {
  const totalValue = ingredients.reduce(
    (sum, ing) => sum + (Number(ing.stock) || 0) * (Number(ing.unit_price) || 0),
    0,
  );

  const dayCount = Math.max(1, Math.ceil((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000)));
  const days: KpiDataPoint[] = [];
  const cursor = new Date(from);

  for (let i = 0; i <= dayCount && cursor <= to; i++) {
    days.push({
      date: new Date(cursor),
      value: totalValue,
      txCount: 0,
      label: format(new Date(cursor), 'dd MMM yyyy'),
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return days;
}

/* ── Growth calculation ───────────────────────── */
function computeGrowth(currentTotal: number, compareTotal: number): {
  pct: number;
  direction: 'up' | 'down' | 'flat';
} {
  if (compareTotal === 0) {
    if (currentTotal === 0) return { pct: 0, direction: 'flat' };
    return { pct: 100, direction: 'up' };
  }
  const pct = Math.round(((currentTotal - compareTotal) / compareTotal) * 100);
  if (pct > 0) return { pct: Math.abs(pct), direction: 'up' };
  if (pct < 0) return { pct: Math.abs(pct), direction: 'down' };
  return { pct: 0, direction: 'flat' };
}

/* ── Result type ──────────────────────────────── */
export interface KpiCardData {
  dataPoints: KpiDataPoint[];
  totalValue: number;
  growthPct: number;
  growthDirection: 'up' | 'down' | 'flat';
  isEmpty: boolean;
}

/* ═══════════════════════════════════════════════════════════════
   HOOK — computes ONE card's KPI data
   ═══════════════════════════════════════════════════════════════ */
export function useKpiCardData(
  sales: Sale[],
  ingredients: Ingredient[],
  cardType: 'omset' | 'transaksi' | 'profit' | 'stock',
  period: KpiPeriod,
  comparePeriod: KpiComparePeriod,
): KpiCardData {
  return useMemo((): KpiCardData => {
    const { from, to } = getPeriodRange(period);
    const compareRange = getCompareRange(comparePeriod);

    switch (cardType) {
      case 'omset': {
        const points = computeDailyPoints(sales, from, to);
        const totalValue = points.reduce((s, p) => s + p.value, 0);
        const comparePoints = computeDailyPoints(sales, compareRange.from, compareRange.to);
        const compareValue = comparePoints.reduce((s, p) => s + p.value, 0);
        const { pct, direction } = computeGrowth(totalValue, compareValue);
        return {
          dataPoints: points,
          totalValue,
          growthPct: pct,
          growthDirection: direction,
          isEmpty: points.length === 0 || totalValue === 0,
        };
      }

      case 'transaksi': {
        const points = computeTxPoints(sales, from, to);
        const totalValue = points.reduce((s, p) => s + p.value, 0);
        const comparePoints = computeTxPoints(sales, compareRange.from, compareRange.to);
        const compareValue = comparePoints.reduce((s, p) => s + p.value, 0);
        const { pct, direction } = computeGrowth(totalValue, compareValue);
        return {
          dataPoints: points,
          totalValue,
          growthPct: pct,
          growthDirection: direction,
          isEmpty: points.length === 0 || totalValue === 0,
        };
      }

      case 'profit': {
        const points = computeProfitPoints(sales, from, to);
        const totalValue = points.reduce((s, p) => s + p.value, 0);
        const comparePoints = computeProfitPoints(sales, compareRange.from, compareRange.to);
        const compareValue = comparePoints.reduce((s, p) => s + p.value, 0);
        const { pct, direction } = computeGrowth(totalValue, compareValue);
        return {
          dataPoints: points,
          totalValue,
          growthPct: pct,
          growthDirection: direction,
          isEmpty: points.length === 0 || totalValue === 0,
        };
      }

      case 'stock': {
        const { from, to } = getPeriodRange(period);
        const criticalCount = ingredients.filter(
          ing => Number(ing.stock) <= (Number(ing.min_stock) || 0),
        ).length;
        const totalItems = ingredients.length;

        const points = computeStockValuePoints(ingredients, from, to);

        return {
          dataPoints: points.map(p => ({ ...p, value: criticalCount })),
          totalValue: criticalCount,
          growthPct: 0,
          growthDirection: totalItems === 0 ? 'flat' as const : (criticalCount > 0 ? 'down' as const : 'flat' as const),
          isEmpty: totalItems === 0,
        };
      }

      default: {
        const points = computeDailyPoints(sales, from, to);
        const totalValue = points.reduce((s, p) => s + p.value, 0);
        return {
          dataPoints: points,
          totalValue,
          growthPct: 0,
          growthDirection: 'flat' as const,
          isEmpty: points.length === 0 || totalValue === 0,
        };
      }
    }
  }, [sales, ingredients, cardType, period, comparePeriod]);
}
