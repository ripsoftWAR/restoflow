import React, { useState } from 'react';
import { Search, ChevronRight, LayoutGrid, Plus } from 'lucide-react';
import { RecipeWithDetails, Ingredient } from '../../../types'; // Sesuaikan path types
import { 
  getCategoryEmoji, 
  FOOD_GRADIENTS, 
  formatIDRShort, 
  calculateCookableLimit 
} from '../utils/salesHelpers';

interface KasirMenuGridProps {
  recipes:       RecipeWithDetails[];
  ingredients:   Ingredient[];
  searchTerm:    string;
  onSearchChange:(v: string) => void;
  onAddItem:     (menu: RecipeWithDetails) => void; // Mengirim objek recipe lengkap lebih baik untuk logic cart
}

export default function KasirMenuGrid({
  recipes, 
  ingredients, 
  searchTerm, 
  onSearchChange, 
  onAddItem,
}: KasirMenuGridProps) {
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [showAll, setShowAll]               = useState(false);

  // Ambil kategori unik dari recipes
  const categories = ['Semua', ...Array.from(new Set(recipes.map(r => r.category ?? 'Lainnya')))];

  // Filter berdasarkan Kategori DAN Search
  const filtered = recipes.filter(r => {
    const matchCat    = activeCategory === 'Semua' || r.category === activeCategory;
    const matchSearch = r.menu_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  const displayed = showAll ? filtered : filtered.slice(0, 8);

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {/* Header & Search */}
      <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-50">
        <h2 className="text-[14px] font-bold text-slate-800">Menu Restoran</h2>
        <div className="relative">
          <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-[11px] w-44 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400 transition-all"
          />
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-1.5 px-5 py-2.5 overflow-x-auto scrollbar-none border-b border-slate-50">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => { setActiveCategory(cat); setShowAll(false); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition border ${
              activeCategory === cat
                ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-100'
                : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
            }`}
          >
            {cat === 'Semua' ? <LayoutGrid size={12} /> : <span className="text-sm leading-none">{getCategoryEmoji(cat)}</span>}
            {cat}
          </button>
        ))}
        <button className="ml-auto text-slate-300 hover:text-slate-500 flex-shrink-0 transition">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Grid Menu */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 p-4">
        {displayed.map((recipe, idx) => (
          <MenuCard
            key={`${recipe.menu_name}-${idx}`}
            recipe={recipe}
            ingredients={ingredients}
            gradientIdx={idx}
            onAdd={() => onAddItem(recipe)}
          />
        ))}
        
        {displayed.length === 0 && (
          <div className="col-span-full py-16 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-slate-400 text-[12px]">Menu tidak ditemukan</p>
          </div>
        )}
      </div>

      {/* Show More Button */}
      {filtered.length > 8 && (
        <div className="border-t border-slate-100 py-3 text-center bg-slate-50/50">
          <button
            onClick={() => setShowAll(v => !v)}
            className="inline-flex items-center gap-1.5 text-purple-600 hover:text-purple-700 font-bold text-[12px] transition"
          >
            <LayoutGrid size={13} />
            {showAll ? 'Sembunyikan Menu' : `Lihat Semua Menu (${filtered.length})`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Sub-Component: MenuCard ───────────────────────────────────────────────────
function MenuCard({
  recipe, ingredients, gradientIdx, onAdd,
}: {
  recipe:       RecipeWithDetails;
  ingredients:  Ingredient[];
  gradientIdx:  number;
  onAdd:        () => void;
}) {
  const [imgError, setImgError] = useState(false);
  
  // Hitung stok berdasarkan ketersediaan bahan di inventory
  const stock  = calculateCookableLimit(recipe, ingredients);
  const low    = stock > 0 && stock <= 5;
  const empty  = stock === 0;
  
  const emoji  = getCategoryEmoji(recipe.category ?? '');
  const image  = (recipe as any).image;

  return (
    <div 
      onClick={() => !empty && onAdd()}
      className={`relative bg-white border rounded-2xl overflow-hidden transition-all duration-200 group flex flex-col h-full ${
        empty 
          ? 'opacity-60 cursor-not-allowed border-slate-100 grayscale-[0.5]' 
          : 'border-slate-100 hover:border-purple-300 cursor-pointer hover:shadow-lg hover:shadow-purple-50'
      }`}
    >
      {/* Gambar / Placeholder Gradient */}
      <div className="relative h-24 sm:h-28 overflow-hidden">
        {!imgError && image ? (
          <img
            src={image}
            alt={recipe.menu_name}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${FOOD_GRADIENTS[gradientIdx % FOOD_GRADIENTS.length]} flex items-center justify-center text-3xl`}>
            {emoji}
          </div>
        )}

        {/* Badge Stok */}
        {empty ? (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider">Habis</span>
          </div>
        ) : low ? (
          <span className="absolute top-2 right-2 text-[9px] bg-orange-500 text-white font-black px-2 py-0.5 rounded-full shadow-sm">
            Sisa {stock}
          </span>
        ) : null}
      </div>

      {/* Informasi Produk */}
      <div className="p-3 flex flex-col flex-1">
        <div className="flex-1">
          <p className="text-[12px] font-bold text-slate-800 leading-tight line-clamp-2">{recipe.menu_name}</p>
          <p className="text-[10px] text-slate-400 mt-1 font-medium italic">{recipe.category ?? 'Menu'}</p>
        </div>
        
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
          <span className="text-[12px] font-black text-purple-600">
            {formatIDRShort(recipe.price ?? 0)}
          </span>
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
            empty ? 'bg-slate-100 text-slate-400' : 'bg-purple-600 text-white group-hover:bg-purple-700 shadow-sm shadow-purple-200'
          }`}>
            <Plus size={16} strokeWidth={3} />
          </div>
        </div>
      </div>
    </div>
  );
}