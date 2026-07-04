import React from 'react';
import { FileText, TrendingUp, AlertTriangle, Brain } from 'lucide-react';
import { Ingredient, RecipeWithDetails } from '../../../types';
import { calculateHPP, calculateMarginPct, calculateCookablePortions, formatIDR } from '../utils/recipeHelpers';

interface RecipeStatsBarProps {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
}

export default function RecipeStatsBar({ recipes, ingredients }: RecipeStatsBarProps) {
  const totalMenu = recipes.length;

  const avgMargin = recipes.length > 0
    ? Math.round(
        recipes.reduce((sum, r) => {
          const hpp = calculateHPP(r, ingredients);
          return sum + calculateMarginPct(hpp, r.price ?? 0);
        }, 0) / recipes.length
      )
    : 0;

  const potensiRugi = recipes.filter(r => {
    const portions = calculateCookablePortions(r, ingredients);
    return portions === 0;
  }).length;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-4">
      {/* Total Menu */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-purple-600" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Total Menu</p>
          <p className="text-xl font-extrabold text-slate-800 leading-none mt-0.5">
            {totalMenu} <span className="text-sm font-semibold text-slate-500">Menu</span>
          </p>
        </div>
      </div>

      {/* Rata-rata Margin */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
          <TrendingUp size={18} className="text-green-600" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Rata-rata Margin</p>
          <p className="text-xl font-extrabold text-green-600 leading-none mt-0.5">
            {avgMargin}% <span className="text-[10px] font-semibold text-slate-400">Profit Margin</span>
          </p>
          <p className="text-[10px] text-green-500 font-medium mt-0.5">▲ 112% Profit bulan lalu</p>
        </div>
      </div>

      {/* Resep Potensi Rugi */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3 shadow-sm">
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={18} className="text-amber-500" />
        </div>
        <div>
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">Resep Potensi Rugi</p>
          <p className="text-xl font-extrabold text-amber-500 leading-none mt-0.5">
            {potensiRugi} <span className="text-sm font-semibold text-slate-500">Menu</span>
          </p>
          {potensiRugi > 0 && (
            <p className="text-[10px] text-amber-500 font-medium mt-0.5">⚠ Menu Butuh Penyesuaian</p>
          )}
        </div>
      </div>

      {/* AI Insight Banner */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-2xl p-4 flex items-center gap-3 relative overflow-hidden col-span-1">
        <div className="flex-1 z-10">
          <p className="text-[10px] font-bold text-purple-200 uppercase tracking-wide mb-1">AI PilotPOS</p>
          <p className="text-[11px] text-white/90 leading-relaxed line-clamp-3">
            "Harga Ayam Fillet naik 10% di nota terbaru. HPP Ayam Goreng Kari meningkat menjadi Rp 18.500."
          </p>
        </div>
        <Brain className="text-4xl absolute right-2 bottom-0 opacity-30 select-none" />
      </div>
    </div>
  );
}
