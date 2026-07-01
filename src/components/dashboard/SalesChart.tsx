import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Lightbulb } from 'lucide-react';
import { formatIDRCompact } from './shared/utils';

const formatIDR = (num: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);

interface Props {
  chartData: { time: string; val: number; date: string }[];
  dateRangeLabel: string;
  isHourly?: boolean;
}

export default function SalesChart({ chartData, dateRangeLabel, isHourly = false }: Props) {
  // Auto-generate insight
  const insight = useMemo(() => {
    if (chartData.length < 2) {
      if (chartData.length === 1) {
        return `Penjualan: ${formatIDRCompact(chartData[0].val)}`;
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
      return `Penjualan tertinggi di ${maxLabel}, ${formatIDRCompact(max)} — ${pctAbove}% di atas rata-rata`;
    }
    return `Rata-rata penjualan ${formatIDRCompact(avg)} ${isHourly ? 'per jam' : 'per hari'}`;
  }, [chartData, isHourly]);

  return (
    <div className="bg-white h-full flex flex-col">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 pt-4 pb-0 gap-3">
        <div>
          <h3 className="text-[13px] font-medium text-slate-800">Penjualan</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Omset {isHourly ? 'per jam' : 'per hari'} · <span className="text-slate-500 font-medium">{dateRangeLabel}</span>
          </p>
        </div>
        <span className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
          Explore ›
        </span>
      </div>

      {/* CHART */}
      <div className="flex-1 px-4 pt-2 pb-1 min-h-[220px] h-[220px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-slate-400">Belum ada data penjualan untuk periode ini</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#378ADD" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#378ADD" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />

              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#888' }}
                interval="preserveStartEnd"
                minTickGap={40}
                dy={8}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#888' }}
                tickFormatter={v => {
                  if (v >= 1_000_000) return `Rp${(v / 1_000_000).toFixed(1)}jt`;
                  if (v >= 1_000) return `Rp${(v / 1_000).toFixed(0)}rb`;
                  return `Rp${v}`;
                }}
                domain={[0, 'auto']}
                width={45}
              />

              <Tooltip
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                content={({ payload, active }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-800">
                        <p className="text-[10px] text-slate-400 mb-0.5">{payload[0].payload.time}</p>
                        <p className="text-sm font-bold">{formatIDR(Number(payload[0].value))}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />

              <Area
                type="monotone"
                dataKey="val"
                stroke="#378ADD"
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                fillOpacity={1}
                fill="url(#salesGrad)"
                dot={false}
                activeDot={{ r: 4, fill: '#378ADD', stroke: '#fff', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* INSIGHT BAR */}
      {insight && (
        <div className="px-4 pb-3 pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <Lightbulb size={13} className="text-amber-600 flex-shrink-0" />
          <p className="text-[11px] text-slate-500">{insight}</p>
        </div>
      )}
    </div>
  );
}