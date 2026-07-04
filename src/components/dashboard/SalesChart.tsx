import { useMemo, useRef, useState, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatIDRCompact } from './shared/utils';

/* ═══════════════════════════════════════════════════════════════
   SalesChart — Penjualan chart with hover tooltip & insight strip
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  chartData: { time: string; val: number; date: string }[];
  dateRangeLabel: string;
  isHourly?: boolean;
}

export default function SalesChart({ chartData, dateRangeLabel, isHourly = false }: Props) {
  const [tooltipData, setTooltipData] = useState<{ x: number; y: number; date: string; val: string } | null>(null);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback((e: any) => {
    if (!e || !e.activePayload || !e.activePayload.length) {
      setTooltipData(null);
      return;
    }
    const payload = e.activePayload[0].payload;
    const container = chartContainerRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const tooltipW = 140; // approx tooltip width
    const rawX = e.chartX || 0;
    const rawY = e.chartY || 0;

    // Clamp to container edges
    const x = Math.max(tooltipW / 2, Math.min(rect.width - tooltipW / 2, rawX));
    const y = Math.max(0, rawY - 10);

    setTooltipData({
      x,
      y,
      date: payload.time,
      val: formatIDRCompact(payload.val),
    });
  }, []);

  const handleMouseLeave = useCallback(() => {
    setTooltipData(null);
  }, []);

  // Auto-generate insight
  const insight = useMemo(() => {
    if (chartData.length < 2) {
      if (chartData.length === 1) {
        return (
          <>Penjualan: <b className="text-pp-text">{formatIDRCompact(chartData[0].val)}</b></>
        );
      }
      return null;
    }
    const values = chartData.map(d => d.val);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    const maxIdx = values.indexOf(max);
    const maxLabel = chartData[maxIdx]?.time || '';
    const pctAbove = avg > 0 ? Math.round(((max - avg) / avg) * 100) : 0;

    if (pctAbove >= 15) {
      return (
        <>
          Penjualan tertinggi di <b className="text-pp-text">{maxLabel}, {formatIDRCompact(max)}</b>{' '}
          <span className="text-pp-success font-semibold">(+{pctAbove}%)</span> di atas rata-rata harian.
        </>
      );
    }
    return (
      <>
        Rata-rata penjualan <b className="text-pp-text">{formatIDRCompact(avg)}</b>{' '}
        {isHourly ? 'per jam' : 'per hari'}
      </>
    );
  }, [chartData, isHourly]);

  const isEmpty = chartData.length === 0;

  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-[15.5px] font-bold text-pp-text">Penjualan</div>
          <div className="text-[12px] text-pp-text-muted mt-0.5">
            Omset {isHourly ? 'per jam' : 'per hari'}
          </div>
        </div>
        <div className="flex items-center gap-[6px] text-[12.5px] font-medium text-pp-text border border-pp-border px-[10px] py-[6px] rounded-pp-xs">
          {isHourly ? 'Hourly' : 'Daily'}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 9l6 6 6-6"/>
          </svg>
        </div>
      </div>

      {/* CHART */}
      <div ref={chartContainerRef} className="relative h-[260px] mt-[14px]">
        {isEmpty ? (
          <div className="h-full flex flex-col items-center justify-center gap-2">
            <span className="text-[32px]">📊</span>
            <p className="text-[13px] text-pp-text-muted">Belum ada data penjualan</p>
            <p className="text-[11px] text-pp-text-muted">Data akan muncul setelah ada transaksi</p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={chartData}
                margin={{ top: 5, right: 0, left: -10, bottom: 0 }}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3E6DF6" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#3E6DF6" stopOpacity={0.02} />
                  </linearGradient>
                </defs>

                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#EEF0F7"
                />

                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  interval="preserveStartEnd"
                  minTickGap={40}
                  dy={8}
                />

                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickFormatter={v => {
                    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1).replace('.', ',')}jt`;
                    if (v >= 1_000) return `${Math.round(v / 1_000)}rb`;
                    return '0';
                  }}
                  domain={[0, 'auto']}
                  width={45}
                />

                <Tooltip content={() => null} cursor={{ stroke: '#D7DCEC', strokeWidth: 1, strokeDasharray: '4 4' }} />

                <Area
                  type="monotone"
                  dataKey="val"
                  stroke="#3E6DF6"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fillOpacity={1}
                  fill="url(#salesGradient)"
                  dot={false}
                  activeDot={{ r: 6, fill: '#3E6DF6', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>

            {/* Hover Tooltip */}
            {tooltipData && (
              <div
                className="absolute bg-[#1B2436] text-white px-[13px] py-[10px] rounded-[10px] text-[12px] pointer-events-none whitespace-nowrap z-10 transform -translate-x-1/2 -translate-y-[115%]"
                style={{ left: tooltipData.x, top: tooltipData.y }}
              >
                <div className="text-[#B9C1D9] text-[11px] mb-[3px]">{tooltipData.date}</div>
                <div className="font-bold flex items-center gap-[6px]">
                  <span className="w-[6px] h-[6px] rounded-full bg-[#3E6DF6] inline-block" />
                  {tooltipData.val}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* INSIGHT STRIP */}
      {insight && (
        <div className="flex items-center gap-[9px] mt-3 pt-[14px] border-t border-pp-border text-[12.5px] text-pp-text-secondary">
          <span className="text-[15px]">💡</span>
          <span>{insight}</span>
        </div>
      )}
    </div>
  );
}
