import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  Search, Filter, Plus, X, ChevronRight,
  TrendingUp, Tag, History, Download, Printer,
  ChevronDown, BadgeCheck, Zap,
} from 'lucide-react';
import { RecipeWithDetails, Ingredient, Sale } from '../../types';
import { useCart } from './hooks/useCart';
import { useCheckout } from './hooks/useCheckout';
import KasirStatsBar from './components/KasirStatsBar';
import KasirMenuGrid from './components/KasirMenuGrid';
import KasirCartPanel from './components/KasirCartPanel';
import VoucherGenerator from './components/VoucherGenerator';
import { VoucherResult, formatIDR } from './utils/salesHelpers';
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

type PaymentFilter = 'SEMUA' | 'CASH' | 'QRIS' | 'TRANSFER' | 'EDC';
type OwnerTab = 'log' | 'voucher';

// ── Payment badge colors ───────────────────────────────────────────────────────
const pmColor: Record<string, string> = {
  CASH: 'bg-emerald-100 text-emerald-700',
  QRIS: 'bg-violet-100 text-violet-700',
  TRANSFER: 'bg-sky-100 text-sky-700',
  EDC: 'bg-amber-100 text-amber-700',
};

// ── Owner View ────────────────────────────────────────────────────────────────
function OwnerSalesView({
  sales, user, onNavigateToKasir, generatedVouchers, setGeneratedVouchers,
}: {
  sales: Sale[];
  user: any;
  onNavigateToKasir: () => void;
  generatedVouchers: Record<string, VoucherResult>;
  setGeneratedVouchers: React.Dispatch<React.SetStateAction<Record<string, VoucherResult>>>;
}) {
  const [activeTab, setActiveTab] = useState<OwnerTab>('log');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('SEMUA');
  const [filterOpen, setFilterOpen] = useState(false);
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('today');

  // ── Filter sales by date range ─────────────────────────────────────────────
  const filteredByDate = useMemo(() => {
    const now = new Date();
    return sales.filter(s => {
      if (!s.created_at) return false;
      const d = new Date(s.created_at);
      if (dateRange === 'today') return d.toDateString() === now.toDateString();
      if (dateRange === 'week') {
        const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
        return d >= weekAgo;
      }
      if (dateRange === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      return true;
    });
  }, [sales, dateRange]);

  const filteredSales = useMemo(() => {
    if (paymentFilter === 'SEMUA') return filteredByDate;
    return filteredByDate.filter(s => s.payment_method === paymentFilter);
  }, [filteredByDate, paymentFilter]);

  const totalRevenue = filteredSales.reduce((a, s) => a + (s.total_price ?? 0), 0);
  const avgTransaction = filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0;

  const paymentBreakdown = useMemo(() => {
    const methods: PaymentFilter[] = ['CASH', 'QRIS', 'TRANSFER', 'EDC'];
    return methods.map(m => ({
      method: m,
      count: filteredByDate.filter(s => s.payment_method === m).length,
      total: filteredByDate.filter(s => s.payment_method === m).reduce((a, s) => a + (s.total_price ?? 0), 0),
    }));
  }, [filteredByDate]);

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const exportCSV = useCallback(() => {
    const rows = [
      ['Waktu', 'Menu', 'Qty', 'Metode Bayar', 'Total'],
      ...filteredSales.map(s => [
        s.created_at ? new Date(s.created_at).toLocaleString('id-ID') : '-',
        s.menu_name ?? '-', s.quantity ?? 1, s.payment_method ?? '-', s.total_price ?? 0,
      ]),
      ['', '', '', 'TOTAL', totalRevenue],
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi-${dateRange}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredSales, totalRevenue, dateRange]);

  // ── Export PDF ─────────────────────────────────────────────────────────────
  const exportPDF = useCallback(() => {
    const rows = filteredSales.map(s => `
      <tr>
        <td>${s.created_at ? new Date(s.created_at).toLocaleString('id-ID') : '-'}</td>
        <td>${s.menu_name ?? '-'}</td>
        <td>${s.quantity ?? 1}x</td>
        <td>${s.payment_method ?? '-'}</td>
        <td style="text-align:right">${formatIDR(s.total_price ?? 0)}</td>
      </tr>`).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>Laporan Transaksi</title>
      <style>
        body{font-family:Arial,sans-serif;font-size:12px;padding:24px}
        h2{color:#7c3aed;margin-bottom:4px}p{color:#64748b;margin:0 0 16px}
        table{width:100%;border-collapse:collapse}
        th{background:#f8f5ff;color:#7c3aed;text-align:left;padding:8px 10px;border-bottom:2px solid #e2e8f0;font-size:11px;text-transform:uppercase}
        td{padding:7px 10px;border-bottom:1px solid #f1f5f9}
        tfoot td{font-weight:bold;background:#f8f5ff;color:#7c3aed}
      </style></head><body>
      <h2>Laporan Transaksi — ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
      <p>Owner: ${user?.nama ?? '-'} &nbsp;|&nbsp; Filter: ${paymentFilter} &nbsp;|&nbsp; Periode: ${dateRange}</p>
      <table>
        <thead><tr><th>Waktu</th><th>Menu</th><th>Qty</th><th>Bayar</th><th style="text-align:right">Total</th></tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr><td colspan="4">Total ${filteredSales.length} transaksi</td><td style="text-align:right">${formatIDR(totalRevenue)}</td></tr></tfoot>
      </table></body></html>`;

    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); w.focus(); setTimeout(() => w.print(), 400); }
  }, [filteredSales, totalRevenue, paymentFilter, dateRange, user]);

  return (
    <div className="min-h-full w-full bg-transparent space-y-4">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-[16px] font-bold text-slate-800">Laporan Penjualan</h1>
            <BadgeCheck size={14} className="text-purple-500" />
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Pantau transaksi, analisis pendapatan, dan kelola voucher.</p>
        </div>
        <button
          onClick={onNavigateToKasir}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold transition flex-shrink-0 shadow-sm shadow-purple-200"
        >
          <Zap size={13} /> Mode Kasir
        </button>
      </div>

      {/* ── Summary cards ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard label="Total Pendapatan" value={formatIDR(totalRevenue)} accent="green" />
        <SummaryCard label="Jumlah Transaksi" value={`${filteredSales.length}×`} accent="blue" />
        <SummaryCard label="Rata-rata Transaksi" value={formatIDR(avgTransaction)} accent="purple" />
        <SummaryCard label="Voucher Aktif" value={`${Object.keys(generatedVouchers).length} kode`} accent="orange" />
      </div>

      {/* ── Payment breakdown ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {paymentBreakdown.map(b => (
          <div key={b.method} className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${pmColor[b.method] ?? 'bg-slate-100 text-slate-600'}`}>{b.method}</span>
              <span className="text-[10px] text-slate-400">{b.count}×</span>
            </div>
            <p className="text-[14px] font-extrabold text-slate-800">{formatIDR(b.total)}</p>
          </div>
        ))}
      </div>

      {/* ── Tabs ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
        {/* Tab nav */}
        <div className="flex border-b border-slate-100 px-4 pt-3 gap-1">
          <TabPill active={activeTab === 'log'} onClick={() => setActiveTab('log')} icon={<History size={12} />} label="Log Transaksi" />
          <TabPill active={activeTab === 'voucher'} onClick={() => setActiveTab('voucher')} icon={<Tag size={12} />} label="Voucher & Promo" />
        </div>

        {/* ── Log Transaksi ────────────────────────────────────────────────── */}
        {activeTab === 'log' && (
          <div className="p-4 space-y-3">
            {/* Toolbar */}
            <div className="flex items-center gap-2 flex-wrap">
              {/* Date range */}
              <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
                {(['today', 'week', 'month'] as const).map(r => (
                  <button
                    key={r}
                    onClick={() => setDateRange(r)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition ${dateRange === r ? 'bg-white text-purple-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {r === 'today' ? 'Hari Ini' : r === 'week' ? '7 Hari' : 'Bulan Ini'}
                  </button>
                ))}
              </div>

              <div className="ml-auto flex items-center gap-2">
                <TrendingUp size={13} className="text-purple-400" />
                <span className="text-[11px] font-bold text-slate-600">{filteredSales.length} transaksi</span>
              </div>

              {/* Payment filter */}
              <div className="relative">
                <button
                  onClick={() => setFilterOpen(p => !p)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:border-purple-300 transition shadow-sm"
                >
                  <Filter size={11} /> {paymentFilter}
                  <ChevronDown size={10} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 min-w-[120px] overflow-hidden">
                    {(['SEMUA', 'CASH', 'QRIS', 'TRANSFER', 'EDC'] as PaymentFilter[]).map(m => (
                      <button
                        key={m}
                        onClick={() => { setPaymentFilter(m); setFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-semibold transition hover:bg-purple-50 hover:text-purple-700 ${paymentFilter === m ? 'bg-purple-50 text-purple-700' : 'text-slate-600'}`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition">
                <Download size={11} /> Excel
              </button>
              <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl text-[11px] font-semibold text-sky-700 hover:bg-sky-100 transition">
                <Printer size={11} /> PDF
              </button>
            </div>

            {/* Table */}
            {filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-300">
                <History size={36} strokeWidth={1.5} className="mb-3" />
                <p className="text-[13px] font-semibold text-slate-400">Belum ada transaksi</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  {paymentFilter !== 'SEMUA' ? `Tidak ada transaksi ${paymentFilter}` : `Tidak ada transaksi untuk periode ini`}
                </p>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden border border-slate-100">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-gradient-to-r from-slate-50 to-purple-50/30 border-b border-slate-100">
                      <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Waktu</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Menu</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Qty</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Bayar</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-400 uppercase tracking-widest text-[9px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((s, i) => (
                      <tr key={s.id} className={`border-b border-slate-50 hover:bg-purple-50/30 transition ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                        <td className="px-4 py-2.5 text-slate-400 font-mono text-[10px]">
                          {s.created_at ? new Date(s.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-700 max-w-[180px]">
                          <span className="truncate block">{s.menu_name ?? '—'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500"><span className="font-bold">{s.quantity ?? 1}</span>×</td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${pmColor[s.payment_method ?? ''] ?? 'bg-slate-100 text-slate-600'}`}>
                            {s.payment_method ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-700">{formatIDR(s.total_price ?? 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-purple-100 bg-gradient-to-r from-purple-50/60 to-slate-50">
                      <td colSpan={4} className="px-4 py-3 font-black text-purple-800 text-[11px]">Total {filteredSales.length} transaksi</td>
                      <td className="px-4 py-3 text-right font-black text-purple-700 text-[13px]">{formatIDR(totalRevenue)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Voucher & Promo ──────────────────────────────────────────────── */}
        {activeTab === 'voucher' && (
          <div className="p-4 space-y-4">
            {/* Active vouchers */}
            {Object.keys(generatedVouchers).length > 0 && (
              <div>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                  Voucher Aktif ({Object.keys(generatedVouchers).length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries(generatedVouchers).map(([code, v]) => (
                    <div
                      key={code}
                      className="flex items-center gap-3 bg-gradient-to-r from-purple-50 to-white border border-purple-100 rounded-xl px-3.5 py-2.5"
                    >
                      <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <Tag size={13} className="text-purple-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-slate-800 font-mono">{code}</p>
                        <p className="text-[10px] text-purple-600 font-semibold truncate">{v.label}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Generator */}
            <div className="border border-slate-100 rounded-xl overflow-hidden">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50/60 to-slate-50 border-b border-slate-100">
                <p className="text-[12px] font-black text-slate-700">Buat Voucher Baru</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Voucher berlaku untuk semua menu.</p>
              </div>
              <div className="p-4">
                <VoucherGenerator
                  restaurantId={user?.restaurant_id}
                  sessionId={user?.sessionId}
                  onVoucherGenerated={(code: string, voucher: VoucherResult) => {
                    setGeneratedVouchers(prev => ({ ...prev, [code.toUpperCase()]: voucher }));
                  }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ label, value, accent }: { label: string; value: string; accent: 'green' | 'blue' | 'purple' | 'orange' }) {
  const map = {
    green:  { bg: 'bg-emerald-50 border-emerald-100', label: 'text-emerald-500', value: 'text-emerald-700' },
    blue:   { bg: 'bg-sky-50 border-sky-100',         label: 'text-sky-500',     value: 'text-sky-700'     },
    purple: { bg: 'bg-purple-50 border-purple-100',   label: 'text-purple-500',  value: 'text-purple-700'  },
    orange: { bg: 'bg-orange-50 border-orange-100',   label: 'text-orange-500',  value: 'text-orange-700'  },
  };
  const c = map[accent];
  return (
    <div className={`px-4 py-3 border rounded-2xl shadow-sm ${c.bg}`}>
      <p className={`text-[9px] font-bold uppercase tracking-widest ${c.label}`}>{label}</p>
      <p className={`text-[14px] font-extrabold mt-0.5 ${c.value}`}>{value}</p>
    </div>
  );
}

// ── Tab Pill ──────────────────────────────────────────────────────────────────
function TabPill({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold transition mb-[-1px] border-b-2 ${
        active ? 'text-purple-700 border-purple-500 bg-purple-50/50' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {icon}{label}
    </button>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function SalesPage({
  recipes, ingredients, sales,
  onTriggerSale, onRefreshStats, onNavigateToKasir,
  user,
}: SalesPageProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [generatedVouchers, setGeneratedVouchers] = useState<Record<string, VoucherResult>>({});

  const cart = useCart(recipes, ingredients, generatedVouchers, user?.sessionId);
  const { checkoutLoading, handleCheckout } = useCheckout();
  const activeRecipe = recipes.find(r => r.menu_name === cart.optionSheet.menuName);

  // Load vouchers
  useEffect(() => {
    if (!user?.restaurant_id) return;
    const apiFetch = makeApiFetch(user?.sessionId);
    apiFetch(`/api/vouchers?restaurant_id=${user.restaurant_id}`)
      .then(r => r.json())
      .then((res: any) => {
        const vouchers: any[] = Array.isArray(res.data) ? res.data : [];
        const map: Record<string, VoucherResult> = {};
        vouchers.forEach(v => {
          map[v.code.toUpperCase()] = {
            valid: true,
            type: v.type === 'PERCENTAGE' ? 'percent' : 'flat',
            value: Number(v.value),
            label: v.type === 'PERCENTAGE'
              ? `Diskon ${v.value}%`
              : `Diskon Rp ${new Intl.NumberFormat('id-ID').format(Number(v.value))}`,
            id: v.id,
          };
        });
        setGeneratedVouchers(map);
      })
      .catch(console.error);
  }, [user?.restaurant_id]);

  const doCheckout = useCallback(() => {
    handleCheckout({
      cart: cart.cart, recipes,
      paymentMethod: cart.paymentMethod,
      cashPaid: cart.cashPaid, cashChange: cart.cashChange,
      totals: cart.totals, discount: cart.discount,
      finalTotal: cart.finalTotal, voucherCode: cart.voucherCode,
      voucherId: cart.voucher?.id, voucherLabel: cart.voucher?.label,
      isCartEmpty: cart.isCartEmpty, paymentError: cart.paymentError,
      onTriggerSale, onRefreshStats,
      cashInputRef: cart.cashInputRef,
      onSuccess: () => { cart.clearCart(); },
    });
  }, [cart, handleCheckout, recipes, onTriggerSale, onRefreshStats]);

  const isOwner = user?.role === 'Pemilik';

  // ── Owner View ─────────────────────────────────────────────────────────────
  if (isOwner) {
    return (
      <OwnerSalesView
        sales={sales}
        user={user}
        onNavigateToKasir={onNavigateToKasir}
        generatedVouchers={generatedVouchers}
        setGeneratedVouchers={setGeneratedVouchers}
      />
    );
  }

  // ── Kasir View (default) ───────────────────────────────────────────────────
  return (
    <div className="min-h-full w-full bg-transparent p-4 space-y-4">
      {/* Topbar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-bold text-slate-800">Kasir Penjualan</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Input penjualan kasir dan cetak struk transaksi.</p>
        </div>
        <div className="relative w-64 flex-shrink-0">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Produk / Barcode…"
            className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-purple-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-50 bg-white flex-shrink-0">
          <Filter size={13} /> Filter
        </button>
        <button
          onClick={onNavigateToKasir}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold transition flex-shrink-0"
        >
          <Plus size={13} /> Mode Kasir
        </button>
      </div>

      <KasirStatsBar sales={sales} onOpenVoucherGenerator={() => {}} />

      <div className="flex gap-4">
        <div className="flex-1 min-w-0">
          <KasirMenuGrid
            recipes={recipes} ingredients={ingredients}
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
            onAddItem={(menu: RecipeWithDetails) => cart.openOptionSheet(menu.menu_name)}
          />
        </div>
        <KasirCartPanel
          recipes={recipes} cart={cart.cart} totals={cart.totals}
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
          onCheckout={doCheckout}
        />
      </div>

      {/* Option Sheet */}
      {cart.optionSheet.open && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4"
          onClick={() => cart.setOptionSheet(s => ({ ...s, open: false }))}
        >
          <div className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
              <div>
                <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-0.5">Kustomisasi Pesanan</p>
                <h3 className="text-[15px] font-black text-slate-800 capitalize">{cart.optionSheet.menuName}</h3>
              </div>
              <button onClick={() => cart.setOptionSheet(s => ({ ...s, open: false }))} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition">
                <X size={14} className="text-slate-500" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5 max-h-[60vh] overflow-y-auto">
              {activeRecipe?.spice_level_option === 1 && (
                <OptionGroup label="🌶️ Level Pedas">
                  {['Tidak Pedas', 'Sedang', 'Pedas', 'Sangat Pedas'].map(s => (
                    <OptionChip key={s} label={s} active={cart.optionSheet.spice === s} onClick={() => cart.setOptionSheet(p => ({ ...p, spice: s }))} />
                  ))}
                </OptionGroup>
              )}
              {activeRecipe?.sugar_level_option === 1 && (
                <OptionGroup label="🧋 Level Gula">
                  {['Less Sugar (70%)', 'Normal (100%)', 'Extra Sugar (130%)'].map(s => (
                    <OptionChip key={s} label={s} active={cart.optionSheet.sugar === s} onClick={() => cart.setOptionSheet(p => ({ ...p, sugar: s }))} />
                  ))}
                </OptionGroup>
              )}
              {cart.optionSheet.customFields.map(field => (
                <OptionGroup key={field.name} label={`✨ ${field.name}`}>
                  {field.choices.map(choice => (
                    <OptionChip key={choice} label={choice} active={cart.optionSheet.customChoices[field.name] === choice}
                      onClick={() => cart.setOptionSheet(p => ({ ...p, customChoices: { ...p.customChoices, [field.name]: choice } }))} />
                  ))}
                </OptionGroup>
              ))}
            </div>
            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3">
              <button onClick={() => cart.setOptionSheet(s => ({ ...s, open: false }))} className="flex-1 py-3 rounded-2xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition">Batal</button>
              <button onClick={cart.confirmOptionSheet} className="flex-[2] py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white text-[12px] font-black shadow-lg shadow-purple-100 transition flex items-center justify-center gap-2">
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
      className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all ${
        active ? 'bg-purple-600 text-white border-purple-600 shadow-sm shadow-purple-200' : 'border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50'
      }`}
    >
      {label}
    </button>
  );
}