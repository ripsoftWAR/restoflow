import React from 'react';
import { Ingredient, RecipeWithDetails } from '../../../types';
import { calculateHPP, calculateMarginPct, formatIDR } from '../utils/recipeHelpers';

interface RecipeRightPanelProps {
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
}

// simple sparkline path generator
function sparklinePath(values: number[], w: number, h: number): string {
  if (!values.length) return '';
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return `M ${pts.join(' L ')}`;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun'];
const HPP_MOCK = [80, 110, 95, 140, 160, 185]; // mock trend data

const CATEGORY_COLORS: Record<string, string> = {
  'Bumbu & Rempah': '#7c3aed',
  'Minuman': '#16a34a',
  'Kemasan': '#f97316',
  'Bahan Mentah': '#2563eb',
  'Lainnya': '#94a3b8',
};

export default function RecipeRightPanel({ recipes, ingredients }: RecipeRightPanelProps) {
  // category distribution
  const catMap: Record<string, number> = {};
  recipes.forEach(r => {
    const cat = r.category || 'Makanan';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const total = recipes.length || 1;
  const cats = Object.entries(catMap).sort((a, b) => b[1] - a[1]);

  // Donut SVG segments
  const DONUT_COLORS = ['#7c3aed', '#16a34a', '#f97316', '#2563eb', '#94a3b8'];
  let offset = 0;
  const donutSegs = cats.map(([ cat, count ], idx) => {
    const pct = (count / total) * 100;
    const seg = { cat, count, pct, offset, color: DONUT_COLORS[idx % DONUT_COLORS.length] };
    offset += pct;
    return seg;
  });

  return (
    <div className="w-56 flex-shrink-0 flex flex-col gap-3">

      {/* HPP Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3.5">
        <h4 className="text-xs font-bold text-slate-800 mb-1">Resep & Laba-Rugi</h4>
        <p className="text-[9px] text-slate-400 mb-2">— HPP Rata-rata</p>
        <svg viewBox={`0 0 200 80`} className="w-full" style={{ height: 70 }}>
          {/* Grid lines */}
          {[0,25,50,75].map(y => (
            <line key={y} x1="24" y1={y} x2="200" y2={y} stroke="#f1f5f9" strokeWidth="1"/>
          ))}
          {/* Y labels */}
          {[250,200,150,100,50,0].map((val, i) => (
            <text key={val} x="20" y={4 + i * 13} fontSize="6" textAnchor="end" fill="#94a3b8">{val}</text>
          ))}
          {/* Sparkline */}
          <path
            d={sparklinePath(HPP_MOCK, 170, 70)}
            fill="none"
            stroke="#7c3aed"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            transform="translate(26,0)"
          />
          {/* Area fill */}
          <path
            d={`${sparklinePath(HPP_MOCK, 170, 70)} L 170,70 L 0,70 Z`}
            fill="url(#chartGrad)"
            opacity="0.15"
            transform="translate(26,0)"
          />
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
        {/* X labels */}
        <div className="flex justify-between px-6 mt-1">
          {MONTHS.map(m => (
            <span key={m} className="text-[8px] text-slate-400">{m}</span>
          ))}
        </div>
      </div>

      {/* Donut kategori */}
      <div className="bg-white rounded-2xl border border-slate-100 p-3.5">
        <h4 className="text-xs font-bold text-slate-800 mb-3">Resep Kategori</h4>
        {/* SVG donut */}
        <div className="flex justify-center mb-3">
          <svg viewBox="0 0 80 80" className="w-20 h-20">
            {donutSegs.map((seg, i) => {
              const r = 28;
              const circumference = 2 * Math.PI * r;
              const dash = (seg.pct / 100) * circumference;
              const gap = circumference - dash;
              const dashOffset = -((seg.offset / 100) * circumference);
              return (
                <circle
                  key={i}
                  cx="40" cy="40" r={r}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="12"
                  strokeDasharray={`${dash} ${gap}`}
                  strokeDashoffset={dashOffset}
                  transform="rotate(-90 40 40)"
                />
              );
            })}
            <text x="40" y="37" textAnchor="middle" fontSize="8" fontWeight="800" fill="#1e293b">{total}</text>
            <text x="40" y="46" textAnchor="middle" fontSize="6" fill="#94a3b8">Menu</text>
          </svg>
        </div>
        {/* Legend */}
        <div className="space-y-1.5">
          {donutSegs.map((seg, i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: seg.color }} />
                <span className="text-[10px] text-slate-600 truncate max-w-[90px]">{seg.cat}</span>
              </div>
              <span className="text-[10px] font-bold text-slate-700">
                {seg.count} ({seg.pct.toFixed(0)}%)
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
