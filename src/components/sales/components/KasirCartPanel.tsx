import React, { useState } from 'react';
import {
  Minus, Plus, X, Tag, Trash2,
  Banknote, QrCode, CreditCard, MoreHorizontal,
  ClipboardList, SplitSquareVertical, RotateCcw, Ticket,
  FileText, ArrowRight,
} from 'lucide-react';
import { RecipeWithDetails } from '../../../types';
import { formatIDR, formatIDRShort, getCategoryEmoji } from '../utils/salesHelpers';
import { CartItem } from '../utils/cartHelpers';
import { ReceiptData } from '../hooks/useCheckout';

interface KasirCartPanelProps {
  recipes:          RecipeWithDetails[];
  cart:             CartItem[];
  totals:           { subtotal: number; tax: number; service: number; grandTotal: number };
  discount:         number;
  finalTotal:       number;
  cashPaid:         number;
  cashChange:       number;
  paymentMethod:    'CASH' | 'QRIS' | 'Debit' | 'Kredit';
  cashPaidAmount:   string;
  paymentError:     string | null;
  voucherCode:      string;
  voucherLabel?:    string;
  checkoutLoading:  boolean;
  cashInputRef:     React.RefObject<HTMLInputElement | null>;
  onSetPayment:     (m: 'CASH' | 'QRIS' | 'Debit' | 'Kredit') => void;
  onSetCashPaid:    (v: string) => void;
  onVoucherChange:  (v: string) => void;
  onApplyVoucher:   () => void;
  onRemoveVoucher:  () => void;
  onDecrement:      (id: string) => void;
  onIncrement:      (id: string) => void;
  onRemoveItem:     (id: string) => void;
  onClearCart:      () => void;
  onCheckout:       () => void;
}

type PayMethod = 'CASH' | 'QRIS' | 'Debit' | 'Kredit';

const PAY_METHODS: { key: PayMethod; label: string; Icon: React.ElementType }[] = [
  { key: 'CASH',   label: 'Tunai',   Icon: Banknote },
  { key: 'QRIS',   label: 'QRIS',    Icon: QrCode },
  { key: 'Debit',  label: 'Kartu',   Icon: CreditCard },
  { key: 'Kredit', label: 'Lainnya', Icon: MoreHorizontal },
];

const BOTTOM_ACTIONS = [
  { label: 'Hold Order', Icon: ClipboardList },
  { label: 'Split Bill', Icon: SplitSquareVertical },
  { label: 'Refund',     Icon: RotateCcw },
  { label: 'Voucher',    Icon: Ticket },
  { label: 'Catatan',    Icon: FileText },
];

export default function KasirCartPanel({
  recipes, cart, totals, discount, finalTotal,
  cashPaid, cashChange, paymentMethod, cashPaidAmount, paymentError,
  voucherCode, voucherLabel, checkoutLoading,
  cashInputRef,
  onSetPayment, onSetCashPaid,
  onVoucherChange, onApplyVoucher, onRemoveVoucher,
  onDecrement, onIncrement, onRemoveItem, onClearCart,
  onCheckout,
}: KasirCartPanelProps) {
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  return (
    <div className="w-[300px] flex-shrink-0 bg-white border-l border-slate-100 flex flex-col">

      {/* ── Header ────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <span className="text-[14px] font-bold text-slate-800">
          Keranjang {cartCount > 0 && <span className="text-purple-600">({cartCount})</span>}
        </span>
        {cart.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-[11px] font-semibold text-red-500 hover:text-red-700 px-2 py-1 rounded-lg hover:bg-red-50 transition"
          >
            Bersihkan
          </button>
        )}
      </div>

      {/* ── Cart items ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 min-h-0">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-300 select-none">
            <span className="text-3xl mb-1.5">🛒</span>
            <p className="text-[11px]">Keranjang kosong</p>
            <p className="text-[10px] mt-0.5">Tambah menu dari kiri</p>
          </div>
        ) : (
          cart.map(item => (
            <CartRow
              key={item.id}
              item={item}
              recipe={recipes.find(r => r.menu_name === item.menuName)}
              onDecrement={() => onDecrement(item.id)}
              onIncrement={() => onIncrement(item.id)}
              onRemove={()    => onRemoveItem(item.id)}
            />
          ))
        )}
      </div>

      {/* ── Totals + voucher ──────────────────────────────────────── */}
      <div className="border-t border-slate-100 px-4 py-3 space-y-2.5">

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
            className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg text-[11px] font-bold transition"
          >
            Pakai
          </button>
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <Row label="Subtotal" value={formatIDR(totals.subtotal)} />

          {discount > 0 && voucherLabel && (
            <>
              <Row label="Diskon" value={`- ${formatIDR(discount)}`} valueClass="text-green-600 font-semibold" />
              <div className="flex items-center justify-between bg-green-50 px-2 py-1 rounded-lg">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="text-[10px] font-bold text-green-700 bg-green-200 px-1.5 py-0.5 rounded flex-shrink-0">
                    {voucherCode.toUpperCase()}
                  </span>
                  <span className="text-[10px] text-green-600 truncate">- {formatIDR(discount)}</span>
                </div>
                <button onClick={onRemoveVoucher} className="text-slate-400 hover:text-red-500 transition flex-shrink-0 ml-1">
                  <Trash2 size={12} />
                </button>
              </div>
            </>
          )}

          <Row label="Pajak (10%)" value={formatIDR(totals.tax)} />

          <div className="flex justify-between items-center pt-1.5 border-t border-slate-100">
            <span className="text-[14px] font-bold text-slate-800">Total</span>
            <span className="text-[15px] font-extrabold text-purple-700">{formatIDR(finalTotal)}</span>
          </div>
        </div>

        {/* Cash input */}
        {paymentMethod === 'CASH' && cart.length > 0 && (
          <div className="space-y-1">
            <label className="text-[10px] font-semibold text-slate-500 block">Uang Diterima</label>
            <input
              ref={cashInputRef}
              type="number"
              placeholder="Masukkan nominal…"
              value={cashPaidAmount}
              onChange={e => onSetCashPaid(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[12px] font-semibold focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
            />
            {cashChange > 0 && (
              <p className="text-[11px] font-semibold text-blue-600">
                Kembalian: {formatIDR(cashChange)}
              </p>
            )}
            {paymentError && (
              <p className="text-[10px] text-red-500 font-medium">{paymentError}</p>
            )}
          </div>
        )}

        {/* Bayar button */}
        <button
          onClick={onCheckout}
          disabled={cart.length === 0 || !!paymentError || checkoutLoading}
          className={`w-full py-3 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition ${
            cart.length === 0 || !!paymentError
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-100'
          }`}
        >
          {checkoutLoading
            ? <><span className="animate-spin inline-block">⏳</span> Memproses…</>
            : <>Bayar <ArrowRight size={14} /></>
          }
        </button>
      </div>

      {/* ── Payment methods ───────────────────────────────────────── */}
      <div className="border-t border-slate-100 grid grid-cols-4">
        {PAY_METHODS.map(({ key, label, Icon }) => (
          <button
            key={key}
            onClick={() => onSetPayment(key)}
            className={`flex flex-col items-center justify-center py-2.5 gap-1 text-[10px] font-semibold transition border-r border-slate-100 last:border-r-0 ${
              paymentMethod === key
                ? 'bg-purple-50 text-purple-700'
                : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
            }`}
          >
            <Icon size={18} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Bottom action bar ─────────────────────────────────────── */}
      <div className="border-t border-slate-100 grid grid-cols-5">
        {BOTTOM_ACTIONS.map(({ label, Icon }) => (
          <button
            key={label}
            className="flex flex-col items-center justify-center py-2 gap-0.5 text-[9px] font-semibold text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition border-r border-slate-100 last:border-r-0"
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── CartRow ───────────────────────────────────────────────────────────────────
function CartRow({
  item, recipe, onDecrement, onIncrement, onRemove,
}: {
  item:        CartItem;
  recipe?:     RecipeWithDetails;
  onDecrement: () => void;
  onIncrement: () => void;
  onRemove:    () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const image = (recipe as any)?.image as string | undefined;
  const emoji = getCategoryEmoji(recipe?.category ?? '');

  const optParts = [
    item.selectedSpice || null,
    item.selectedSugar || null,
    ...Object.entries(item.customChoices ?? {}).map(([k, v]) => `${k}: ${v}`),
  ].filter(Boolean) as string[];

  return (
    <div className="flex items-start gap-2 p-2 rounded-xl hover:bg-slate-50 transition group">
      {/* Thumbnail */}
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
            <button onClick={onDecrement} className="w-5 h-5 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition">
              <Minus size={10} />
            </button>
            <span className="text-[12px] font-bold text-slate-700 w-5 text-center">{item.qty}</span>
            <button onClick={onIncrement} className="w-5 h-5 rounded-md border border-slate-200 flex items-center justify-center hover:bg-slate-100 transition">
              <Plus size={10} />
            </button>
          </div>
          <span className="text-[11px] font-bold text-slate-700">
            {formatIDR(item.price * item.qty)}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────
function Row({ label, value, valueClass = 'text-slate-500' }: { label: string; value: string; valueClass?: string }) {
  return (
    <div className="flex justify-between text-[11px]">
      <span className="text-slate-500">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}
