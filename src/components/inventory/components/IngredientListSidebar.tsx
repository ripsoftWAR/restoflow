import { useMemo, useState, useEffect, useRef } from 'react';
import { SlidersHorizontal } from 'lucide-react';
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
  activeCategory: string;
  categories: string[];
  onCategoryChange: (cat: string) => void;
  statusFilter: string;
  onStatusFilterChange: (s: string) => void;
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
  search,
  activeCategory, categories, onCategoryChange,
  statusFilter, onStatusFilterChange,
  totalCount,
}: Props) {
  /* ── Filter popover state + click-outside ── */
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    if (filterOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [filterOpen]);

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
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg overflow-hidden flex flex-col max-h-[calc(100vh-130px)]">
      {/* ── Header: Category tabs row ── */}
      <div className="px-3 pt-3 border-b border-pp-border">
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
          {categories.slice(0, 6).map(cat => (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`text-[11px] font-medium pb-[7px] border-b-[2px] transition-colors cursor-pointer whitespace-nowrap ${
                activeCategory === cat
                  ? 'text-pp-primary font-semibold border-pp-primary'
                  : 'text-pp-text-muted border-transparent hover:text-pp-text-secondary'
              }`}
            >
              {cat.replace('Semua Bahan', 'Semua')}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sub-header: Filter icon + count ── */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="relative" ref={filterRef}>
          <button
            onClick={() => setFilterOpen(prev => !prev)}
            className={`w-[26px] h-[26px] flex items-center justify-center rounded-pp-sm transition cursor-pointer ${
              statusFilter !== 'Semua'
                ? 'text-pp-primary bg-pp-primary-soft'
                : 'text-pp-text-muted hover:text-pp-text-secondary hover:bg-pp-bg'
            }`}
            title={`Filter: ${statusFilter}`}
          >
            <SlidersHorizontal size={13} strokeWidth={1.8} />
          </button>

          {/* Filter popover */}
          {filterOpen && (
            <div className="absolute top-full left-0 mt-1 bg-pp-surface border border-pp-border rounded-pp-md shadow-md py-1 z-50 min-w-[120px]">
              {['Semua', 'Aman', 'Kritis'].map(opt => (
                <button
                  key={opt}
                  onClick={() => { onStatusFilterChange(opt); setFilterOpen(false); }}
                  className={`w-full text-left px-3 py-[6px] text-[11px] transition cursor-pointer ${
                    statusFilter === opt
                      ? 'text-pp-primary font-semibold bg-pp-primary-soft'
                      : 'text-pp-text-secondary hover:bg-pp-bg'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
          )}
        </div>

        <span className="text-[10px] text-pp-text-muted tabular-nums">
          {filtered.length}/{totalCount}
        </span>
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
                  <p className={`text-base font-semibold truncate leading-tight ${
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
