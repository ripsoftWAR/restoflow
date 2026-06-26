// InventoryInsight.tsx  (fixed)
// FIX: tidak lagi hardcode "minggu ini" — sekarang pakai filteredMovements
//      yang sudah di-filter oleh Dashboard sesuai global date range.
// FIX: pakai shared StatCard size="sm" untuk konsistensi.

import { useMemo } from 'react';
import { Ingredient, MovementLog } from '../../types';
import { formatIDRCompact } from './shared/utils';
import StatCard from './shared/StatCard';

interface Props {
  ingredients: Ingredient[];
  /** Movements SUDAH difilter sesuai dateRange global dari Dashboard */
  movements: MovementLog[];
  criticalCount: number;
  stockValue: number;
  dateRangeLabel: string;
}

export default function InventoryInsight({
  ingredients,
  movements,
  criticalCount,
  stockValue,
  dateRangeLabel,
}: Props) {
  // Total bahan terpakai dalam periode yang dipilih (pakai filteredMovements)
  const totalUsage = useMemo(
    () =>
      movements
        .filter(m => m.type === 'OUT')
        .reduce((sum, m) => sum + Math.abs(Number(m.amount) || 0), 0),
    [movements],
  );

  // Top 5 bahan paling banyak dipakai dalam periode yang dipilih
  const topUsage = useMemo(() => {
    const usageMap: Record<number, number> = {};
    movements
      .filter(m => m.type === 'OUT')
      .forEach(m => {
        usageMap[m.ingredient_id] =
          (usageMap[m.ingredient_id] || 0) + Math.abs(Number(m.amount));
      });

    return Object.entries(usageMap)
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
  }, [movements, ingredients]);

  const maxAmount = topUsage[0]?.amount || 1;

  const formatUsage = (amount: number, unit: string) => {
    if (unit === 'pcs') return `${Math.round(amount)} pcs`;
    if (unit === 'ml')
      return amount >= 1000
        ? `${(amount / 1000).toFixed(1)} L`
        : `${Math.round(amount)} ml`;
    return amount >= 1000
      ? `${(amount / 1000).toFixed(1)} kg`
      : `${Math.round(amount)} g`;
  };

  const formatTotalUsage = (amount: number) =>
    amount >= 1000
      ? `${(amount / 1000).toFixed(1)} kg`
      : `${Math.round(amount)} g`;

  return (
    <div className="bg-white h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h3 className="text-[13px] font-medium text-slate-800">
            Inventory insight
          </h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Konsumsi ·{' '}
            <span className="text-slate-500 font-medium">{dateRangeLabel}</span>
          </p>
        </div>
        <span className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
          Explore ›
        </span>
      </div>

      <div className="px-4 pb-4 flex flex-col gap-4 flex-1">
        {/* 3 Mini stat cards — pakai shared StatCard size="sm" */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Nilai stok" value={formatIDRCompact(stockValue)} size="sm" />
          <StatCard label="Terpakai" value={formatTotalUsage(totalUsage)} size="sm" />
          <StatCard
            label="Akan habis"
            value={`${criticalCount} item`}
            size="sm"
            trend={
              criticalCount > 0
                ? { value: criticalCount, direction: 'down', label: 'item kritis' }
                : null
            }
          />
        </div>

        {/* Top usage bars */}
        <div>
          <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-3">
            Paling banyak dipakai
          </p>

          {topUsage.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-[11px] text-slate-400">
                Belum ada data pemakaian untuk periode ini
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {topUsage.map(item => {
                const pct = Math.round((item.amount / maxAmount) * 100);
                return (
                  <div
                    key={item.name}
                    className="grid grid-cols-[52px_1fr_48px] items-center gap-2"
                  >
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