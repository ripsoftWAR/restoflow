import { BaseUnit } from '../../../types';

export const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID').format(Math.round(n));

export const formatStock = (amount: number, unit: BaseUnit) => {
  if (unit === 'gram' && amount >= 1000)
    return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
  if (unit === 'ml' && amount >= 1000)
    return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} L`;
  return `${amount} ${unit}`;
};

/** Format angka stok mentah (tetap dalam base unit, tanpa konversi ke kg/L) */
export const formatStockRaw = (amount: number) =>
  new Intl.NumberFormat('id-ID').format(amount);

export const unitLabel = (unit: BaseUnit) =>
  unit === 'gram' ? 'gram' : unit === 'ml' ? 'ml' : 'pcs';

/** Label satuan bulk: gram → kg, ml → Liter */
export const bulkLabel = (unit: BaseUnit) =>
  unit === 'gram' ? 'kg' : unit === 'ml' ? 'Liter' : 'pcs';

/** Konversi harga per base_unit → per bulk (×1000 untuk gram→kg, ml→L) */
export const pricePerBulk = (unitPrice: number, unit: BaseUnit) =>
  unit === 'pcs' ? unitPrice : unitPrice * 1000;

/** Format harga per buy_unit: "Rp 35.000/kg" — unitPrice sudah per buy_unit */
export const formatPricePerUnit = (unitPrice: number, buyUnit?: string) =>
  `Rp ${formatIDR(unitPrice)}/${buyUnit || 'unit'}`;

/** Format harga per base unit: "Rp 35/gram" — referensi satuan kecil */
export const formatPricePerBulk = (unitPrice: number, baseUnit: BaseUnit, cf: number) => {
  if (baseUnit === 'pcs' || cf === 1 || cf === 0) return '—';
  const perBase = unitPrice / cf;
  return `Rp ${formatIDR(perBase)}/${unitLabel(baseUnit)}`;
};