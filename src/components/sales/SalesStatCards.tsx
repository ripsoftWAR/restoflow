import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import PremiumKPICard from '../dashboard/PremiumKPICard';
import {
  useKpiCardData,
  deriveComparePeriod,
  mapGlobalToKpiPeriod,
} from '../dashboard/useKpiData';
import { formatIDRCompact } from '../dashboard/shared/utils';
import type { KpiCardConfig, KpiPeriod, KpiComparePeriod } from '../dashboard/PremiumKPICard';
import type { Sale, Ingredient } from '../../types';
import type { DateRangeValue } from '../dashboard/DateRangePicker';

/* ═══════════════════════════════════════════════════════════════
   SalesStatCards — Premium 4-card KPI row untuk halaman Penjualan
   
   Metrics:
   • Total Penjualan  → reuse 'omset' dari useKpiCardData
   • Jumlah Transaksi  → reuse 'transaksi'
   • Rata-rata / Tx    → kalkulasi sendiri
   • Total Item        → sum quantity (kalkulasi sendiri)
   ═══════════════════════════════════════════════════════════════ */

/* ── Card configurations ──────────────────────── */
const CARD_CONFIGS: Record<string, KpiCardConfig> = {
  omset: {
    id: 'sales-omset',
    label: 'Total Penjualan',
    color: '#2E4FE0',
    softColor: '#EFF3FF',
    formatValue: (v: number) => `Rp ${formatIDRCompact(v)}`,
    formatCountUp: (v: number) => `Rp ${v.toLocaleString('id-ID')}`,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
        <path d="M6 2l1.5 4h9L18 2"/><path d="M3 7h18l-1.5 12a2 2 0 01-2 1.8H6.5a2 2 0 01-2-1.8L3 7z"/>
      </svg>
    ),
    iconBg: '#2E4FE0',
  },
  transaksi: {
    id: 'sales-tx',
    label: 'Jumlah Transaksi',
    color: '#6366F1',
    softColor: '#EEF2FF',
    formatValue: (v: number) => `${v.toLocaleString('id-ID')} tx`,
    formatCountUp: (v: number) => v.toLocaleString('id-ID'),
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2">
        <rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/>
      </svg>
    ),
    iconBg: '#EEF2FF',
  },
  rataRata: {
    id: 'sales-avg',
    label: 'Rata-rata / Transaksi',
    color: '#10B981',
    softColor: '#ECFDF5',
    formatValue: (v: number) => `Rp ${formatIDRCompact(v)}`,
    formatCountUp: (v: number) => `Rp ${v.toLocaleString('id-ID')}`,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2">
        <rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6 6v0M18 18v0"/>
      </svg>
    ),
    iconBg: '#ECFDF5',
  },
  totalItem: {
    id: 'sales-items',
    label: 'Total Item Terjual',
    color: '#F59E0B',
    softColor: '#FFFBEB',
    formatValue: (v: number) => `${v.toLocaleString('id-ID')} item`,
    formatCountUp: (v: number) => v.toLocaleString('id-ID'),
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
        <path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7l8.7 5 8.7-5M12 22V12"/>
      </svg>
    ),
    iconBg: '#FFFBEB',
  },
};

/* ── Compute daily points for custom metrics ─── */
import { startOfDay, endOfDay, subDays, format, isWithinInterval } from 'date-fns';
import type { KpiDataPoint } from '../dashboard/PremiumKPICard';

function parseDate(d: string | undefined): Date | null {
  if (!d) return null;
  const parsed = new Date(d);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function getPeriodRange(period: KpiPeriod) {
  const now = new Date();
  switch (period) {
    case 'today': return { from: startOfDay(now), to: endOfDay(now) };
    case '7d': return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case '30d': return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    default: return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
  }
}

function getCompareRange(compare: KpiComparePeriod) {
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
      const to = subDays(now, 29);
      return { from: subDays(to, 29), to: endOfDay(to) };
    }
    default: {
      const y = subDays(now, 1);
      return { from: startOfDay(y), to: endOfDay(y) };
    }
  }
}

function computeAvgPoints(sales: Sale[], from: Date, to: Date): KpiDataPoint[] {
  const dayMap = new Map<string, { omset: number; tx: number }>();
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = format(cursor, 'yyyy-MM-dd');
    dayMap.set(key, { omset: 0, tx: 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const s of sales) {
    const d = parseDate(s.created_at);
    if (!d || !isWithinInterval(d, { start: from, end: to })) continue;
    const key = format(d, 'yyyy-MM-dd');
    const entry = dayMap.get(key);
    if (entry) {
      entry.omset += Number(s.total_price) || 0;
      entry.tx += 1;
    }
  }
  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, { omset, tx }]) => ({
      date: new Date(dateStr),
      value: tx > 0 ? Math.round(omset / tx) : 0,
      txCount: tx,
      label: format(new Date(dateStr), 'dd MMM yyyy'),
    }));
}

function computeItemPoints(sales: Sale[], from: Date, to: Date): KpiDataPoint[] {
  const dayMap = new Map<string, number>();
  const cursor = new Date(from);
  while (cursor <= to) {
    dayMap.set(format(cursor, 'yyyy-MM-dd'), 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const s of sales) {
    const d = parseDate(s.created_at);
    if (!d || !isWithinInterval(d, { start: from, end: to })) continue;
    const key = format(d, 'yyyy-MM-dd');
    dayMap.set(key, (dayMap.get(key) || 0) + (Number(s.quantity) || 0));
  }
  return Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateStr, qty]) => ({
      date: new Date(dateStr),
      value: qty,
      txCount: 0,
      label: format(new Date(dateStr), 'dd MMM yyyy'),
    }));
}

/* ═══════════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sales: Sale[];
  ingredients: Ingredient[];
  globalDateRange: DateRangeValue;
}

const SalesStatCards = memo(function SalesStatCards({ sales, ingredients, globalDateRange }: Props) {
  return (
    <div className="grid grid-cols-4 gap-4 max-[1180px]:grid-cols-2 max-[760px]:overflow-x-auto max-[760px]:flex max-[760px]:gap-3 max-[760px]:pb-1 max-[760px]:snap-x">
      {/* Cards 1 & 2 reuse useKpiCardData */}
      <div className="max-[760px]:min-w-[260px] max-[760px]:snap-start">
        <ReusedCard
          cardType="omset"
          config={CARD_CONFIGS.omset}
          sales={sales}
          ingredients={ingredients}
          globalDateRange={globalDateRange}
        />
      </div>
      <div className="max-[760px]:min-w-[260px] max-[760px]:snap-start">
        <ReusedCard
          cardType="transaksi"
          config={CARD_CONFIGS.transaksi}
          sales={sales}
          ingredients={ingredients}
          globalDateRange={globalDateRange}
        />
      </div>
      {/* Cards 3 & 4: custom metrics */}
      <div className="max-[760px]:min-w-[260px] max-[760px]:snap-start">
        <CustomCard
          config={CARD_CONFIGS.rataRata}
          sales={sales}
          globalDateRange={globalDateRange}
          computePoints={computeAvgPoints}
        />
      </div>
      <div className="max-[760px]:min-w-[260px] max-[760px]:snap-start">
        <CustomCard
          config={CARD_CONFIGS.totalItem}
          sales={sales}
          globalDateRange={globalDateRange}
          computePoints={computeItemPoints}
        />
      </div>
    </div>
  );
});

/* ── Reused card (omset & transaksi via useKpiCardData) ─── */
const ReusedCard = memo(function ReusedCard({
  cardType, config, sales, ingredients, globalDateRange,
}: {
  cardType: 'omset' | 'transaksi';
  config: KpiCardConfig;
  sales: Sale[];
  ingredients: Ingredient[];
  globalDateRange: DateRangeValue;
}) {
  const [period, setPeriod] = useState<KpiPeriod>('30d');
  const [comparePeriod, setComparePeriod] = useState<KpiComparePeriod>(
    deriveComparePeriod('30d'),
  );

  useEffect(() => {
    const mapped = mapGlobalToKpiPeriod(globalDateRange.preset);
    setPeriod(mapped);
    setComparePeriod(deriveComparePeriod(mapped));
  }, [globalDateRange.preset]);

  const handlePeriodChange = useCallback((p: KpiPeriod) => {
    setPeriod(p);
    setComparePeriod(deriveComparePeriod(p));
  }, []);

  const handleCompareChange = useCallback((cp: KpiComparePeriod) => {
    setComparePeriod(cp);
  }, []);

  const data = useKpiCardData(sales, ingredients, cardType, period, comparePeriod);

  return (
    <PremiumKPICard
      config={config}
      dataPoints={data.dataPoints}
      totalValue={data.totalValue}
      growthPct={data.growthPct}
      growthDirection={data.growthDirection}
      period={period}
      comparePeriod={comparePeriod}
      onPeriodChange={handlePeriodChange}
      onCompareChange={handleCompareChange}
      isEmpty={data.isEmpty}
      emptyMessage="Belum ada data"
    />
  );
});

/* ── Custom card (rata-rata & total item) ─── */
const CustomCard = memo(function CustomCard({
  config, sales, globalDateRange,
  computePoints,
}: {
  config: KpiCardConfig;
  sales: Sale[];
  globalDateRange: DateRangeValue;
  computePoints: (sales: Sale[], from: Date, to: Date) => KpiDataPoint[];
}) {
  const [period, setPeriod] = useState<KpiPeriod>('30d');
  const [comparePeriod, setComparePeriod] = useState<KpiComparePeriod>(
    deriveComparePeriod('30d'),
  );

  useEffect(() => {
    const mapped = mapGlobalToKpiPeriod(globalDateRange.preset);
    setPeriod(mapped);
    setComparePeriod(deriveComparePeriod(mapped));
  }, [globalDateRange.preset]);

  const handlePeriodChange = useCallback((p: KpiPeriod) => {
    setPeriod(p);
    setComparePeriod(deriveComparePeriod(p));
  }, []);

  const handleCompareChange = useCallback((cp: KpiComparePeriod) => {
    setComparePeriod(cp);
  }, []);

  const data = useMemo(() => {
    const { from, to } = getPeriodRange(period);
    const compareRange = getCompareRange(comparePeriod);

    const points = computePoints(sales, from, to);
    const totalValue = points.reduce((s, p) => s + p.value, 0);

    const comparePoints = computePoints(sales, compareRange.from, compareRange.to);
    const compareValue = comparePoints.reduce((s, p) => s + p.value, 0);

    let growthPct = 0;
    let growthDirection: 'up' | 'down' | 'flat' = 'flat';
    if (compareValue > 0) {
      growthPct = Math.round(((totalValue - compareValue) / compareValue) * 100);
      growthDirection = growthPct > 0 ? 'up' : growthPct < 0 ? 'down' : 'flat';
      growthPct = Math.abs(growthPct);
    } else if (totalValue > 0) {
      growthPct = 100;
      growthDirection = 'up';
    }

    return {
      dataPoints: points,
      totalValue,
      growthPct,
      growthDirection,
      isEmpty: points.length === 0 || totalValue === 0,
    };
  }, [sales, period, comparePeriod, computePoints]);

  return (
    <PremiumKPICard
      config={config}
      dataPoints={data.dataPoints}
      totalValue={data.totalValue}
      growthPct={data.growthPct}
      growthDirection={data.growthDirection}
      period={period}
      comparePeriod={comparePeriod}
      onPeriodChange={handlePeriodChange}
      onCompareChange={handleCompareChange}
      isEmpty={data.isEmpty}
      emptyMessage="Belum ada data"
    />
  );
});

export default SalesStatCards;
