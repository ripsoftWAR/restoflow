import { RecipeWithDetails, Ingredient } from '../../../types';

export const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', minimumFractionDigits: 0,
  }).format(n);

export const formatIDRShort = (n: number) =>
  new Intl.NumberFormat('id-ID').format(n);

const normalizeName = (value: string) => value.toLowerCase().trim().replace(/\s+/g, ' ');

export const getDishPrice = (
  recipes: RecipeWithDetails[],
  ingredients: Ingredient[],
  name: string,
): number => {
  const recipe = recipes.find(r => normalizeName(r.menu_name) === normalizeName(name));

  // Priority 1: explicit price from DB
  if (recipe) {
    const raw = recipe.price ?? 0;
    const parsed = typeof raw === 'string' ? parseFloat(raw) : Number(raw);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }

  // Priority 2: HPP × 1.5 from recipe items + ingredient unit_price
  // unit_price disimpan per BUY unit (kg/liter/botol), bukan per base unit (gram/ml).
  // Konversi: (unit_price / conversion_factor) × item.amount
  if (recipe?.items?.length) {
    const hpp = recipe.items.reduce((sum, item) => {
      const ingredient = ingredients.find(i => i.id === item.ingredient_id);
      const conversion = (ingredient?.conversion_factor && ingredient.conversion_factor > 0)
        ? ingredient.conversion_factor
        : 1;
      return sum + (item.amount || 0) * ((ingredient?.unit_price || 0) / conversion);
    }, 0);
    if (hpp > 0) return Math.max(1000, Math.round(hpp * 1.5));
  }

  // Fallback: 0 — never hardcode a number here
  return 0;
};

export const getIngredientStock = (ingredients: Ingredient[], id: number): number =>
  ingredients.find(i => i.id === id)?.stock ?? 0;

export const calculateCookableLimit = (
  recipe: RecipeWithDetails,
  ingredients: Ingredient[]
): number => {
  let limit = Infinity;
  recipe.items.forEach(item => {
    if (item.amount <= 0) return;
    const possible = Math.floor(getIngredientStock(ingredients, item.ingredient_id) / item.amount);
    if (possible < limit) limit = possible;
  });
  return limit === Infinity ? 0 : Math.max(0, limit);
};

export const getCategoryEmoji = (cat: string) => {
  const map: Record<string, string> = {
    Minuman: '🥤', Kopi: '☕', Dessert: '🍮', Camilan: '🍟', Paket: '📦',
  };
  return map[cat] || '🍽️';
};

export const FOOD_GRADIENTS = [
  'from-orange-300 to-red-400',
  'from-yellow-300 to-orange-400',
  'from-teal-300 to-cyan-400',
  'from-purple-300 to-pink-400',
  'from-green-300 to-teal-400',
  'from-blue-300 to-indigo-400',
  'from-red-300 to-orange-400',
  'from-pink-300 to-rose-400',
];

// ─── Voucher ─────────────────────────────────────────────────────────────────

export interface VoucherResult {
  valid: boolean;
  type: 'percent' | 'flat' | null;
  value: number;
  label: string;
  id?: string;
}

// Static built-in vouchers
const STATIC_VOUCHER_DB: Record<string, VoucherResult> = {
  RESTFLOW10: { valid: true, type: 'percent', value: 10, label: '10% Diskon' },
  HEMAT20: { valid: true, type: 'percent', value: 20, label: '20% Diskon' },
  FLAT5K: { valid: true, type: 'flat', value: 5000, label: 'Diskon Rp 5.000' },
  FLAT10K: { valid: true, type: 'flat', value: 10000, label: 'Diskon Rp 10.000' },
  SAVE10: { valid: true, type: 'percent', value: 10, label: '10% Diskon' },
};

/** Validates against static DB only — kept for backward compat */
export const validateVoucher = (token: string): VoucherResult => {
  const upper = token.trim().toUpperCase();
  return STATIC_VOUCHER_DB[upper] ?? { valid: false, type: null, value: 0, label: 'Kode tidak valid' };
};

/**
 * Validates against both static DB and runtime-generated vouchers.
 * Pass `generatedVouchers` from VoucherGenerator state.
 */
export const validateVoucherWithGenerated = (
  token: string,
  generatedVouchers: Record<string, VoucherResult>,
): VoucherResult => {
  const upper = token.trim().toUpperCase();
  return (
    STATIC_VOUCHER_DB[upper] ??
    generatedVouchers[upper] ??
    { valid: false, type: null, value: 0, label: 'Kode tidak valid' }
  );
};

export const applyDiscount = (total: number, voucher: VoucherResult): number => {
  if (!voucher.valid) return 0;
  if (voucher.type === 'percent') return Math.round(total * voucher.value / 100);
  return Math.min(voucher.value, total);
};

/** Generate a unique-enough voucher code */
export const generateVoucherCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'RF';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};