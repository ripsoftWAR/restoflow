import React from 'react';
import { Edit2, Package, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { Ingredient, RecipeWithDetails, RecipeItem } from '../../../types';
import {
  calculateHPP, calculateMarginPct, calculateCookablePortions,
  formatIDR, getCategoryEmoji, FOOD_GRADIENTS, getIngredientStock,
} from '../utils/recipeHelpers';

interface RecipeCardProps {
  recipe: RecipeWithDetails;
  ingredients: Ingredient[];
  index: number;
  onEdit: (recipe: RecipeWithDetails) => void;
}

export default function RecipeCard({ recipe, ingredients, index, onEdit }: RecipeCardProps) {
  const hpp = calculateHPP(recipe, ingredients);
  const portions = calculateCookablePortions(recipe, ingredients);
  const marginPct = calculateMarginPct(hpp, recipe.price ?? 0);
  const isDryStock = portions === 0;
  const gradient = FOOD_GRADIENTS[index % FOOD_GRADIENTS.length];

  // parse custom options safely
  let customOptions: { name: string; choices: string }[] = [];
  try {
    if (recipe.custom_options) customOptions = JSON.parse(recipe.custom_options);
  } catch {}

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">

      {/* Card header — food thumbnail placeholder + name */}
      <div className={`h-16 bg-gradient-to-br ${gradient} flex items-center px-4 gap-3 relative`}>
        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl flex-shrink-0">
          {getCategoryEmoji(recipe.category || 'Makanan')}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-white truncate leading-none">{recipe.menu_name}</h3>
          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
            <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full font-semibold">
              {recipe.category || 'Makanan'}
            </span>
            {recipe.spice_level_option === 1 && (
              <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full">🔥 Pedas</span>
            )}
            {recipe.sugar_level_option === 1 && (
              <span className="text-[9px] bg-white/20 text-white px-2 py-0.5 rounded-full">🍬 Gula</span>
            )}
          </div>
        </div>
        {/* Status badge */}
        <div className={`flex-shrink-0 flex items-center gap-1 text-[9px] font-bold px-2 py-1 rounded-lg
          ${isDryStock ? 'bg-red-500/90 text-white' : 'bg-white/20 text-white'}`}>
          {isDryStock
            ? <><AlertCircle size={10} /> Bahan Habis</>
            : <><CheckCircle size={10} /> {portions} Porsi</>
          }
        </div>
      </div>

      {/* HPP + Harga Jual row */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">HPP</p>
          <p className="text-[13px] font-bold text-slate-700 font-mono leading-tight">
            Rp {formatIDR(Math.round(hpp))}
          </p>
        </div>
        <div className="px-3 py-2.5">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Harga Jual</p>
          <p className="text-[13px] font-bold text-blue-600 font-mono leading-tight">
            {recipe.price ? `Rp ${formatIDR(recipe.price)}` : '—'}
          </p>
        </div>
      </div>

      {/* Margin + Status */}
      <div className="grid grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
        <div className="px-3 py-2">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Margin Keuntungan</p>
          <p className={`text-[12px] font-extrabold leading-tight mt-0.5
            ${marginPct >= 50 ? 'text-green-600' : marginPct >= 30 ? 'text-amber-500' : 'text-red-500'}`}>
            {marginPct}% Profit Margin
          </p>
        </div>
        <div className="px-3 py-2">
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide">Status Stok</p>
          <span className={`inline-block mt-0.5 text-[10px] font-bold px-2 py-0.5 rounded-md
            ${isDryStock
              ? 'bg-red-100 text-red-600'
              : portions <= 3
                ? 'bg-amber-100 text-amber-600'
                : 'bg-green-100 text-green-700'}`}>
            {isDryStock ? 'Bahan Habis' : portions <= 3 ? 'Hampir Habis' : 'Tersedia'}
          </span>
        </div>
      </div>

      {/* Ingredients list — compact */}
      <div className="flex-1 px-3 py-2.5 overflow-hidden">
        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
          Bahan ({recipe.items.length} material)
        </p>
        <div className="space-y-1 max-h-20 overflow-y-auto">
          {recipe.items.map((item: RecipeItem) => {
            const stock = getIngredientStock(ingredients, item.ingredient_id);
            const isShort = stock < item.amount;
            return (
              <div key={item.id} className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 truncate flex-1">{item.ingredient_name}</span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <span className="text-[10px] font-mono font-semibold text-slate-700">
                    {item.amount} {item.base_unit}
                  </span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold
                    ${isShort ? 'bg-red-50 text-red-500' : 'bg-slate-100 text-slate-400'}`}>
                    {isShort ? 'Short' : 'Ok'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Action button */}
      <div className="px-3 py-2.5 border-t border-slate-100">
        <button
          id={`btn-edit-recipe-${recipe.menu_name.replace(/\s+/g, '-')}`}
          onClick={() => onEdit(recipe)}
          className="w-full py-2 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-200 transition-all flex items-center justify-center gap-1.5"
        >
          <Edit2 size={12} /> Aksi
        </button>
      </div>
    </div>
  );
}
