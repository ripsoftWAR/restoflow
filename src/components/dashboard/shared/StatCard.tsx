// shared/StatCard.tsx
// Single source of truth untuk semua mini stat card di dashboard.
// Semua tab harus pakai ini — jangan buat stat card sendiri-sendiri.

import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

export interface StatCardTrend {
  value: number;
  direction: 'up' | 'down' | 'flat';
  label?: string;
}

export interface StatCardProps {
  label: string;
  value: string;
  trend?: StatCardTrend | null;
  sparkData?: number[];
  sparkColor?: string;
  /** 'sm' = compact (dipakai di dalam panel), 'md' = default (MetricCards) */
  size?: 'sm' | 'md';
  /** klik seluruh card */
  onClick?: () => void;
}

export default function StatCard({
  label,
  value,
  trend,
  sparkData = [],
  sparkColor = '#378ADD',
  size = 'md',
  onClick,
}: StatCardProps) {
  const valueSize = size === 'sm' ? 'text-[15px]' : 'text-[22px]';
  const labelSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';
  const trendSize = size === 'sm' ? 'text-[10px]' : 'text-[11px]';

  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-xl p-4 flex items-start justify-between transition-all duration-200 ${
        onClick ? 'cursor-pointer hover:bg-slate-50 hover:shadow-sm' : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <div className={`${labelSize} text-slate-400 mb-1.5`}>{label}</div>
        <div
          className={`${valueSize} font-semibold text-slate-800 tabular-nums tracking-[-0.03em] mb-1`}
        >
          {value}
        </div>
        {trend && trend.direction !== 'flat' && (
          <div
            className={`flex items-center gap-1 ${trendSize} font-medium transition-colors ${
              trend.direction === 'up' ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {trend.direction === 'up' ? (
              <TrendingUp size={11} />
            ) : (
              <TrendingDown size={11} />
            )}
            <span>{trend.direction === 'up' ? '↑' : '↓'} {trend.value}%</span>
            {trend.label && (
              <span className="text-slate-400 font-normal ml-0.5">{trend.label}</span>
            )}
          </div>
        )}
      </div>

      {sparkData.length > 1 && (
        <div className="w-[72px] h-[40px] flex-shrink-0 ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.map((v, i) => ({ i, v }))}>
              <defs>
                <linearGradient
                  id={`spark-${label.replace(/[\s·]/g, '')}`}
                  x1="0" y1="0" x2="0" y2="1"
                >
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={sparkColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparkColor}
                strokeWidth={1.5}
                fill={`url(#spark-${label.replace(/[\s·]/g, '')})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
