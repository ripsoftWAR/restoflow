import React, { useState } from 'react';
import { RefreshCw, Copy, Check } from 'lucide-react';
import { VoucherResult, generateVoucherCode, formatIDRShort } from '../utils/salesHelpers';

interface VoucherGeneratorProps {
  /** Parent passes a setter so generated codes are available for cart validation */
  onVoucherGenerated: (code: string, voucher: VoucherResult) => void;
}

type DiscountType = 'percent' | 'flat';

export default function VoucherGenerator({ onVoucherGenerated }: VoucherGeneratorProps) {
  const [discountType, setDiscountType]   = useState<DiscountType>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [minPurchase, setMinPurchase]     = useState('50000');
  const [dateFrom, setDateFrom]           = useState(() => new Date().toLocaleDateString('id-ID'));
  const [dateTo, setDateTo]               = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toLocaleDateString('id-ID');
  });
  const [limitUsage, setLimitUsage]       = useState('100');
  const [isActive, setIsActive]           = useState(true);
  const [generatedCode, setGeneratedCode] = useState('SAVE10');
  const [copied, setCopied]               = useState(false);

  const rawValue = parseFloat(discountValue) || 0;
  const voucherValue = discountType === 'flat' ? rawValue * 1000 : rawValue;
  const discountLabel = discountType === 'percent'
    ? `${rawValue}% Diskon`
    : `Diskon Rp ${formatIDRShort(voucherValue)}`;

  const handleGenerate = () => {
    const code    = generateVoucherCode();
    const voucher: VoucherResult = {
      valid: true,
      type:  discountType,
      value: voucherValue,
      label: discountLabel,
    };
    setGeneratedCode(code);
    onVoucherGenerated(code, voucher);
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(generatedCode).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
      {/* Title */}
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-[14px] font-bold text-slate-800">Vouchers &amp; Diskon Generator</h2>
        <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded-full tracking-wide uppercase">
          Baru
        </span>
      </div>

      <div className="flex gap-5">
        {/* ── Form fields ───────────────────────────────────────── */}
        <div className="flex-1 grid grid-cols-3 gap-3">
          {/* Row 1 */}
          <FormField label="Tipe Diskon">
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as DiscountType)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-[11px] bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
            >
              <option value="percent">Persentase (%)</option>
              <option value="flat">Nominal (Rp)</option>
            </select>
          </FormField>

          <FormField label="Nilai Diskon">
            <div className="relative">
              <input
                type="number"
                min={0}
                value={discountValue}
                onChange={e => setDiscountValue(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">
                {discountType === 'percent' ? '%' : 'Rp'}
              </span>
            </div>
          </FormField>

          <FormField label="Minimum Pembelian">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 pointer-events-none">Rp</span>
              <input
                type="number"
                min={0}
                value={minPurchase}
                onChange={e => setMinPurchase(e.target.value)}
                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              />
            </div>
          </FormField>

          {/* Row 2 */}
          <FormField label="Berlaku Dari">
            <div className="relative">
              <input
                type="text"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">📅</span>
            </div>
          </FormField>

          <FormField label="Berlaku Sampai">
            <div className="relative">
              <input
                type="text"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 pr-8 text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">📅</span>
            </div>
          </FormField>

          <FormField label="Limit Penggunaan">
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                value={limitUsage}
                onChange={e => setLimitUsage(e.target.value)}
                className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-[11px] focus:outline-none focus:ring-2 focus:ring-purple-200 focus:border-purple-400"
              />
              <span className="text-[11px] text-slate-400 flex-shrink-0">kali</span>
              {/* Aktif toggle */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <span className="text-[10px] text-slate-500 font-medium">Aktif</span>
                <button
                  type="button"
                  onClick={() => setIsActive(v => !v)}
                  className={`w-9 h-5 rounded-full transition-colors relative flex-shrink-0 ${isActive ? 'bg-purple-600' : 'bg-slate-200'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${isActive ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>
          </FormField>
        </div>

        {/* ── Generated code panel ──────────────────────────────── */}
        <div className="w-48 flex flex-col">
          <p className="text-[10px] font-semibold text-slate-500 mb-1.5">Kode Voucher</p>

          {/* Code display */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full border-2 border-dashed border-purple-300 rounded-xl py-3 px-3 text-center mb-2 hover:bg-purple-50 transition group"
          >
            <p className="text-[20px] font-black text-purple-700 tracking-widest leading-none">
              {generatedCode}
            </p>
            <div className="flex items-center justify-center gap-1 mt-1.5">
              {copied
                ? <Check size={11} className="text-green-500" />
                : <Copy size={11} className="text-slate-400 group-hover:text-purple-400 transition" />
              }
              <span className="text-[10px] text-slate-400 group-hover:text-purple-500 transition">
                {copied ? 'Disalin!' : 'Salin kode'}
              </span>
            </div>
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-1.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold transition"
          >
            <RefreshCw size={12} />
            Generate Kode Baru
          </button>

          <p className="text-[10px] text-slate-400 text-center mt-1.5">
            Kode akan otomatis dibuat unik
          </p>
        </div>

        {/* ── Robot mascot ─────────────────────────────────────── */}
        <div className="w-24 flex items-end justify-center pb-1 select-none">
          <span className="text-6xl" style={{ filter: 'drop-shadow(0 4px 12px rgba(139,92,246,.35))' }}>
            🤖
          </span>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] font-semibold text-slate-500 mb-1 block">{label}</label>
      {children}
    </div>
  );
}
