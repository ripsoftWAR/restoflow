import { useMemo } from 'react';
import { Ingredient, MovementLog } from '../../types';
import { formatIDRCompact } from './shared/utils';

/* ═══════════════════════════════════════════════════════════════
   InventoryInsight — 3 mini stat cards + usage percentage bar
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  ingredients: Ingredient[];
  movements: MovementLog[];
  criticalCount: number;
  stockValue: number;
  dateRangeLabel: string;
  onNavigate: (tab: string) => void;
}

const SEGMENT_COLORS = [
  'bg-[#2E4FE0]',   // #1
  'bg-[#4F6EF2]',   // #2
  'bg-[#7085F5]',   // #3
  'bg-[#8E9EF7]',   // #4
  'bg-[#A8B5F9]',   // #5
  'bg-[#C4CDFB]',   // #6 — "lainnya"
];

export default function InventoryInsight({
  movements, criticalCount, stockValue, onNavigate,
}: Props) {
  // Total bahan terpakai
  const totalUsage = useMemo(
    () =>
      movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + Math.abs(Number(m.amount) || 0), 0),
    [movements],
  );

  // Group usage by ingredient name → percentage
  const usageBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    movements
      .filter(m => m.type === 'OUT')
      .forEach(m => {
        const name = m.ingredient_name || 'Lainnya';
        map[name] = (map[name] || 0) + Math.abs(Number(m.amount) || 0);
      });

    const total = Object.values(map).reduce((s, v) => s + v, 0);
    if (total === 0) return [];

    const sorted = Object.entries(map)
      .map(([name, amount]) => ({ name, amount, pct: Math.round((amount / total) * 100) }))
      .sort((a, b) => b.amount - a.amount);

    // Top 5 individual + "Lainnya" bucket
    const top5 = sorted.slice(0, 5);
    const rest = sorted.slice(5);
    const restPct = rest.reduce((s, r) => s + r.pct, 0);

    if (rest.length > 0) {
      top5.push({ name: `${rest.length} lainnya`, amount: rest.reduce((s, r) => s + r.amount, 0), pct: restPct });
    }

    // Normalize to exactly 100%
    const diff = 100 - top5.reduce((s, t) => s + t.pct, 0);
    if (top5.length > 0) top5[0].pct += diff;

    return top5;
  }, [movements]);

  const formatUsage = (amount: number) =>
    amount >= 1000
      ? `${(amount / 1000).toFixed(1)} kg`
      : `${Math.round(amount)} g`;

  return (
    <div className="bg-white border border-[#E9ECF5] rounded-2xl p-5">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-[15.5px] font-bold text-[#1B2436]">Inventory Insight</div>
          <div className="text-[12px] text-[#9CA3AF] mt-0.5">Kondisi inventori saat ini</div>
        </div>
        <button
          onClick={() => onNavigate('inventory')}
          className="text-[12.5px] font-semibold text-[#2E4FE0] flex items-center gap-1 cursor-pointer hover:underline"
        >
          Lihat Semua
        </button>
      </div>

      {/* MINI STATS */}
      <div className="grid grid-cols-3 gap-3 mt-[14px]">
        {/* Nilai Stok */}
        <div className="border border-[#E9ECF5] rounded-xl p-[13px]">
          <div className="w-[30px] h-[30px] rounded-lg bg-[#F2F5FF] flex items-center justify-center mb-[10px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2E4FE0" strokeWidth="2">
              <path d="M21 8L12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/>
            </svg>
          </div>
          <div className="text-[11.5px] text-[#9CA3AF] mb-1">Nilai Stok</div>
          <div className="text-[15px] font-bold text-[#1B2436] mb-[5px]">
            {formatIDRCompact(stockValue)}
          </div>
          <div className="text-[11px] font-semibold text-[#149355]">↑ 7.1% dari bulan lalu</div>
        </div>

        {/* Terpakai */}
        <div className="border border-[#E9ECF5] rounded-xl p-[13px]">
          <div className="w-[30px] h-[30px] rounded-lg bg-[#E4F7EC] flex items-center justify-center mb-[10px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#149355" strokeWidth="2">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><path d="M3 6h18M16 10a4 4 0 01-8 0"/>
            </svg>
          </div>
          <div className="text-[11.5px] text-[#9CA3AF] mb-1">Terpakai</div>
          <div className="text-[15px] font-bold text-[#1B2436] mb-[5px]">
            {formatUsage(totalUsage)}
          </div>
          <div className="text-[11px] font-semibold text-[#149355]">↑ 5.3% dari bulan lalu</div>
        </div>

        {/* Akan Habis */}
        <div className="border border-[#E9ECF5] rounded-xl p-[13px]">
          <div className="w-[30px] h-[30px] rounded-lg bg-[#FDECD9] flex items-center justify-center mb-[10px]">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#E8720C" strokeWidth="2">
              <path d="M12 8v4l3 3"/><circle cx="12" cy="12" r="10"/>
            </svg>
          </div>
          <div className="text-[11.5px] text-[#9CA3AF] mb-1">Akan Habis</div>
          <div className="text-[15px] font-bold text-[#1B2436] mb-[5px]">
            {criticalCount} item
          </div>
          <div className="text-[11px] font-semibold text-[#E8720C]">
            {criticalCount > 0 ? 'Perlu restock segera' : 'Stok aman'}
          </div>
        </div>
      </div>

      {/* USAGE BREAKDOWN — stacked percentage bar */}
      {usageBreakdown.length > 0 && (
        <div className="mt-[16px]">
          <div className="text-[12.5px] font-semibold text-[#1B2436] mb-[10px]">
            Pemakaian Bahan
          </div>

          {/* Stacked bar */}
          <div className="h-[28px] rounded-lg overflow-hidden flex w-full">
            {usageBreakdown.map((item, idx) => (
              <div
                key={item.name}
                className={`h-full ${SEGMENT_COLORS[idx] || SEGMENT_COLORS[SEGMENT_COLORS.length - 1]}`}
                style={{ width: `${item.pct}%` }}
                title={`${item.name}: ${item.pct}%`}
              />
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-[10px]">
            {usageBreakdown.map((item, idx) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className={`w-[10px] h-[10px] rounded-sm ${SEGMENT_COLORS[idx] || SEGMENT_COLORS[SEGMENT_COLORS.length - 1]}`} />
                <span className="text-[11.5px] text-[#4B5468] font-medium">{item.name}</span>
                <span className="text-[11px] text-[#9CA3AF]">{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
