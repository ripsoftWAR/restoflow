import React, { useState, useRef, useEffect } from 'react';
import {
  ShoppingCart, CreditCard, RefreshCcw, Search, Flame,
  Droplets, ReceiptText, Printer, X, Plus, Minus,
  Trash2, CheckCircle2, UtensilsCrossed, Coffee, AlertCircle
} from 'lucide-react';
import { RecipeWithDetails, Ingredient, Sale } from '../types';

interface SalesSimulatorProps {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  sales: Sale[];
  // Updated to object-based parameter to be more scalable
  onTriggerSale: (saleData: {
    menu_name: string;
    quantity: number;
    total_price: number;
    selected_options?: string;
    payment_method: 'CASH' | 'QRIS';
    cash_paid: number | null;
    cash_change: number | null;
  }) => Promise<void>;
  onRefreshStats: () => void;
}

const DISH_PRICES: Record<string, number> = {
  'seblak komplit': 20000,
  'nasi goreng spesial': 30000,
  'sop ayam sehat': 25000,
};

interface CartItem {
  id: string;
  menuName: string;
  qty: number;
  price: number;
  selectedSpice: string;
  selectedSugar: string;
  customChoices?: Record<string, string>;
}

interface OptionSheetField {
  name: string;
  choices: string[];
}

interface OptionSheetState {
  open: boolean;
  menuName: string;
  spice: string;
  sugar: string;
  customChoices: Record<string, string>;
  customFields: OptionSheetField[];
}

export default function SalesSimulator({
  recipes,
  ingredients,
  sales,
  onTriggerSale,
  onRefreshStats,
}: SalesSimulatorProps) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [categoryTab, setCategoryTab] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QRIS'>('CASH');
  const [cashPaidAmount, setCashPaidAmount] = useState('');
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [lastReceipt, setLastReceipt] = useState<any | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [mobileView, setMobileView] = useState<'menu' | 'cart'>('menu');
  const [optionSheet, setOptionSheet] = useState<OptionSheetState>({
    open: false,
    menuName: '',
    spice: 'Sedang',
    sugar: 'Less Sugar (70%)',
    customChoices: {},
    customFields: [],
  });

  const cashInputRef = useRef<HTMLInputElement>(null);

  const getDishPrice = (name: string): number => {
    const recipe = recipes.find(r => r.menu_name.toLowerCase().trim() === name.toLowerCase().trim());
    if (recipe && typeof recipe.price === 'number') {
      return recipe.price;
    }
    return DISH_PRICES[name.toLowerCase().trim()] ?? 25000;
  };

  const getIngredientStock = (id: number): number =>
    ingredients.find(i => i.id === id)?.stock ?? 0;

  const calculateCookableLimit = (recipe: RecipeWithDetails): number => {
    let limit = Infinity;
    recipe.items.forEach(item => {
      if (item.amount <= 0) return;
      const possible = Math.floor(getIngredientStock(item.ingredient_id) / item.amount);
      if (possible < limit) limit = possible;
    });
    return limit === Infinity ? 0 : Math.max(0, limit);
  };

  const openOptionSheet = (menuName: string) => {
    const recipe = recipes.find(r => r.menu_name === menuName);
    if (!recipe) return;

    const hasOptions =
      recipe.spice_level_option === 1 ||
      recipe.sugar_level_option === 1 ||
      !!recipe.custom_options;

    if (!hasOptions) {
      commitAddToCart(menuName, '', '', {});
      return;
    }

    const initialCustom: Record<string, string> = {};
    const customFields: OptionSheetField[] = [];

    if (recipe.custom_options) {
      try {
        const parsed = JSON.parse(recipe.custom_options);
        parsed.forEach((opt: any) => {
          const choices = opt.choices.split(',').map((c: string) => c.trim()).filter(Boolean);
          if (choices.length > 0) {
            initialCustom[opt.name] = choices[0];
          } else {
            initialCustom[opt.name] = '';
          }
          customFields.push({ name: opt.name, choices });
        });
      } catch (_) {
        // ignore malformed option payload
      }
    }

    setOptionSheet({
      open: true,
      menuName,
      spice: 'Sedang',
      sugar: 'Less Sugar (70%)',
      customChoices: initialCustom,
      customFields,
    });
  };

  const commitAddToCart = (
    menuName: string,
    spice: string,
    sugar: string,
    customChoices: Record<string, string>
  ) => {
    const choiceHash = Object.entries(customChoices)
      .map(([k, v]) => `${k}:${v}`)
      .sort()
      .join('|');
    const uniqueId = `${menuName}-${spice || 'none'}-${sugar || 'none'}-${choiceHash || 'none'}`;

    setCart(prev => {
      const idx = prev.findIndex(i => i.id === uniqueId);
      if (idx > -1) {
        const copy = [...prev];
        copy[idx].qty += 1;
        return copy;
      }
      return [
        ...prev,
        {
          id: uniqueId,
          menuName,
          qty: 1,
          price: getDishPrice(menuName),
          selectedSpice: spice,
          selectedSugar: sugar,
          customChoices,
        },
      ];
    });
  };

  const handleSheetConfirm = () => {
    commitAddToCart(
      optionSheet.menuName,
      optionSheet.spice,
      optionSheet.sugar,
      optionSheet.customChoices
    );
    setOptionSheet(s => ({ ...s, open: false }));
  };

  const decrementQty = (id: string) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter(i => i.id !== id);
      return prev.map(i => i.id === id ? { ...i, qty: i.qty - 1 } : i);
    });
  };

  const incrementQty = (id: string) =>
    setCart(prev => prev.map(i => i.id === id ? { ...i, qty: i.qty + 1 } : i));

  const removeItem = (id: string) => setCart(prev => prev.filter(i => i.id !== id));

  const clearCart = () => setCart([]);

  // Computed Totals
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartTax = Math.round(cartTotal * 0.1);
  const cartService = 2000;
  const cartGrandTotal = cartTotal + cartTax + cartService;
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const isCartEmpty = cart.length === 0;

  const cashPaid = parseFloat(cashPaidAmount) || 0;
  const cashChange = cashPaid >= cartGrandTotal ? cashPaid - cartGrandTotal : 0;

  const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  // Validation Logic (Real-time)
  useEffect(() => {
    if (isCartEmpty) {
      setPaymentError(null);
      return;
    }

    if (paymentMethod === 'CASH') {
      if (!cashPaidAmount) {
        setPaymentError("Masukkan uang diterima terlebih dahulu");
      } else if (cashPaid < cartGrandTotal) {
        setPaymentError(`Uang kurang ${formatIDR(cartGrandTotal - cashPaid)}`);
      } else {
        setPaymentError(null);
      }
    } else {
      setPaymentError(null);
    }
  }, [paymentMethod, cashPaidAmount, cartGrandTotal, isCartEmpty]);

  const handleCheckout = async () => {
    // 1. Double check validation
    if (isCartEmpty) return;
    
    if (paymentMethod === 'CASH') {
      if (!cashPaidAmount || cashPaid < cartGrandTotal) {
        setPaymentError(cashPaid < cartGrandTotal ? "Uang diterima tidak cukup" : "Masukkan uang diterima");
        cashInputRef.current?.focus();
        return;
      }
    }

    setCheckoutLoading(true);
    setCheckoutSuccess(false);
    setPaymentError(null);

    const invoiceId = `INV-${Date.now().toString().slice(-6)}`;
    const lineReceipts: any[] = [];

    try {
      // 2. Process each cart item with payment details
      for (const item of cart) {
        const parts: string[] = [];
        if (item.selectedSpice) parts.push(`Level: ${item.selectedSpice}`);
        if (item.selectedSugar) parts.push(item.selectedSugar);
        if (item.customChoices) {
          Object.entries(item.customChoices).forEach(([k, v]) => parts.push(`${k}: ${v}`));
        }
        const optionsStr = parts.join(', ');
        const lineTotal = item.price * item.qty;

        // API Call with full payment context
        await onTriggerSale({
          menu_name: item.menuName,
          quantity: item.qty,
          total_price: lineTotal,
          selected_options: optionsStr,
          payment_method: paymentMethod,
          cash_paid: paymentMethod === 'CASH' ? cashPaid : null,
          cash_change: paymentMethod === 'CASH' ? cashChange : null
        });

        lineReceipts.push({
          menuName: item.menuName,
          qty: item.qty,
          price: item.price,
          total: lineTotal,
          options: optionsStr,
          category: recipes.find(r => r.menu_name === item.menuName)?.category ?? 'Makanan',
        });
      }

      // 3. Prepare Receipt
      setLastReceipt({
        invoiceId,
        timestamp:
          new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) +
          ', ' +
          new Date().toLocaleDateString('id-ID'),
        items: lineReceipts,
        paymentMethod,
        cashPaid: paymentMethod === 'CASH' ? cashPaid : cartGrandTotal,
        cashChange: paymentMethod === 'CASH' ? cashChange : 0,
        subtotal: cartTotal,
        tax: cartTax,
        serviceCharge: cartService,
        totalAmount: cartGrandTotal,
      });

      // 4. Finalize & Reset
      setCheckoutSuccess(true);
      setCart([]);
      setCashPaidAmount('');
      setPaymentMethod('CASH'); // Reset for next transaction
      onRefreshStats();
      setShowPrintModal(true);
      
      setTimeout(() => setCheckoutSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setPaymentError("Terjadi kesalahan saat memproses pesanan.");
    } finally {
      setCheckoutLoading(false);
    }
  };

  const dynamicCategories = ['Semua', ...Array.from(new Set(recipes.map(r => r.category ?? 'Makanan')))];

  const filteredRecipes = recipes.filter(recipe => {
    const matchesSearch = recipe.menu_name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (categoryTab === 'Semua') return true;
    return (recipe.category ?? 'Makanan').toLowerCase() === categoryTab.toLowerCase();
  });

  const currentRecipe = recipes.find(r => r.menu_name === optionSheet.menuName);

  return (
    <div className="flex flex-col gap-0.1 h-full">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        {/* Mobile tab switcher */}
        <div className="flex sm:hidden w-full gap-2">
          <button
            onClick={() => setMobileView('menu')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition ${mobileView === 'menu' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            Menu
          </button>
          <button
            onClick={() => setMobileView('cart')}
            className={`flex-1 py-2 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 ${mobileView === 'cart' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}
          >
            Keranjang
            {cartCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${mobileView === 'cart' ? 'bg-white/30 text-white' : 'bg-blue-600 text-white'}`}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* LEFT: Menu catalog */}
        <div className={`flex flex-col gap-3 flex-1 min-w-0 ${mobileView === 'cart' ? 'hidden sm:flex' : 'flex'}`}>
          <div className="flex flex-col gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari menu..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
              {dynamicCategories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryTab(cat)}
                  className={`shrink-0 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition whitespace-nowrap ${categoryTab === cat ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-500 hover:border-slate-300'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 pr-0.5">
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {filteredRecipes.map(recipe => {
                const limit = calculateCookableLimit(recipe);
                const isOut = limit === 0;
                const price = getDishPrice(recipe.menu_name);
                const cat = recipe.category ?? 'Makanan';
                return (
                  <div key={recipe.menu_name} className={`bg-white border rounded-2xl p-3.5 flex flex-col gap-2 transition select-none ${isOut ? 'opacity-50 cursor-not-allowed border-slate-100' : 'border-slate-200 hover:border-blue-300 hover:shadow-sm cursor-pointer group'}`}>
                    <span className={`self-start text-[10px] font-semibold px-2 py-0.5 rounded-md ${cat === 'Minuman' ? 'bg-sky-50 text-sky-600' : 'bg-amber-50 text-amber-700'}`}>{cat}</span>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{recipe.menu_name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{formatIDR(price)}</p>
                    </div>
                    <div className="flex flex-wrap gap-0.5">
                      {recipe.items.slice(0, 4).map(item => (
                        <span key={item.id} className="text-[9px] px-1 py-0.5 bg-slate-50 rounded text-slate-400">{item.ingredient_name}</span>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      {isOut ? <span className="text-[10px] text-red-400 font-medium">Habis</span> : <span className={`text-[10px] font-medium ${limit < 5 ? 'text-amber-500' : 'text-slate-400'}`}>{limit < 5 ? `Sisa ${limit}` : `${limit} porsi`}</span>}
                      {!isOut && (
                        <button onClick={() => openOptionSheet(recipe.menu_name)} className="w-7 h-7 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition group-hover:scale-105">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Transaction history mini-log */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 shrink-0">
            <h2 className="text-xs font-semibold text-slate-700 mb-2">Log Transaksi</h2>
            <div className="overflow-x-auto max-h-48 overflow-y-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100">
                    <th className="py-1.5 pr-3">Menu</th>
                    <th className="py-1.5 pr-3 text-center">Qty</th>
                    <th className="py-1.5 pr-3 text-right">Total</th>
                    <th className="py-1.5 text-right">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-[11px] text-slate-600">
                  {sales.map(sale => (
                    <tr key={sale.id} className="hover:bg-slate-50/50">
                      <td className="py-1.5 pr-3 font-medium text-slate-800">{sale.menu_name}</td>
                      <td className="py-1.5 pr-3 text-center font-mono font-bold">{sale.quantity}×</td>
                      <td className="py-1.5 pr-3 text-right font-mono text-emerald-600 font-semibold">{formatIDR(sale.total_price)}</td>
                      <td className="py-1.5 text-right text-slate-400 font-mono">{(sale.created_at.split(' ')[0] || sale.created_at.split('T')[0])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT: Cart sidebar */}
        <div
          className={`w-full sm:w-[360px] shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden ${mobileView === 'menu' ? 'hidden sm:flex' : 'flex'}`}
          style={{ maxHeight: 'calc(100vh - 160px)' }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-slate-800">Keranjang</span>
            </div>
            {!isCartEmpty && (
              <button onClick={clearCart} className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-red-500 transition px-2 py-1 rounded-lg hover:bg-red-50">
                <Trash2 className="w-3 h-3" /> Hapus semua
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-2">
            {isCartEmpty ? (
              <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-300 py-10">
                <ShoppingCart className="w-10 h-10 stroke-[1.5]" />
                <p className="text-xs font-medium text-slate-400">Keranjang kosong</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {cart.map(item => (
                  <div key={item.id} className="flex flex-col gap-1.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-slate-800 truncate">{item.menuName}</p>
                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{formatIDR(item.price)} × {item.qty}</p>
                        {((item.selectedSpice && item.selectedSpice !== 'Sedang') || (item.selectedSugar && item.selectedSugar !== 'Less Sugar (70%)') || Object.keys(item.customChoices ?? {}).length > 0) && (
                          <p className="text-[9px] text-slate-500 mt-1 line-clamp-2">{[
                            item.selectedSpice && item.selectedSpice !== 'Sedang' ? item.selectedSpice : null,
                            item.selectedSugar && item.selectedSugar !== 'Less Sugar (70%)' ? item.selectedSugar : null,
                            ...Object.entries(item.customChoices ?? {}).map(([k, v]) => `${k}: ${v}`),
                          ].filter(Boolean).join(' • ')}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button onClick={() => decrementQty(item.id)} className="w-6 h-6 rounded-full border border-slate-200 bg-white flex items-center justify-center">
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-bold font-mono w-4 text-center">{item.qty}</span>
                        <button onClick={() => incrementQty(item.id)} className="w-6 h-6 rounded-full border border-slate-200 bg-white flex items-center justify-center">
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-slate-100 px-4 pt-3 pb-4 space-y-3 bg-white">
            <div className="space-y-1">
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Subtotal</span>
                <span className="font-mono">{formatIDR(cartTotal)}</span>
              </div>
              <div className="flex justify-between items-baseline pt-2 border-t border-slate-100 mt-1">
                <span className="text-xs text-slate-500 font-medium">Total Pesanan</span>
                <span className="text-xl font-bold font-mono text-slate-800">{formatIDR(cartGrandTotal)}</span>
              </div>
            </div>

            {!isCartEmpty && (
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${paymentMethod === 'CASH' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-500'}`}
                  >
                    💵 Cash
                  </button>
                  <button
                    onClick={() => setPaymentMethod('QRIS')}
                    className={`py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition ${paymentMethod === 'QRIS' ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-200 text-slate-500'}`}
                  >
                    📱 QRIS
                  </button>
                </div>

                {paymentMethod === 'CASH' && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          ref={cashInputRef}
                          type="number"
                          placeholder="Uang diterima..."
                          value={cashPaidAmount}
                          onChange={e => setCashPaidAmount(e.target.value)}
                          className={`w-full px-3 py-2.5 text-xs bg-slate-50 border rounded-xl focus:outline-none font-mono ${paymentError ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-blue-400'}`}
                        />
                      </div>
                      {cashPaid >= cartGrandTotal && cashPaid > 0 && (
                        <div className="text-right">
                          <p className="text-[9px] text-slate-400 uppercase font-bold">Kembalian</p>
                          <p className="text-xs text-emerald-600 font-bold whitespace-nowrap">{formatIDR(cashChange)}</p>
                        </div>
                      )}
                    </div>
                    
                    {/* Quick Cash Suggestions */}
                    <div className="flex gap-1.5">
                      {[
                        { label: 'Pas', value: cartGrandTotal },
                        { label: '50rb', value: 50000 > cartGrandTotal ? 50000 : Math.ceil(cartGrandTotal / 50000) * 50000 },
                        { label: '100rb', value: 100000 > cartGrandTotal ? 100000 : Math.ceil(cartGrandTotal / 100000) * 100000 },
                      ].map(({ label, value }) => (
                        <button
                          key={label}
                          onClick={() => setCashPaidAmount(value.toString())}
                          className="flex-1 py-1.5 text-[10px] font-semibold bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-600 transition"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Real-time Validation Message */}
                {paymentError && (
                  <div className="flex items-center gap-1.5 text-[10px] text-red-500 bg-red-50 border border-red-100 rounded-lg p-2 animate-pulse">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    {paymentError}
                  </div>
                )}
              </>
            )}

            {checkoutSuccess && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                Transaksi berhasil dicatat!
              </div>
            )}

            <button
              disabled={isCartEmpty || checkoutLoading || !!paymentError}
              onClick={handleCheckout}
              className="w-full py-3.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition shadow-sm shadow-blue-200"
            >
              {checkoutLoading ? (
                <><RefreshCcw className="w-4 h-4 animate-spin" /> Memproses...</>
              ) : (
                <><CreditCard className="w-4 h-4" /> Bayar Sekarang</>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Option bottom sheet */}
      {optionSheet.open && currentRecipe && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4" onClick={() => setOptionSheet(s => ({ ...s, open: false }))}>
          <div className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-semibold text-slate-800">{optionSheet.menuName}</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Pilih preferensi pelanggan</p>
              </div>
              <button onClick={() => setOptionSheet(s => ({ ...s, open: false }))} className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              {currentRecipe.spice_level_option === 1 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Flame className="w-3 h-3 text-red-400" /> Level Pedas</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {['Tidak Pedas', 'Sedang', 'Pedas', 'Super Pedas'].map(s => (
                      <button key={s} onClick={() => setOptionSheet(prev => ({ ...prev, spice: s }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${optionSheet.spice === s ? 'bg-red-500 text-white border-red-500' : 'border-slate-200'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}
              {currentRecipe.sugar_level_option === 1 && (
                <div>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><Droplets className="w-3 h-3 text-sky-400" /> Tingkat Gula</p>
                  <div className="flex gap-1.5 flex-wrap">
                    {['Normal', 'Less Sugar', 'Half Sugar', 'No Sugar'].map(s => (
                      <button key={s} onClick={() => setOptionSheet(prev => ({ ...prev, sugar: s }))} className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${optionSheet.sugar === s ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200'}`}>{s}</button>
                    ))}
                  </div>
                </div>
              )}

              {optionSheet.customFields.length > 0 && optionSheet.customFields.map(field => (
                <div key={field.name}>
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1"><UtensilsCrossed className="w-3 h-3 text-slate-400" /> {field.name}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {field.choices.map(choice => (
                      <button
                        key={choice}
                        onClick={() => setOptionSheet(prev => ({
                          ...prev,
                          customChoices: { ...prev.customChoices, [field.name]: choice },
                        }))}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${optionSheet.customChoices[field.name] === choice ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-700'}`}
                      >
                        {choice}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={handleSheetConfirm} className="w-full mt-5 py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Masukkan Keranjang</button>
          </div>
        </div>
      )}

      {/* Print receipt modal */}
      {showPrintModal && lastReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-slate-100 rounded-3xl max-w-4xl w-full p-5 relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-2">
              <div className="flex items-center gap-2">
                <ReceiptText className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold text-slate-800 text-sm">Pratinjau Struk</h3>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="p-1.5 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Receipt Visuals */}
              <div className="bg-white p-5 shadow-sm border border-slate-200 rounded-2xl flex flex-col font-mono text-[11px] text-slate-800">
                <div className="text-center pb-3 border-b border-dashed border-slate-300">
                  <h4 className="font-sans font-bold text-xs text-slate-800 uppercase">RESTOFLOW POS</h4>
                  <p className="text-[9px] mt-2">Inv: {lastReceipt.invoiceId}</p>
                  <p className="text-[9px] text-slate-400">{lastReceipt.timestamp}</p>
                </div>
                <div className="py-3 border-b border-dashed border-slate-300 space-y-2">
                  {lastReceipt.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between">
                      <span className="font-bold">{item.menuName} x{item.qty}</span>
                      <span>{formatIDR(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="py-3 space-y-1">
                  <div className="flex justify-between"><span>Total</span><span className="font-bold">{formatIDR(lastReceipt.totalAmount)}</span></div>
                  <div className="flex justify-between text-slate-400"><span>Metode</span><span>{lastReceipt.paymentMethod}</span></div>
                  {lastReceipt.paymentMethod === 'CASH' && (
                    <>
                      <div className="flex justify-between text-slate-400"><span>Tunai</span><span>{formatIDR(lastReceipt.cashPaid)}</span></div>
                      <div className="flex justify-between font-bold text-emerald-600"><span>Kembali</span><span>{formatIDR(lastReceipt.cashChange)}</span></div>
                    </>
                  )}
                </div>
                <p className="text-center text-slate-400 font-sans pt-2 border-t border-dashed border-slate-300">★ Selesai ★</p>
              </div>

              {/* Kitchen & Bar Slips (Placeholders) */}
              <div className="bg-amber-50/70 p-5 shadow-sm border border-amber-200 rounded-2xl flex flex-col font-mono text-[11px]">
                 <div className="text-center pb-2 border-b border-dashed border-amber-200 mb-2">
                    <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700 mx-auto mb-1" />
                    <span className="font-sans font-bold text-[10px] uppercase">Dapur</span>
                 </div>
                 {lastReceipt.items.filter((i:any) => i.category !== 'Minuman').map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between font-bold">
                       <span>{item.menuName}</span>
                       <span className="text-red-600">x{item.qty}</span>
                    </div>
                 ))}
              </div>

              <div className="bg-sky-50/70 p-5 shadow-sm border border-sky-200 rounded-2xl flex flex-col font-mono text-[11px]">
                 <div className="text-center pb-2 border-b border-dashed border-sky-200 mb-2">
                    <Coffee className="w-3.5 h-3.5 text-sky-700 mx-auto mb-1" />
                    <span className="font-sans font-bold text-[10px] uppercase">Bar</span>
                 </div>
                 {lastReceipt.items.filter((i:any) => i.category === 'Minuman').map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between font-bold">
                       <span>{item.menuName}</span>
                       <span className="text-blue-600">x{item.qty}</span>
                    </div>
                 ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
              <button onClick={() => window.print()} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Cetak Struk
              </button>
              <button onClick={() => setShowPrintModal(false)} className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold">Tutup</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}