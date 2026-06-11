import React, { useMemo, useState } from 'react';
import { Search, Filter, Plus, X, ChevronRight } from 'lucide-react';
import { RecipeWithDetails, Ingredient, Sale } from '../../types';
import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';
import KasirStatsBar from './components/KasirStatsBar';
import KasirMenuGrid from './components/KasirMenuGrid';
import KasirCartPanel from './components/KasirCartPanel';
import VoucherGenerator from './components/VoucherGenerator';
import { VoucherResult } from './utils/salesHelpers';
import { useEffect } from 'react';
import { makeApiFetch } from '../../utils/api';

interface SalesPageProps {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  sales: Sale[];
  onTriggerSale: (data: any) => Promise<void>;
  onRefreshStats: () => void;
  onNavigateToKasir: () => void;
  user?: any;
}

export default function SalesPage({
  recipes, ingredients, sales,
  onTriggerSale, onRefreshStats, onNavigateToKasir,
  user
}: SalesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showVoucherGenerator, setShowVoucherGenerator] = useState(false);
  const [generatedVouchers, setGeneratedVouchers] = useState<Record<string, any>>({});

  const cart = useCart(recipes, ingredients, generatedVouchers, user?.sessionId);
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
      onSuccess: () => { },
    });
  };
  // Tambah import


// Di dalam SalesPage, setelah state generatedVouchers:
useEffect(() => {
  const apiFetch = makeApiFetch(user?.sessionId);
  apiFetch(`/api/vouchers?restaurant_id=${user?.restaurant_id}`)
    .then(r => r.json())
    .then((vouchers: any[]) => {
      const map: Record<string, any> = {};
      vouchers.forEach(v => {
        map[v.code.toUpperCase()] = {
          valid: true,
          type: v.type === 'PERCENTAGE' ? 'percent' : 'flat',
          value: v.value,
          label: v.type === 'PERCENTAGE'
            ? `Diskon ${v.value}%`
            : `Diskon Rp ${new Intl.NumberFormat('id-ID').format(v.value)}`,
        };
      });
      setGeneratedVouchers(map);
    })
    .catch(console.error);
}, [user?.restaurant_id]);

  const voucherLabel = useMemo(() => cart.voucher?.label ?? '', [cart.voucher]);

  // Ambil recipe untuk option sheet yang sedang terbuka
  const activeRecipe = recipes.find(r => r.menu_name === cart.optionSheet.menuName);

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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            onAddItem={(menu: RecipeWithDetails) => cart.openOptionSheet(menu.menu_name)}
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

      {/* ── Voucher Generator Modal ──────────────────────────────────── */}
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
              restaurantId={user?.restaurant_id}
              sessionId={user?.sessionId}
              onVoucherGenerated={(code: string, voucher: VoucherResult) => {
                // ✅ Simpan sebagai VoucherResult lengkap agar bisa divalidasi di useCart
                setGeneratedVouchers(prev => ({
                  ...prev,
                  [code.toUpperCase()]: voucher,
                }));
                setShowVoucherGenerator(false);
              }}
            />
          </div>
        </div>
      )}

      {/* ── Option Sheet Modal ───────────────────────────────────────── */}
      {cart.optionSheet.open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => cart.setOptionSheet(s => ({ ...s, open: false }))}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-0.5">Kustomisasi Pesanan</p>
                <h3 className="text-[15px] font-black text-slate-800 capitalize">
                  {cart.optionSheet.menuName}
                </h3>
              </div>
              <button
                onClick={() => cart.setOptionSheet(s => ({ ...s, open: false }))}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
              >
                <X size={14} className="text-slate-500" />
              </button>
            </div>

            {/* Options Body */}
            <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">

              {/* Spice Level */}
              {activeRecipe?.spice_level_option === 1 && (
                <OptionGroup label="🌶️ Level Pedas">
                  {['Tidak Pedas', 'Sedang', 'Pedas', 'Sangat Pedas'].map(s => (
                    <OptionChip
                      key={s}
                      label={s}
                      active={cart.optionSheet.spice === s}
                      onClick={() => cart.setOptionSheet(prev => ({ ...prev, spice: s }))}
                    />
                  ))}
                </OptionGroup>
              )}

              {/* Sugar Level */}
              {activeRecipe?.sugar_level_option === 1 && (
                <OptionGroup label="🧋 Level Gula">
                  {['Less Sugar (70%)', 'Normal (100%)', 'Extra Sugar (130%)'].map(s => (
                    <OptionChip
                      key={s}
                      label={s}
                      active={cart.optionSheet.sugar === s}
                      onClick={() => cart.setOptionSheet(prev => ({ ...prev, sugar: s }))}
                    />
                  ))}
                </OptionGroup>
              )}

              {/* Custom Options */}
              {cart.optionSheet.customFields.map(field => (
                <OptionGroup key={field.name} label={`✨ ${field.name}`}>
                  {field.choices.map(choice => (
                    <OptionChip
                      key={choice}
                      label={choice}
                      active={cart.optionSheet.customChoices[field.name] === choice}
                      onClick={() => cart.setOptionSheet(prev => ({
                        ...prev,
                        customChoices: { ...prev.customChoices, [field.name]: choice }
                      }))}
                    />
                  ))}
                </OptionGroup>
              ))}
            </div>

            {/* Footer Actions */}
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => cart.setOptionSheet(s => ({ ...s, open: false }))}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={cart.confirmOptionSheet}
                className="flex-[2] py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-black shadow-lg shadow-purple-100 transition flex items-center justify-center gap-2"
              >
                Tambah ke Keranjang <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper Components ─────────────────────────────────────────────────────────

function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function OptionChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all ${active
        ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
        : 'border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50'
        }`}
    >
      {label}
    </button>
  );
}