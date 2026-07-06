import React from 'react';
import { Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Ingredient, stockInBuyUnit } from '../../../types';

interface IngredientListProps {
  ingredients: Ingredient[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  totalCount: number;
  filteredCount: number;
}

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE
   ═══════════════════════════════════════════════════════════════ */
function StatusBadge({ ing }: { ing: Ingredient }) {
  if (ing.stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100">
        <AlertTriangle size={10} /> Habis
      </span>
    );
  }
  if (ing.stock <= ing.min_stock) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100">
        <AlertTriangle size={10} /> Kritis
      </span>
    );
  }
  if (ing.stock <= ing.min_stock * 1.5) {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
        <Clock size={10} /> Akan Habis
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">
      <CheckCircle2 size={10} /> Aman
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STOCK DISPLAY
   ═══════════════════════════════════════════════════════════════ */
function StockDisplay({ ing }: { ing: Ingredient }) {
  const buyQty = stockInBuyUnit(ing);
  const buyLabel = ing.buy_unit || ing.base_unit;

  if (ing.buy_unit && ing.conversion_factor && ing.conversion_factor !== 1) {
    const formatted = Number.isInteger(buyQty) ? buyQty.toLocaleString('id-ID') : buyQty.toFixed(1);
    return (
      <span className="text-xs font-semibold text-pp-text tabular-nums">
        {formatted} <span className="text-pp-text-muted font-normal">{buyLabel}</span>
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold text-pp-text tabular-nums">
      {ing.stock.toLocaleString('id-ID')} <span className="text-pp-text-muted font-normal">{ing.base_unit}</span>
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CATEGORY BADGE
   ═══════════════════════════════════════════════════════════════ */
const CAT_COLORS: Record<string, string> = {
  'Bumbu': 'bg-orange-50 text-orange-600',
  'Sayuran': 'bg-green-50 text-green-600',
  'Daging': 'bg-red-50 text-red-600',
  'Seafood': 'bg-blue-50 text-blue-600',
  'Minuman': 'bg-cyan-50 text-cyan-600',
  'Bahan Pokok': 'bg-amber-50 text-amber-600',
  'Susu & Telur': 'bg-yellow-50 text-yellow-600',
  'Bahan Kering': 'bg-stone-50 text-stone-600',
  'Lainnya': 'bg-slate-50 text-slate-600',
};

function CategoryBadge({ category }: { category?: string }) {
  const cat = category || 'Lainnya';
  const colors = CAT_COLORS[cat] || 'bg-slate-50 text-slate-600';
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold ${colors}`}>
      {cat}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   INGREDIENT LIST — MAIN
   ═══════════════════════════════════════════════════════════════ */
export default function IngredientList({
  ingredients,
  selectedId,
  onSelect,
  totalCount,
  filteredCount,
}: IngredientListProps) {
  /* ── Empty state ── */
  if (ingredients.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-pp-surface border border-pp-border rounded-pp-lg p-8">
        <div className="w-12 h-12 rounded-full bg-pp-primary-soft flex items-center justify-center mb-3">
          <Package size={20} className="text-pp-primary" />
        </div>
        <p className="text-sm font-semibold text-pp-text mb-1">Belum ada bahan</p>
        <p className="text-xs text-pp-text-muted text-center max-w-[240px]">
          Tambahkan bahan pertama untuk mulai mengelola inventori restoran.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-pp-surface border border-pp-border rounded-pp-lg">
      {/* ── List header ── */}
      <div className="sticky top-0 z-10 flex items-center px-4 py-2.5 bg-pp-surface border-b border-pp-border-light text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider">
        <span className="w-8 flex-shrink-0" />
        <span className="flex-1">Bahan</span>
        <span className="w-[72px] text-right flex-shrink-0">Stok</span>
        <span className="w-[76px] text-center flex-shrink-0">Status</span>
        <span className="w-[100px] text-right flex-shrink-0 hidden lg:block">Update</span>
      </div>

      {/* ── Items ── */}
      <div className="divide-y divide-pp-border-light">
        {ingredients.map(ing => {
          const isSelected = ing.id === selectedId;
          const isCritical = ing.stock <= ing.min_stock;

          return (
            <button
              key={ing.id}
              onClick={() => onSelect(ing.id)}
              className={`w-full flex items-center px-4 py-3 text-left transition-colors hover:bg-pp-bg ${
                isSelected
                  ? 'bg-pp-primary-soft border-l-2 border-l-pp-primary'
                  : 'border-l-2 border-l-transparent'
              }`}
            >
              {/* Thumbnail */}
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isCritical ? 'bg-red-50 text-red-500' : 'bg-pp-primary-soft text-pp-primary'
              }`}>
                <Package size={14} />
              </div>

              {/* Name + Meta */}
              <div className="flex-1 ml-3 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className={`text-[13px] font-semibold truncate ${
                    isSelected ? 'text-pp-primary' : 'text-pp-text'
                  }`}>
                    {ing.name}
                  </span>
                  {ing.sku && (
                    <span className="text-[9px] text-pp-text-muted font-mono tracking-wide flex-shrink-0">
                      {ing.sku}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <CategoryBadge category={ing.category} />
                  {ing.supplier && (
                    <span className="text-[10px] text-pp-text-muted truncate max-w-[110px]">
                      {ing.supplier}
                    </span>
                  )}
                </div>
              </div>

              {/* Stock */}
              <div className="w-[72px] text-right flex-shrink-0">
                <StockDisplay ing={ing} />
              </div>

              {/* Status */}
              <div className="w-[76px] flex justify-center flex-shrink-0">
                <StatusBadge ing={ing} />
              </div>

              {/* Last Updated */}
              <div className="w-[100px] text-right flex-shrink-0 hidden lg:block">
                <span className="text-[10px] text-pp-text-muted">
                  {ing.updated_at
                    ? new Date(ing.updated_at).toLocaleDateString('id-ID', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : ing.created_at
                      ? new Date(ing.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : '—'}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
