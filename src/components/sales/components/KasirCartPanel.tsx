import React, { useState, useEffect, useRef } from 'react';
import {
  Minus, Plus, X, Tag, Trash2,
  Banknote, QrCode, CreditCard, Smartphone,
  Ticket, ArrowRight, CheckCircle, Printer,
} from 'lucide-react';
import { RecipeWithDetails } from '../../../types';
import { formatIDR, formatIDRShort, getCategoryEmoji } from '../utils/salesHelpers';
import { CartItem } from '../utils/cartHelpers';

// ── Checkout success sound ────────────────────────────────────────────────────
const playSuccess = () => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const notes = [523, 659, 784, 1047]; // C E G C
    notes.forEach((freq, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = 'sine';
      o.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      g.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.15);
      o.start(ctx.currentTime + i * 0.1);
      o.stop(ctx.currentTime + i * 0.1 + 0.15);
    });
  } catch { /* ignore */ }
};

// ── Types ─────────────────────────────────────────────────────────────────────
interface KasirCartPanelProps {
  recipes: RecipeWithDetails[];
  cart: CartItem[];
  totals: { subtotal: number; tax: number; service: number; grandTotal: number };
  discount: number;
  finalTotal: number;
  cashPaid: number;
  cashChange: number;
  paymentMethod: 'CASH' | 'QRIS' | 'Debit' | 'Kredit';
  cashPaidAmount: string;
  paymentError: string | null;
  voucherCode: string;
  voucherLabel?: string;
  checkoutLoading: boolean;
  cashInputRef: React.RefObject<HTMLInputElement | null>;
  onSetPayment: (m: 'CASH' | 'QRIS' | 'Debit' | 'Kredit') => void;
  onSetCashPaid: (v: string) => void;
  onVoucherChange: (v: string) => void;
  onApplyVoucher: () => void;
  onRemoveVoucher: () => void;
  onDecrement: (id: string) => void;
  onIncrement: (id: string, currentQty: number, maxQty: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
  // inject last sale for receipt modal
  lastSale?: {
    items: { menuName: string; qty: number; price: number }[];
    paymentMethod: string;
    cashPaid?: number;
    cashChange?: number;
    finalTotal: number;
    voucherLabel?: string;
    discount?: number;
  } | null;
  onReceiptClose?: () => void;
  // expose trigger so parent can fire modal after checkout
  onCheckoutSuccess?: () => void;
  // max stock per menu for increment guard
  stockMap?: Record<string, number>;
}

type PayMethod = 'CASH' | 'QRIS' | 'Debit' | 'Kredit';

const PAY_METHODS: { key: PayMethod; label: string; Icon: React.ElementType; color: string }[] = [
  { key: 'CASH', label: 'Tunai', Icon: Banknote, color: 'emerald' },
  { key: 'QRIS', label: 'QRIS', Icon: QrCode, color: 'violet' },
  { key: 'Debit', label: 'GoPay', Icon: Smartphone, color: 'sky' },
  { key: 'Kredit', label: 'Grab', Icon: CreditCard, color: 'green' },
];

const CASH_PRESETS = [10000, 20000, 50000, 100000];

// ── Main ──────────────────────────────────────────────────────────────────────
export default function KasirCartPanel({
  recipes, cart, totals, discount, finalTotal,
  cashPaid, cashChange, paymentMethod, cashPaidAmount, paymentError,
  voucherCode, voucherLabel, checkoutLoading,
  cashInputRef,
  onSetPayment, onSetCashPaid,
  onVoucherChange, onApplyVoucher, onRemoveVoucher,
  onDecrement, onIncrement, onRemoveItem, onClearCart,
  onCheckout,
  lastSale, onReceiptClose,
  stockMap = {},
}: KasirCartPanelProps) {
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="w-[320px] flex-shrink-0 bg-white border-l border-slate-100 flex flex-col shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-purple-50/50 to-white">
          <span className="text-[14px] font-black text-slate-800">
            Keranjang {cartCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-purple-600 text-white rounded-full text-[10px] font-black">
                {cartCount}
              </span>
            )}
          </span>
          {cart.length > 0 && (
            <button
              onClick={onClearCart}
              className="text-[10px] font-bold text-red-400 hover:text-red-600 px-2 py-1 rounded-lg hover:bg-red-50 transition flex items-center gap-1"
            >
              <Trash2 size={11} /> Kosongkan
            </button>
          )}
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-slate-300 select-none">
              <span className="text-4xl mb-2">🛒</span>
              <p className="text-[11px] font-semibold">Keranjang kosong</p>
              <p className="text-[10px] mt-0.5 text-slate-200">Tambah menu dari kiri</p>
            </div>
          ) : (
            cart.map(item => {
              const maxQty = stockMap[item.menuName] ?? Infinity;
              return (
                <CartRow
                  key={item.id}
                  item={item}
                  recipe={recipes.find(r => r.menu_name === item.menuName)}
                  maxQty={maxQty}
                  onDecrement={() => onDecrement(item.id)}
                  onIncrement={() => onIncrement(item.id, item.qty, maxQty)}
                  onRemove={() => onRemoveItem(item.id)}
                />
              );
            })
          )}
        </div>

        {/* Payment method selector — ABOVE totals, no layout shift */}
        <div className="border-t border-slate-100 grid grid-cols-4 bg-slate-50/60">
          {PAY_METHODS.map(({ key, label, Icon, color }) => (
            <button
              key={key}
              onClick={() => onSetPayment(key)}
              className={`flex flex-col items-center justify-center py-2.5 gap-0.5 text-[10px] font-bold transition border-r border-slate-100 last:border-r-0 ${paymentMethod === key
                ? `bg-purple-600 text-white`
                : 'text-slate-400 hover:bg-white hover:text-slate-700'
                }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Totals + voucher + cash — fixed height area, no collapse */}
        <div className="border-t border-slate-100 px-4 py-3 space-y-2.5 bg-white">

          {/* Voucher input */}
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Tag size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Kode voucher…"
                value={voucherCode}
                onChange={e => onVoucherChange(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && onApplyVoucher()}
                className="w-full pl-7 pr-2 py-1.5 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              />
            </div>
            <button
              onClick={onApplyVoucher}
              className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-[11px] font-black transition"
            >
              Pakai
            </button>
          </div>

          {/* Totals — no tax line */}
          <div className="space-y-1">
            <Row label="Subtotal" value={formatIDR(totals.subtotal)} />

            {discount > 0 && voucherLabel && (
              <div className="flex items-center justify-between bg-green-50 px-2 py-1.5 rounded-lg">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Ticket size={10} className="text-green-600 flex-shrink-0" />
                  <span className="text-[10px] font-black text-green-700 bg-green-200 px-1.5 py-0.5 rounded">
                    {voucherCode.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-green-600 truncate">- {formatIDR(discount)}</span>
                </div>
                <button onClick={onRemoveVoucher} className="text-slate-300 hover:text-red-500 transition flex-shrink-0 ml-1">
                  <X size={12} />
                </button>
              </div>
            )}

            <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
              <span className="text-[14px] font-black text-slate-800">Total</span>
              <span className="text-[16px] font-extrabold text-purple-700">{formatIDR(finalTotal)}</span>
            </div>
          </div>

          {/* Cash section — always same height slot */}
          <div className="min-h-[64px]">
            {paymentMethod === 'CASH' && cart.length > 0 ? (
              <div className="space-y-2">
                {/* Quick presets */}
                <div className="grid grid-cols-4 gap-1">
                  {CASH_PRESETS.map(preset => (
                    <button
                      key={preset}
                      onClick={() => onSetCashPaid(String(preset))}
                      className={`py-1.5 rounded-lg text-[10px] font-black border transition ${cashPaidAmount === String(preset)
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-purple-300 hover:text-purple-700'
                        }`}
                    >
                      {preset >= 1000 ? `${preset / 1000}rb` : preset}
                    </button>
                  ))}
                </div>
                {/* Manual input */}
                <input
                  ref={cashInputRef}
                  type="number"
                  placeholder="Nominal lain…"
                  value={cashPaidAmount}
                  onChange={e => onSetCashPaid(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-1.5 text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
                />
                {cashChange > 0 && (
                  <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                    Kembalian: {formatIDR(cashChange)}
                  </p>
                )}
                {paymentError && (
                  <p className="text-[10px] text-red-500 font-semibold">{paymentError}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <span className="text-[10px] text-slate-300 font-medium">
                  {paymentMethod === 'QRIS' ? 'Scan QR saat checkout' :
                    paymentMethod === 'Debit' ? 'Bayar via GoPay' :
                      paymentMethod === 'Kredit' ? 'Bayar via GrabPay' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Checkout button */}
          <button
            type="button" // <── PENTING: Mencegah tombol bertindak sebagai submit form
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!checkoutLoading && cart.length > 0) {
                onCheckout();
              }
            }}
            disabled={cart.length === 0 || !!paymentError || checkoutLoading}
            className={`w-full py-3.5 rounded-xl text-[13px] font-black flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 ${cart.length === 0 || !!paymentError || checkoutLoading
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-200'
              }`}
          >
            {checkoutLoading ? (
              <>
                <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Memproses...
              </>
            ) : (
              <>
                Bayar Sekarang <ArrowRight size={15} />
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

// ── CartRow ───────────────────────────────────────────────────────────────────
function CartRow({
  item, recipe, maxQty, onDecrement, onIncrement, onRemove,
}: {
  item: CartItem;
  recipe?: RecipeWithDetails;
  maxQty: number;
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const image = (recipe as any)?.image as string | undefined;
  const emoji = getCategoryEmoji(recipe?.category ?? '');
  const atMax = item.qty >= maxQty;

  const optParts = [
    item.selectedSpice || null,
    item.selectedSugar || null,
    ...Object.entries(item.customChoices ?? {}).map(([, v]) => v),
  ].filter(Boolean) as string[];

  return (
    <div className="flex items-start gap-2 p-2 rounded-xl hover:bg-slate-50 transition group">
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-orange-50 flex-shrink-0">
        {!imgError && image ? (
          <img src={image} alt={item.menuName} className="w-full h-full object-cover" onError={() => setImgError(true)} />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-lg">{emoji}</div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0">
            <p className="text-[11px] font-bold text-slate-800 truncate leading-tight">{item.menuName}</p>
            <p className="text-[9px] text-slate-400">Rp {formatIDRShort(item.price)}</p>
            {optParts.length > 0 && (
              <p className="text-[9px] text-purple-500 truncate mt-0.5">{optParts.join(' · ')}</p>
            )}
          </div>
          <button
            onClick={onRemove}
            className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-400 transition flex-shrink-0 mt-0.5"
          >
            <X size={12} />
          </button>
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <div className="flex items-center gap-1">
            <button
              onClick={onDecrement}
              className="w-5 h-5 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition"
            >
              <Minus size={10} />
            </button>
            <span className="text-[12px] font-bold text-slate-700 w-5 text-center">{item.qty}</span>
            <button
              onClick={onIncrement}
              disabled={atMax}
              title={atMax ? `Stok hanya ${maxQty}` : undefined}
              className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${atMax
                ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed'
                : 'border-slate-200 hover:bg-slate-100'
                }`}
            >
              <Plus size={10} />
            </button>
          </div>
          <div className="text-right">
            <span className="text-[11px] font-bold text-slate-700">{formatIDR(item.price * item.qty)}</span>
            {atMax && (
              <p className="text-[9px] text-orange-500 font-bold">Stok max</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Row helper ────────────────────────────────────────────────────────────────
function Row({ label, value, valueClass = 'text-slate-500' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}