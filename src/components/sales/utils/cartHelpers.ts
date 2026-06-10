export interface CartItem {
  id: string;
  menuName: string;
  qty: number;
  price: number;
  selectedSpice: string;
  selectedSugar: string;
  customChoices: Record<string, string>;
}

export interface OptionSheetField {
  name: string;
  choices: string[];
}

export interface OptionSheetState {
  open: boolean;
  menuName: string;
  spice: string;
  sugar: string;
  customChoices: Record<string, string>;
  customFields: OptionSheetField[];
}

export const buildCartItemId = (
  menuName: string,
  spice: string,
  sugar: string,
  customChoices: Record<string, string>
): string => {
  const choiceHash = Object.entries(customChoices)
    .map(([k, v]) => `${k}:${v}`)
    .sort()
    .join('|');
  return `${menuName}-${spice || 'none'}-${sugar || 'none'}-${choiceHash || 'none'}`;
};

export const formatIDR = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);

export const calcCartTotals = (cart: CartItem[]) => {
  const subtotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const tax      = Math.round(subtotal * 0.1);
  const service  = 2000;
  return { subtotal, tax, service, grandTotal: subtotal + tax + service };
};