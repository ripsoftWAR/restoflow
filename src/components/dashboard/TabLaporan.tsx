import { useMemo } from 'react';
import { Sale } from '../../types';
import { FileText, Download } from 'lucide-react';
import { formatIDRCompact } from './shared/utils';

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
}

export default function TabLaporan({ sales, dateRangeLabel }: Props) {
  const dailyReport = useMemo(() => {
    const dayMap: Record<string, { tx: number; omset: number; profit: number }> = {};

    sales.forEach(s => {
      const dateStr = s.created_at
        ? String(s.created_at).split('T')[0]
        : '';
      if (!dateStr) return;

      if (!dayMap[dateStr]) {
        dayMap[dateStr] = { tx: 0, omset: 0, profit: 0 };
      }
      dayMap[dateStr].tx += 1;
      dayMap[dateStr].omset += Number(s.total_price) || 0;
      dayMap[dateStr].profit += Math.round((Number(s.total_price) || 0) * 0.42);
    });

    return Object.entries(dayMap)
      .map(([date, data]) => {
        const d = new Date(date);
        const formatted = d.toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        });
        return { date: formatted, rawDate: date, ...data };
      })
      .sort((a, b) => b.rawDate.localeCompare(a.rawDate))
      .slice(0, 10);
  }, [sales]);

  const totalOmset = dailyReport.reduce((s, d) => s + d.omset, 0);
  const totalProfit = dailyReport.reduce((s, d) => s + d.profit, 0);
  const totalTx = dailyReport.reduce((s, d) => s + d.tx, 0);

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 mb-1">Total omset bulan ini</div>
          <div className="text-[15px] font-medium text-slate-800 font-mono">
            {formatIDRCompact(totalOmset)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 mb-1">Total profit bulan ini</div>
          <div className="text-[15px] font-medium text-slate-800 font-mono">
            {formatIDRCompact(totalProfit)}
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-3">
          <div className="text-[10px] text-slate-400 mb-1">Total transaksi</div>
          <div className="text-[15px] font-medium text-slate-800 font-mono">
            {totalTx}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white border border-slate-200 rounded-xl p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[13px] font-medium text-slate-800">Riwayat penjualan</h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50">
              <FileText size={11} />
              Export PDF
            </button>
            <button className="flex items-center gap-1.5 text-[10px] px-2.5 py-1.5 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50">
              <Download size={11} />
              CSV
            </button>
          </div>
        </div>

        {dailyReport.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs text-slate-400">Belum ada data penjualan</p>
          </div>
        ) : (
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr>
                <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                  Tanggal
                </th>
                <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                  Transaksi
                </th>
                <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                  Omset
                </th>
                <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                  Profit
                </th>
                <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {dailyReport.map((row, i) => {
                const isToday = row.rawDate === todayStr;
                return (
                  <tr key={row.rawDate}>
                    <td className="py-2.5 px-2 border-b border-slate-100 text-slate-700">
                      {row.date}
                    </td>
                    <td className="py-2.5 px-2 border-b border-slate-100 text-slate-700">
                      {row.tx}
                    </td>
                    <td className="py-2.5 px-2 border-b border-slate-100 text-slate-700 font-mono">
                      {formatIDRCompact(row.omset)}
                    </td>
                    <td className="py-2.5 px-2 border-b border-slate-100 text-slate-700 font-mono">
                      {formatIDRCompact(row.profit)}
                    </td>
                    <td className="py-2.5 px-2 border-b border-slate-100">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                        isToday
                          ? 'bg-[#EAF3DE] text-[#27500A] border border-[#C0DD97]'
                          : 'bg-[#EAF3DE] text-[#27500A] border border-[#C0DD97]'
                      }`}>
                        {isToday ? 'Berjalan' : 'Selesai'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}