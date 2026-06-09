import { BaseUnit } from '../../types';

export const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID').format(n);

export const formatStock = (amount: number, unit: BaseUnit) => {
  if (unit === 'gram' && amount >= 1000)
    return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
  if (unit === 'ml' && amount >= 1000)
    return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} L`;
  return `${amount} ${unit}`;
};

export const pricePerBulk = (unitPrice: number, unit: BaseUnit) =>
  unit === 'pcs' ? unitPrice : unitPrice * 1000;

export const bulkLabel = (unit: BaseUnit) =>
  unit === 'gram' ? 'kg' : unit === 'ml' ? 'Liter' : 'pcs';
