import { useMemo } from 'react';
import { RecipeWithDetails } from '../../../types';

export function useRecipeState(recipes: RecipeWithDetails[]) {
  const existingCategories = useMemo(
    () => Array.from(new Set(recipes.map(r => r.category || 'Makanan'))),
    [recipes]
  );

  const recipeSummary = useMemo(() => ({
    totalRecipes: recipes.length,
    categories: existingCategories,
  }), [existingCategories, recipes.length]);

  return { existingCategories, recipeSummary };
}
