import React from 'react';
import { TrendingUp, ChevronRight } from 'lucide-react';
import { Sale } from '../../../types';
import { formatIDR, formatIDRShort } from '../utils/salesHelpers';

interface KasirStatsBarProps {
  sales: Sale[];
  onOpenVoucherGenerator: () => void;
}

export default function KasirStatsBar({ sales, onOpenVoucherGenerator }: KasirStatsBarProps) {
  const totalRevenue   = sales.reduce((s, t) => s + t.total_price, 0);
  const txCount        = sales.length;
  const avgStruk       = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
  const itemsTerjual   = sales.reduce((s, t) => s + t.quantity, 0);
  // unique "pelanggan" approximated as unique sale IDs today (real data = JOIN customers)
  const pelanggan      = new Set(sales.map(s => s.id)).size;

  const stats = [
    { label: 'Penjualan Hari Ini',  value: formatIDR(totalRevenue), delta: `${txCount} transaksi`,       up: true },
    { label: 'Transaksi',           value: txCount,                  delta: 'total hari ini',             up: true },
    { label: 'Rata-rata Struk',     value: formatIDR(avgStruk),      delta: 'per transaksi',              up: avgStruk > 0 },
    { label: 'Item Terjual',        value: itemsTerjual,             delta: `${itemsTerjual} item`,       up: true },
    { label: 'Pelanggan',           value: pelanggan,                delta: 'transaksi unik',             up: true },
  ];

  return (
    <div className="grid grid-cols-6 gap-3">
      {stats.map(s => (
        <div key={s.label} className="bg-white rounded-xl border border-slate-100 px-4 py-3 shadow-sm">
          <p className="text-[10px] text-slate-400 font-medium mb-1 leading-tight">{s.label}</p>
          <p className="text-[15px] font-extrabold text-slate-800 leading-none">{s.value}</p>
          <p className="flex items-center gap-0.5 text-[10px] font-semibold text-green-500 mt-1">
            <TrendingUp size={10} />
            {s.delta}
          </p>
        </div>
      ))}

      {/* Vouchers & Diskon promo card */}
      <button
        onClick={onOpenVoucherGenerator}
        className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl px-4 py-3 text-left relative overflow-hidden shadow-sm hover:from-purple-700 hover:to-indigo-800 transition group"
      >
        {/* decorative circles */}
        <div className="absolute -top-3 -left-3 w-12 h-12 bg-white/10 rounded-full" />
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full" />
        <div className="relative">
          <p className="text-[12px] font-bold text-white leading-tight">Vouchers &amp; Diskon</p>
          <p className="text-[10px] text-white/70 mt-0.5 leading-tight">Generate voucher diskon untuk promosi penjualan</p>
        </div>
        <ChevronRight size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 group-hover:text-white transition" />
      </button>
    </div>
  );
}
