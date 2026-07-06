import { Package, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import {
  Ingredient,
  pricePerBuyUnit,
  totalStockValue,
  formatStockWithBase,
} from '../../../types';
import { formatIDR } from '../utils/format';

/* ═══════════════════════════════════════════════════════════════
   IngredientTable — 9 kolom (ringkas, scroll horizontal jika perlu)
   Kolom: # | Nama+Supplier | Kategori | Stok | Min.Stok | Harga/BU | Nilai Stok | Status | Update
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  ingredients: Ingredient[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  filteredCount: number;
}

/* ── Status Badge ─────────────────────────────── */
function StatusBadge({ ing }: { ing: Ingredient }) {
  if (ing.stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 whitespace-nowrap">
        <AlertTriangle size={10} /> Habis
      </span>
    );
  }
  if (ing.stock <= ing.min_stock) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 whitespace-nowrap">
        <AlertTriangle size={10} /> Kritis
      </span>
    );
  }
  if (ing.stock <= ing.min_stock * 1.5) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 whitespace-nowrap">
        <Clock size={10} /> Akan Habis
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 whitespace-nowrap">
      <CheckCircle2 size={10} /> Aman
    </span>
  );
}

/* ── Category Badge ───────────────────────────── */
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
    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold whitespace-nowrap ${colors}`}>
      {cat}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */
export default function IngredientTable({
  ingredients,
  selectedId,
  onSelect,
  filteredCount,
}: Props) {
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
    <div className="flex-1 bg-pp-surface border border-pp-border rounded-pp-lg overflow-hidden flex flex-col">
      {/* Wrapper with horizontal scroll — overflow-x-auto lives HERE */}
      <div className="overflow-x-auto flex-1">
        <table className="w-full min-w-[900px] border-collapse">
          {/* ── HEADER ────────────────────────── */}
          <thead>
            <tr className="sticky top-0 z-10 bg-pp-surface border-b border-pp-border-light">
              <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider w-10">#</th>
              <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider min-w-[180px]">Nama</th>
              <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider w-[85px]">Kategori</th>
              <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider w-[120px]">Stok</th>
              <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider w-[80px]">Min. Stok</th>
              <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider w-[110px]">Harga/BU</th>
              <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider w-[120px]">Nilai Stok</th>
              <th className="text-center px-3 py-2.5 text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider w-[85px]">Status</th>
              <th className="text-right px-4 py-2.5 text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider w-[100px]">Update</th>
            </tr>
          </thead>

          {/* ── BODY ──────────────────────────── */}
          <tbody className="divide-y divide-pp-border-light">
            {ingredients.map((ing) => {
              const isSelected = ing.id === selectedId;
              const isCritical = ing.stock <= ing.min_stock;

              /* Stock display with base equivalent */
              const { display: stockDisplay, baseEquivalent } = formatStockWithBase(ing);
              const stockParts = stockDisplay.includes(' ') ? stockDisplay.split(' ') : [stockDisplay, ''];
              const stockNum = stockParts[0];
              const stockUnit = stockParts.slice(1).join(' ');

              /* Min stock in buy unit */
              const minStockBuy = ing.conversion_factor && ing.conversion_factor !== 1
                ? ing.min_stock / ing.conversion_factor
                : ing.min_stock;
              const minLabel = ing.buy_unit || ing.base_unit;
              const minStockDisplay = Number.isInteger(minStockBuy)
                ? minStockBuy.toString()
                : minStockBuy.toFixed(1);

              /* Price per buy unit */
              const buyPrice = ing.buy_unit && ing.conversion_factor && ing.conversion_factor !== 1
                ? pricePerBuyUnit(ing)
                : ing.unit_price;

              /* Total stock value */
              const totalVal = totalStockValue(ing);

              return (
                <tr
                  key={ing.id}
                  onClick={() => onSelect(ing.id)}
                  className={`cursor-pointer transition-colors hover:bg-pp-bg ${
                    isSelected
                      ? 'bg-pp-primary-soft border-l-2 border-l-pp-primary'
                      : 'border-l-2 border-l-transparent'
                  }`}
                >
                  {/* Thumbnail/Icon */}
                  <td className="px-3 py-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                      isCritical ? 'bg-red-50 text-red-500' : 'bg-pp-primary-soft text-pp-primary'
                    }`}>
                      <Package size={13} />
                    </div>
                  </td>

                  {/* Nama + Supplier (merged) */}
                  <td className="px-3 py-3">
                    <span className={`text-[13px] font-semibold truncate block ${
                      isSelected ? 'text-pp-primary' : 'text-pp-text'
                    }`}>
                      {ing.name}
                    </span>
                    {ing.supplier && (
                      <span className="text-[10px] text-pp-text-muted truncate block mt-0.5">
                        {ing.supplier}
                      </span>
                    )}
                  </td>

                  {/* Kategori */}
                  <td className="px-3 py-3">
                    <CategoryBadge category={ing.category} />
                  </td>

                  {/* Stok (format: 593 kaleng ≈ 88.950 gram) */}
                  <td className="px-3 py-3 text-right">
                    <div>
                      <span className={`text-[12px] font-semibold tabular-nums ${
                        isCritical ? 'text-red-600' : 'text-pp-text'
                      }`}>
                        {stockNum}
                      </span>
                      <span className="text-[11px] text-pp-text-muted font-normal ml-0.5">
                        {stockUnit}
                      </span>
                    </div>
                    {baseEquivalent && (
                      <div className="text-[10px] text-pp-text-muted mt-0.5">
                        {baseEquivalent}
                      </div>
                    )}
                  </td>

                  {/* Min. Stok */}
                  <td className="px-3 py-3 text-right">
                    <span className="text-[11px] text-pp-text-secondary tabular-nums">
                      {minStockDisplay} <span className="text-pp-text-muted font-normal">{minLabel}</span>
                    </span>
                  </td>

                  {/* Harga/buy_unit */}
                  <td className="px-3 py-3 text-right">
                    <span className="text-[11px] font-medium text-pp-text tabular-nums">
                      Rp {formatIDR(buyPrice)}
                    </span>
                  </td>

                  {/* Total Nilai Stok */}
                  <td className="px-3 py-3 text-right">
                    <span className="text-[11px] font-semibold text-pp-primary tabular-nums">
                      Rp {formatIDR(totalVal)}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-3 py-3">
                    <div className="flex justify-center">
                      <StatusBadge ing={ing} />
                    </div>
                  </td>

                  {/* Terakhir Update */}
                  <td className="px-4 py-3 text-right">
                    <span className="text-[10px] text-pp-text-muted whitespace-nowrap">
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
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Footer: row count ── */}
      <div className="px-4 py-2 border-t border-pp-border-light bg-pp-bg">
        <span className="text-[10px] text-pp-text-muted">
          Menampilkan {ingredients.length} dari {filteredCount} bahan
        </span>
      </div>
    </div>
  );
}
