import React from 'react';
import {
  ShoppingCart, Trash2, Minus, Plus, CreditCard,
  RefreshCcw, CheckCircle2, AlertCircle, Tag, X,
} from 'lucide-react';
import { CartItem } from '../../../sales/utils/cartHelpers';
import { formatIDR, formatIDRShort, VoucherResult } from '../../../sales/utils/salesHelpers';

interface CartPanelProps {
  cart: CartItem[];
  isCartEmpty: boolean;
  totals: { subtotal: number; tax: number; service: number };
  discount: number;
  finalTotal: number;
  paymentMethod: 'CASH' | 'QRIS' | 'Debit' | 'Kredit';
  setPaymentMethod: (m: 'CASH' | 'QRIS' | 'Debit' | 'Kredit') => void;
  cashPaidAmount: string;
  setCashPaidAmount: (v: string) => void;
  cashPaid: number;
  cashChange: number;
  paymentError: string | null;
  checkoutLoading: boolean;
  checkoutSuccess: boolean;
  cashInputRef: React.RefObject<HTMLInputElement | null>;
  // voucher
  voucherCode: string;
  setVoucherCode: (v: string) => void;
  voucher: VoucherResult | null;
  voucherError: string;
  onApplyVoucher: () => void;
  onRemoveVoucher: () => void;
  // actions
  onDecrement: (id: string) => void;
  onIncrement: (id: string) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

const PAYMENT_METHODS = [
  { key: 'CASH',  label: 'Tunai',      icon: '💵' },
  { key: 'Debit', label: 'Debit',      icon: '💳' },
  { key: 'Kredit',label: 'Kredit',     icon: '🏦' },
  { key: 'QRIS',  label: 'QRIS',       icon: '📱' },
] as const;

export default function CartPanel({
  cart, isCartEmpty, totals, discount, finalTotal,
  paymentMethod, setPaymentMethod,
  cashPaidAmount, setCashPaidAmount, cashPaid, cashChange,
  paymentError, checkoutLoading, checkoutSuccess,
  cashInputRef,
  voucherCode, setVoucherCode, voucher, voucherError,
  onApplyVoucher, onRemoveVoucher,
  onDecrement, onIncrement, onRemoveItem, onClearCart, onCheckout,
}: CartPanelProps) {

  return (
    <div className="w-full sm:w-[340px] shrink-0 bg-white border border-slate-200 rounded-2xl flex flex-col overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <ShoppingCart size={15} className="text-purple-600" />
          <span className="text-[13px] font-bold text-slate-800">Keranjang Belanja</span>
          {!isCartEmpty && (
            <span className="text-[9px] font-bold bg-purple-600 text-white px-1.5 py-0.5 rounded-full">
              {cart.reduce((s, i) => s + i.qty, 0)}
            </span>
          )}
        </div>
        {!isCartEmpty && (
          <button
            onClick={onClearCart}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 transition"
          >
            <Trash2 size={11} /> Hapus
          </button>
        )}
      </div>

      {/* Cart items */}
      <div className="flex-1 overflow-y-auto px-3 py-2">
        {isCartEmpty ? (
          <div className="h-full flex flex-col items-center justify-center gap-2 py-10 text-slate-300">
            <ShoppingCart size={36} strokeWidth={1.5} />
            <p className="text-[11px] text-slate-400 font-medium">Keranjang kosong</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {cart.map(item => (
              <div key={item.id} className="flex flex-col gap-1 p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 truncate leading-none">
                      {item.menuName}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      @ Rp {formatIDRShort(item.price)} × {item.qty}
                    </p>
                    {(item.selectedSpice || item.selectedSugar || Object.keys(item.customChoices ?? {}).length > 0) && (
                      <p className="text-[9px] text-slate-500 mt-0.5 line-clamp-1">
                        {[
                          item.selectedSpice && item.selectedSpice !== 'Sedang' ? item.selectedSpice : null,
                          item.selectedSugar && item.selectedSugar !== 'Less Sugar (70%)' ? item.selectedSugar : null,
                          ...Object.entries(item.customChoices ?? {}).map(([k, v]) => `${k}: ${v}`),
                        ].filter(Boolean).join(' • ')}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => onDecrement(item.id)}
                      className="w-5 h-5 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-red-50 hover:border-red-200 transition"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-[11px] font-bold font-mono w-4 text-center">{item.qty}</span>
                    <button
                      onClick={() => onIncrement(item.id)}
                      className="w-5 h-5 rounded-full border border-slate-200 bg-white flex items-center justify-center hover:bg-purple-50 hover:border-purple-200 transition"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-[11px] font-bold text-purple-600 font-mono">
                    Rp {formatIDRShort(item.price * item.qty)}
                  </p>
                  <button
                    onClick={() => onRemoveItem(item.id)}
                    className="text-slate-300 hover:text-red-500 transition"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Voucher + totals + payment */}
      <div className="border-t border-slate-100 px-3 pt-3 pb-4 space-y-3 bg-white">

        {/* Voucher input */}
        <div>
          <div className="flex gap-1.5">
            <div className="relative flex-1">
              <Tag size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Kode voucher / diskon"
                value={voucherCode}
                onChange={e => setVoucherCode(e.target.value.toUpperCase())}
                onKeyDown={e => e.key === 'Enter' && onApplyVoucher()}
                className="w-full pl-7 pr-2 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-mono focus:outline-none focus:border-purple-400"
              />
            </div>
            <button
              onClick={onApplyVoucher}
              className="px-3 py-2 bg-purple-600 text-white rounded-xl text-[10px] font-bold hover:bg-purple-700 transition flex-shrink-0"
            >
              Pakai
            </button>
          </div>
          {voucher?.valid && (
            <div className="flex items-center justify-between mt-1 bg-green-50 border border-green-100 rounded-lg px-2.5 py-1.5">
              <span className="text-[10px] text-green-700 font-semibold">✓ {voucher.label}</span>
              <button onClick={onRemoveVoucher} className="text-green-400 hover:text-green-600">
                <X size={11} />
              </button>
            </div>
          )}
          {voucherError && (
            <p className="text-[10px] text-red-500 mt-1 pl-1">{voucherError}</p>
          )}
        </div>

        {/* Totals */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Subtotal</span>
            <span className="font-mono">Rp {formatIDRShort(totals.subtotal)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Tax (10%)</span>
            <span className="font-mono">Rp {formatIDRShort(totals.tax)}</span>
          </div>
          <div className="flex justify-between text-[11px] text-slate-400">
            <span>Service</span>
            <span className="font-mono">Rp {formatIDRShort(totals.service)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-[11px] text-green-600">
              <span>Diskon</span>
              <span className="font-mono">- Rp {formatIDRShort(discount)}</span>
            </div>
          )}
          <div className="flex justify-between items-baseline pt-1.5 border-t border-slate-100 mt-1">
            <span className="text-[12px] font-bold text-slate-700">Total</span>
            <span className="text-xl font-extrabold font-mono text-slate-800">
              Rp {formatIDRShort(finalTotal)}
            </span>
          </div>
        </div>

        {!isCartEmpty && (
          <>
            {/* Payment methods — 4 buttons */}
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">Pilihan Pembayaran</p>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_METHODS.map(({ key, label, icon }) => (
                  <button
                    key={key}
                    onClick={() => setPaymentMethod(key)}
                    className={`flex flex-col items-center gap-1 py-2 rounded-xl text-[9px] font-semibold border transition
                      ${paymentMethod === key
                        ? 'bg-purple-600 text-white border-purple-600'
                        : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    <span className="text-base">{icon}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Cash input */}
            {paymentMethod === 'CASH' && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Amount Reterima</p>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">Rp</span>
                    <input
                      ref={cashInputRef}
                      type="number"
                      placeholder={`${formatIDRShort(finalTotal)}`}
                      value={cashPaidAmount}
                      onChange={e => setCashPaidAmount(e.target.value)}
                      className={`w-full pl-8 pr-3 py-2.5 text-[12px] bg-slate-50 border rounded-xl focus:outline-none font-mono
                        ${paymentError ? 'border-red-300 focus:border-red-400' : 'border-slate-200 focus:border-purple-400'}`}
                    />
                  </div>
                  {cashPaid >= finalTotal && cashPaid > 0 && (
                    <div className="text-right flex-shrink-0">
                      <p className="text-[9px] text-slate-400 uppercase font-bold">Kembalian</p>
                      <p className="text-[12px] text-green-600 font-bold whitespace-nowrap">
                        Rp {formatIDRShort(cashChange)}
                      </p>
                    </div>
                  )}
                </div>
                {/* Quick cash suggestions */}
                <div className="flex gap-1.5">
                  {[
                    { label: 'Pas', value: finalTotal },
                    { label: '50rb', value: Math.max(50000, Math.ceil(finalTotal / 50000) * 50000) },
                    { label: '100rb', value: Math.max(100000, Math.ceil(finalTotal / 100000) * 100000) },
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

            {/* Error */}
            {paymentError && (
              <div className="flex items-center gap-1.5 text-[10px] text-red-500 bg-red-50 border border-red-100 rounded-lg p-2">
                <AlertCircle size={12} className="flex-shrink-0" />
                {paymentError}
              </div>
            )}
          </>
        )}

        {/* Success */}
        {checkoutSuccess && (
          <div className="flex items-center gap-2 text-[11px] text-green-700 bg-green-50 border border-green-100 rounded-xl px-3 py-2">
            <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />
            Transaksi berhasil dicatat!
          </div>
        )}

        {/* Checkout button */}
        <button
          disabled={isCartEmpty || checkoutLoading || !!paymentError}
          onClick={onCheckout}
          className="w-full py-3.5 rounded-xl text-[12px] font-bold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
        >
          {checkoutLoading
            ? <><RefreshCcw size={15} className="animate-spin" /> Memproses...</>
            : <><CreditCard size={15} /> Selesaikan &amp; Cetak Struk</>
          }
        </button>
      </div>
    </div>
  );
}
