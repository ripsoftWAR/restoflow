import React from 'react';
import { X, Printer, ReceiptText } from 'lucide-react';
import { ReceiptData } from '../../../sales/hooks/useCheckout';
import { formatIDR } from '../../../sales/utils/salesHelpers';

interface PrintReceiptModalProps {
  receipt: ReceiptData;
  onClose: () => void;
}

export default function PrintReceiptModal({ receipt, onClose }: PrintReceiptModalProps) {
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-100 rounded-2xl max-w-3xl w-full p-5 relative flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-4">
          <div className="flex items-center gap-2">
            <ReceiptText size={15} className="text-purple-600" />
            <h3 className="text-[13px] font-bold text-slate-800">Pratinjau Struk</h3>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600">
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Main receipt */}
          <div className="bg-white p-5 shadow-sm border border-slate-200 rounded-xl flex flex-col font-mono text-[11px] text-slate-800">
            <div className="text-center pb-3 border-b border-dashed border-slate-300">
              <h4 className="font-sans font-bold text-xs text-slate-800 uppercase tracking-wider">RESTFLOW POS</h4>
              <p className="text-[9px] mt-1.5">Inv: {receipt.invoiceId}</p>
              <p className="text-[9px] text-slate-400">{receipt.timestamp}</p>
            </div>

            <div className="py-3 border-b border-dashed border-slate-300 space-y-1.5">
              {receipt.items.map((item, idx) => (
                <div key={idx}>
                  <div className="flex justify-between font-semibold">
                    <span>{item.menuName} ×{item.qty}</span>
                    <span>{formatIDR(item.total)}</span>
                  </div>
                  {item.options && (
                    <p className="text-[9px] text-slate-400 pl-2">{item.options}</p>
                  )}
                </div>
              ))}
            </div>

            <div className="py-3 space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span><span>{formatIDR(receipt.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Tax</span><span>{formatIDR(receipt.tax)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Service</span><span>{formatIDR(receipt.serviceCharge)}</span>
              </div>
              {receipt.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Diskon {receipt.voucherLabel ? `(${receipt.voucherLabel})` : ''}</span>
                  <span>-{formatIDR(receipt.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold pt-1 border-t border-dashed border-slate-300">
                <span>Total</span><span>{formatIDR(receipt.totalAmount)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Metode</span><span>{receipt.paymentMethod}</span>
              </div>
              {receipt.paymentMethod === 'CASH' && (
                <>
                  <div className="flex justify-between text-slate-400">
                    <span>Tunai</span><span>{formatIDR(receipt.cashPaid)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-green-600">
                    <span>Kembali</span><span>{formatIDR(receipt.cashChange)}</span>
                  </div>
                </>
              )}
            </div>
            <p className="text-center text-slate-400 font-sans pt-2 border-t border-dashed border-slate-300 text-[10px]">
              ★ Terima Kasih ★
            </p>
          </div>

          {/* Kitchen slip */}
          <div className="bg-amber-50/70 p-5 shadow-sm border border-amber-200 rounded-xl flex flex-col font-mono text-[11px]">
            <div className="text-center pb-2 border-b border-dashed border-amber-200 mb-2">
              <span className="font-sans font-bold text-[10px] uppercase text-amber-800">🍳 Dapur</span>
              <p className="text-[9px] text-amber-600 mt-0.5">{receipt.invoiceId}</p>
            </div>
            {receipt.items.filter(i => i.category !== 'Minuman').map((item, idx) => (
              <div key={idx} className="flex justify-between font-bold py-0.5">
                <span className="text-slate-700">{item.menuName}</span>
                <span className="text-amber-700">×{item.qty}</span>
              </div>
            ))}
            {receipt.items.filter(i => i.category !== 'Minuman').length === 0 && (
              <p className="text-[10px] text-amber-400 italic">Tidak ada item dapur</p>
            )}
          </div>

          {/* Bar slip */}
          <div className="bg-sky-50/70 p-5 shadow-sm border border-sky-200 rounded-xl flex flex-col font-mono text-[11px]">
            <div className="text-center pb-2 border-b border-dashed border-sky-200 mb-2">
              <span className="font-sans font-bold text-[10px] uppercase text-sky-800">☕ Bar</span>
              <p className="text-[9px] text-sky-600 mt-0.5">{receipt.invoiceId}</p>
            </div>
            {receipt.items.filter(i => i.category === 'Minuman').map((item, idx) => (
              <div key={idx} className="flex justify-between font-bold py-0.5">
                <span className="text-slate-700">{item.menuName}</span>
                <span className="text-sky-700">×{item.qty}</span>
              </div>
            ))}
            {receipt.items.filter(i => i.category === 'Minuman').length === 0 && (
              <p className="text-[10px] text-sky-400 italic">Tidak ada item bar</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 mt-4">
          <button
            onClick={() => window.print()}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold flex items-center gap-2"
          >
            <Printer size={14} /> Cetak Struk
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-[11px] font-semibold hover:bg-slate-300"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
