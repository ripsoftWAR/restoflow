// Dynamic Unit Estimated Costs for Financial Calculations (Rp per Base Unit)
export const ESTIMATED_UNIT_COSTS: Record<string, number> = {
  'cabai merah': 60,      // Rp 60/g => Rp 60,000/kg
  'bawang merah': 40,     // Rp 40/g => Rp 40,000/kg
  'wortel': 25,           // Rp 25/g => Rp 25,000/kg
  'minyak goreng': 18,    // Rp 18/ml => Rp 18,000/L
  'telur ayam': 2000,     // Rp 2,000/pcs
  'daging ayam': 75,      // Rp 75/g => Rp 75,000/kg
  'kerupuk aci': 25,      // Rp 25/g => Rp 25,000/kg
};

export function getIngredientEstimatedCost(ing: any): number {
  if (ing.unit_price && ing.unit_price > 0) {
    return ing.stock * ing.unit_price;
  }
  const norm = ing.name.toLowerCase();
  let costPerUnit = 30; // default Rp 30 per unit
  for (const [key, val] of Object.entries(ESTIMATED_UNIT_COSTS)) {
    if (norm.includes(key)) {
      costPerUnit = val;
      break;
    }
  }
  return ing.stock * costPerUnit;
}
