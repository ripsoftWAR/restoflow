import { useMemo } from 'react';
import { RecipeWithDetails, Sale } from '../../../types';

export function useSalesState(recipes: RecipeWithDetails[], sales: Sale[]) {
  const categories = useMemo(
    () => Array.from(new Set(recipes.map(r => r.category || 'Makanan'))),
    [recipes]
  );

  const summary = useMemo(() => ({
    totalSales: sales.length,
    totalRevenue: sales.reduce((sum, item) => sum + Number(item.total_price || 0), 0),
    categories,
  }), [categories, sales]);

  return { categories, summary };
}
