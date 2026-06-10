import React, { useMemo, useState } from 'react';
import { Search, Filter, Plus } from 'lucide-react';
import { RecipeWithDetails, Ingredient, Sale } from '../../types';
import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';
import KasirStatsBar from './components/KasirStatsBar';
import KasirMenuGrid from './components/KasirMenuGrid';
import KasirCartPanel from './components/KasirCartPanel';
import VoucherGenerator from './components/VoucherGenerator';

interface SalesPageProps {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  sales: Sale[];
  onTriggerSale: (data: any) => Promise<void>;
  onRefreshStats: () => void;
  onNavigateToKasir: () => void;   // ← navigation callback
}

export default function SalesPage({
  recipes, ingredients, sales,
  onTriggerSale, onRefreshStats, onNavigateToKasir,
}: SalesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showVoucherGenerator, setShowVoucherGenerator] = useState(false);
  const [generatedVouchers, setGeneratedVouchers] = useState<Record<string, any>>({});

  const cart = useCart(recipes, ingredients, generatedVouchers);
  const { checkoutLoading, handleCheckout } = useCheckout();

  const doCheckout = () => {
    handleCheckout({
      cart: cart.cart,
      recipes,
      paymentMethod: cart.paymentMethod,
      cashPaid: cart.cashPaid,
      cashChange: cart.cashChange,
      totals: cart.totals,
      discount: cart.discount,
      finalTotal: cart.finalTotal,
      voucherLabel: cart.voucher?.label,
      isCartEmpty: cart.isCartEmpty,
      paymentError: cart.paymentError,
      onTriggerSale,
      onRefreshStats,
      cashInputRef: cart.cashInputRef,
      onSuccess: () => {},
    });
  };

  const voucherLabel = useMemo(() => cart.voucher?.label ?? '', [cart.voucher]);

  return (
    <div className="min-h-full w-full bg-transparent p-4 space-y-4">

      {/* Topbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-bold text-slate-800">Kasir Penjualan</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Input penjualan kasir dan cetak struk transaksi.
          </p>
        </div>
        <div className="relative w-64 flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Produk / Barcode…"
            className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-purple-400"
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-50 bg-white flex-shrink-0">
          <Filter size={13} /> Filter
        </button>
        <button
          onClick={onNavigateToKasir}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold transition flex-shrink-0"
        >
          <Plus size={13} /> Transaksi Baru
        </button>
      </div>

      {/* Stats bar */}
      <KasirStatsBar sales={sales} onOpenVoucherGenerator={() => setShowVoucherGenerator(true)} />

      {/* Main area */}
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <KasirMenuGrid
            recipes={recipes}
            ingredients={ingredients}
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            onAddItem={cart.openOptionSheet}
          />
        </div>

        <KasirCartPanel
          recipes={recipes}
          cart={cart.cart}
          totals={cart.totals}
          discount={cart.discount}
          finalTotal={cart.finalTotal}
          cashPaid={cart.cashPaid}
          cashChange={cart.cashChange}
          paymentMethod={cart.paymentMethod}
          cashPaidAmount={cart.cashPaidAmount}
          paymentError={cart.paymentError}
          voucherCode={cart.voucherCode}
          voucherLabel={voucherLabel}
          checkoutLoading={checkoutLoading}
          cashInputRef={cart.cashInputRef}
          onSetPayment={cart.setPaymentMethod}
          onSetCashPaid={cart.setCashPaidAmount}
          onVoucherChange={cart.setVoucherCode}
          onApplyVoucher={cart.handleApplyVoucher}
          onRemoveVoucher={cart.removeVoucher}
          onDecrement={cart.decrementQty}
          onIncrement={cart.incrementQty}
          onRemoveItem={cart.removeItem}
          onClearCart={cart.clearCart}
          onCheckout={doCheckout}
        />
      </div>

      {showVoucherGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-5xl rounded-3xl bg-white p-4 shadow-2xl">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[14px] font-bold text-slate-800">Generator Voucher</h3>
                <p className="text-[11px] text-slate-400">Buat kode voucher promosi untuk transaksi penjualan.</p>
              </div>
              <button
                onClick={() => setShowVoucherGenerator(false)}
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50"
              >
                Tutup
              </button>
            </div>
            <VoucherGenerator
              onVoucherGenerated={(code, voucher) => {
                setGeneratedVouchers(prev => ({ ...prev, [code.toUpperCase()]: voucher }));
                setShowVoucherGenerator(false);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
