import React, { useState } from 'react';
import { Search, ChevronRight, LayoutGrid } from 'lucide-react';
import { RecipeWithDetails, Ingredient } from '../../../types';
import { getCategoryEmoji, FOOD_GRADIENTS, formatIDRShort, calculateCookableLimit } from '../utils/salesHelpers';

interface KasirMenuGridProps {
  recipes:       RecipeWithDetails[];
  ingredients:   Ingredient[];
  searchTerm:    string;
  onSearchChange:(v: string) => void;
  onAddItem:     (menuName: string) => void;
}

export default function KasirMenuGrid({
  recipes, ingredients, searchTerm, onSearchChange, onAddItem,
}: KasirMenuGridProps) {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [showAll, setShowAll]               = useState(false);

  const categories = ['Semua', ...Array.from(new Set(recipes.map(r => r.category ?? 'Lainnya')))];

  const filtered = recipes.filter(r => {
    const matchCat    = activeCategory === 'Semua' || r.category === activeCategory;
    const matchSearch = r.menu_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 8);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-50">
        <h2 className="text-[14px] font-bold text-slate-800">Kategori Menu</h2>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari menu…"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] w-44 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
          />
        </div>
      </div>

      {/* Category tabs */}
      <div className="flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto scrollbar-none border-b border-slate-50">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setShowAll(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition border ${
              activeCategory === cat
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {cat === 'Semua' ? <LayoutGrid size={12} /> : <span className="text-sm leading-none">{getCategoryEmoji(cat)}</span>}
            {cat}
          </button>
        ))}
        <button className="ml-auto text-slate-300 hover:text-slate-500 flex-shrink-0">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-3 p-4">
        {displayed.map((recipe, idx) => (
          <MenuCard
            key={recipe.menu_name}
            recipe={recipe}
            ingredients={ingredients}
            gradientIdx={idx}
            onAdd={onAddItem}
          />
        ))}
        {displayed.length === 0 && (
          <div className="col-span-4 py-12 text-center text-slate-400 text-[12px]">
            Tidak ada menu ditemukan
          </div>
        )}
      </div>

      {/* Show all / collapse */}
      {filtered.length > 8 && (
        <div className="border-t border-slate-100 py-3 text-center">
          <button
            onClick={() => setShowAll(v => !v)}
            className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-semibold text-[12px]"
          >
            <LayoutGrid size={13} />
            {showAll ? 'Sembunyikan' : `Lihat Semua Menu (${filtered.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── MenuCard ──────────────────────────────────────────────────────────────────
function MenuCard({
  recipe, ingredients, gradientIdx, onAdd,
}: {
  recipe:       RecipeWithDetails;
  ingredients:  Ingredient[];
  gradientIdx:  number;
  onAdd:        (name: string) => void;
}) {
  const [imgError, setImgError] = useState(false);
  const stock  = calculateCookableLimit(recipe, ingredients);
  const low    = stock > 0 && stock <= 5;
  const empty  = stock === 0;
  const emoji  = getCategoryEmoji(recipe.category ?? '');
  const image  = (recipe as any).image as string | undefined;

  return (
    <div className={`bg-white border rounded-xl overflow-hidden transition group hover:shadow-md ${
      empty ? 'opacity-50 cursor-not-allowed border-slate-100' : 'border-slate-100 hover:border-purple-200 cursor-pointer'
    }`}>
      {/* Thumbnail */}
      <div className="relative h-[76px] overflow-hidden">
        {!imgError && image ? (
          <img
            src={image}
            alt={recipe.menu_name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${FOOD_GRADIENTS[gradientIdx % FOOD_GRADIENTS.length]} flex items-center justify-center text-2xl`}>
            {emoji}
          </div>
        )}
        {low && !empty && (
          <span className="absolute top-1 right-1 text-[8px] bg-amber-400 text-white font-bold px-1.5 py-0.5 rounded-full">
            Stok {stock}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-2.5">
        <p className="text-[11px] font-bold text-slate-800 leading-tight truncate">{recipe.menu_name}</p>
        <p className="text-[9px] text-slate-400 mt-0.5 truncate">{recipe.category ?? 'Menu'}</p>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[11px] font-bold text-slate-700">
            Rp {formatIDRShort(recipe.price ?? 0)}
          </span>
          <button
            disabled={empty}
            onClick={() => !empty && onAdd(recipe.menu_name)}
            className="w-6 h-6 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-200 text-white rounded-md flex items-center justify-center transition"
          >
            <span className="text-[14px] leading-none font-bold">+</span>
          </button>
        </div>
      </div>
    </div>
  );
}
