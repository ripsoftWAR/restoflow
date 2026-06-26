import { useMemo } from 'react';
import { Sale } from '../../types';
import { formatIDRCompact } from './shared/utils';

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
}

export default function MenuTerlaris({ sales, dateRangeLabel }: Props) {
  const topMenus = useMemo(() => {
    // Aggregate by menu_name from pre-filtered sales
    const menuMap: Record<string, { qty: number; revenue: number }> = {};
    sales.forEach(s => {
      if (!menuMap[s.menu_name]) {
        menuMap[s.menu_name] = { qty: 0, revenue: 0 };
      }
      menuMap[s.menu_name].qty += Number(s.quantity) || 0;
      menuMap[s.menu_name].revenue += Number(s.total_price) || 0;
    });

    return Object.entries(menuMap)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 4);
  }, [sales]);

  const dotColors = ['#378ADD', '#1D9E75', '#7C3AED', '#EF9F27'];

  return (
    <div className="bg-white h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h3 className="text-[13px] font-medium text-slate-800">Menu terlaris</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            <span className="text-slate-500 font-medium">{dateRangeLabel}</span>
          </p>
        </div>
        <span className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
          Explore ›
        </span>
      </div>

      {/* LIST */}
      <div className="px-4 pb-4 flex flex-col flex-1">
        {topMenus.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-xs text-slate-400">Belum ada penjualan</p>
          </div>
        ) : (
          topMenus.map((menu, i) => (
            <div
              key={menu.name}
              className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 w-3.5">{i + 1}</span>
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: dotColors[i] || '#94a3b8' }}
                />
                <div>
                  <div className="text-[12px] text-slate-700">{menu.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {menu.qty} porsi
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-medium text-slate-500 tabular-nums tracking-[-0.03em]">
                {formatIDRCompact(menu.revenue)}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}