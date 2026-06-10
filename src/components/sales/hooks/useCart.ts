import { useState, useEffect, useRef } from 'react';
import { RecipeWithDetails, Ingredient } from '../../../types';
import {
  CartItem, OptionSheetState, buildCartItemId, calcCartTotals,
} from '../utils/cartHelpers';
import {
  getDishPrice,
  validateVoucher,
  applyDiscount,
  VoucherResult,
} from '../utils/salesHelpers';

const INITIAL_OPTION_SHEET: OptionSheetState = {
  open: false,
  menuName: '',
  spice: 'Sedang',
  sugar: 'Less Sugar (70%)',
  customChoices: {},
  customFields: [],
};

export function useCart(
  recipes: RecipeWithDetails[],
  ingredients: Ingredient[],
  /** Pass runtime-generated vouchers from VoucherGenerator so they validate */
  generatedVouchers: Record<string, VoucherResult> = {},
) {
  const [cart, setCart]                     = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod]   = useState<'CASH' | 'QRIS' | 'Debit' | 'Kredit'>('CASH');
  const [cashPaidAmount, setCashPaidAmount] = useState('');
  const [paymentError, setPaymentError]     = useState<string | null>(null);
  const [optionSheet, setOptionSheet]       = useState<OptionSheetState>(INITIAL_OPTION_SHEET);

  // Voucher
  const [voucherCode, setVoucherCode]   = useState('');
  const [voucher, setVoucher]           = useState<VoucherResult | null>(null);
  const [voucherError, setVoucherError] = useState('');

  const cashInputRef = useRef<HTMLInputElement | null>(null);

  const totals      = calcCartTotals(cart);
  const discount    = voucher ? applyDiscount(totals.grandTotal, voucher) : 0;
  const finalTotal  = totals.grandTotal - discount;
  const cashPaid    = parseFloat(cashPaidAmount) || 0;
  const cashChange  = cashPaid >= finalTotal ? cashPaid - finalTotal : 0;
  const isCartEmpty = cart.length === 0;
  const cartCount   = cart.reduce((s, i) => s + i.qty, 0);

  // ── Voucher ────────────────────────────────────────────────────────────────
  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) return;

    const upper = voucherCode.trim().toUpperCase();
    const staticResult = validateVoucher(voucherCode);
    const result = staticResult.valid
      ? staticResult
      : (generatedVouchers[upper] ?? { valid: false, type: null, value: 0, label: 'Kode voucher tidak valid' });

    if (result.valid) {
      setVoucher(result);
      setVoucherError('');
    } else {
      setVoucher(null);
      setVoucherError('Kode voucher tidak valid');
    }
  };

  const removeVoucher = () => {
    setVoucher(null);
    setVoucherCode('');
    setVoucherError('');
  };

  // ── Payment validation ─────────────────────────────────────────────────────
  useEffect(() => {
    if (isCartEmpty) { setPaymentError(null); return; }
    if (paymentMethod === 'CASH') {
      if (!cashPaidAmount) {
        setPaymentError('Masukkan uang diterima terlebih dahulu');
      } else if (cashPaid < finalTotal) {
        setPaymentError(`Uang kurang Rp ${(finalTotal - cashPaid).toLocaleString('id-ID')}`);
      } else {
        setPaymentError(null);
      }
    } else {
      setPaymentError(null);
    }
  }, [paymentMethod, cashPaidAmount, finalTotal, isCartEmpty, cashPaid]);

  // ── Cart CRUD ──────────────────────────────────────────────────────────────
  const commitAddToCart = (
    menuName: string,
    spice: string,
    sugar: string,
    customChoices: Record<string, string>,
  ) => {
    const id    = buildCartItemId(menuName, spice, sugar, customChoices);
    // Resolve price at add-time from real recipe data
    const price = getDishPrice(recipes, ingredients, menuName);

    setCart(prev => {
      const idx = prev.findIndex(i => i.id === id);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx] = { ...copy[idx], qty: copy[idx].qty + 1 };
        return copy;
      }
      return [...prev, { id, menuName, qty: 1, price, selectedSpice: spice, selectedSugar: sugar, customChoices }];
    });
  };

  const openOptionSheet = (menuName: string) => {
  const recipe = recipes.find(r => r.menu_name === menuName);
  if (!recipe) return;

  const hasOptions =
    recipe.spice_level_option === 1 ||
    recipe.sugar_level_option === 1 ||
    !!recipe.custom_options;

  console.log('hasOptions:', hasOptions);

  if (!hasOptions) {
    commitAddToCart(menuName, '', '', {});
    return;
  }

  console.log('CHECKPOINT 1'); // ← tambah ini

  const initialCustom: Record<string, string> = {};
  const customFields: { name: string; choices: string[] }[] = [];

  console.log('CHECKPOINT 2'); // ← tambah ini

  if (recipe.custom_options) {
    console.log('CHECKPOINT 3 - masuk custom_options'); // ← tambah ini
    try {
      const parsed = typeof recipe.custom_options === 'string'
        ? JSON.parse(recipe.custom_options)
        : recipe.custom_options;

      console.log('CHECKPOINT 4 - parsed:', parsed); // ← tambah ini

      parsed.forEach((opt: { name: string; choices: string }) => {
        const choices = opt.choices.split(',').map((c: string) => c.trim()).filter(Boolean);
        initialCustom[opt.name] = choices[0] || '';
        customFields.push({ name: opt.name, choices });
      });
    } catch (e) {
      console.error('CHECKPOINT 3 ERROR:', e);
    }
  }

  console.log('CHECKPOINT 5 - sebelum setOptionSheet'); // ← tambah ini

  setOptionSheet({
    open: true,
    menuName,
    spice: 'Sedang',
    sugar: 'Less Sugar (70%)',
    customChoices: initialCustom,
    customFields,
  });
};
  const confirmOptionSheet = () => {
    
    commitAddToCart(
      optionSheet.menuName,
      optionSheet.spice,
      optionSheet.sugar,
      optionSheet.customChoices,
    );
    setOptionSheet(s => ({ ...s, open: false }));
  };

  const decrementQty = (id: string) =>
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });

  const incrementQty = (id: string) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));

  const removeItem = (id: string) =>
    setCart(prev => prev.filter(i => i.id !== id));

  const clearCart = () => setCart([]);

  return {
    cart, isCartEmpty, cartCount,
    paymentMethod, setPaymentMethod,
    cashPaidAmount, setCashPaidAmount, cashInputRef,
    paymentError,
    optionSheet, setOptionSheet,
    openOptionSheet, confirmOptionSheet,
    decrementQty, incrementQty, removeItem, clearCart,
    totals, discount, finalTotal, cashPaid, cashChange,
    voucherCode, setVoucherCode, voucher, voucherError,
    handleApplyVoucher, removeVoucher,
  };
}