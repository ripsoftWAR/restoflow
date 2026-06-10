import React from 'react';
import { Plus } from 'lucide-react';
import { RecipeWithDetails, Ingredient } from '../../../../types';
import { calculateCookableLimit, getDishPrice, formatIDR, FOOD_GRADIENTS, getCategoryEmoji } from '../../../sales/utils/salesHelpers';

interface MenuGridProps {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  searchQuery: string;
  categoryTab: string;
  onAddToCart: (menuName: string) => void;
}

export default function MenuGrid({
  recipes, ingredients, searchQuery, categoryTab, onAddToCart,
}: MenuGridProps) {
  const filtered = recipes.filter(r => {
    const matchSearch = r.menu_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchSearch) return false;
    if (categoryTab === 'Semua') return true;
    return (r.category ?? 'Makanan').toLowerCase() === categoryTab.toLowerCase();
  });

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
      {filtered.map((recipe, idx) => {
        const limit = calculateCookableLimit(recipe, ingredients);
        const isOut = limit === 0;
        const price = getDishPrice(recipes, ingredients, recipe.menu_name);
        const cat = recipe.category ?? 'Makanan';
        const gradient = FOOD_GRADIENTS[idx % FOOD_GRADIENTS.length];

        return (
          <div
            key={recipe.menu_name}
            onClick={() => !isOut && onAddToCart(recipe.menu_name)}
            className={`bg-white border rounded-2xl overflow-hidden flex flex-col transition select-none
              ${isOut
                ? 'opacity-50 cursor-not-allowed border-slate-100'
                : 'border-slate-200 hover:border-purple-300 hover:shadow-md cursor-pointer group'}`}
          >
            <div className={`h-24 bg-gradient-to-br ${gradient} flex items-center justify-center text-3xl relative`}>
              {getCategoryEmoji(cat)}
              {isOut && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full">Habis</span>
                </div>
              )}
              {!isOut && limit < 5 && (
                <div className="absolute top-2 right-2 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  Sisa {limit}
                </div>
              )}
            </div>

            <div className="p-2.5 flex flex-col gap-1.5 flex-1">
              <span className={`self-start text-[9px] font-bold px-1.5 py-0.5 rounded-md
                ${cat === 'Minuman' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-700'}`}>
                {cat}
              </span>
              <p className="text-[11px] font-semibold text-slate-800 leading-tight line-clamp-2">{recipe.menu_name}</p>
              <p className="text-[11px] text-purple-600 font-bold font-mono">{formatIDR(price)}</p>

              <div className="flex items-center justify-between mt-auto pt-1.5 border-t border-slate-100">
                {!isOut ? (
                  <span className={`text-[9px] font-medium ${limit < 5 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {limit >= 5 ? `${limit} porsi` : `Sisa ${limit}`}
                  </span>
                ) : <span />}
                {!isOut && (
                  <button
                    onClick={e => { e.stopPropagation(); onAddToCart(recipe.menu_name); }}
                    className="w-6 h-6 rounded-full bg-purple-600 hover:bg-purple-700 text-white flex items-center justify-center transition group-hover:scale-110"
                  >
                    <Plus size={12} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="col-span-full py-12 text-center text-[11px] text-slate-400 italic">
          Tidak ada menu yang cocok.
        </div>
      )}
    </div>
  );
}
