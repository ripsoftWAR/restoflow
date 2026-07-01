// TabTren.tsx  (fixed)
// FIX: hapus filter lokal yang mati (tombol "7 hari / 30 hari / 3 bulan" tidak fungsional).
// Sekarang sepenuhnya driven oleh dateRange dari Dashboard (single source of truth).
// FIX: pakai shared StatCard untuk konsistensi visual dengan tab lain.

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Sale } from '../../types';
import { formatIDRCompact, parseDashboardDate } from './shared/utils';
import StatCard from './shared/StatCard';

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
  /** Dikirim dari Dashboard agar label sumbu X tepat */
  dateRange: 'today' | '7d' | '30d' | 'custom';
}

export default function TabTren({ sales, dateRangeLabel, dateRange }: Props) {
  const chartData = useMemo(() => {
    if (!sales?.length) return [];

    if (dateRange === 'today') {
      // Aggregate per jam
      const hourMap: Record<string, number> = {};
      sales.forEach(s => {
        const d = parseDashboardDate(s.created_at);
        if (!d) return;
        const key = `${String(d.getHours()).padStart(2, '0')}:00`;
        hourMap[key] = (hourMap[key] || 0) + (Number(s.total_price) || 0);
      });
      return Object.entries(hourMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([time, amount]) => ({
          time,
          omset: Math.round((amount / 1_000_000) * 10) / 10,
          profit: Math.round((amount * 0.42 / 1_000_000) * 10) / 10,
        }));
    }

    // Aggregate per hari
    const dayMap: Record<string, number> = {};
    sales.forEach(s => {
      const d = parseDashboardDate(s.created_at);
      if (!d) return;
      const key = d.toISOString().split('T')[0];
      dayMap[key] = (dayMap[key] || 0) + (Number(s.total_price) || 0);
    });

    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const sorted = Object.entries(dayMap).sort(([a], [b]) => a.localeCompare(b));

    return sorted.map(([date, amount]) => ({
      time:
        dateRange === '7d'
          ? dayNames[new Date(date).getDay()]
          : new Date(date).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
            }),
      omset: Math.round((amount / 1_000_000) * 10) / 10,
      profit: Math.round((amount * 0.42 / 1_000_000) * 10) / 10,
    }));
  }, [sales, dateRange]);

  const totalOmset = chartData.reduce((sum, d) => sum + d.omset, 0);
  const totalProfit = chartData.reduce((sum, d) => sum + d.profit, 0);
  const avgPerPeriod = chartData.length > 0 ? totalOmset / chartData.length : 0;

  const periodLabel = dateRange === 'today' ? 'per jam' : 'per hari';

  return (
    <div className="space-y-3">
      {/* STAT CARDS — pakai shared StatCard size="sm" */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard
          label={`Total omset · ${dateRangeLabel}`}
          value={`Rp${totalOmset.toFixed(1)}jt`}
          size="sm"
        />
        <StatCard
          label={`Total profit · ${dateRangeLabel}`}
          value={`Rp${totalProfit.toFixed(1)}jt`}
          size="sm"
        />
        <StatCard
          label={`Rata-rata ${periodLabel}`}
          value={`Rp${avgPerPeriod.toFixed(1)}jt`}
          size="sm"
        />
      </div>

      {/* CHART */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-[13px] font-medium text-slate-800">
              Tren penjualan
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Omset & profit{' '}
              <span className="text-slate-500 font-medium">{dateRangeLabel}</span>
            </p>
          </div>
          {/* Legend */}
          <div className="flex gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#378ADD] inline-block" />
              Omset
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#1D9E75] inline-block" />
              Profit
            </span>
          </div>
        </div>

        <div className="h-[220px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <p className="text-xs text-slate-400">Belum ada data</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 5, right: 0, left: -10, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="rgba(128,128,128,0.1)"
                />
                <XAxis
                  dataKey="time"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#888' }}
                  interval="preserveStartEnd"
                  minTickGap={24}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: '#888' }}
                  tickFormatter={v => `Rp${v}jt`}
                  width={45}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                  content={({ payload, active }) => {
                    if (active && payload?.length) {
                      return (
                        <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-800 text-xs">
                          <p className="text-[10px] text-slate-400 mb-1">
                            {payload[0]?.payload?.time}
                          </p>
                          {payload.map((p: any) => (
                            <div
                              key={p.dataKey}
                              className="flex items-center gap-2"
                            >
                              <span
                                className="w-2 h-2 rounded-sm inline-block"
                                style={{ backgroundColor: p.color }}
                              />
                              <span className="text-slate-300">
                                {p.dataKey === 'omset' ? 'Omset' : 'Profit'}:
                              </span>
                              <span className="font-bold">Rp{p.value}jt</span>
                            </div>
                          ))}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="omset"
                  fill="#378ADD"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
                <Bar
                  dataKey="profit"
                  fill="#1D9E75"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}