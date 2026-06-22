import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Sale } from '../../types';

const formatIDRCompact = (num: number) => {
  if (num >= 1_000_000) return `Rp${(num / 1_000_000).toFixed(1)}jt`;
  if (num >= 1_000) return `Rp${(num / 1_000).toFixed(0)}rb`;
  return `Rp${num.toLocaleString('id-ID')}`;
};

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
}

export default function TabTren({ sales, dateRangeLabel }: Props) {
  const chartData = useMemo(() => {
    if (!sales?.length) return [];
    const dayMap: Record<string, number> = {};
    sales.forEach(s => {
      const d = new Date(s.created_at ?? '');
      if (!isNaN(d.getTime())) {
        const key = d.toISOString().split('T')[0];
        dayMap[key] = (dayMap[key] || 0) + (Number(s.total_price) || 0);
      }
    });
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    return Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-7)
      .map(([date, amount]) => ({
        time: dayNames[new Date(date).getDay()],
        omset: Math.round((amount / 1_000_000) * 10) / 10,
        profit: Math.round((amount * 0.42 / 1_000_000) * 10) / 10,
      }));
  }, [sales]);

  const totalOmset = useMemo(() => {
    return chartData.reduce((sum, d) => sum + (d.omset || 0), 0);
  }, [chartData]);

  const totalProfit = useMemo(() => {
    return chartData.reduce((sum, d) => sum + (d.profit || 0), 0);
  }, [chartData]);

  const avgPerDay = chartData.length > 0 ? totalOmset / chartData.length : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h3 className="text-[13px] font-medium text-slate-800">Tren penjualan</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Omset & profit 7 hari terakhir</p>
        </div>
        <div className="flex gap-1">
          <button className="text-[11px] px-2.5 py-1 rounded-md border border-[#185FA5] text-[#185FA5] bg-[#E6F1FB]">
            7 hari
          </button>
          <button className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 text-slate-500 bg-white hover:text-slate-700">
            30 hari
          </button>
          <button className="text-[11px] px-2.5 py-1 rounded-md border border-slate-200 text-slate-500 bg-white hover:text-slate-700">
            3 bulan
          </button>
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
          <div className="text-[10px] text-slate-400 mb-1">Total omset</div>
          <div className="text-[15px] font-medium text-slate-800 font-mono">
            Rp{totalOmset.toFixed(1)}jt
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
          <div className="text-[10px] text-slate-400 mb-1">Total profit</div>
          <div className="text-[15px] font-medium text-slate-800 font-mono">
            Rp{totalProfit.toFixed(1)}jt
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
          <div className="text-[10px] text-slate-400 mb-1">Rata-rata/hari</div>
          <div className="text-[15px] font-medium text-slate-800 font-mono">
            Rp{avgPerDay.toFixed(1)}jt
          </div>
        </div>
      </div>

      {/* LEGEND */}
      <div className="flex gap-4 text-[11px] text-slate-500 mb-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#378ADD] inline-block" />
          Omset
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-[#1D9E75] inline-block" />
          Profit
        </span>
      </div>

      {/* CHART */}
      <div className="h-[200px]">
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <p className="text-xs text-slate-400">Belum ada data</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 5, right: 0, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.1)" />
              <XAxis
                dataKey="time"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 10, fill: '#888' }}
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
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-800 text-xs">
                        {payload.map((p: any) => (
                          <div key={p.dataKey} className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-sm inline-block" style={{ backgroundColor: p.color }} />
                            <span className="text-slate-300">{p.dataKey === 'omset' ? 'Omset' : 'Profit'}:</span>
                            <span className="font-bold">Rp{p.value}jt</span>
                          </div>
                        ))}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="omset" fill="#378ADD" radius={[4, 4, 0, 0]} maxBarSize={32} />
              <Bar dataKey="profit" fill="#1D9E75" radius={[4, 4, 0, 0]} maxBarSize={32} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}