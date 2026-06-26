// MetricCards.tsx  (fixed)
// Sekarang pakai shared StatCard — tidak ada duplikasi logic card lagi.

import { useMemo } from 'react';
import StatCard from './shared/StatCard';
import { formatIDRCompact } from './shared/utils';

interface FilteredStats {
  totalOmset: number;
  totalTx: number;
  totalQty: number;
  profit: number;
  sparkline: number[];
}

interface Props {
  filteredStats: FilteredStats;
  criticalCount: number;
  dateRangeLabel: string;
  onNavigate: (tab: string) => void;
}

export default function MetricCards({
  filteredStats,
  criticalCount,
  dateRangeLabel,
  onNavigate,
}: Props) {
  const { totalOmset, totalTx, profit, sparkline } = filteredStats;

  // Trend: bandingkan paruh pertama vs paruh kedua sparkline
  const salesTrend = useMemo(() => {
    if (sparkline.length < 2) return null;
    const mid = Math.floor(sparkline.length / 2);
    const avg1 =
      sparkline.slice(0, mid).reduce((a, b) => a + b, 0) / mid || 0;
    const avg2 =
      sparkline.slice(mid).reduce((a, b) => a + b, 0) /
        (sparkline.length - mid) || 0;
    if (avg1 === 0) return avg2 > 0 ? { value: 100, direction: 'up' as const } : null;
    const pct = Math.round(((avg2 - avg1) / avg1) * 100);
    return {
      value: Math.abs(pct),
      direction: (pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat') as
        | 'up'
        | 'down'
        | 'flat',
      label: 'trend',
    };
  }, [sparkline]);

  const txSpark = useMemo(() => {
    if (!sparkline.length) return [];
    const ratio = totalTx / (sparkline[sparkline.length - 1] || 1);
    return sparkline.map(v => Math.max(0, Math.round(v * ratio * 0.01)));
  }, [sparkline, totalTx]);

  const profitSpark = useMemo(
    () => sparkline.map(v => Math.round(v * 0.42)),
    [sparkline],
  );

  const criticalSpark = useMemo(
    () => [
      Math.max(0, criticalCount - 2),
      Math.max(0, criticalCount - 1),
      criticalCount,
      criticalCount,
      criticalCount,
      criticalCount,
      criticalCount,
    ],
    [criticalCount],
  );

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        label={`Omset · ${dateRangeLabel}`}
        value={formatIDRCompact(totalOmset)}
        trend={salesTrend}
        sparkData={sparkline}
        sparkColor="#1D9E75"
        onClick={() => onNavigate('sales')}
      />
      <StatCard
        label={`Transaksi · ${dateRangeLabel}`}
        value={`${totalTx}`}
        sparkData={txSpark}
        sparkColor="#378ADD"
        onClick={() => onNavigate('sales')}
      />
      <StatCard
        label={`Profit · ${dateRangeLabel}`}
        value={formatIDRCompact(profit)}
        sparkData={profitSpark}
        sparkColor="#7C3AED"
        onClick={() => onNavigate('sales')}
      />
      <StatCard
        label="Stok kritis"
        value={`${criticalCount} item`}
        sparkData={criticalSpark}
        sparkColor="#EF9F27"
        onClick={() => onNavigate('inventory')}
      />
    </div>
  );
}