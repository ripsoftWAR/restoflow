import React from 'react';
import { TrendingUp, ChevronRight, Ticket } from 'lucide-react';
import { Sale } from '../../../types';
import { formatIDR } from '../utils/cartHelpers';

interface KasirStatsBarProps {
  sales: Sale[];
  onOpenVoucherGenerator: () => void;
}

export default function KasirStatsBar({ sales, onOpenVoucherGenerator }: KasirStatsBarProps) {
  // Logic Perhitungan dari Database Sales
  const totalRevenue   = sales.reduce((s, t) => s + (t.total_price || 0), 0);
  const txCount        = sales.length;
  const avgStruk       = txCount > 0 ? Math.round(totalRevenue / txCount) : 0;
  const itemsTerjual   = sales.reduce((s, t) => s + (t.quantity || 0), 0);
  
  // Menghitung pelanggan unik berdasarkan invoice_id (karena baris sales bersifat flat)
  const uniqueInvoices = new Set(sales.map(s => s.invoice_id || s.id)).size;

  const stats = [
    { 
      label: 'Penjualan Hari Ini',  
      value: formatIDR(totalRevenue), 
      delta: `${txCount} transaksi`,       
      color: 'text-emerald-500' 
    },
    { 
      label: 'Total Transaksi',           
      value: txCount,                  
      delta: 'Pesanan selesai',             
      color: 'text-blue-500' 
    },
    { 
      label: 'Rata-rata Struk',     
      value: formatIDR(avgStruk),      
      delta: 'Per pelanggan',              
      color: 'text-amber-500' 
    },
    { 
      label: 'Item Terjual',        
      value: `${itemsTerjual} Menu`,             
      delta: 'Volume produk',       
      color: 'text-indigo-500' 
    },
    { 
      label: 'Pelanggan Unik',      
      value: uniqueInvoices,                
      delta: 'Traffic harian',             
      color: 'text-rose-500' 
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map((s) => (
        <div 
          key={s.label} 
          className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
        >
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5 leading-tight">
            {s.label}
          </p>
          <p className="text-[16px] font-black text-slate-800 leading-none truncate">
            {s.value}
          </p>
          <div className={`flex items-center gap-1 text-[10px] font-bold ${s.color} mt-2`}>
            <TrendingUp size={10} strokeWidth={3} />
            <span className="truncate">{s.delta}</span>
          </div>
        </div>
      ))}

      {/* Button Voucher Generator */}
      <button
        onClick={onOpenVoucherGenerator}
        className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-2xl p-4 text-left relative overflow-hidden shadow-lg shadow-purple-100 hover:shadow-purple-200 active:scale-[0.98] transition-all group"
      >
        {/* Dekorasi Latar Belakang */}
        <div className="absolute -top-3 -left-3 w-12 h-12 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
        <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-500" />
        
        <div className="relative flex flex-col h-full justify-between">
          <div className="flex justify-between items-start">
            <div className="p-1.5 bg-white/20 rounded-lg backdrop-blur-md">
              <Ticket size={14} className="text-white" />
            </div>
            <ChevronRight size={16} className="text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
          </div>
          
          <div className="mt-2">
            <p className="text-[12px] font-black text-white leading-tight">Voucher & Promo</p>
            <p className="text-[9px] text-white/70 mt-0.5 leading-tight font-medium">Buat diskon baru</p>
          </div>
        </div>
      </button>
    </div>
  );
}