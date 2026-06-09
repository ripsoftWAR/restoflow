import React from 'react';
import OriginalRecipeSystem from '../RecipeSystem';
import { Ingredient, RecipeWithDetails } from '../../types';
import { useRecipeState } from './hooks/useRecipeState';

interface RecipeSystemProps {
  ingredients: Ingredient[];
  recipes: RecipeWithDetails[];
  onAddOrUpdateRecipe: (
    menuName: string,
    items: { ingredient_id: number; amount: number }[],
    category?: string,
    spice_level_option?: boolean,
    sugar_level_option?: boolean,
    custom_options?: string,
    price?: number
  ) => Promise<void>;
}

export default function RecipeSystem(props: RecipeSystemProps) {
  const { recipeSummary } = useRecipeState(props.recipes);

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-[11px] uppercase tracking-[0.2em] text-slate-400">Feature module</p>
        <h2 className="text-base font-semibold text-slate-800">Recipes feature</h2>
        <p className="text-sm text-slate-500">
          {recipeSummary.totalRecipes} resep • {recipeSummary.categories.length} kategori aktif
        </p>
      </div>
      <OriginalRecipeSystem {...props} />
    </section>
  );
}
