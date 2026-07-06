import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, X, ChevronRight,
  ChevronDown, Smartphone,
  ShoppingCart, BarChart3, Bell,
  Receipt, Gift,
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { RecipeWithDetails, Ingredient, Sale, Voucher } from '../../types';
import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';
import KasirStatsBar from './components/KasirStatsBar';
import KasirMenuGrid from './components/KasirMenuGrid';
import KasirCartPanel from './components/KasirCartPanel';
import SalesStatCards from './SalesStatCards';
import PaymentBreakdownCards from './PaymentBreakdownCards';
import RightSidebar from '../dashboard/RightSidebar';
import PageLayout from '../layout/PageLayout';
import TabOverview from './TabOverview';
import TabLog from './TabLog';
import TabVoucher from './TabVoucher';
import { VoucherResult, formatIDR, formatIDRShort } from './utils/salesHelpers';
import { makeApiFetch } from '../../utils/api';
import DateRangePicker, { getPresetRange, formatDisplayLabel } from '../dashboard/DateRangePicker';
import type { DateRangeValue } from '../dashboard/DateRangePicker';

interface SalesPageProps {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  sales: Sale[];
  onTriggerSale: (data: any) => Promise<void>;
  onRefreshStats: () => void;
  onNavigateToKasir: () => void;
  onNavigate: (tab: string) => void;
  user?: any;
}

type PaymentFilter = 'SEMUA' | 'CASH' | 'QRIS' | 'TRANSFER' | 'EDC';

// ═══════════════════════════════════════════════════════════════════════════════
// OWNER SALES VIEW — Dashboard Profesional
// ═══════════════════════════════════════════════════════════════════════════════
function OwnerSalesView({
  sales, user, onNavigateToKasir, onNavigate, ingredients,
  generatedVouchers, setGeneratedVouchers, voucherList,
  refreshVouchers,
}: {
  sales: Sale[];
  user: any;
  onNavigateToKasir: () => void;
  onNavigate: (tab: string) => void;
  ingredients: Ingredient[];
  generatedVouchers: Record<string, VoucherResult>;
  setGeneratedVouchers: React.Dispatch<React.SetStateAction<Record<string, VoucherResult>>>;
  voucherList: Voucher[];
  refreshVouchers: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'log' | 'voucher'>('overview');
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: 'today' });
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('SEMUA');
  const [filterOpen, setFilterOpen] = useState(false);

  // ── Computed dates from DateRangePicker ──────────
  const { startDate, endDate } = useMemo(() => {
    if (dateRange.preset === 'custom' && dateRange.from && dateRange.to) {
      return { startDate: dateRange.from, endDate: dateRange.to };
    }
    const range = getPresetRange(dateRange.preset);
    return { startDate: range.from, endDate: range.to };
  }, [dateRange]);

  // ── Filtered data untuk sidebar & KPI ──────────
  const filteredByDate = useMemo(() => {
    return sales.filter(s => {
      if (!s.created_at) return false;
      const d = new Date(s.created_at);
      return d >= startDate && d <= endDate;
    });
  }, [sales, startDate, endDate]);

  const filteredSales = useMemo(() => {
    if (paymentFilter === 'SEMUA') return filteredByDate;
    return filteredByDate.filter(s => s.payment_method === paymentFilter);
  }, [filteredByDate, paymentFilter]);

  const totalRevenue = filteredByDate.reduce((a, s) => a + (s.total_price ?? 0), 0);
  const totalTx = filteredByDate.length;
  const dateLabel = useMemo(() => formatDisplayLabel(dateRange), [dateRange]);

  return (
    <div className="p-[22px] px-[26px] min-w-0">
      {/* ── TOPBAR ─────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between mb-[18px] flex-wrap gap-[14px]">
        <div>
          <h1 className="text-[24px] font-bold text-[#1B2436] tracking-[-0.02em]">Penjualan</h1>
          <p className="text-[13px] text-[#6B7280] mt-1 flex items-center gap-1">
            Ringkasan & log transaksi
            <span className="text-[#9CA3AF] mx-1">•</span>
            <select className="border-none bg-transparent text-[13px] text-[#6B7280] font-medium cursor-pointer outline-none">
              <option>Semua Outlet</option>
              <option>PilotPOS Jakarta</option>
            </select>
          </p>
        </div>

        {/* Topbar Right */}
        <div className="flex items-center gap-[10px]">
          {/* Date Range Picker — Tokopedia-style */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          {/* Filter Payment Method */}
          <div className="relative">
            <button onClick={() => setFilterOpen(p => !p)}
              className="flex items-center gap-2 bg-white border border-[#E9ECF5] px-[14px] py-[9px] rounded-[10px] text-[13px] font-medium text-[#1B2436] hover:border-[#D6DCEC] transition-colors">
              <Filter size={15} strokeWidth={1.8} />
              {paymentFilter === 'SEMUA' ? 'Filter' : paymentFilter}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-[#E9ECF5] rounded-[10px] shadow-xl z-30 min-w-[130px] overflow-hidden">
                {(['SEMUA','CASH','QRIS','TRANSFER','EDC'] as PaymentFilter[]).map(m => (
                  <button key={m} onClick={() => { setPaymentFilter(m); setFilterOpen(false); }}
                    className={`w-full text-left px-4 py-2.5 text-[12px] font-semibold transition hover:bg-[#F8FAFE] ${paymentFilter===m ? 'bg-[#EFF3FF] text-[#2E4FE0]' : 'text-[#6B7280]'}`}>
                    {m}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Bell */}
          <div className="relative w-[38px] h-[38px] rounded-[10px] bg-white border border-[#E9ECF5] flex items-center justify-center cursor-pointer hover:bg-[#F8FAFE] transition-colors">
            <Bell size={17} strokeWidth={1.8} color="#4B5468" />
            <span className="absolute -top-1 -right-1 bg-[#2E4FE0] text-white text-[10px] font-bold rounded-full w-[17px] h-[17px] flex items-center justify-center border-[2px] border-[#F3F5FA]">
              {filteredByDate.length > 99 ? '99+' : filteredByDate.length}
            </span>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-[9px] py-1 pl-1 pr-2 rounded-[10px] hover:bg-white cursor-pointer transition-colors">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nama || 'Owner')}&background=2E4FE0&color=fff&size=72`}
              alt={user?.nama || 'Owner'}
              className="w-[36px] h-[36px] rounded-full object-cover"
            />
            <div>
              <div className="text-[13.5px] font-semibold leading-tight text-[#1B2436]">
                {user?.nama || 'Owner'}
              </div>
              <div className="text-[11.5px] text-[#9CA3AF]">{user?.role || 'Pemilik'}</div>
            </div>
            <ChevronDown size={13} strokeWidth={2} color="#9CA3AF" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          TABS — di atas, sebelum KPI cards (seperti Dashboard)
          ═══════════════════════════════════════════════ */}
      <div className="flex items-center justify-between border-b border-[#E9ECF5] mb-5">
        <div className="flex gap-[22px]">
          {(['overview', 'log', 'voucher'] as const).map(tabId => {
            const icons: Record<string, React.ReactNode> = {
              overview: <BarChart3 size={15} strokeWidth={2} />,
              log: <Receipt size={15} strokeWidth={2} />,
              voucher: <Gift size={15} strokeWidth={2} />,
            };
            const labels: Record<string, string> = {
              overview: 'Overview', log: 'Log Transaksi', voucher: 'Voucher & Promo',
            };
            return (
              <button
                key={tabId}
                onClick={() => setActiveTab(tabId)}
                className={`flex items-center gap-[7px] px-0.5 pb-3 text-[14px] font-medium border-b-[2px] transition-colors cursor-pointer ${
                  activeTab === tabId
                    ? 'text-[#2E4FE0] font-semibold border-[#2E4FE0]'
                    : 'text-[#6B7280] border-transparent hover:text-[#2E4FE0]'
                }`}
              >
                {icons[tabId]}
                {labels[tabId]}
              </button>
            );
          })}
        </div>

        {/* Kasir App — sejajar dengan tab, di kanan */}
        <div
          className="flex items-center gap-1.5 px-4 py-[7px] bg-[#F0F4FF] border border-[#D9E2F9] rounded-[10px] text-[12px] font-medium text-[#6B7FA3] select-none mb-[2px]"
          title="Fitur kasir tersedia di aplikasi Flutter mobile"
        >
          <Smartphone size={14} strokeWidth={1.8} />
          <span className="hidden sm:inline">Kasir App</span>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          GRID: LEFT (KPI cards + tab content) + RIGHT (Pilot AI sidebar)
          Panel kanan TIDAK berubah saat pindah tab
          ═══════════════════════════════════════════════ */}
      <PageLayout
        rightPanel={
          <>
            <PaymentBreakdownCards sales={filteredSales} dateRangeLabel={dateLabel} />
            <RightSidebar
              sales={filteredSales}
              ingredients={ingredients}
              movements={[]}
              criticalCount={0}
              stockValue={0}
              totalOmset={totalRevenue}
              totalTx={totalTx}
              onNavigate={onNavigate}
            />
          </>
        }
      >
        <div className="flex flex-col gap-5">
          {/* KPI CARDS — di dalam kolom kiri, ikuti lebar grid */}
          <SalesStatCards
            sales={sales}
            ingredients={[]}
            globalDateRange={dateRange}
          />

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <TabOverview
                sales={filteredSales}
                dateRangeLabel={dateLabel}
                startDate={startDate}
                endDate={endDate}
              />
            )}
            {activeTab === 'log' && (
              <TabLog
                sessionId={user?.sessionId}
                startDate={startDate}
                endDate={endDate}
                paymentFilter={paymentFilter}
                dateLabel={dateLabel}
                user={user}
              />
            )}
            {activeTab === 'voucher' && (
              <TabVoucher
                voucherList={voucherList}
                sessionId={user?.sessionId}
                restaurantId={user?.restaurant_id}
                onRefreshVouchers={refreshVouchers}
              />
            )}
          </AnimatePresence>
        </div>
      </PageLayout>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXPORT — SalesPage (Owner + Kasir views)
// ═══════════════════════════════════════════════════════════════════════════════
export default function SalesPage({
  recipes, ingredients, sales,
  onTriggerSale, onRefreshStats, onNavigateToKasir, onNavigate,
  user,
}: SalesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedVouchers, setGeneratedVouchers] = useState<Record<string, VoucherResult>>({});
  const [voucherList, setVoucherList] = useState<Voucher[]>([]);

  const refreshVouchers = useCallback(() => {
    if (!user?.restaurant_id) return;
    const apiFetch = makeApiFetch(user?.sessionId);
    apiFetch(`/api/vouchers?restaurant_id=${user.restaurant_id}`)
      .then(r => r.json())
      .then((res: any) => {
        const vouchers: any[] = Array.isArray(res.data) ? res.data : [];
        const fullList: Voucher[] = vouchers.map((v: any) => ({
          id: v.id, code: v.code,
          type: v.type === 'PERCENTAGE' ? 'percentage' : 'fixed',
          value: Number(v.value),
          min_purchase: Number(v.min_purchase || 0),
          max_discount: v.max_discount ? Number(v.max_discount) : null,
          is_active: v.is_active === true || v.is_active === 'true',
          valid_from: v.valid_from || null,
          valid_until: v.valid_until || null,
          max_usage: v.max_usage ? Number(v.max_usage) : null,
          usage_count: Number(v.usage_count || 0),
          created_at: v.created_at || '',
        }));
        setVoucherList(fullList);
        const map: Record<string, VoucherResult> = {};
        vouchers.forEach((v: any) => {
          map[v.code.toUpperCase()] = {
            valid: true, type: v.type==='PERCENTAGE'?'percent':'flat', value: Number(v.value),
            label: v.type==='PERCENTAGE'?`Diskon ${v.value}%`:`Diskon Rp ${new Intl.NumberFormat('id-ID').format(Number(v.value))}`,
            id: v.id,
          };
        });
        setGeneratedVouchers(map);
      }).catch(console.error);
  }, [user?.restaurant_id, user?.sessionId]);

  useEffect(() => {
    refreshVouchers();
  }, [refreshVouchers]);

  const cart = useCart(recipes, ingredients, generatedVouchers, user?.sessionId);
  const { checkoutLoading, handleCheckout } = useCheckout();
  const activeRecipe = recipes.find(r => r.menu_name === cart.optionSheet.menuName);

  const doCheckout = useCallback(() => {
    handleCheckout({
      cart: cart.cart, recipes, paymentMethod: cart.paymentMethod,
      cashPaid: cart.cashPaid, cashChange: cart.cashChange,
      totals: cart.totals, discount: cart.discount,
      finalTotal: cart.finalTotal, voucherCode: cart.voucherCode,
      voucherId: cart.voucher?.id, voucherLabel: cart.voucher?.label,
      isCartEmpty: cart.isCartEmpty, paymentError: cart.paymentError,
      onTriggerSale, onRefreshStats, cashInputRef: cart.cashInputRef,
      onSuccess: () => { cart.clearCart(); },
    });
  }, [cart, handleCheckout, recipes, onTriggerSale, onRefreshStats]);

  if (user?.role === 'Pemilik') {
    return <OwnerSalesView sales={sales} user={user} onNavigateToKasir={onNavigateToKasir} onNavigate={onNavigate}
      ingredients={ingredients}
      generatedVouchers={generatedVouchers} setGeneratedVouchers={setGeneratedVouchers}
      voucherList={voucherList} refreshVouchers={refreshVouchers} />;
  }

  return (
    <div className="min-h-full w-full bg-transparent p-4 space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-bold text-slate-800">Kasir Penjualan</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Input penjualan kasir dan cetak struk transaksi.</p>
        </div>
        <div className="relative w-64 flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Cari Produk / Barcode…"
            className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-purple-400"
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-50 bg-white flex-shrink-0">
          <Filter size={13} /> Filter
        </button>
        {/* Mode Kasir — badge preview (fungsi di Flutter app) */}
        <div
          className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-medium text-slate-400 select-none flex-shrink-0"
          title="Fitur kasir tersedia di aplikasi Flutter mobile"
        >
          <Smartphone size={13} strokeWidth={1.8} />
          <span className="hidden sm:inline">Kasir App</span>
        </div>
      </div>
      <KasirStatsBar sales={sales} onOpenVoucherGenerator={()=>{}} />
      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <KasirMenuGrid recipes={recipes} ingredients={ingredients}
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
            onAddItem={(menu: RecipeWithDetails) => cart.openOptionSheet(menu.menu_name)} />
        </div>
        <KasirCartPanel recipes={recipes} cart={cart.cart} totals={cart.totals}
          discount={cart.discount} finalTotal={cart.finalTotal}
          cashPaid={cart.cashPaid} cashChange={cart.cashChange}
          paymentMethod={cart.paymentMethod} cashPaidAmount={cart.cashPaidAmount}
          paymentError={cart.paymentError} voucherCode={cart.voucherCode}
          voucherLabel={cart.voucher?.label ?? ''} checkoutLoading={checkoutLoading}
          cashInputRef={cart.cashInputRef} onSetPayment={cart.setPaymentMethod}
          onSetCashPaid={cart.setCashPaidAmount} onVoucherChange={cart.setVoucherCode}
          onApplyVoucher={cart.handleApplyVoucher} onRemoveVoucher={cart.removeVoucher}
          onDecrement={cart.decrementQty} onIncrement={cart.incrementQty}
          onRemoveItem={cart.removeItem} onClearCart={cart.clearCart}
          onCheckout={doCheckout} />
      </div>
      {cart.optionSheet.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => cart.setOptionSheet(s => ({ ...s, open: false }))}>
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-0.5">Kustomisasi Pesanan</p>
                <h3 className="text-[15px] font-black text-slate-800 capitalize">{cart.optionSheet.menuName}</h3>
              </div>
              <button onClick={() => cart.setOptionSheet(s => ({ ...s, open: false }))}
                className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition">
                <X size={14} className="text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {activeRecipe?.spice_level_option === 1 && (
                <OptionGroup label="🌶️ Level Pedas">
                  {['Tidak Pedas','Sedang','Pedas','Sangat Pedas'].map(s => (
                    <OptionChip key={s} label={s} active={cart.optionSheet.spice===s}
                      onClick={()=>cart.setOptionSheet(p=>({...p,spice:s}))} />
                  ))}
                </OptionGroup>
              )}
              {activeRecipe?.sugar_level_option === 1 && (
                <OptionGroup label="🧋 Level Gula">
                  {['Less Sugar (70%)','Normal (100%)','Extra Sugar (130%)'].map(s => (
                    <OptionChip key={s} label={s} active={cart.optionSheet.sugar===s}
                      onClick={()=>cart.setOptionSheet(p=>({...p,sugar:s}))} />
                  ))}
                </OptionGroup>
              )}
              {cart.optionSheet.customFields.map(field => (
                <OptionGroup key={field.name} label={`✨ ${field.name}`}>
                  {field.choices.map(choice => (
                    <OptionChip key={choice} label={choice}
                      active={cart.optionSheet.customChoices[field.name]===choice}
                      onClick={()=>cart.setOptionSheet(p=>({...p,customChoices:{...p.customChoices,[field.name]:choice}}))} />
                  ))}
                </OptionGroup>
              ))}
            </div>
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3">
              <button onClick={()=>cart.setOptionSheet(s=>({...s,open:false}))}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition">Batal</button>
              <button onClick={cart.confirmOptionSheet}
                className="flex-[2] py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-black shadow-lg shadow-purple-100 transition flex items-center justify-center gap-2">
                Tambah ke Keranjang <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HELPER: Option Sheet
// ═══════════════════════════════════════════════════════════════════════════════
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
    <button onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all ${
        active ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200'
        : 'border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50'
      }`}>
      {label}
    </button>
  );
}
