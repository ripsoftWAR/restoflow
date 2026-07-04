import { useMemo } from 'react';
import { Sale } from '../../types';
import { formatIDRCompact } from './shared/utils';

/* ═══════════════════════════════════════════════════════════════
   MenuTerlaris — Top 4 menu with rank, thumb, name, qty, revenue
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
}

// Food emoji placeholder based on menu name
function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('ayam') || lower.includes('chicken')) return '🍗';
  if (lower.includes('nasi') || lower.includes('rice')) return '🍚';
  if (lower.includes('mie') || lower.includes('noodle')) return '🍜';
  if (lower.includes('sate') || lower.includes('satay')) return '🍢';
  if (lower.includes('ikan') || lower.includes('fish')) return '🐟';
  if (lower.includes('sop') || lower.includes('soup')) return '🍲';
  if (lower.includes('es') || lower.includes('ice') || lower.includes('drink')) return '🥤';
  if (lower.includes('kopi') || lower.includes('coffee')) return '☕';
  if (lower.includes('teh') || lower.includes('tea')) return '🍵';
  if (lower.includes('gado') || lower.includes('salad')) return '🥗';
  if (lower.includes('bakso') || lower.includes('meatball')) return '🍖';
  if (lower.includes('tempe') || lower.includes('tahu')) return '🫘';
  if (lower.includes('pisang') || lower.includes('banana')) return '🍌';
  if (lower.includes('roti') || lower.includes('bread')) return '🍞';
  return '🍽️';
}

const RANK_COLORS = ['#2E4FE0', '#18A659', '#8B5CF6', '#F0801E'];

export default function MenuTerlaris({ sales, dateRangeLabel }: Props) {
  const topMenus = useMemo(() => {
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

  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-[15.5px] font-bold text-pp-text">Menu Terlaris</div>
          <div className="text-[12px] text-pp-text-muted mt-0.5">30 hari terakhir</div>
        </div>
        <button className="text-[12.5px] font-semibold text-pp-primary flex items-center gap-1 cursor-pointer hover:underline">
          Lihat Semua
        </button>
      </div>

      {/* LIST */}
      <div className="flex flex-col mt-[14px]">
        {topMenus.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 gap-2">
            <span className="text-[32px]">🍽️</span>
            <p className="text-[13px] text-pp-text-muted">Belum ada penjualan</p>
            <p className="text-[11px] text-pp-text-muted">Menu akan muncul setelah transaksi</p>
          </div>
        ) : (
          topMenus.map((menu, i) => (
            <div
              key={menu.name}
              className="flex items-center gap-3 py-[11px] border-b border-pp-border last:border-b-0 last:pb-0"
            >
              <span className="text-[13px] font-bold text-pp-text-muted w-[14px] tabular-nums">
                {i + 1}
              </span>
              <div
                className="w-[42px] h-[42px] rounded-pp-sm flex items-center justify-center text-[20px] flex-shrink-0"
                style={{ backgroundColor: `${RANK_COLORS[i]}15` }}
              >
                {getFoodEmoji(menu.name)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[13.5px] font-semibold text-pp-text truncate">
                  {menu.name}
                </div>
                <div className="text-[12px] text-pp-text-muted mt-0.5">
                  {menu.qty} porsi
                </div>
              </div>
              <div className="text-[13.5px] font-bold text-pp-text whitespace-nowrap">
                {formatIDRCompact(menu.revenue)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
