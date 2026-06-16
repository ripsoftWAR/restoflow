import React from 'react';
import {
  Sparkles, ArrowUp, ArrowDown, Sliders, Scan,
  Plus, Upload, Tag, Store, Printer,
} from 'lucide-react';
import { Ingredient } from '../../../types';

interface RightSidebarProps {
  ingredients: Ingredient[];
  totalItem: number;
  onAddClick: () => void;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  onAdjustFirstClick: () => void;
}

const DISTRIB = [
  { name: 'Bahan Mentah',   pct: 43.6, color: 'bg-purple-600' },
  { name: 'Bumbu & Rempah', pct: 26.9, color: 'bg-blue-600' },
  { name: 'Minuman',        pct: 15.4, color: 'bg-green-600' },
  { name: 'Kemasan',        pct: 7.7,  color: 'bg-orange-500' },
  { name: 'Lainnya',        pct: 6.4,  color: 'bg-slate-400' },
];

const AKTIVITAS = [
  { icon: <ArrowUp size={12} className="text-green-600" />,  bg: 'bg-green-100',  name: 'Pembelian #PO-00521',  detail: '+15 kg Ayam Fillet',     time: '09:32' },
  { icon: <ArrowDown size={12} className="text-red-500" />,  bg: 'bg-red-100',    name: 'Penjualan #INV-01234', detail: '-2 kg Tepung Terigu',     time: '09:18' },
  { icon: <Sliders size={12} className="text-orange-500" />, bg: 'bg-orange-100', name: 'Penyesuaian Stok',     detail: 'Minyak Goreng -1 L',      time: '08:45' },
  { icon: <Scan size={12} className="text-purple-600" />,    bg: 'bg-purple-100', name: 'Scan Nota #OCR-0211',  detail: '+5 item ditambahkan',     time: '08:12' },
];

export default function RightSidebar({
  ingredients,
  totalItem,
  onAddClick,
  onAdjustFirstClick,
}: RightSidebarProps) {
  return (
    <div className="w-full flex flex-col gap-3 xl:w-72 xl:flex-shrink-0">

      {/* AI Insight */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-3.5 text-white relative overflow-hidden">
        <h4 className="text-xs font-bold mb-1">AI Insight</h4>
        <p className="text-[10px] opacity-85 leading-relaxed mb-3">
          3 bahan bakal habis dalam 2 hari ke depan.
        </p>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 border border-white/30 rounded-lg text-[10px] font-semibold">
          <Sparkles size={12} /> Tanya AI
        </button>
        <div className="absolute -right-2 -bottom-2 text-5xl opacity-20">🤖</div>
      </div>

      {/* Distribusi Kategori */}
      <div className="bg-white rounded-xl border border-slate-100 p-3.5">
        <h4 className="text-xs font-bold text-slate-800 mb-3">Distribusi Kategori</h4>
        <div className="flex flex-col gap-3">
          {DISTRIB.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-800">{item.name}</span>
                <span className="text-[10px] text-slate-400">
                  {Math.round(item.pct * totalItem / 100)} item ({item.pct}%)
                </span>
              </div>
              <div className="h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-white rounded-xl border border-slate-100 p-3.5">
        <h4 className="text-xs font-bold text-slate-800 mb-3">Quick Action</h4>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-2">
          {[
            { icon: <Plus size={16} />,    label: 'Tambah Bahan',   onClick: onAddClick },
            { icon: <Upload size={16} />,  label: 'Import Stok',    onClick: undefined },
            { icon: <Sliders size={16} />, label: 'Penyesuaian',    onClick: onAdjustFirstClick },
            { icon: <Tag size={16} />,     label: 'Kategori',       onClick: undefined },
            { icon: <Store size={16} />,   label: 'Supplier',       onClick: undefined },
            { icon: <Printer size={16} />, label: 'Print Laporan',  onClick: undefined },
          ].map((btn, idx) => (
            <button
              key={idx}
              onClick={btn.onClick}
              className="flex flex-col items-center gap-1 p-2 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors"
            >
              <span className="text-purple-600">{btn.icon}</span>
              <span className="text-[9px] font-medium text-slate-600 text-center">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aktivitas Stok Terbaru */}
      <div className="bg-white rounded-xl border border-slate-100 p-3.5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-800">Aktivitas Stok Terbaru</h4>
          <a className="text-[10px] text-purple-600 cursor-pointer font-medium">Lihat Semua</a>
        </div>
        <div className="flex flex-col gap-3">
          {AKTIVITAS.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className={`w-6 h-6 ${item.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-slate-800 leading-none">{item.name}</p>
                <p className="text-[9px] text-slate-400 mt-0.5">{item.detail}</p>
              </div>
              <span className="text-[9px] text-slate-400 flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
