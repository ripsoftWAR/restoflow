import React, { useState } from 'react';
import { Search, ArrowLeft, List, LayoutGrid } from 'lucide-react';
import { RecipeWithDetails, Ingredient, Sale } from '../../../types';
import { useCart } from '../../sales/hooks/useCart';
import { useCheckout, ReceiptData } from '../../sales/hooks/useCheckout';
import MenuGrid from './components/MenuGrid';
import CartPanel from './components/CartPanel';
import OptionSheet from './components/OptionSheet';
import PrintReceiptModal from './components/PrintReceiptModal';

interface KasirPageProps {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  sales: Sale[];
  onTriggerSale: (data: any) => Promise<void>;
  onRefreshStats: () => void;
  onBack: () => void;   // ← navigate back to SalesPage
}

const TABS_BASE = ['Semua'];

export default function KasirPage({
  recipes, ingredients, sales,
  onTriggerSale, onRefreshStats, onBack,
}: KasirPageProps) {

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryTab, setCategoryTab] = useState('Semua');
  const [mobileView, setMobileView] = useState<'menu' | 'cart'>('menu');

  const [lastReceipt, setLastReceipt] = useState<ReceiptData | null>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);

  const cartState = useCart(recipes, ingredients);
  const { checkoutLoading, checkoutSuccess, handleCheckout } = useCheckout();

  // Derive category tabs from recipes
  const cats = Array.from(new Set(recipes.map(r => r.category ?? 'Makanan')));
  const tabs = [...TABS_BASE, ...cats];

  const doCheckout = () => {
    handleCheckout({
      cart: cartState.cart,
      recipes,
      paymentMethod: cartState.paymentMethod,
      cashPaid: cartState.cashPaid,
      cashChange: cartState.cashChange,
      totals: cartState.totals,
      discount: cartState.discount,
      finalTotal: cartState.finalTotal,
      voucherLabel: cartState.voucher?.label,
      isCartEmpty: cartState.isCartEmpty,
      paymentError: cartState.paymentError,
      onTriggerSale,
      onRefreshStats,
      cashInputRef: cartState.cashInputRef,
      onSuccess: (receipt) => {
        setLastReceipt(receipt);
        cartState.clearCart();
        cartState.setCashPaidAmount('');
        cartState.removeVoucher();
        setShowPrintModal(true);
      },
    });
  };

  return (
    <div className="min-h-full w-full bg-transparent p-4 flex flex-col gap-3">

      {/* Topbar */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-50 bg-white flex-shrink-0"
        >
          <ArrowLeft size={13} /> Kembali
        </button>
        <div>
          <h1 className="text-[16px] font-bold text-slate-800">Kasir — POS</h1>
          <p className="text-[11px] text-slate-400">Pilih menu dan proses pembayaran.</p>
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari menu..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-purple-400"
          />
        </div>
      </div>

      {/* Mobile switcher */}
      <div className="flex sm:hidden gap-2">
        {(['menu', 'cart'] as const).map(v => (
          <button
            key={v}
            onClick={() => setMobileView(v)}
            className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition
              ${mobileView === v ? 'bg-purple-600 text-white' : 'bg-white border border-slate-200 text-slate-500'}`}
          >
            {v === 'menu' ? 'Menu' : `Keranjang (${cartState.cartCount})`}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="flex gap-4 flex-1 min-h-0">

        {/* Left: category tabs + menu grid */}
        <div className={`flex flex-col gap-3 flex-1 min-w-0 overflow-y-auto ${mobileView === 'cart' ? 'hidden sm:flex' : 'flex'}`}>

          {/* Tabs toolbar */}
          <div className="bg-white rounded-xl border border-slate-100">
            <div className="flex items-center justify-between px-1 border-b border-slate-100">
              <div className="flex overflow-x-auto no-scrollbar">
                {tabs.map(tab => (
                  <button
                    key={tab}
                    onClick={() => setCategoryTab(tab)}
                    className={`py-2.5 px-3.5 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors
                      ${categoryTab === tab
                        ? 'text-purple-600 border-purple-600'
                        : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
              <div className="flex gap-1 px-3 flex-shrink-0">
                <button className="p-1.5 border border-purple-200 bg-purple-50 text-purple-600 rounded-lg">
                  <LayoutGrid size={13} />
                </button>
                <button className="p-1.5 border border-slate-200 text-slate-400 rounded-lg">
                  <List size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* Menu grid */}
          <MenuGrid
            recipes={recipes}
            ingredients={ingredients}
            searchQuery={searchQuery}
            categoryTab={categoryTab}
            onAddToCart={cartState.openOptionSheet}
          />
        </div>

        {/* Right: cart panel */}
        <div className={`${mobileView === 'menu' ? 'hidden sm:flex' : 'flex'}`}>
          <CartPanel
            cart={cartState.cart}
            isCartEmpty={cartState.isCartEmpty}
            totals={cartState.totals}
            discount={cartState.discount}
            finalTotal={cartState.finalTotal}
            paymentMethod={cartState.paymentMethod}
            setPaymentMethod={cartState.setPaymentMethod}
            cashPaidAmount={cartState.cashPaidAmount}
            setCashPaidAmount={cartState.setCashPaidAmount}
            cashPaid={cartState.cashPaid}
            cashChange={cartState.cashChange}
            paymentError={cartState.paymentError}
            checkoutLoading={checkoutLoading}
            checkoutSuccess={checkoutSuccess}
            cashInputRef={cartState.cashInputRef}
            voucherCode={cartState.voucherCode}
            setVoucherCode={cartState.setVoucherCode}
            voucher={cartState.voucher}
            voucherError={cartState.voucherError}
            onApplyVoucher={cartState.handleApplyVoucher}
            onRemoveVoucher={cartState.removeVoucher}
            onDecrement={cartState.decrementQty}
            onIncrement={cartState.incrementQty}
            onRemoveItem={cartState.removeItem}
            onClearCart={cartState.clearCart}
            onCheckout={doCheckout}
          />
        </div>
      </div>

      {/* Option sheet */}
      <OptionSheet
        state={cartState.optionSheet}
        recipe={recipes.find(r => r.menu_name === cartState.optionSheet.menuName)}
        onChange={patch => cartState.setOptionSheet(s => ({ ...s, ...patch }))}
        onConfirm={cartState.confirmOptionSheet}
        onClose={() => cartState.setOptionSheet(s => ({ ...s, open: false }))}
      />

      {/* Print modal */}
      {showPrintModal && lastReceipt && (
        <PrintReceiptModal
          receipt={lastReceipt}
          onClose={() => setShowPrintModal(false)}
        />
      )}
    </div>
  );
}
