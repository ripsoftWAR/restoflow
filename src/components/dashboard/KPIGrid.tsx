import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { formatIDRCompact } from './shared/utils';

interface KPICard {
  label: string;
  value: string;
  trend?: { value: number; direction: 'up' | 'down' | 'flat' } | null;
  sparkData: number[];
  sparkColor: string;
  onClick?: () => void;
}

interface Props {
  totalOmset: number;
  totalTx: number;
  profit: number;
  criticalCount: number;
  sparkline: number[];
  dateRangeLabel: string;
  onNavigate: (tab: string) => void;
  /** "horizontal" = full-width grid 4 kolom, "vertical" = sidebar stack */
  variant?: 'horizontal' | 'vertical';
}

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const cardItem = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

const cardItemH = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] } },
};

export default function KPIGrid({
  totalOmset, totalTx, profit, criticalCount,
  sparkline, dateRangeLabel, onNavigate,
  variant = 'vertical',
}: Props) {
  const cards = useMemo((): KPICard[] => {
    const computeTrend = (data: number[]): KPICard['trend'] => {
      if (data.length < 2) return null;
      const mid = Math.floor(data.length / 2);
      const first = data.slice(0, mid).reduce((a, b) => a + b, 0) / mid || 0;
      const second = data.slice(mid).reduce((a, b) => a + b, 0) / (data.length - mid) || 0;
      if (first === 0) return second > 0 ? { value: 100, direction: 'up' } : null;
      const pct = Math.round(((second - first) / first) * 100);
      if (pct === 0) return { value: 0, direction: 'flat' };
      return { value: Math.abs(pct), direction: pct > 0 ? 'up' : 'down' };
    };

    const salesTrend = computeTrend(sparkline);
    const txSpark = sparkline.map(v => Math.max(0, Math.round(v * (totalTx / (sparkline[sparkline.length - 1] || 1)) * 0.01)));
    const profitSpark = sparkline.map(v => Math.round(v * 0.42));
    const criticalSpark = [Math.max(0, criticalCount - 2), Math.max(0, criticalCount - 1), criticalCount, criticalCount, criticalCount, criticalCount, criticalCount];

    return [
      {
        label: 'Revenue',
        value: formatIDRCompact(totalOmset),
        trend: salesTrend,
        sparkData: sparkline,
        sparkColor: 'var(--pp-chart-green)',
        onClick: () => onNavigate('sales'),
      },
      {
        label: 'Transaksi',
        value: totalTx.toString(),
        trend: null,
        sparkData: txSpark,
        sparkColor: 'var(--pp-chart-blue)',
        onClick: () => onNavigate('sales'),
      },
      {
        label: 'Profit',
        value: formatIDRCompact(profit),
        trend: null,
        sparkData: profitSpark,
        sparkColor: 'var(--pp-chart-purple)',
        onClick: () => onNavigate('sales'),
      },
      {
        label: 'Stok Kritis',
        value: criticalCount === 0 ? 'Aman' : `${criticalCount} item`,
        trend: criticalCount > 0 ? { value: criticalCount, direction: 'down' } : { value: 0, direction: 'flat' },
        sparkData: criticalSpark,
        sparkColor: 'var(--pp-chart-orange)',
        onClick: () => onNavigate('inventory'),
      },
    ];
  }, [totalOmset, totalTx, profit, criticalCount, sparkline, dateRangeLabel, onNavigate]);

  /* ── Horizontal variant: full-width 4-column grid ─── */
  if (variant === 'horizontal') {
    return (
      <motion.div variants={container} initial="hidden" animate="show">
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={13} className="text-pp-primary" />
          <p className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-[0.06em]">
            KPI Overview
          </p>
          <span className="text-[10px] text-pp-text-placeholder ml-auto">
            {dateRangeLabel}
          </span>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {cards.map((card, i) => (
            <motion.div key={card.label} variants={cardItemH}>
              <motion.button
                whileHover={{ y: -3, boxShadow: 'var(--pp-shadow-sm)' }}
                whileTap={{ scale: 0.98 }}
                onClick={card.onClick}
                className="w-full flex flex-col justify-between gap-2 bg-pp-surface border border-pp-border rounded-pp-md p-4 cursor-pointer transition-all duration-200 hover:border-pp-border-focus/20 text-left"
              >
                {/* Top row: Label + Sparkline */}
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-[0.05em]">
                    {card.label}
                  </p>
                  {card.sparkData.length > 1 && (
                    <div className="w-[52px] h-[26px] flex-shrink-0 -mt-0.5">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={card.sparkData.map((v, idx) => ({ i: idx, v }))}>
                          <defs>
                            <linearGradient id={`kpi-h-${i}`} x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={card.sparkColor} stopOpacity={0.25} />
                              <stop offset="100%" stopColor={card.sparkColor} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <Area
                            type="monotone"
                            dataKey="v"
                            stroke={card.sparkColor}
                            strokeWidth={1.5}
                            fill={`url(#kpi-h-${i})`}
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Bottom row: Value + Trend */}
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[21px] font-bold text-pp-text tabular-nums tracking-[-0.03em] leading-tight">
                    {card.value}
                  </p>
                  {card.trend && card.trend.direction !== 'flat' && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                      card.trend.direction === 'up' ? 'text-pp-success' : 'text-pp-danger'
                    }`}>
                      {card.trend.direction === 'up'
                        ? <TrendingUp size={10} />
                        : <TrendingDown size={10} />
                      }
                      {card.trend.value}%
                    </span>
                  )}
                  {card.trend?.direction === 'flat' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-pp-text-muted">
                      <Minus size={10} />
                      Stabil
                    </span>
                  )}
                </div>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </motion.div>
    );
  }

  /* ── Vertical variant: sidebar stack ─── */
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp size={13} className="text-pp-primary" />
        <p className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-[0.06em]">
          KPI Overview
        </p>
        <span className="text-[10px] text-pp-text-placeholder ml-auto">
          {dateRangeLabel}
        </span>
      </div>

      <div className="space-y-2.5">
        {cards.map((card, i) => (
          <motion.div key={card.label} variants={cardItem}>
            <motion.button
              whileHover={{ y: -2, boxShadow: 'var(--pp-shadow-sm)' }}
              whileTap={{ scale: 0.98 }}
              onClick={card.onClick}
              className="w-full flex items-center justify-between gap-3 bg-pp-surface border border-pp-border rounded-pp-md p-3.5 cursor-pointer transition-all duration-200 hover:border-pp-border-focus/20 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-[0.05em] mb-0.5">
                  {card.label}
                </p>
                <div className="flex items-baseline gap-2">
                  <p className="text-[20px] font-bold text-pp-text tabular-nums tracking-[-0.03em] leading-tight">
                    {card.value}
                  </p>
                  {card.trend && card.trend.direction !== 'flat' && (
                    <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold ${
                      card.trend.direction === 'up' ? 'text-pp-success' : 'text-pp-danger'
                    }`}>
                      {card.trend.direction === 'up'
                        ? <TrendingUp size={10} />
                        : <TrendingDown size={10} />
                      }
                      {card.trend.value}%
                    </span>
                  )}
                  {card.trend?.direction === 'flat' && (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-pp-text-muted">
                      <Minus size={10} />
                      Stabil
                    </span>
                  )}
                </div>
              </div>
              {card.sparkData.length > 1 && (
                <div className="w-[64px] h-[32px] flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={card.sparkData.map((v, idx) => ({ i: idx, v }))}>
                      <defs>
                        <linearGradient id={`kpi-compact-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={card.sparkColor} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={card.sparkColor} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={card.sparkColor}
                        strokeWidth={1.5}
                        fill={`url(#kpi-compact-${i})`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
