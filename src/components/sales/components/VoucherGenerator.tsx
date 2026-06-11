import React, { useState } from 'react';
import { RefreshCw, Check, Sparkles } from 'lucide-react';
import { generateVoucherCode, VoucherResult } from '../utils/salesHelpers';
import { makeApiFetch } from '../../../utils/api';

interface VoucherGeneratorProps {
  restaurantId: number;
  sessionId: number;
  // ✅ Kirim object lengkap agar bisa langsung dipakai di keranjang
  onVoucherGenerated?: (code: string, voucher: VoucherResult) => void;
}

export default function VoucherGenerator({ restaurantId, sessionId, onVoucherGenerated }: VoucherGeneratorProps) {
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('10');
  const [minPurchase, setMinPurchase] = useState('50000');
  const [dateFrom, setDateFrom] = useState(() => new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [limitUsage, setLimitUsage] = useState('100');
  const [isActive, setIsActive] = useState(true);
  const [generatedCode, setGeneratedCode] = useState('SAVE10');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const apiFetch = React.useMemo(() => makeApiFetch(sessionId), [sessionId]);

  const handleGenerate = async () => {
    setLoading(true);
    const code = generateVoucherCode();

    const payload = {
      restaurant_id: restaurantId,
      code,
      type: discountType,
      value: parseFloat(discountValue) || 0,
      min_purchase: parseFloat(minPurchase) || 0,
      is_active: isActive,
      start_at: dateFrom,
      end_at: dateTo,
      max_usage: parseInt(limitUsage) || null,
    };

    try {
      const response = await apiFetch('/api/vouchers', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get('content-type');
      const result = contentType?.includes('application/json')
        ? await response.json()
        : { message: await response.text() };

      if (!response.ok) {
        throw new Error(result.error || result.message || `HTTP ${response.status}`);
      }

      setGeneratedCode(code);

      // ✅ Bangun VoucherResult dari nilai yang diinput user
      const val = parseFloat(discountValue) || 0;
      const voucherResult: VoucherResult = {
        valid: true,
        type: discountType === 'PERCENTAGE' ? 'percent' : 'flat',
        value: val,
        label: discountType === 'PERCENTAGE'
          ? `Diskon ${val}%`
          : `Diskon Rp ${new Intl.NumberFormat('id-ID').format(val)}`,
      };

      onVoucherGenerated?.(code, voucherResult);
      alert(`Voucher ${code} berhasil dibuat!`);

    } catch (error: any) {
      console.error('Voucher Error:', error);
      alert('Gagal Membuat Voucher: ' + (error.message ?? 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(generatedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-600 rounded-lg"><Sparkles size={16} className="text-white" /></div>
        <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">Voucher Generator</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Tipe">
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as any)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none bg-white"
            >
              <option value="PERCENTAGE">Persentase (%)</option>
              <option value="FIXED">Nominal (Rp)</option>
            </select>
          </FormField>

          <FormField label={discountType === 'PERCENTAGE' ? 'Nilai (%)' : 'Nilai (Rp)'}>
            <input
              type="number"
              value={discountValue}
              onChange={e => setDiscountValue(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none"
            />
          </FormField>

          <FormField label="Min. Beli">
            <input
              type="number"
              value={minPurchase}
              onChange={e => setMinPurchase(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none"
            />
          </FormField>

          <FormField label="Mulai">
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none"
            />
          </FormField>

          <FormField label="Berakhir">
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none"
            />
          </FormField>

          <FormField label="Limit Pemakaian">
            <input
              type="number"
              value={limitUsage}
              onChange={e => setLimitUsage(e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none"
              placeholder="Kosongkan jika tak terbatas"
            />
          </FormField>
        </div>

        <div className="w-full lg:w-56 flex flex-col justify-center border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8 text-center">
          <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Preview Kode</p>
          <div
            onClick={handleCopy}
            className={`border-2 border-dashed rounded-2xl py-4 cursor-pointer transition-all mb-3 ${
              copied ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-purple-200 hover:bg-purple-50'
            }`}
          >
            <p className={`text-xl font-black tracking-widest ${copied ? 'text-green-600' : 'text-purple-700'}`}>
              {copied ? <Check className="inline-block" size={20} /> : generatedCode}
            </p>
            <span className="text-[9px] text-slate-400 uppercase font-bold">
              {copied ? 'Berhasil Disalin' : 'Klik untuk Salin'}
            </span>
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3.5 bg-purple-600 text-white rounded-2xl text-[12px] font-black shadow-lg hover:bg-purple-700 disabled:bg-slate-300 transition-all flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={16} className="animate-spin" /> : 'BUAT VOUCHER'}
          </button>
        </div>
      </div>
    </div>
  );
}

function FormField({ label, children }: any) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider ml-1">{label}</label>
      {children}
    </div>
  );
}