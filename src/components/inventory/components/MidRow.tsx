import React, { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, Clock, Activity } from 'lucide-react';
import { Ingredient } from '../../../types';
import { formatStock } from '../utils/format';

interface MidRowProps {
  ingredients: Ingredient[];
  totalItem: number;
  kritisCount: number;
}

// Warna default untuk kategori yang digenerate otomatis
const CATEGORY_COLORS: Record<string, { color: string, stroke: string }> = {
  'Bahan Mentah': { color: 'bg-purple-600', stroke: '#7c3aed' },
  'Bumbu & Rempah': { color: 'bg-blue-600', stroke: '#2563eb' },
  'Minuman': { color: 'bg-green-600', stroke: '#16a34a' },
  'Kemasan': { color: 'bg-orange-500', stroke: '#f97316' },
  'Lainnya': { color: 'bg-slate-300', stroke: '#e5e7eb' },
};

export default function MidRow({ ingredients, totalItem, kritisCount }: MidRowProps) {
  // --- 1. LOGIKA DINAMIS OVERVIEW (DONUT) ---
  const dynamicSegments = useMemo(() => {
    if (ingredients.length === 0) return [];

    // Hitung jumlah per kategori
    const counts = ingredients.reduce((acc, curr) => {
      const cat = curr.category || 'Lainnya';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Ubah ke format diagram
    let cumulativePercent = 0;
    return Object.entries(counts).map(([label, count]) => {
      const pct = parseFloat(((count / ingredients.length) * 100).toFixed(1));
      const config = CATEGORY_COLORS[label] || CATEGORY_COLORS['Lainnya'];
      const offset = cumulativePercent;
      cumulativePercent += pct;

      return {
        label,
        pct,
        offset: -offset, // Digunakan untuk strokeDashoffset
        ...config
      };
    }).sort((a, b) => b.pct - a.pct); // Urutkan dari yang terbesar
  }, [ingredients]);

  // --- 2. LOGIKA DINAMIS PREDIKSI ---
  const dynamicPredictions = useMemo(() => {
    return ingredients
      .filter(ing => ing.stock > 0) // Hanya yang masih ada stok
      .map(ing => {
        // Logika sederhana: Rasio stok vs min_stock sebagai indikator "sisa hari"
        // Dalam realitas, ini harusnya: (stok / rata-rata penggunaan harian)
        const ratio = ing.stock / (ing.min_stock || 1);
        let days = Math.ceil(ratio * 2); // Simulasi: 1x lipat min_stock = 2 hari

        let colorStyle = 'bg-green-50 text-green-600 border-green-100';
        if (days <= 2) colorStyle = 'bg-red-50 text-red-600 border-red-100';
        else if (days <= 4) colorStyle = 'bg-orange-50 text-orange-600 border-orange-100';

        return { name: ing.name, day: days, style: colorStyle };
      })
      .sort((a, b) => a.day - b.day) // Paling cepat habis di atas
      .slice(0, 5); // Ambil top 5
  }, [ingredients]);

  // --- ANIMASI ANGKA ---
  const [displayCount, setDisplayCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = totalItem;
    if (end === 0) { setDisplayCount(0); return; }
    const timer = setInterval(() => {
      start += Math.ceil(end / 20);
      if (start >= end) {
        setDisplayCount(end);
        clearInterval(timer);
      } else {
        setDisplayCount(start);
      }
    }, 30);
    return () => clearInterval(timer);
  }, [totalItem]);

  return (
    <>
      <style>{`
        @keyframes drawCircle { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
        .donut-segment { stroke-dasharray: 100; animation: drawCircle 1.5s ease-out forwards; }
        .animate-fade-in-up { animation: fadeInUp 0.5s ease-out forwards; opacity: 0; transform: translateY(10px); }
        @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        
        {/* 1. Overview Dinamis */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm relative overflow-hidden group">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><Activity size={16} className="text-purple-600" /> Overview</h3>
          </div>
          <div className="flex items-center gap-5">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f1f5f9" strokeWidth="5" />
                {dynamicSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="18" cy="18" r="15.9155"
                    fill="none"
                    stroke={seg.stroke}
                    strokeWidth="5"
                    strokeDasharray={`${seg.pct} 100`}
                    strokeDashoffset={seg.offset}
                    className="donut-segment"
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-lg font-extrabold text-slate-800">{displayCount}</span>
                <span className="text-[7px] text-slate-400 font-medium uppercase">Items</span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              {dynamicSegments.map((seg, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <div className={`w-1.5 h-1.5 rounded-full ${seg.color}`} />
                    <span className="text-[10px] text-slate-500 truncate">{seg.label}</span>
                  </div>
                  <span className="text-[10px] font-bold text-slate-700">{seg.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Critical Stock (Tetap) */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2"><AlertTriangle size={16} className="text-red-500" /> Critical</h3>
            <span className="text-[10px] font-bold bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{kritisCount}</span>
          </div>
          <div className="space-y-2 max-h-[120px] overflow-y-auto custom-scrollbar">
             {ingredients.filter(i => i.stock <= i.min_stock).slice(0, 4).map((ing, idx) => (
               <div key={ing.id} className="flex items-center p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold text-slate-700 truncate">{ing.name}</p>
                    <p className="text-[9px] text-slate-400">Sisa: <span className="text-red-500">{formatStock(ing.stock, ing.base_unit)}</span></p>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* 3. Prediksi Dinamis */}
        <div className="bg-white rounded-xl border border-slate-200/60 p-4 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-3"><Clock size={16} className="text-blue-500" /> Prediksi Habis</h3>
          <div className="space-y-2">
            {dynamicPredictions.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 p-2 rounded-lg bg-slate-50/50 border border-slate-100">
                <div className={`w-7 h-7 rounded flex items-center justify-center border ${item.style.split(' ')[0]} ${item.style.split(' ')[2]}`}>
                  <Clock size={12} className={item.style.split(' ')[1]} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-bold text-slate-700 truncate">{item.name}</p>
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded border ${item.style}`}>
                  {item.day}hr
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}