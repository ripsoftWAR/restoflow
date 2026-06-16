import React, { useEffect, useState, useMemo } from 'react';
import { AlertTriangle, Clock, Activity, ArrowRight, BarChart3 } from 'lucide-react';
import { Ingredient } from '../../../types';
import { formatStock } from '../utils/format';

interface UnifiedInventoryGraphProps {
  ingredients: Ingredient[];
  totalItem: number;
  kritisCount: number;
}

const CATEGORY_COLORS: Record<string, { from: string; to: string }> = {
  'Bahan Mentah': { from: '#a78bfa', to: '#7c3aed' },
  'Bumbu & Rempah': { from: '#60a5fa', to: '#2563eb' },
  'Minuman': { from: '#4ade80', to: '#16a34a' },
  'Kemasan': { from: '#fb923c', to: '#f97316' },
  'Lainnya': { from: '#cbd5e1', to: '#94a3b8' },
};

export default function UnifiedInventoryGraph({ ingredients, totalItem, kritisCount }: UnifiedInventoryGraphProps) {

  // 1. Logika Data Donut (Kategori)
  const categoryStats = useMemo(() => {
    const counts = ingredients.reduce((acc, curr) => {
      const cat = curr.category || 'Lainnya';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let cumulativePercent = 0;
    return Object.entries(counts).map(([label, count]) => {
      const pct = parseFloat(((count / ingredients.length) * 100).toFixed(1));
      const config = CATEGORY_COLORS[label] || CATEGORY_COLORS['Lainnya'];
      const offset = cumulativePercent;
      cumulativePercent += pct;
      return { label, pct, offset: -offset, ...config };
    }).sort((a, b) => b.pct - a.pct);
  }, [ingredients]);

  // 2. Logika Item Kritis & Prediksi
  const criticalItems = useMemo(() =>
    ingredients
      .filter(ing => ing.stock <= ing.min_stock)
      .slice(0, 3),
    [ingredients]);

  const predictionItems = useMemo(() => {
    return ingredients
      .filter(ing => ing.stock > 0)
      .map(ing => ({
        ...ing,
        daysLeft: Math.ceil((ing.stock / (ing.min_stock || 1)) * 2)
      }))
      .sort((a, b) => a.daysLeft - b.daysLeft)
      .slice(0, 3);
  }, [ingredients]);

  return (
    <div className="font-['Inter',_sans-serif] w-full">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        @keyframes drawCircle { from { stroke-dashoffset: 100; } to { stroke-dashoffset: 0; } }
        .donut-segment { stroke-dasharray: 100; animation: drawCircle 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
        .progress-fill { transition: width 1s ease-out; }
      `}</style>

      <div className="bg-white border border-slate-200/80 rounded-[24px] shadow-sm overflow-hidden">
        {/* Header Section */}
        <div className="relative px-5 py-4 border-b border-slate-100 bg-white/40 backdrop-blur-md">
          {/* Layer Efek Kaca Reflektif */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50/80 via-transparent to-slate-50/30 pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">

            {/* SISI KIRI: Branding & Status */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="p-2.5 bg-slate-900 rounded-xl shadow-lg shadow-slate-200 ring-1 ring-slate-800/10">
                  <BarChart3 size={18} className="text-white" />
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full pulse-ring" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Intelligence Hub</h3>
                  <span className="px-1.5 py-0.5 bg-slate-100 text-slate-500 text-[9px] font-bold rounded uppercase tracking-wider border border-slate-200/50">v2.4</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5 mt-0.5">
                  <span className="inline-block w-1 h-1 rounded-full bg-slate-300" />
                  Status & Projection Analysis
                </p>
              </div>
            </div>

            {/* SISI TENGAH: Tanggal & Filter (The "Premium Control" Block) */}
            <div className="flex items-center gap-2 p-1.5 bg-slate-100/50 rounded-[14px] border border-slate-200/40 shadow-inner">
              {/* Date Pill */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-white shadow-sm border border-slate-200/60 rounded-[10px]">
                <Clock size={12} className="text-slate-400" />
                <span className="text-[11px] font-bold text-slate-600">
                  {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
              </div>

              {/* Interactive Filter Dropdown Style */}
              <button className="group flex items-center gap-2 px-3 py-1.5 hover:bg-white transition-all duration-300 rounded-[10px] cursor-pointer">
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full border border-white bg-slate-200 ring-1 ring-slate-100" />
                  <div className="w-4 h-4 rounded-full border border-white bg-slate-300 ring-1 ring-slate-100" />
                </div>
                <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800 transition-colors">Semua Kategori</span>
                <svg className="w-3 h-3 text-slate-400 group-hover:translate-y-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
</svg>
              </button>
            </div>

            {/* SISI KANAN: Visual Counters */}
            <div className="flex items-center gap-4 border-l border-slate-200/80 pl-4">
              <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-tight">Total SKU</span>
                <span className="text-base font-black text-slate-800 tracking-tighter leading-none">{totalItem}</span>
              </div>

              <div className="group relative flex items-center gap-3 px-3 py-2 bg-red-50/50 hover:bg-red-50 transition-colors border border-red-100/60 rounded-xl">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-[radial-gradient(circle_at_50%_-20%,rgba(239,68,68,0.1),transparent)] rounded-xl" />
                <div className="text-right relative z-10">
                  <span className="text-[9px] font-black text-red-400 uppercase tracking-widest leading-tight">Critical</span>
                  <p className="text-base font-black text-red-500 tracking-tighter leading-none">{kritisCount}</p>
                </div>
                <AlertTriangle size={18} className="text-red-400 group-hover:rotate-12 transition-transform" />
              </div>
            </div>

          </div>

          <style>{`
    @keyframes pulse-ring {
      0% { transform: scale(0.33); opacity: 0.5; }
      80%, 100% { opacity: 0; }
    }
    .pulse-ring::before {
      content: '';
      position: absolute; width: 300%; height: 300%; top: -100%; left: -100%;
      border-radius: 45px; background-color: #10b981;
      animation: pulse-ring 1.25s cubic-bezier(0.455, 0.03, 0.515, 0.955) infinite;
    }
  `}</style>
        </div>

        {/* Content Section: Unified Grid */}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

          {/* ZONE 1: Categories (Donut) */}
          <div className="lg:col-span-4 flex flex-col items-center border-b lg:border-b-0 lg:border-r border-slate-100 pb-8 lg:pb-0 lg:pr-8">
            <div className="relative w-44 h-44">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="#f1f5f9" strokeWidth="3.5" />
                {categoryStats.map((seg, i) => (
                  <circle
                    key={i}
                    cx="18" cy="18" r="15.9"
                    fill="none"
                    stroke={`url(#grad-${i})`}
                    strokeWidth="4"
                    strokeDasharray={`${seg.pct} 100`}
                    strokeDashoffset={seg.offset}
                    strokeLinecap="round"
                    className="donut-segment"
                  />
                ))}
                <defs>
                  {categoryStats.map((seg, i) => (
                    <linearGradient key={i} id={`grad-${i}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={seg.from} />
                      <stop offset="100%" stopColor={seg.to} />
                    </linearGradient>
                  ))}
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-3xl font-extrabold text-slate-800 leading-none">{totalItem}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 tracking-widest">Items</p>
              </div>
            </div>

            <div className="mt-6 w-full space-y-2">
              {categoryStats.slice(0, 4).map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cat.from }} />
                    <span className="text-slate-500 font-medium">{cat.label}</span>
                  </div>
                  <span className="font-bold text-slate-700">{cat.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ZONE 2 & 3: Alerts and Predictions */}
          <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-8">

            {/* Critical Monitor */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-red-500">
                <AlertTriangle size={14} strokeWidth={2.5} />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.1em]">Stok Kritis</h4>
              </div>
              <div className="space-y-4">
                {criticalItems.length > 0 ? criticalItems.map((item, i) => (
                  <div key={i} className="group">
                    <div className="flex justify-between items-end mb-1.5">
                      <p className="text-xs font-semibold text-slate-700 truncate mr-2">{item.name}</p>
                      <p className="text-[10px] font-bold text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                        {formatStock(item.stock, item.base_unit)}
                      </p>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-red-400 to-rose-500 progress-fill rounded-full"
                        style={{ width: `${Math.min(100, (item.stock / (item.min_stock || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                )) : (
                  <div className="py-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 flex flex-col items-center justify-center">
                    <p className="text-[11px] text-slate-400">Semua stok aman</p>
                  </div>
                )}
              </div>
            </div>

            {/* Run-out Prediction */}
            <div>
              <div className="flex items-center gap-2 mb-4 text-indigo-500">
                <Clock size={14} strokeWidth={2.5} />
                <h4 className="text-[11px] font-bold uppercase tracking-[0.1em]">Prediksi Habis</h4>
              </div>
              <div className="space-y-3">
                {predictionItems.map((item, i) => {
                  const isUrgent = item.daysLeft <= 2;
                  return (
                    <div key={i} className="p-3 rounded-xl border border-slate-100 bg-slate-50/30 flex items-center justify-between hover:border-indigo-200 transition-colors">
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-700 truncate">{item.name}</p>
                        <p className="text-[10px] text-slate-400">Estimasi habis dalam {item.daysLeft} hari</p>
                      </div>
                      <div className={`flex flex-col items-center min-w-[40px] px-2 py-1 rounded-lg ${isUrgent ? 'bg-orange-50 text-orange-600' : 'bg-indigo-50 text-indigo-600'}`}>
                        <span className="text-[11px] font-black">{item.daysLeft}</span>
                        <span className="text-[8px] font-bold uppercase">Hari</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>
        </div>

        {/* Bottom CTA / Legend */}
        <div className="px-6 py-3 bg-slate-50/50 border-t border-slate-100 flex justify-center">
          <button className="flex items-center gap-1.5 text-indigo-600 font-bold text-[10px] uppercase tracking-widest hover:gap-3 transition-all">
            View Full Analytics Report <ArrowRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}