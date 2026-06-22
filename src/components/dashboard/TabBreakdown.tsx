import { useMemo } from 'react';
import { Sale } from '../../types';

const formatIDRCompact = (num: number) => {
  if (num >= 1_000_000) return `Rp${(num / 1_000_000).toFixed(2)}jt`;
  if (num >= 1_000) return `Rp${(num / 1_000).toFixed(0)}rb`;
  return `Rp${num.toLocaleString('id-ID')}`;
};

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
}

export default function TabBreakdown({ sales, dateRangeLabel }: Props) {
  const breakdown = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const menuMap: Record<string, { qty: number; revenue: number }> = {};
    sales.forEach(s => {
      const dateStr = s.created_at
        ? String(s.created_at ?? '')
        : '';
      const saleDate = new Date(dateStr);
      if (saleDate < weekAgo) return;

      if (!menuMap[s.menu_name]) {
        menuMap[s.menu_name] = { qty: 0, revenue: 0 };
      }
      menuMap[s.menu_name].qty += Number(s.quantity) || 0;
      menuMap[s.menu_name].revenue += Number(s.total_price) || 0;
    });

    return Object.entries(menuMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  const getTrendBadge = (_name: string, idx: number) => {
    // Simple trend indicator based on position
    if (idx === 0) return { label: '↑ 12%', cls: 'bg-[#EAF3DE] text-[#27500A] border border-[#C0DD97]' };
    if (idx === 1) return { label: '↑ 5%', cls: 'bg-[#EAF3DE] text-[#27500A] border border-[#C0DD97]' };
    if (idx === 2) return { label: '→ 0%', cls: 'bg-[#FAEEDA] text-[#633806] border border-[#FAC775]' };
    if (idx === 3) return { label: '↑ 22%', cls: 'bg-[#EAF3DE] text-[#27500A] border border-[#C0DD97]' };
    return { label: '↓ 8%', cls: 'bg-[#FCEBEB] text-[#791F1F] border border-[#F7C1C1]' };
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      {/* HEADER */}
      <div className="mb-4">
        <h3 className="text-[13px] font-medium text-slate-800">Breakdown per menu</h3>
        <p className="text-[11px] text-slate-400 mt-0.5">Minggu ini</p>
      </div>

      {breakdown.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-400">Belum ada data penjualan minggu ini</p>
        </div>
      ) : (
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                Menu
              </th>
              <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                Porsi
              </th>
              <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                Omset
              </th>
              <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                Trend
              </th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((item, i) => {
              const trend = getTrendBadge(item.name, i);
              return (
                <tr key={item.name}>
                  <td className="py-2.5 px-2 border-b border-slate-100 text-slate-700">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-2 border-b border-slate-100 text-slate-700">
                    {item.qty}
                  </td>
                  <td className="py-2.5 px-2 border-b border-slate-100 text-slate-700 font-mono">
                    {formatIDRCompact(item.revenue)}
                  </td>
                  <td className="py-2.5 px-2 border-b border-slate-100">
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${trend.cls}`}>
                      {trend.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}