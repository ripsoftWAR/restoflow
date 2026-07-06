import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Ingredient } from '../../../types';
import { formatIDRCompact } from '../../dashboard/shared/utils';
import { preciseMultiply } from '../../../utils/mathHelper';

/* ═══════════════════════════════════════════════════════════════
   InventoryCategoryChart — Donut distribusi nilai stok per kategori
   Reuse pattern dari TabBreakdown.tsx
   ═══════════════════════════════════════════════════════════════ */

const CAT_COLORS = [
  'var(--pp-chart-blue)',
  'var(--pp-chart-green)',
  'var(--pp-chart-purple)',
  'var(--pp-chart-orange)',
  '#E11D48',
  '#0891B2',
  '#D946EF',
  '#84CC16',
  '#F59E0B',
  '#6366F1',
];

interface Props {
  ingredients: Ingredient[];
}

/** Hitung nilai stok satu ingredient dalam buy_unit */
function calcStockValue(ing: Ingredient): number {
  const stockInBuyUnit =
    ing.conversion_factor && ing.buy_unit && ing.buy_unit !== ing.base_unit
      ? ing.stock / ing.conversion_factor
      : ing.stock;
  return preciseMultiply(Math.max(0, stockInBuyUnit), ing.unit_price);
}

export default function InventoryCategoryChart({ ingredients }: Props) {
  const categoryData = useMemo(() => {
    const agg: Record<string, number> = {};
    ingredients.forEach(ing => {
      const cat = (ing.category || 'Lainnya').trim();
      const val = calcStockValue(ing);
      agg[cat] = (agg[cat] || 0) + val;
    });

    const list = Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const total = list.reduce((sum, i) => sum + i.value, 0);
    return { list, total };
  }, [ingredients]);

  if (categoryData.list.length === 0) {
    return (
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5">
        <div className="flex flex-col items-center justify-center py-8 gap-2">
          <span className="text-[32px]">📂</span>
          <p className="text-[13px] text-pp-text-muted">Belum ada data bahan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
      <div className="mb-4">
        <div className="text-[15.5px] font-bold text-pp-text">Distribusi Nilai Stok per Kategori</div>
        <div className="text-[12px] text-pp-text-muted mt-0.5">
          {categoryData.list.length} kategori · Total {formatIDRCompact(categoryData.total)}
        </div>
      </div>

      <div className="flex items-center gap-5">
        {/* Donut */}
        <div className="w-[140px] h-[140px] flex-shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={categoryData.list}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={62}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
              >
                {categoryData.list.map((_, i) => (
                  <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.[0]) return null;
                  const d = payload[0].payload;
                  const pct = categoryData.total > 0
                    ? Math.round((d.value / categoryData.total) * 100)
                    : 0;
                  return (
                    <div className="bg-[#1B2436] text-white px-3 py-2 rounded-[10px] text-[12px]">
                      <div className="font-semibold">{d.name}</div>
                      <div className="text-[#B9C1D9]">{formatIDRCompact(d.value)} · {pct}%</div>
                    </div>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          {/* Center label */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-pp-text-muted leading-tight">Total</span>
            <span className="text-[13px] font-bold text-pp-text leading-tight tabular-nums">
              {formatIDRCompact(categoryData.total)}
            </span>
          </div>
        </div>

        {/* Legend list */}
        <div className="flex-1 min-w-0 space-y-2">
          {categoryData.list.map((item, i) => {
            const pct = categoryData.total > 0
              ? Math.round((item.value / categoryData.total) * 100)
              : 0;
            return (
              <div key={item.name} className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                />
                <span className="text-[12.5px] text-pp-text flex-1 truncate">{item.name}</span>
                <span className="text-[11.5px] font-semibold text-pp-text tabular-nums ml-auto">
                  {pct}%
                </span>
                <span className="text-[11px] text-pp-text-muted tabular-nums w-[70px] text-right">
                  {formatIDRCompact(item.value)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
