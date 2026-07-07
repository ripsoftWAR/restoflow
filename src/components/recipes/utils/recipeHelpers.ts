import { Ingredient, RecipeWithDetails } from '../../../types';

export const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID').format(n);

export const formatUnitVal = (amount: number, unit: string) => {
  if (unit === 'gram' && amount >= 1000)
    return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
  if (unit === 'ml' && amount >= 1000)
    return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')} L`;
  return `${amount} ${unit}`;
};

export const getIngredientById = (ingredients: Ingredient[], id: number) =>
  ingredients.find(i => i.id === id);

export const getIngredientUnit = (ingredients: Ingredient[], id: number): string =>
  getIngredientById(ingredients, id)?.base_unit || 'gram';

export const getIngredientStock = (ingredients: Ingredient[], id: number): number =>
  getIngredientById(ingredients, id)?.stock || 0;

export const calculateCookablePortions = (
  recipe: RecipeWithDetails,
  ingredients: Ingredient[]
): number => {
  let minPortions = Infinity;
  recipe.items.forEach(item => {
    const stock = getIngredientStock(ingredients, item.ingredient_id);
    if (item.amount <= 0) return;
    const portions = Math.floor(stock / item.amount);
    if (portions < minPortions) minPortions = portions;
  });
  return minPortions === Infinity ? 0 : Math.max(0, minPortions);
};

export const calculateHPP = (
  recipe: RecipeWithDetails,
  ingredients: Ingredient[]
): number => {
  return recipe.items.reduce((total, item) => {
    const ing = getIngredientById(ingredients, item.ingredient_id);
    if (!ing) return total;
    // Konversi: unit_price per BUY unit → harga per BASE unit
    const conversion = (ing.conversion_factor && ing.conversion_factor > 0)
      ? ing.conversion_factor
      : 1;
    return total + item.amount * ((ing.unit_price || 0) / conversion);
  }, 0);
};

export const calculateMarginPct = (hpp: number, price: number): number => {
  if (!price || price <= 0) return 0;
  return Math.round(((price - hpp) / price) * 100);
};

export const getCategoryEmoji = (cat: string) => {
  const map: Record<string, string> = {
    Minuman: '🥤', Kopi: '☕', Dessert: '🍮', Camilan: '🍟',
  };
  return map[cat] || '🍽️';
};

export const FOOD_GRADIENTS = [
  'from-orange-400 to-rose-400',
  'from-yellow-400 to-orange-400',
  'from-teal-400 to-cyan-400',
  'from-purple-400 to-pink-400',
  'from-green-400 to-teal-400',
  'from-blue-400 to-indigo-400',
  'from-red-400 to-orange-400',
  'from-pink-400 to-rose-400',
];
