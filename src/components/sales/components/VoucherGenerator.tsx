import React, { useState } from 'react';
import { RefreshCw, Copy, Check, Sparkles } from 'lucide-react';
import { generateVoucherCode } from '../utils/salesHelpers';

interface VoucherGeneratorProps {
  restaurantId: number;
  onVoucherGenerated?: (code: string) => void;
}

export default function VoucherGenerator({ restaurantId, onVoucherGenerated }: VoucherGeneratorProps) {
  const [discountType, setDiscountType]   = useState<'percent' | 'flat'>('percent');
  const [discountValue, setDiscountValue] = useState('10');
  const [minPurchase, setMinPurchase]     = useState('50000');
  const [dateFrom, setDateFrom]           = useState(() => new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo]               = useState(() => {
    const d = new Date(); d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [limitUsage, setLimitUsage]       = useState('100');
  const [isActive, setIsActive]           = useState(true);
  const [generatedCode, setGeneratedCode] = useState('SAVE10');
  const [copied, setCopied]               = useState(false);
  const [loading, setLoading]             = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    const code = generateVoucherCode();
    
    // Siapkan Payload untuk API
    const payload = {
      restaurant_id: restaurantId,
      code: code,
      type: discountType,
      value: parseFloat(discountValue),
      min_purchase: parseFloat(minPurchase),
      is_active: isActive,
      start_at: dateFrom,
      end_at: dateTo,
      max_usage: parseInt(limitUsage)
    };

    try {
      // PANGGIL BACKEND API
      const response = await fetch('/api/sales/vouchers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) throw new Error(result.error || 'Gagal menyimpan voucher');

      setGeneratedCode(code);
      if (onVoucherGenerated) onVoucherGenerated(code);
      alert(`Voucher ${code} berhasil dibuat!`);
    } catch (error: any) {
      alert("Error API: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard?.writeText(generatedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 relative overflow-hidden">
      {/* UI Form Sama Seperti Sebelumnya */}
      <div className="flex items-center gap-2 mb-6">
        <div className="p-2 bg-purple-600 rounded-lg"><Sparkles size={16} className="text-white" /></div>
        <h2 className="text-[15px] font-black text-slate-800 uppercase tracking-tight">Voucher Generator</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="Tipe">
            <select value={discountType} onChange={e => setDiscountType(e.target.value as any)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none">
              <option value="percent">Persentase (%)</option>
              <option value="flat">Nominal (Rp)</option>
            </select>
          </FormField>
          <FormField label="Nilai">
            <input type="number" value={discountValue} onChange={e => setDiscountValue(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none" />
          </FormField>
          <FormField label="Min. Beli">
            <input type="number" value={minPurchase} onChange={e => setMinPurchase(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none" />
          </FormField>
          <FormField label="Mulai">
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none" />
          </FormField>
          <FormField label="Berakhir">
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none" />
          </FormField>
          <FormField label="Limit">
            <input type="number" value={limitUsage} onChange={e => setLimitUsage(e.target.value)} className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-bold outline-none" />
          </FormField>
        </div>

        <div className="w-full lg:w-56 flex flex-col justify-center border-l border-slate-50 lg:pl-8 text-center">
          <p className="text-[10px] font-black text-slate-400 mb-2 uppercase tracking-widest">Kode Baru</p>
          <div onClick={handleCopy} className="bg-slate-50 border-2 border-dashed border-purple-200 rounded-2xl py-4 cursor-pointer hover:bg-purple-50 transition-all mb-3">
             <p className="text-xl font-black text-purple-700 tracking-widest">{generatedCode}</p>
             <span className="text-[9px] text-slate-400 uppercase">{copied ? 'Disalin!' : 'Klik untuk Salin'}</span>
          </div>
          <button onClick={handleGenerate} disabled={loading} className="w-full py-3.5 bg-purple-600 text-white rounded-2xl text-[12px] font-black shadow-lg hover:bg-purple-700 disabled:bg-slate-300 transition-all">
            {loading ? "PROSES..." : "BUAT VOUCHER"}
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