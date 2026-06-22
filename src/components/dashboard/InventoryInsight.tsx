import { useMemo } from 'react';
import { Ingredient, MovementLog } from '../../types';

const formatIDRCompact = (num: number) => {
  if (num >= 1_000_000) return `Rp${(num / 1_000_000).toFixed(1)}jt`;
  if (num >= 1_000) return `Rp${(num / 1_000).toFixed(0)}rb`;
  return `Rp${num.toLocaleString('id-ID')}`;
};

interface Props {
  ingredients: Ingredient[];
  movements: MovementLog[];
  criticalCount: number;
  stockValue: number;
  dateRangeLabel: string;
}

export default function InventoryInsight({ ingredients, movements, criticalCount, stockValue, dateRangeLabel }: Props) {
  // ── Total bahan terpakai minggu ini ─────────────────────────────
  const totalUsage = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return movements
      .filter(m => m.type === 'OUT' && new Date(m.created_at) >= weekAgo)
      .reduce((sum, m) => sum + Math.abs(Number(m.amount) || 0), 0);
  }, [movements]);

  // ── Top 5 bahan paling banyak dipakai ───────────────────────────
  const topUsage = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const usageMap: Record<number, number> = {};
    movements
      .filter(m => m.type === 'OUT' && new Date(m.created_at) >= weekAgo)
      .forEach(m => {
        usageMap[m.ingredient_id] = (usageMap[m.ingredient_id] || 0) + Math.abs(Number(m.amount));
      });

    const merged = Object.entries(usageMap)
      .map(([id, amount]) => {
        const ing = ingredients.find(i => i.id === Number(id));
        return {
          name: ing?.name || `Bahan #${id}`,
          amount,
          unit: ing?.base_unit || '',
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    return merged;
  }, [movements, ingredients]);

  const maxAmount = topUsage.length > 0 ? topUsage[0].amount : 1;

  const formatUsage = (amount: number, unit: string) => {
    if (unit === 'pcs') return `${Math.round(amount)} pcs`;
    if (unit === 'ml') {
      if (amount >= 1000) return `${(amount / 1000).toFixed(1)} L`;
      return `${Math.round(amount)} ml`;
    }
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)} kg`;
    return `${Math.round(amount)} g`;
  };

  const formatTotalUsage = (amount: number) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)} kg`;
    return `${Math.round(amount)} g`;
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h3 className="text-[13px] font-medium text-slate-800">Inventory insight</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Konsumsi minggu ini</p>
        </div>
        <span className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600">
          Explore ›
        </span>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-4 flex-1">
        {/* ── 3 Mini stat cards ─────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <div className="text-[10px] text-slate-400 mb-1">Nilai stok</div>
            <div className="text-[15px] font-medium text-slate-800 font-mono">
              {formatIDRCompact(stockValue)}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <div className="text-[10px] text-slate-400 mb-1">Terpakai</div>
            <div className="text-[15px] font-medium text-slate-800 font-mono">
              {formatTotalUsage(totalUsage)}
            </div>
          </div>
          <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-100">
            <div className="text-[10px] text-slate-400 mb-1">Akan habis</div>
            <div className={`text-[15px] font-medium font-mono ${criticalCount > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>
              {criticalCount} item
            </div>
          </div>
        </div>

        {/* ── Top usage bars ────────────────────────────────────── */}
        <div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-3">
            Paling banyak dipakai
          </p>

          {topUsage.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-[11px] text-slate-400">Belum ada data pemakaian minggu ini</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topUsage.map((item) => {
                const pct = Math.round((item.amount / maxAmount) * 100);
                return (
                  <div key={item.name} className="grid grid-cols-[52px_1fr_48px] items-center gap-2">
                    <span className="text-[11px] text-slate-500 truncate">
                      {item.name}
                    </span>
                    <div className="bg-slate-100 rounded-full h-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#378ADD] transition-all duration-500"
                        style={{ width: `${Math.max(4, pct)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 text-right font-mono">
                      {formatUsage(item.amount, item.unit)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}