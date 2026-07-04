import { memo, useState, useCallback, useEffect } from 'react';
import PremiumKPICard from './PremiumKPICard';
import { useKpiCardData, deriveComparePeriod, mapGlobalToKpiPeriod } from './useKpiData';
import { formatIDRCompact } from './shared/utils';
import type { KpiCardConfig, KpiPeriod, KpiComparePeriod } from './PremiumKPICard';
import type { Sale, Ingredient } from '../../types';
import type { DateRangeValue } from './DateRangePicker';

/* ═══════════════════════════════════════════════════════════════
   StatCards — Premium 4-card KPI row
   
   Each card has TWO separate dropdowns:
   • PeriodDropdown (top-right) — duration only, no "vs"
   • CompareDropdown (bottom row) — "vs ...", next to growth badge
   Data computed per-card via useKpiCardData hook.
   ═══════════════════════════════════════════════════════════════ */

/* ── Card configurations ──────────────────────── */
const CARD_CONFIGS: Record<string, KpiCardConfig> = {
  omset: {
    id: 'omset',
    label: 'Omset',
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
    id: 'transaksi',
    label: 'Transaksi',
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
  profit: {
    id: 'profit',
    label: 'Keuntungan',
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
  stock: {
    id: 'stock',
    label: 'Stok Kritis',
    color: '#F59E0B',
    softColor: '#FFFBEB',
    formatValue: (v: number) => v === 0 ? 'Aman' : `${v} item`,
    formatCountUp: (v: number) => v === 0 ? 'Aman' : `${v} item`,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="#D97706" strokeWidth="2">
        <path d="M21 16V8a2 2 0 00-1-1.7l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.7l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"/><path d="M3.3 7l8.7 5 8.7-5M12 22V12"/>
      </svg>
    ),
    iconBg: '#FFFBEB',
  },
};

type CardKey = 'omset' | 'transaksi' | 'profit' | 'stock';

interface Props {
  sales: Sale[];
  ingredients: Ingredient[];
  globalDateRange: DateRangeValue;
}

/* ═══════════════════════════════════════════════════════════════
   SINGLE CARD WRAPPER — manages its own period state
   ═══════════════════════════════════════════════════════════════ */

const CardWrapper = memo(function CardWrapper({
  cardKey,
  config,
  sales,
  ingredients,
  globalDateRange,
}: {
  cardKey: CardKey;
  config: KpiCardConfig;
  sales: Sale[];
  ingredients: Ingredient[];
  globalDateRange: DateRangeValue;
}) {
  const [period, setPeriod] = useState<KpiPeriod>('30d');
  const [comparePeriod, setComparePeriod] = useState<KpiComparePeriod>(
    deriveComparePeriod('30d'),
  );

  /* ── Sync from global date range ──────────── */
  useEffect(() => {
    // Stock card stays independent (snapshot saat ini)
    if (cardKey === 'stock') return;
    const mapped = mapGlobalToKpiPeriod(globalDateRange.preset);
    setPeriod(mapped);
    setComparePeriod(deriveComparePeriod(mapped));
  }, [globalDateRange.preset, cardKey]);

  const handlePeriodChange = useCallback((p: KpiPeriod) => {
    setPeriod(p);
    setComparePeriod(deriveComparePeriod(p));
  }, []);

  const handleCompareChange = useCallback((cp: KpiComparePeriod) => {
    setComparePeriod(cp);
  }, []);

  const data = useKpiCardData(sales, ingredients, cardKey, period, comparePeriod);

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
      emptyMessage={cardKey === 'stock' ? 'Semua stok aman' : 'Belum ada data'}
    />
  );
});

/* ═══════════════════════════════════════════════════════════════
   GRID
   ═══════════════════════════════════════════════════════════════ */
const StatCards = memo(function StatCards({ sales, ingredients, globalDateRange }: Props) {
  const cards: { key: CardKey; config: KpiCardConfig }[] = [
    { key: 'omset', config: CARD_CONFIGS.omset },
    { key: 'transaksi', config: CARD_CONFIGS.transaksi },
    { key: 'profit', config: CARD_CONFIGS.profit },
    { key: 'stock', config: CARD_CONFIGS.stock },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 max-[1180px]:grid-cols-2 max-[760px]:overflow-x-auto max-[760px]:flex max-[760px]:gap-3 max-[760px]:pb-1 max-[760px]:snap-x">
      {cards.map(({ key, config }) => (
        <div key={key} className="max-[760px]:min-w-[260px] max-[760px]:snap-start">
          <CardWrapper
            cardKey={key}
            config={config}
            sales={sales}
            ingredients={ingredients}
            globalDateRange={globalDateRange}
          />
        </div>
      ))}
    </div>
  );
});

export default StatCards;
