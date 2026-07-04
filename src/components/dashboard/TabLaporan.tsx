import { useMemo } from 'react';
import { Sale } from '../../types';
import { FileText, Download } from 'lucide-react';
import { formatIDRCompact, parseDashboardDate } from './shared/utils';

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
}

export default function TabLaporan({ sales, dateRangeLabel }: Props) {
  const dailyReport = useMemo(() => {
    const dayMap: Record<string, { tx: number; omset: number; profit: number }> = {};

    sales.forEach(s => {
      const d = parseDashboardDate(s.created_at);
      if (!d) return;
      const dateStr = d.toISOString().split('T')[0];

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
    <div className="space-y-5">
      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-pp-surface border border-pp-border rounded-pp-md p-4 shadow-pp-xs">
          <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider mb-1">Total omset</p>
          <p className="text-[18px] font-bold text-pp-text tabular-nums tracking-[-0.03em]">
            {formatIDRCompact(totalOmset)}
          </p>
        </div>
        <div className="bg-pp-surface border border-pp-border rounded-pp-md p-4 shadow-pp-xs">
          <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider mb-1">Total profit</p>
          <p className="text-[18px] font-bold text-pp-text tabular-nums tracking-[-0.03em]">
            {formatIDRCompact(totalProfit)}
          </p>
        </div>
        <div className="bg-pp-surface border border-pp-border rounded-pp-md p-4 shadow-pp-xs">
          <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider mb-1">Total transaksi</p>
          <p className="text-[18px] font-bold text-pp-text tabular-nums tracking-[-0.03em]">
            {totalTx}
          </p>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-pp-surface border border-pp-border rounded-pp-md shadow-pp-xs overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-pp-border-light">
          <h3 className="text-[14px] font-semibold text-pp-text">Riwayat penjualan</h3>
          <div className="flex gap-2">
            <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 border border-pp-border rounded-pp-xs bg-pp-surface text-pp-text-secondary hover:bg-pp-bg transition-all duration-150">
              <FileText size={12} />
              Export PDF
            </button>
            <button className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-1.5 border border-pp-border rounded-pp-xs bg-pp-surface text-pp-text-secondary hover:bg-pp-bg transition-all duration-150">
              <Download size={12} />
              CSV
            </button>
          </div>
        </div>

        {dailyReport.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-16">
            <div className="w-10 h-10 rounded-full bg-pp-bg flex items-center justify-center">
              <FileText size={18} className="text-pp-text-placeholder" />
            </div>
            <p className="text-[13px] text-pp-text-muted">Belum ada data penjualan</p>
            <p className="text-[12px] text-pp-text-placeholder">Riwayat akan muncul setelah transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="bg-pp-bg/50">
                  <th className="py-2.5 pl-5 pr-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">
                    Tanggal
                  </th>
                  <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">
                    Transaksi
                  </th>
                  <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">
                    Omset
                  </th>
                  <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">
                    Profit
                  </th>
                  <th className="py-2.5 pl-2 pr-5 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {dailyReport.map((row) => {
                  const isToday = row.rawDate === todayStr;
                  return (
                    <tr
                      key={row.rawDate}
                      className="border-t border-pp-border-light hover:bg-pp-bg/50 transition-colors"
                    >
                      <td className="py-3 pl-5 pr-2 text-pp-text font-medium">
                        {row.date}
                      </td>
                      <td className="py-3 px-2 text-pp-text-secondary">
                        {row.tx}
                      </td>
                      <td className="py-3 px-2 text-pp-text font-medium tabular-nums">
                        {formatIDRCompact(row.omset)}
                      </td>
                      <td className="py-3 px-2 text-pp-text-secondary tabular-nums">
                        {formatIDRCompact(row.profit)}
                      </td>
                      <td className="py-3 pl-2 pr-5">
                        <span
                          className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full"
                          style={{
                            backgroundColor: isToday ? 'var(--pp-success-soft)' : 'var(--pp-bg)',
                            color: isToday ? 'var(--pp-success)' : 'var(--pp-text-muted)',
                            border: `1px solid ${isToday ? 'var(--pp-success-border)' : 'var(--pp-border-light)'}`,
                          }}
                        >
                          {isToday ? 'Berjalan' : 'Selesai'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
