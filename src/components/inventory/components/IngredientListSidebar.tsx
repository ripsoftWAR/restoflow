import { useMemo } from 'react';
import { Search, Plus } from 'lucide-react';
import type { Ingredient } from '../../../types';
import { formatStockWithBase } from '../../../types';

/* ═══════════════════════════════════════════════════════════════
   IngredientListSidebar — compact ingredient list
   untuk kolom kiri (col-span-3, ~25% lebar)
   ═══════════════════════════════════════════════════════════════ */

/* ── Category icon & color mapping ── */
const CATEGORY_META: Record<string, { emoji: string; bg: string; color: string }> = {
  'Bahan Pokok': { emoji: '🌾', bg: 'bg-pp-primary-soft', color: 'text-pp-primary' },
  'Protein': { emoji: '🥩', bg: 'bg-pp-danger-soft', color: 'text-pp-danger' },
  'Sayuran': { emoji: '🥬', bg: 'bg-pp-success-soft', color: 'text-pp-success' },
  'Bumbu & Rempah': { emoji: '🌶️', bg: 'bg-pp-warning-soft', color: 'text-pp-warning' },
  'Minuman': { emoji: '🥤', bg: 'bg-pp-primary-soft', color: 'text-pp-primary' },
  'Kemasan': { emoji: '📦', bg: 'bg-[#EFF1F7]', color: 'text-pp-text-muted' },
  'Lainnya': { emoji: '📋', bg: 'bg-pp-bg', color: 'text-pp-text-muted' },
};

function getCategoryMeta(category?: string) {
  return CATEGORY_META[category || ''] || CATEGORY_META['Lainnya'];
}

interface Props {
  ingredients: Ingredient[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  search: string;
  onSearchChange: (s: string) => void;
  activeCategory: string;
  categories: string[];
  onCategoryChange: (cat: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
  onAdd: () => void;
  totalCount: number;
}

/* ── Status dot — indikator warna kecil ── */
function StatusDot({ ing }: { ing: Ingredient }) {
  if (ing.stock <= 0) return <span className="w-2 h-2 rounded-full bg-pp-danger flex-shrink-0" title="Habis" />;
  if (ing.stock <= ing.min_stock) return <span className="w-2 h-2 rounded-full bg-pp-warning flex-shrink-0" title="Kritis" />;
  if (ing.stock <= ing.min_stock * 1.5) return <span className="w-2 h-2 rounded-full bg-pp-info flex-shrink-0" title="Akan Habis" />;
  return <span className="w-2 h-2 rounded-full bg-pp-success flex-shrink-0" title="Aman" />;
}

export default function IngredientListSidebar({
  ingredients, selectedId, onSelect,
  search, onSearchChange,
  activeCategory, categories, onCategoryChange,
  statusFilter, onStatusFilterChange,
  onAdd, totalCount,
}: Props) {
  const filtered = useMemo(() => {
    return ingredients.filter(ing => {
      const matchSearch = ing.name.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'Semua Bahan'
        || (ing.category || 'Lainnya') === activeCategory;
      const matchStatus = statusFilter === 'Semua'
        || (statusFilter === 'Aman' && ing.stock > ing.min_stock * 1.5)
        || (statusFilter === 'Kritis' && ing.stock <= ing.min_stock);
      return matchSearch && matchCat && matchStatus;
    });
  }, [ingredients, search, activeCategory, statusFilter]);

  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg overflow-hidden flex flex-col h-full max-h-[calc(100vh-210px)]">
      {/* ── Search + Add ── */}
      <div className="p-3 border-b border-pp-border space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 min-w-0">
            <Search size={13} strokeWidth={1.8} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pp-text-placeholder" />
            <input
              type="text"
              placeholder="Cari bahan..."
              value={search}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-8 pr-2.5 py-[6px] bg-pp-bg border border-pp-border rounded-pp-md text-[12px] text-pp-text placeholder:text-pp-text-placeholder focus:outline-none focus:ring-2 focus:ring-pp-primary/20 focus:border-pp-primary transition"
            />
          </div>
          <button
            onClick={onAdd}
            className="flex items-center justify-center w-8 h-8 bg-pp-primary text-white rounded-pp-md hover:bg-pp-primary-hover transition flex-shrink-0 cursor-pointer"
            title="Tambah Bahan"
          >
            <Plus size={15} strokeWidth={2} />
          </button>
        </div>

        {/* ── Category chips ── */}
        <div className="flex items-center gap-1 overflow-x-auto pb-0.5 no-scrollbar">
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full transition-all cursor-pointer border whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-pp-primary text-white border-transparent shadow-sm'
                  : 'border-pp-border text-pp-text-muted hover:text-pp-text-secondary hover:border-pp-text-muted'
              }`}
            >
              {cat.replace('Semua Bahan', 'Semua')}
            </button>
          ))}
        </div>

        {/* ── Status filter + count ── */}
        <div className="flex items-center justify-between">
          <select
            value={statusFilter}
            onChange={e => onStatusFilterChange(e.target.value)}
            className="px-2 py-1 bg-pp-bg border border-pp-border rounded-pp-xs text-[11px] text-pp-text-muted focus:outline-none focus:ring-1 focus:ring-pp-primary/20 cursor-pointer"
          >
            <option value="Semua">Semua Status</option>
            <option value="Aman">Stok Aman</option>
            <option value="Kritis">Stok Kritis</option>
          </select>
          <span className="text-[10px] text-pp-text-muted tabular-nums">
            {filtered.length}/{totalCount}
          </span>
        </div>
      </div>

      {/* ── List ── */}
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 px-4 text-center">
            <div className="w-10 h-10 rounded-pp-sm bg-pp-bg flex items-center justify-center mb-3 text-lg">
              📋
            </div>
            <p className="text-[11px] font-medium text-pp-text-muted">Tidak ada bahan</p>
            <p className="text-[10px] text-pp-text-placeholder mt-0.5">Coba ubah filter atau tambah baru</p>
          </div>
        ) : (
          filtered.map(ing => {
            const isSelected = ing.id === selectedId;
            const isCritical = ing.stock <= ing.min_stock;
            const meta = getCategoryMeta(ing.category);
            const { display: stockDisplay } = formatStockWithBase(ing);
            const stockParts = stockDisplay.includes(' ')
              ? stockDisplay.split(' ')
              : [stockDisplay, ''];
            const stockNum = stockParts[0];
            const stockUnit = stockParts.slice(1).join(' ');

            return (
              <button
                key={ing.id}
                onClick={() => onSelect(ing.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left border-l-[3px] transition-all duration-100 cursor-pointer ${
                  isSelected
                    ? 'bg-pp-primary-soft border-l-pp-primary'
                    : 'border-l-transparent hover:bg-pp-bg'
                }`}
              >
                {/* Emoji icon */}
                <div className={`w-7 h-7 rounded-pp-sm flex items-center justify-center flex-shrink-0 text-[15px] ${meta.bg}`}>
                  {meta.emoji}
                </div>

                {/* Name + stock */}
                <div className="flex-1 min-w-0">
                  <p className={`text-[12px] font-semibold truncate leading-tight ${
                    isSelected ? 'text-pp-primary' : 'text-pp-text'
                  }`}>
                    {ing.name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[10px] font-medium tabular-nums ${
                      isCritical ? 'text-pp-danger' : 'text-pp-text-secondary'
                    }`}>
                      {stockNum}
                    </span>
                    <span className="text-[10px] text-pp-text-muted">
                      {stockUnit}
                    </span>
                  </div>
                </div>

                {/* Status dot */}
                <StatusDot ing={ing} />

                {/* Chevron */}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-pp-text-placeholder flex-shrink-0">
                  <path d="M9 6l6 6-6 6"/>
                </svg>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
