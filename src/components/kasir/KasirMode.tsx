import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  ShoppingCart,
  LogOut,
  History,
  Tag,
  TrendingUp,
  Zap,
  Filter,
  Download,
  ChevronDown,
  BadgeCheck,
  Layers,
  Scan,
  Utensils,
} from 'lucide-react';
import { RecipeWithDetails, Ingredient, Sale } from '../../types';
import { useCart } from '../sales/hooks/useCart';
import { useCheckout } from '../sales/hooks/useCheckout';
import KasirMenuGrid from '../sales/components/KasirMenuGrid';
import KasirCartPanel from '../sales/components/KasirCartPanel';
import VoucherGenerator from '../sales/components/VoucherGenerator';
import {
  calculateCookableLimit,
  formatIDR,
  VoucherResult,
} from '../sales/utils/salesHelpers';
import { makeApiFetch } from '../../utils/api';
import { CheckCircle, Printer } from 'lucide-react';
import { useFeatures } from '../../hooks/useFeatures';

// ── Existing pages, reused as-is for staff tabs (Inventori & OCR) ──────────────
// These are the SAME components the Owner uses — no new UI is built from
// scratch. Only the navigation (tab vs sidebar) differs between roles.
import Inventory from '../inventory';
import ReceiptScanner from '../ReceiptScanner';
import RecipeSystem from '../recipes';

// ── Click sound ───────────────────────────────────────────────────────────────
const playClick = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.frequency.setValueAtTime(880, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.08);
    g.gain.setValueAtTime(0.18, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    o.start(ctx.currentTime);
    o.stop(ctx.currentTime + 0.12);
  } catch {
    /* ignore */
  }
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface Props {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  sales: Sale[];
  onTriggerSale: (data: any) => Promise<void>;
  onRefreshStats: () => void;
  onExit: () => void;
  user?: any;

  // ── Needed for the Inventori tab (reuses the same Inventory page Owner uses) ──
  onAddIngredient: (payload: any) => Promise<void>;
  onEditIngredient: (id: number, payload: any) => Promise<void>;
  onAdjustStock: (id: number, finalStock: number, notes: string) => Promise<void>;
  onDeleteIngredient: (id: number) => Promise<void>;

  // ── Needed for the OCR tab (reuses the same ReceiptScanner page Owner uses) ──
  onScanReceipt: (base64: string, mimeType: string) => Promise<any>;
  onConfirmReceiptItems: (items: any[]) => Promise<void>;

  // ── Needed for the Resep tab (reuses the same RecipeSystem page Owner uses) ──
  onAddOrUpdateRecipe: (
    menuName: string,
    items: { ingredient_id: number; amount: number }[],
    category?: string,
    spice_level_option?: boolean,
    sugar_level_option?: boolean,
    custom_options?: string,
    price?: number
  ) => Promise<void>;
  onDeleteRecipe: (menuName: string) => Promise<void>;
}

type Tab = 'pos' | 'riwayat' | 'voucher' | 'inventori' | 'resep' | 'ocr';
type PaymentFilter = 'SEMUA' | 'CASH' | 'QRIS' | 'TRANSFER' | 'EDC';

// ── Stat Card ─────────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: 'green' | 'blue' | 'purple' | 'orange';
}) {
  const accentMap: Record<string, { bg: string; label: string; value: string }> = {
    green: { bg: 'bg-emerald-50 border-emerald-100', label: 'text-emerald-500', value: 'text-emerald-700' },
    blue: { bg: 'bg-sky-50 border-sky-100', label: 'text-sky-500', value: 'text-sky-700' },
    purple: { bg: 'bg-purple-50 border-purple-100', label: 'text-purple-500', value: 'text-purple-700' },
    orange: { bg: 'bg-orange-50 border-orange-100', label: 'text-orange-500', value: 'text-orange-700' },
  };

  const c = accentMap[accent];

  return (
    <div className={`px-3.5 py-2 border rounded-xl ${c.bg}`}>
      <p className={`text-[9px] font-bold uppercase tracking-widest ${c.label}`}>{label}</p>
      <p className={`text-[13px] font-extrabold mt-0.5 ${c.value}`}>{value}</p>
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────
function TabBtn({
  active,
  onClick,
  icon,
  label,
  badge,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all duration-200 ${active
        ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
        }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
          {badge > 99 ? '99' : badge}
        </span>
      )}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function KasirMode({
  recipes,
  ingredients,
  sales,
  onTriggerSale,
  onRefreshStats,
  onExit,
  user,
  onAddIngredient,
  onEditIngredient,
  onAdjustStock,
  onDeleteIngredient,
  onScanReceipt,
  onConfirmReceiptItems,
  onAddOrUpdateRecipe,
  onDeleteRecipe,
}: Props) {
  const { can } = useFeatures();

  // ── Permission-filtered tab list ──────────────────────────────────────────
  // This is the single source of truth for which tabs this staff member sees.
  // Same `can()` checks the Owner's sidebar already uses — just rendered as
  // tabs here instead of a sidebar.
  const availableTabs = useMemo(
    () =>
      (
        [
          { id: 'pos' as Tab, label: 'POS', icon: <Zap size={14} />, show: can('pos.view') },
          { id: 'riwayat' as Tab, label: 'Riwayat', icon: <History size={14} />, show: can('pos.view_history') },
          { id: 'voucher' as Tab, label: 'Voucher', icon: <Tag size={14} />, show: can('pos.apply_voucher') },
          { id: 'inventori' as Tab, label: 'Inventori', icon: <Layers size={14} />, show: can('inventory.view') },
          { id: 'resep' as Tab, label: 'Resep', icon: <Utensils size={14} />, show: can('recipes.view') },
          { id: 'ocr' as Tab, label: 'OCR', icon: <Scan size={14} />, show: can('ocr.scan') },
        ] as { id: Tab; label: string; icon: React.ReactNode; show: boolean }[]
      ).filter((t) => t.show),
    [can]
  );

  const [activeTab, setActiveTab] = useState<Tab>(availableTabs[0]?.id ?? 'pos');

  // If the active tab becomes unavailable (e.g. owner revokes a permission
  // mid-session) or on first mount, fall back to the first tab this staff
  // member is actually allowed to see.
  useEffect(() => {
    if (!availableTabs.some((t) => t.id === activeTab)) {
      setActiveTab(availableTabs[0]?.id ?? 'pos');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [availableTabs]);

  const [search, setSearch] = useState('');
  const [generatedVouchers, setGeneratedVouchers] = useState<Record<string, VoucherResult>>({});

  // ── Riwayat state ──────────────────────────────────────────────────────────
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('SEMUA');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // ── Cart & checkout hooks ──────────────────────────────────────────────────
  const cart = useCart(recipes, ingredients, generatedVouchers, user?.sessionId);
  const { checkoutLoading, handleCheckout } = useCheckout();
  const [lastSale, setLastSale] = useState<any>(null);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Load vouchers
  useEffect(() => {
    if (!user?.restaurant_id) return;
    const apiFetch = makeApiFetch(user?.sessionId);
    apiFetch(`/api/vouchers?restaurant_id=${user.restaurant_id}`)
      .then((r) => r.json())
      .then((res: any) => {
        const vouchers: any[] = Array.isArray(res.data) ? res.data : [];
        const map: Record<string, VoucherResult> = {};
        vouchers.forEach((v) => {
          map[v.code.toUpperCase()] = {
            valid: true,
            type: v.type === 'PERCENTAGE' ? 'percent' : 'flat',
            value: Number(v.value),
            label:
              v.type === 'PERCENTAGE'
                ? `Diskon ${v.value}%`
                : `Diskon Rp ${new Intl.NumberFormat('id-ID').format(Number(v.value))}`,
            id: v.id,
          };
        });
        setGeneratedVouchers(map);
      })
      .catch(console.error);
  }, [user?.restaurant_id]);

  // Gunakan ref agar onSuccess tidak stale walau parent re-render di tengah checkout
  const setLastSaleRef = useRef(setLastSale);
  useEffect(() => { setLastSaleRef.current = setLastSale; }, [setLastSale]);

  const doCheckout = useCallback(() => {
    handleCheckout({
      cart: cart.cart,
      recipes,
      paymentMethod: cart.paymentMethod,
      cashPaid: cart.cashPaid,
      cashChange: cart.cashChange,
      totals: cart.totals,
      discount: cart.discount,
      finalTotal: cart.finalTotal,
      voucherCode: cart.voucherCode,
      voucherId: cart.voucher?.id,
      voucherLabel: cart.voucher?.label,
      isCartEmpty: cart.isCartEmpty,
      paymentError: cart.paymentError,
      onTriggerSale,
      onRefreshStats,
      cashInputRef: cart.cashInputRef,
      onSuccess: (receipt) => {
        console.log('✅ onSuccess dipanggil, set lastSale:', receipt);
        setLastSaleRef.current(receipt); // pakai ref → tidak pernah stale
      },
    });
  }, [
    cart.cart,
    cart.paymentMethod,
    cart.cashPaid,
    cart.cashChange,
    cart.totals,
    cart.discount,
    cart.finalTotal,
    cart.voucherCode,
    cart.voucher,
    cart.isCartEmpty,
    cart.paymentError,
    cart.cashInputRef,
    handleCheckout,
    recipes,
    onTriggerSale,
    onRefreshStats,
  ]);

  // ── Satu handler terpusat untuk tutup receipt ─────────────────
  const handleReceiptClose = useCallback(() => {
    setLastSale(null);
    cart.clearCart();
    onRefreshStats();
  }, [cart.clearCart, onRefreshStats]);

  // ── Item add handler ───────────────────────────────────────────────────────
  const handleAddItem = useCallback(
    (r: RecipeWithDetails) => {
      const limit = calculateCookableLimit(r, ingredients);
      if (limit <= 0) return;
      playClick();
      cart.openOptionSheet(r.menu_name);
    },
    [cart, ingredients]
  );

  // ── Today's sales ──────────────────────────────────────────────────────────
  const todaySales = useMemo(() => {
    const today = new Date().toDateString();
    return sales.filter(
      (s) => s.created_at && new Date(s.created_at).toDateString() === today
    );
  }, [sales]);

  const filteredSales = useMemo(() => {
    if (paymentFilter === 'SEMUA') return todaySales;
    return todaySales.filter((s) => s.payment_method === paymentFilter);
  }, [todaySales, paymentFilter]);

  const todayTotal = todaySales.reduce((s, sale) => s + (sale.total_price ?? 0), 0);
  const todayCount = todaySales.length;

  const filteredTotal = filteredSales.reduce((s, sale) => s + (sale.total_price ?? 0), 0);

  // ── Payment breakdown ──────────────────────────────────────────────────────
  const paymentBreakdown = useMemo(() => {
    const methods: PaymentFilter[] = ['CASH', 'QRIS', 'TRANSFER', 'EDC'];
    return methods.map((m) => ({
      method: m,
      count: todaySales.filter((s) => s.payment_method === m).length,
      total: todaySales
        .filter((s) => s.payment_method === m)
        .reduce((a, s) => a + (s.total_price ?? 0), 0),
    }));
  }, [todaySales]);

  // ── Export Excel (CSV) ─────────────────────────────────────────────────────
  const exportExcel = useCallback(() => {
    const rows = [
      ['Waktu', 'Menu', 'Qty', 'Metode Bayar', 'Total'],
      ...filteredSales.map((s) => [
        s.created_at ? new Date(s.created_at).toLocaleTimeString('id-ID') : '-',
        s.menu_name ?? '-',
        s.quantity ?? 1,
        s.payment_method ?? '-',
        s.total_price ?? 0,
      ]),
      ['', '', '', 'TOTAL', filteredTotal],
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredSales, filteredTotal]);

  // ── Export PDF (print) ─────────────────────────────────────────────────────
  const exportPDF = useCallback(() => {
    const tableRows = filteredSales
      .map(
        (s) =>
          `<tr>
            <td>${s.created_at ? new Date(s.created_at).toLocaleTimeString('id-ID') : '-'}</td>
            <td>${s.menu_name ?? '-'}</td>
            <td>${s.quantity ?? 1}x</td>
            <td>${s.payment_method ?? '-'}</td>
            <td style="text-align:right">${formatIDR(s.total_price ?? 0)}</td>
          </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>Laporan Transaksi</title>
<style>
  body { font-family: Arial, sans-serif; font-size: 12px; padding: 24px; }
  h2 { color: #7c3aed; margin-bottom: 4px; }
  p { color: #64748b; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #f8f5ff; color: #7c3aed; text-align: left; padding: 8px 10px; border-bottom: 2px solid #e2e8f0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; }
  tfoot td { font-weight: bold; background: #f8f5ff; color: #7c3aed; }
</style>
</head><body>
<h2>Laporan Transaksi — ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2>
<p>Kasir: ${user?.nama ?? '-'} &nbsp;|&nbsp; Filter: ${paymentFilter}</p>
<table>
  <thead><tr><th>Waktu</th><th>Menu</th><th>Qty</th><th>Bayar</th><th style="text-align:right">Total</th></tr></thead>
  <tbody>${tableRows}</tbody>
  <tfoot><tr><td colspan="4">Total ${filteredSales.length} transaksi</td><td style="text-align:right">${formatIDR(filteredTotal)}</td></tr></tfoot>
</table>
</body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.focus();
      setTimeout(() => w.print(), 400);
    }
  }, [filteredSales, filteredTotal, paymentFilter, user]);

  // ── Thermal Bluetooth Print ────────────────────────────────────────────────
  const thermalPrint = useCallback(async () => {
    try {
      if (!(navigator as any).bluetooth) {
        alert('Browser ini tidak mendukung Web Bluetooth. Gunakan Chrome/Edge di Android/Windows.');
        return;
      }
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [{ services: ['000018f0-0000-1000-8000-00805f9b34fb'] }],
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      });
      const server = await device.gatt.connect();
      const service = await server.getPrimaryService('000018f0-0000-1000-8000-00805f9b34fb');
      const char = await service.getCharacteristic('00002af1-0000-1000-8000-00805f9b34fb');

      const enc = new TextEncoder();
      const lines = [
        `================================\n`,
        `         RESTOFLOW\n`,
        `================================\n`,
        `${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`,
        `Kasir: ${user?.nama ?? '-'}\n`,
        `--------------------------------\n`,
        ...filteredSales.map(
          (s) =>
            `${(s.menu_name ?? '-').padEnd(18).slice(0, 18)} ${String(s.quantity ?? 1).padStart(2)}x ${formatIDR(s.total_price ?? 0)}\n`
        ),
        `--------------------------------\n`,
        `TOTAL              ${formatIDR(filteredTotal)}\n`,
        `================================\n\n\n`,
      ];

      for (const line of lines) {
        const chunk = enc.encode(line);
        await char.writeValue(chunk);
      }

      alert('✅ Berhasil dicetak ke printer thermal!');
    } catch (err: any) {
      if (err?.name !== 'NotFoundError') {
        console.error(err);
        alert('Gagal terhubung ke printer. Pastikan Bluetooth aktif dan printer kompatibel.');
      }
    }
  }, [filteredSales, filteredTotal, user]);

  // ── Payment method badge color ─────────────────────────────────────────────
  const pmColor: Record<string, string> = {
    CASH: 'bg-emerald-100 text-emerald-700',
    QRIS: 'bg-violet-100 text-violet-700',
    TRANSFER: 'bg-sky-100 text-sky-700',
    EDC: 'bg-amber-100 text-amber-700',
  };

  // ── No tabs available at all ────────────────────────────────────────────────
  if (availableTabs.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-50">
        <div className="text-center px-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 flex items-center justify-center mx-auto mb-4">
            <ShoppingCart size={24} className="text-slate-400" />
          </div>
          <p className="text-[14px] font-bold text-slate-600 mb-1">Belum Ada Akses</p>
          <p className="text-[12px] text-slate-400 mb-5">
            Akun kamu belum diberikan izin akses fitur apapun. Hubungi pemilik restoran.
          </p>
          <button
            onClick={onExit}
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-white text-[12px] font-bold hover:bg-slate-900 transition"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
        background: 'linear-gradient(135deg, #faf5ff 0%, #f8fafc 60%, #f0f9ff 100%)',
      }}
    >
      {/* ── Topbar ──────────────────────────────────────────────────────────── */}
      <header className="bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm px-5 py-2.5 flex items-center gap-3 flex-shrink-0 z-10">
        <div className="flex items-center gap-3 flex-shrink-0">
          <div
            className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md"
            style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' }}
          >
            <ShoppingCart size={16} className="text-white" />
          </div>
          <div className="leading-none">
            <div className="flex items-center gap-1.5">
              <p className="text-[13px] font-black text-slate-800">Mode Kerja</p>
              <BadgeCheck size={12} className="text-purple-500" />
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {user?.nama ?? 'Staff'} &nbsp;·&nbsp;
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
        </div>

        <div className="h-8 w-px bg-slate-100 flex-shrink-0 hidden md:block" />

        {can('pos.view') && (
          <div className="hidden md:flex items-center gap-2">
            <StatCard label="Omzet Hari Ini" value={formatIDR(todayTotal)} accent="green" />
            <StatCard label="Transaksi" value={`${todayCount}×`} accent="blue" />
            <StatCard
              label="Avg Transaksi"
              value={todayCount > 0 ? formatIDR(Math.round(todayTotal / todayCount)) : 'Rp 0'}
              accent="purple"
            />
          </div>
        )}

        {/* Tabs are rendered only for what this staff member is permitted to see.
            Same can() checks the Owner's sidebar uses — just shown as tabs here. */}
        <div className="flex items-center gap-1 mx-auto bg-slate-100 rounded-2xl p-1 overflow-x-auto">
          {availableTabs.map((t) => (
            <TabBtn
              key={t.id}
              active={activeTab === t.id}
              onClick={() => setActiveTab(t.id)}
              icon={t.icon}
              label={t.label}
              badge={
                t.id === 'pos'
                  ? (cart.cart.length > 0 ? cart.cart.length : undefined)
                  : t.id === 'riwayat'
                    ? (todayCount > 0 ? todayCount : undefined)
                    : undefined
              }
            />
          ))}
        </div>

        <button
          onClick={onExit}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white text-[12px] font-semibold text-slate-500 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all flex-shrink-0 shadow-sm"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Akhiri Shift</span>
        </button>
      </header>

      {/* ── Tab body ────────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 overflow-hidden">

        {/* ══ TAB: POS ════════════════════════════════════════════════════════ */}
        {activeTab === 'pos' && can('pos.view') && (
          <div className="flex h-full">
            <div className="flex-1 min-w-0 overflow-hidden">
              <KasirMenuGrid
                recipes={recipes}
                ingredients={ingredients}
                onAddItem={handleAddItem}
                searchTerm={search}
                onSearchChange={setSearch}
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
              voucherLabel={cart.voucher?.label}
              checkoutLoading={checkoutLoading}
              cashInputRef={cart.cashInputRef}
              onSetPayment={cart.setPaymentMethod}
              onSetCashPaid={cart.setCashPaidAmount}
              onVoucherChange={cart.setVoucherCode}
              onApplyVoucher={cart.handleApplyVoucher}
              onRemoveVoucher={cart.removeVoucher}
              onDecrement={cart.decrementQty}
              onIncrement={(id: string) => cart.incrementQty(id)}
              onRemoveItem={cart.removeItem}
              onClearCart={cart.clearCart}
              onCheckout={doCheckout}
              stockMap={Object.fromEntries(
                recipes.map(r => [r.menu_name, calculateCookableLimit(r, ingredients)])
              )}
            />
          </div>
        )}

        {/* ══ TAB: RIWAYAT ════════════════════════════════════════════════════ */}
        {activeTab === 'riwayat' && can('pos.view_history') && (
          <div className="h-full overflow-y-auto px-5 py-4 space-y-4">

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {paymentBreakdown.map((b) => (
                <div
                  key={b.method}
                  className="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm hover:shadow-md transition"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${pmColor[b.method] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {b.method}
                    </span>
                    <span className="text-[10px] text-slate-400">{b.count}×</span>
                  </div>
                  <p className="text-[15px] font-extrabold text-slate-800">{formatIDR(b.total)}</p>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 mr-auto">
                <TrendingUp size={14} className="text-purple-500" />
                <p className="text-[12px] font-bold text-slate-700">
                  {filteredSales.length} transaksi
                  {paymentFilter !== 'SEMUA' && (
                    <span className="ml-1 text-purple-600">· {paymentFilter}</span>
                  )}
                </p>
              </div>

              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setFilterOpen((p) => !p)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:border-purple-300 hover:text-purple-600 transition shadow-sm"
                >
                  <Filter size={12} />
                  {paymentFilter}
                  <ChevronDown size={11} className={`transition-transform ${filterOpen ? 'rotate-180' : ''}`} />
                </button>
                {filterOpen && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20 min-w-[130px]">
                    {(['SEMUA', 'CASH', 'QRIS', 'TRANSFER', 'EDC'] as PaymentFilter[]).map((m) => (
                      <button
                        key={m}
                        onClick={() => { setPaymentFilter(m); setFilterOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-[11px] font-semibold transition hover:bg-purple-50 hover:text-purple-700 ${paymentFilter === m ? 'bg-purple-50 text-purple-700' : 'text-slate-600'
                          }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {can('pos.export_csv') && (
                <button
                  onClick={exportExcel}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] font-semibold text-emerald-700 hover:bg-emerald-100 transition shadow-sm"
                >
                  <Download size={12} /> Excel
                </button>
              )}
              {can('pos.export_pdf') && (
                <button
                  onClick={exportPDF}
                  className="flex items-center gap-1.5 px-3 py-2 bg-sky-50 border border-sky-200 rounded-xl text-[11px] font-semibold text-sky-700 hover:bg-sky-100 transition shadow-sm"
                >
                  <Download size={12} /> PDF
                </button>
              )}
              {can('pos.thermal_print') && (
                <button
                  onClick={thermalPrint}
                  className="flex items-center gap-1.5 px-3 py-2 bg-violet-50 border border-violet-200 rounded-xl text-[11px] font-semibold text-violet-700 hover:bg-violet-100 transition shadow-sm"
                >
                  <Printer size={12} /> Thermal
                </button>
              )}
            </div>

            {filteredSales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                <History size={40} strokeWidth={1.5} className="mb-3" />
                <p className="text-[13px] font-semibold text-slate-400">Belum ada transaksi hari ini</p>
                <p className="text-[11px] text-slate-300 mt-1">
                  {paymentFilter !== 'SEMUA' ? `Tidak ada transaksi ${paymentFilter}` : 'Mulai transaksi dari tab POS'}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-purple-50/30">
                      <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-widest text-[9px]">Waktu</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-widest text-[9px]">Menu</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-widest text-[9px]">Qty</th>
                      <th className="text-left px-4 py-3 font-bold text-slate-500 uppercase tracking-widest text-[9px]">Bayar</th>
                      <th className="text-right px-4 py-3 font-bold text-slate-500 uppercase tracking-widest text-[9px]">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSales.map((s, i) => (
                      <tr
                        key={s.id}
                        className={`border-b border-slate-50 transition hover:bg-purple-50/40 ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}
                      >
                        <td className="px-4 py-2.5 text-slate-400 font-mono text-[10px]">
                          {s.created_at
                            ? new Date(s.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-slate-700 max-w-[160px]">
                          <span className="truncate block">{s.menu_name ?? '—'}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-500">
                          <span className="font-bold">{s.quantity ?? 1}</span>×
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black ${pmColor[s.payment_method ?? ''] ?? 'bg-slate-100 text-slate-600'}`}>
                            {s.payment_method ?? '—'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-700">
                          {formatIDR(s.total_price ?? 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr
                      className="border-t-2 border-purple-100"
                      style={{ background: 'linear-gradient(90deg, #faf5ff 0%, #f5f3ff 100%)' }}
                    >
                      <td colSpan={4} className="px-4 py-3 font-black text-purple-800 text-[11px]">
                        Total {filteredSales.length} transaksi
                      </td>
                      <td className="px-4 py-3 text-right font-black text-purple-700 text-[13px]">
                        {formatIDR(filteredTotal)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ══ TAB: VOUCHER ════════════════════════════════════════════════════ */}
        {activeTab === 'voucher' && can('pos.apply_voucher') && (
          <div className="h-full overflow-y-auto px-5 py-6">
            <div className="max-w-2xl mx-auto">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-7 h-7 rounded-xl bg-purple-100 flex items-center justify-center">
                    <Tag size={13} className="text-purple-600" />
                  </div>
                  <h2 className="text-[16px] font-black text-slate-800">Voucher & Promo</h2>
                </div>
                <p className="text-[11px] text-slate-400 ml-9">
                  Buat voucher diskon untuk pelanggan setia atau event spesial.
                </p>
              </div>

              {Object.keys(generatedVouchers).length > 0 && (
                <div className="mb-5">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">
                    Voucher Aktif ({Object.keys(generatedVouchers).length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(generatedVouchers)
                      .slice(0, 6)
                      .map(([code, v]) => (
                        <div
                          key={code}
                          className="flex items-center gap-3 bg-white border border-purple-100 rounded-xl px-3.5 py-2.5 shadow-sm"
                          style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' }}
                        >
                          <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                            <Tag size={12} className="text-purple-600" />
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

              <div className="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-purple-50/60 to-slate-50">
                  <p className="text-[12px] font-black text-slate-700">Buat Voucher Baru</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Voucher berlaku untuk semua menu hari ini.</p>
                </div>
                <div className="p-5">
                  {can('pos.generate_voucher') ? (
                    <VoucherGenerator
                      restaurantId={user?.restaurant_id}
                      sessionId={user?.sessionId}
                      onVoucherGenerated={(code: string, voucher: VoucherResult) => {
                        setGeneratedVouchers((prev) => ({
                          ...prev,
                          [code.toUpperCase()]: voucher,
                        }));
                      }}
                    />
                  ) : (
                    <p className="text-[11px] text-slate-400 text-center py-6">
                      Kamu tidak memiliki izin untuk membuat voucher baru.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ══ TAB: INVENTORI ══════════════════════════════════════════════════ */}
        {/* Reuses the exact same Inventory page the Owner sees — no new UI.   */}
        {activeTab === 'inventori' && can('inventory.view') && (
          <div className="h-full overflow-y-auto px-5 py-4">
            <Inventory
              ingredients={ingredients}
              onAddIngredient={onAddIngredient}
              onEditIngredient={onEditIngredient}
              onAdjustStock={onAdjustStock}
              onDeleteIngredient={onDeleteIngredient}
              forceFullscreen
            />
          </div>
        )}

        {/* ══ TAB: OCR ════════════════════════════════════════════════════════ */}
        {/* Reuses the exact same ReceiptScanner page the Owner sees — no new UI. */}
        {activeTab === 'ocr' && can('ocr.scan') && (
          <div className="h-full overflow-y-auto px-5 py-4">
            <ReceiptScanner
              ingredients={ingredients}
              onScanReceipt={onScanReceipt}
              onConfirmReceiptItems={onConfirmReceiptItems}
              onRefreshStats={onRefreshStats}
            />
          </div>
        )}

        {/* ══ TAB: RESEP ══════════════════════════════════════════════════════ */}
        {/* Reuses the exact same RecipeSystem page the Owner sees — no new UI. */}
        {activeTab === 'resep' && can('recipes.view') && (
          <div className="h-full overflow-y-auto">
            <RecipeSystem
              ingredients={ingredients}
              recipes={recipes}
              onAddOrUpdateRecipe={onAddOrUpdateRecipe}
              onDeleteRecipe={onDeleteRecipe}
              forceFullscreen
            />
          </div>
        )}
      </div>

      {/* ── Option Sheet Modal ───────────────────────────────────────────────── */}
      {cart.optionSheet.open && (
        <div
          className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4"
          style={{ background: 'rgba(15,23,42,0.55)', backdropFilter: 'blur(6px)' }}
          onClick={() => cart.setOptionSheet((s: any) => ({ ...s, open: false }))}
        >
          <div
            className="w-full max-w-sm rounded-3xl bg-white shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="px-6 pt-6 pb-4 border-b border-slate-100"
              style={{ background: 'linear-gradient(135deg, #faf5ff 0%, #ffffff 100%)' }}
            >
              <p className="text-[9px] font-black text-purple-500 uppercase tracking-widest mb-1">
                Kustomisasi Pesanan
              </p>
              <h3 className="text-[16px] font-black text-slate-800 capitalize leading-tight">
                {cart.optionSheet.menuName}
              </h3>
            </div>

            <div className="px-6 py-5 space-y-5 max-h-[55vh] overflow-y-auto">
              {(() => {
                const activeRecipe = recipes.find(
                  (r) => r.menu_name === cart.optionSheet.menuName
                );

                return (
                  <>
                    {activeRecipe?.spice_level_option === 1 && (
                      <OptionGroup label="🌶️ Level Pedas">
                        {['Tidak Pedas', 'Sedang', 'Pedas', 'Sangat Pedas'].map((s) => (
                          <OptionChip
                            key={s}
                            label={s}
                            active={cart.optionSheet.spice === s}
                            onClick={() => cart.setOptionSheet((p: any) => ({ ...p, spice: s }))}
                          />
                        ))}
                      </OptionGroup>
                    )}
                    {activeRecipe?.sugar_level_option === 1 && (
                      <OptionGroup label="🧋 Level Gula">
                        {['Less Sugar (70%)', 'Normal (100%)', 'Extra Sugar (130%)'].map((s) => (
                          <OptionChip
                            key={s}
                            label={s}
                            active={cart.optionSheet.sugar === s}
                            onClick={() => cart.setOptionSheet((p: any) => ({ ...p, sugar: s }))}
                          />
                        ))}
                      </OptionGroup>
                    )}
                    {cart.optionSheet.customFields?.map((field: any) => (
                      <OptionGroup key={field.name} label={`✨ ${field.name}`}>
                        {field.choices.map((choice: string) => (
                          <OptionChip
                            key={choice}
                            label={choice}
                            active={cart.optionSheet.customChoices?.[field.name] === choice}
                            onClick={() =>
                              cart.setOptionSheet((p: any) => ({
                                ...p,
                                customChoices: { ...p.customChoices, [field.name]: choice },
                              }))
                            }
                          />
                        ))}
                      </OptionGroup>
                    ))}
                    {!activeRecipe?.spice_level_option &&
                      !activeRecipe?.sugar_level_option &&
                      !cart.optionSheet.customFields?.length && (
                        <p className="text-[12px] text-slate-400 text-center py-4">
                          Tidak ada opsi untuk menu ini.
                        </p>
                      )}
                  </>
                );
              })()}
            </div>

            <div className="px-6 pb-6 pt-4 border-t border-slate-100 flex gap-3">
              <button
                onClick={() => cart.setOptionSheet((s: any) => ({ ...s, open: false }))}
                className="flex-1 py-3 rounded-2xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                onClick={cart.confirmOptionSheet}
                className="flex-[2] py-3.5 rounded-2xl text-white text-[12px] font-black shadow-lg transition flex items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                  boxShadow: '0 4px 20px rgba(124,58,237,0.25)',
                }}
              >
                Tambah ke Keranjang
                <ShoppingCart size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Receipt / Success Modal ──────────────────────────────────────────── */}
      {lastSale && (
        <div
          className="fixed inset-0 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-xl"
          style={{ zIndex: 99999 }}
        >
          <div className="bg-white rounded-[40px] w-full max-w-sm overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)]">
            <div className="p-10 text-center text-white" style={{ background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' }}>
              <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4 border-4 border-white/40">
                <CheckCircle size={56} />
              </div>
              <p className="text-[12px] font-black uppercase tracking-widest opacity-80 mb-2">Transaction Success</p>
              <h2 className="text-4xl font-black mb-1">{formatIDR(lastSale.finalTotal || lastSale.totalAmount)}</h2>
              <p className="text-sm font-medium opacity-90">{lastSale.paymentMethod}</p>
            </div>

            <div className="p-8 space-y-3">
              <button
                type="button"
                onClick={() => {
                  const w = window.open('', '_blank');
                  w?.document.write(`<html><body><h2>STRUK</h2><hr/>TOTAL: ${formatIDR(lastSale.finalTotal)}</body></html>`);
                  w?.document.close();
                  w?.print();
                }}
                className="w-full py-4 border-2 border-slate-100 rounded-3xl font-black text-slate-700 flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
              >
                <Printer size={20} /> Cetak Struk
              </button>

              <button
                type="button"
                onClick={handleReceiptClose}
                className="w-full py-4 bg-purple-600 text-white rounded-3xl font-black text-[16px] shadow-xl shadow-purple-100 transition-all active:scale-95"
              >
                Transaksi Baru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Helper UI ─────────────────────────────────────────────────────────────────
function OptionGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2.5">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function OptionChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3.5 py-2 rounded-xl text-[11px] font-bold border transition-all ${active
        ? 'text-white border-transparent shadow-md'
        : 'border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50'
        }`}
      style={
        active
          ? { background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)', boxShadow: '0 2px 10px rgba(124,58,237,0.2)' }
          : undefined
      }
    >
      {label}
    </button>
  );
}
