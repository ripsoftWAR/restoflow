import { useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const formatIDRCompact = (num: number) => {
  if (num >= 1_000_000) return `Rp${(num / 1_000_000).toFixed(1)}jt`;
  if (num >= 1_000) return `Rp${(num / 1_000).toFixed(0)}rb`;
  return `Rp${num.toLocaleString('id-ID')}`;
};

interface MetricCardProps {
  label: string;
  value: string;
  trend: { value: number; direction: 'up' | 'down' | 'flat'; label: string } | null;
  sparkData: number[];
  sparkColor: string;
}

function MetricCard({ label, value, trend, sparkData, sparkColor }: MetricCardProps) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <div className="text-[11px] text-slate-400 mb-1.5">{label}</div>
        <div className="text-[22px] font-semibold text-slate-800 tabular-nums tracking-[-0.03em] mb-1">
          {value}
        </div>
        {trend && trend.direction !== 'flat' && (
          <div className={`flex items-center gap-1 text-[11px] font-medium ${
            trend.direction === 'up' ? 'text-emerald-700' : 'text-amber-700'
          }`}>
            {trend.direction === 'up'
              ? <TrendingUp size={11} />
              : <TrendingDown size={11} />
            }
            <span>{trend.direction === 'up' ? '↑' : '↓'} {trend.value}%</span>
            <span className="text-slate-400 font-normal ml-0.5">{trend.label}</span>
          </div>
        )}
      </div>
      {sparkData.length > 0 && (
        <div className="w-[72px] h-[40px] flex-shrink-0 ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.map((v, i) => ({ i, v }))}>
              <defs>
                <linearGradient id={`spark-${label.replace(/\s/g,'')}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                fill={`url(#spark-${label.replace(/\s/g,'')})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

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

export default function MetricCards({ filteredStats, criticalCount, dateRangeLabel, onNavigate }: Props) {
  const { totalOmset, totalTx, profit, sparkline } = filteredStats;

  // ── Trend calculation (compare first half vs second half) ───────
  const salesTrend = useMemo(() => {
    if (sparkline.length < 2) return null;
    const mid = Math.floor(sparkline.length / 2);
    const firstHalf = sparkline.slice(0, mid);
    const secondHalf = sparkline.slice(mid);
    const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    if (avg1 === 0) return avg2 > 0 ? { value: 100, direction: 'up' as const, label: 'trend' } : null;
    const pct = Math.round(((avg2 - avg1) / avg1) * 100);
    return {
      value: Math.abs(pct),
      direction: (pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat') as 'up' | 'down' | 'flat',
      label: 'trend',
    };
  }, [sparkline]);

  // ── Transaction spark (scaled) ──────────────────────────────────
  const txSpark = useMemo(() => {
    if (!sparkline.length) return [];
    const ratio = totalTx / (sparkline[sparkline.length - 1] || 1);
    return sparkline.map(v => Math.max(0, Math.round(v * ratio * 0.01)));
  }, [sparkline, totalTx]);

  // ── Profit spark ────────────────────────────────────────────────
  const profitSpark = useMemo(() => {
    return sparkline.map(v => Math.round(v * 0.42));
  }, [sparkline]);

  // ── Critical spark (flat, just for visual) ──────────────────────
  const criticalSpark = useMemo(() => {
    return [Math.max(0, criticalCount - 2), Math.max(0, criticalCount - 1), criticalCount, criticalCount, criticalCount, criticalCount, criticalCount];
  }, [criticalCount]);

  const metrics = [
    {
      label: `Omset · ${dateRangeLabel}`,
      value: formatIDRCompact(totalOmset),
      trend: salesTrend,
      sparkData: sparkline,
      sparkColor: '#1D9E75',
    },
    {
      label: `Transaksi · ${dateRangeLabel}`,
      value: `${totalTx}`,
      trend: null,
      sparkData: txSpark,
      sparkColor: '#378ADD',
    },
    {
      label: `Profit · ${dateRangeLabel}`,
      value: formatIDRCompact(profit),
      trend: null,
      sparkData: profitSpark,
      sparkColor: '#7C3AED',
    },
    {
      label: 'Stok kritis',
      value: `${criticalCount} item`,
      trend: null,
      sparkData: criticalSpark,
      sparkColor: '#EF9F27',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map(m => (
        <div
          key={m.label}
          onClick={() => {
            if (m.label.includes('Omset') || m.label.includes('Transaksi') || m.label.includes('Profit')) {
              onNavigate('sales');
            } else {
              onNavigate('inventory');
            }
          }}
          className="cursor-pointer"
        >
          <MetricCard {...m} />
        </div>
      ))}
    </div>
  );
}