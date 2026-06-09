import React from 'react';
import { AlertTriangle, Clock } from 'lucide-react';
import { Ingredient } from '../../types';
import { formatStock } from '../utils/format';

interface MidRowProps {
  ingredients: Ingredient[];
  totalItem: number;
  kritisCount: number;
}

const DONUT_SEGMENTS = [
  { label: 'Bahan Mentah',   pct: 43.6, color: 'bg-purple-600', stroke: '#7c3aed' },
  { label: 'Bumbu & Rempah', pct: 26.9, color: 'bg-blue-600',   stroke: '#2563eb' },
  { label: 'Minuman',        pct: 15.4, color: 'bg-green-600',  stroke: '#16a34a' },
  { label: 'Kemasan',        pct: 7.7,  color: 'bg-orange-500', stroke: '#f97316' },
  { label: 'Lainnya',        pct: 6.4,  color: 'bg-slate-300',  stroke: '#e5e7eb' },
];

const PREDIKSI = [
  { name: 'Tepung Terigu', day: 1, color: 'bg-red-100 text-red-600' },
  { name: 'Ayam Fillet',   day: 2, color: 'bg-orange-100 text-orange-600' },
  { name: 'Saus Sambal',   day: 2, color: 'bg-orange-100 text-orange-600' },
  { name: 'Bawang Putih',  day: 3, color: 'bg-blue-100 text-blue-600' },
  { name: 'Telur Ayam',    day: 4, color: 'bg-green-100 text-green-600' },
];

export default function MidRow({ ingredients, totalItem, kritisCount }: MidRowProps) {
  const kritisItems = ingredients.filter(i => i.stock <= i.min_stock).slice(0, 5);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">

      {/* Ringkasan Stok — Donut */}
      <div className="bg-white rounded-xl border border-slate-100 p-3.5">
        <h3 className="text-xs font-bold text-slate-800 mb-3">Ringkasan Stok</h3>
        <div className="flex items-center gap-3">
          <div className="relative w-20 h-20 flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none" stroke="#f1f5f9" strokeWidth="6"
              />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#7c3aed" strokeWidth="6" strokeDasharray="43 57"      strokeDashoffset="0" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563eb" strokeWidth="6" strokeDasharray="27 73"      strokeDashoffset="-43" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#16a34a" strokeWidth="6" strokeDasharray="15.4 84.6"  strokeDashoffset="-70" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="6" strokeDasharray="7.7 92.3"   strokeDashoffset="-85.4" />
              <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" strokeWidth="6" strokeDasharray="6.4 93.6"   strokeDashoffset="-93.1" />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
              <div className="text-sm font-extrabold text-slate-800">{totalItem}</div>
              <div className="text-[8px] text-slate-400">Total Item</div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 flex-1">
            {DONUT_SEGMENTS.map((seg, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${seg.color}`} />
                <span className="text-[10px] text-slate-600 flex-1 truncate">{seg.label}</span>
                <span className="text-[10px] font-bold text-slate-800">{seg.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stok Kritis */}
      <div className="bg-white rounded-xl border border-slate-100 p-3.5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800">
            Stok Kritis{' '}
            <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded-full">
              {kritisCount}
            </span>
          </h3>
          <a className="text-[10px] text-purple-600 cursor-pointer font-medium">Lihat Semua</a>
        </div>
        <div className="flex flex-col gap-1.5 overflow-y-auto max-h-32">
          {kritisItems.length > 0
            ? kritisItems.map(ing => (
                <div key={ing.id} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg">
                  <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                    <AlertTriangle size={10} className="text-red-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-slate-800 truncate leading-none">
                      {ing.name}
                    </p>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Sisa: {formatStock(ing.stock, ing.base_unit)}
                    </p>
                  </div>
                </div>
              ))
            : <p className="text-[10px] text-slate-400 italic">Tidak ada stok kritis.</p>
          }
        </div>
      </div>

      {/* Prediksi Habis */}
      <div className="bg-white rounded-xl border border-slate-100 p-3.5 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-bold text-slate-800">Prediksi Habis</h3>
          <a className="text-[10px] text-purple-600 cursor-pointer font-medium">Selanjutnya →</a>
        </div>
        <div className="flex flex-col gap-1.5">
          {PREDIKSI.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <div className="w-5 h-5 bg-purple-50 rounded flex items-center justify-center flex-shrink-0">
                <Clock size={10} className="text-purple-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-800 truncate leading-none">
                  {item.name}
                </p>
                <p className="text-[9px] text-slate-400">Habis dalam</p>
              </div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${item.color}`}>
                {item.day} hari
              </span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
