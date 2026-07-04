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
  const trendSize = size === 'sm' ? 'text-[10px]' : 'text-[12px]';
  const sparkW = size === 'sm' ? 'w-[60px]' : 'w-[80px]';
  const sparkH = size === 'sm' ? 'h-[32px]' : 'h-[44px]';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`bg-pp-surface border border-pp-border rounded-pp-md p-4 flex items-start justify-between transition-all duration-200 ${
        onClick
          ? 'cursor-pointer hover:border-pp-border-focus/30 hover:shadow-pp-sm hover:-translate-y-0.5'
          : ''
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className={`${labelSize} font-medium text-pp-text-muted uppercase tracking-wider mb-1.5`}>
          {label}
        </p>
        <p
          className={`${valueSize} font-bold text-pp-text tabular-nums tracking-[-0.03em] mb-1`}
        >
          {value}
        </p>
        {trend && trend.direction !== 'flat' && (
          <div
            className={`flex items-center gap-1 ${trendSize} font-semibold ${
              trend.direction === 'up' ? 'text-pp-success' : 'text-pp-danger'
            }`}
          >
            {trend.direction === 'up' ? (
              <TrendingUp size={size === 'sm' ? 10 : 12} />
            ) : (
              <TrendingDown size={size === 'sm' ? 10 : 12} />
            )}
            <span>{trend.value}%</span>
            {trend.label && (
              <span className="text-pp-text-muted font-normal ml-0.5">{trend.label}</span>
            )}
          </div>
        )}
      </div>

      {sparkData.length > 1 && (
        <div className={`${sparkW} ${sparkH} flex-shrink-0 ml-3`}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={sparkData.map((v, i) => ({ i, v }))}>
              <defs>
                <linearGradient
                  id={`spark-${label.replace(/[\s·]/g, '')}`}
                  x1="0" y1="0" x2="0" y2="1"
                >
                  <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
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
