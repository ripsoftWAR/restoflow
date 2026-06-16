// -------------------------------------------------------------
// Unit Conversion Helpers
// -------------------------------------------------------------

export const CONVERSIONS: Record<string, { factor: number; base_unit: 'gram' | 'ml' | 'pcs' }> = {
  'kg': { factor: 1000, base_unit: 'gram' },
  'kilogram': { factor: 1000, base_unit: 'gram' },
  'gr': { factor: 1, base_unit: 'gram' },
  'g': { factor: 1, base_unit: 'gram' },
  'gram': { factor: 1, base_unit: 'gram' },
  'liter': { factor: 1000, base_unit: 'ml' },
  'l': { factor: 1000, base_unit: 'ml' },
  'ml': { factor: 1, base_unit: 'ml' },
  'mililiter': { factor: 1, base_unit: 'ml' },
  'pcs': { factor: 1, base_unit: 'pcs' },
  'pc': { factor: 1, base_unit: 'pcs' },
  'butir': { factor: 1, base_unit: 'pcs' },
  'buah': { factor: 1, base_unit: 'pcs' },
  'pack': { factor: 1, base_unit: 'pcs' },
  'bungkus': { factor: 1, base_unit: 'pcs' },
  'bks': { factor: 1, base_unit: 'pcs' },
  'kaleng': { factor: 1, base_unit: 'pcs' },
  'can': { factor: 1, base_unit: 'pcs' }
};

export function convertToBaseUnit(amount: number, unit: string): { amount: number; baseUnit: 'gram' | 'ml' | 'pcs' } {
  const norm = unit.toLowerCase().trim();
  const rule = CONVERSIONS[norm];
  if (rule) {
    return { amount: amount * rule.factor, baseUnit: rule.base_unit };
  }
  // Try default fallback
  return { amount, baseUnit: 'gram' };
}

export function convertBuyUnitToBase(amount: number, buyUnit: string, conversionFactor: number): { amount: number; baseUnit: 'gram' | 'ml' | 'pcs' } {
  const norm = buyUnit.toLowerCase().trim();
  const rule = CONVERSIONS[norm];
  if (rule) {
    return { amount: amount * rule.factor * conversionFactor, baseUnit: rule.base_unit };
  }
  // Default fallback
  return { amount: amount * conversionFactor, baseUnit: 'gram' };
}

export function convertToUnit(amount: number, unitStr: string, baseUnit: string): number {
  const normUnit = unitStr.toLowerCase().trim();
  const normBase = baseUnit.toLowerCase().trim();

  if (normUnit === normBase) return amount;

  if (normBase === 'gram') {
    if (normUnit === 'kg' || normUnit === 'kilogram') return amount * 1000;
    if (normUnit === 'gr' || normUnit === 'g') return amount;
  }

  if (normBase === 'ml') {
    if (normUnit === 'l' || normUnit === 'liter') return amount * 1000;
  }

  return amount;
}

// Fuzzy map scanned receipt names to existing Master Ingredients
export function findMappedIngredient(rawName: string, ingredients: { id: number; name: string }[]) {
  const lowerRaw = rawName.toLowerCase();

  // 1. Try exact match
  let matched = ingredients.find(i => i.name.toLowerCase() === lowerRaw);
  if (matched) return matched.id;

  // 2. Try partial matching
  matched = ingredients.find(i => lowerRaw.includes(i.name.toLowerCase()) || i.name.toLowerCase().includes(lowerRaw));
  if (matched) return matched.id;

  // 3. Try token-based matching (split raw receipt entry by space)
  const tokens = lowerRaw.split(/\s+/).filter(t => t.length > 2);
  for (const token of tokens) {
    matched = ingredients.find(i => i.name.toLowerCase().includes(token));
    if (matched) return matched.id;
  }

  return null;
}
