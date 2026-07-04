import { useMemo } from 'react';
import { motion } from 'framer-motion';
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

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

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
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <motion.div variants={cardItem}>
        <StatCard
          label={`Omset · ${dateRangeLabel}`}
          value={formatIDRCompact(totalOmset)}
          trend={salesTrend}
          sparkData={sparkline}
          sparkColor="var(--pp-chart-green)"
          onClick={() => onNavigate('sales')}
        />
      </motion.div>
      <motion.div variants={cardItem}>
        <StatCard
          label={`Transaksi · ${dateRangeLabel}`}
          value={`${totalTx}`}
          sparkData={txSpark}
          sparkColor="var(--pp-chart-blue)"
          onClick={() => onNavigate('sales')}
        />
      </motion.div>
      <motion.div variants={cardItem}>
        <StatCard
          label={`Profit · ${dateRangeLabel}`}
          value={formatIDRCompact(profit)}
          sparkData={profitSpark}
          sparkColor="var(--pp-chart-purple)"
          onClick={() => onNavigate('sales')}
        />
      </motion.div>
      <motion.div variants={cardItem}>
        <StatCard
          label="Stok kritis"
          value={`${criticalCount} item`}
          sparkData={criticalSpark}
          sparkColor="var(--pp-chart-orange)"
          onClick={() => onNavigate('inventory')}
        />
      </motion.div>
    </motion.div>
  );
}
