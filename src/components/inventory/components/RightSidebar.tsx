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
  { name: 'Bahan Mentah',   pct: 43.6, color: 'bg-pp-primary' },
  { name: 'Bumbu & Rempah', pct: 26.9, color: 'bg-pp-info' },
  { name: 'Minuman',        pct: 15.4, color: 'bg-pp-success' },
  { name: 'Kemasan',        pct: 7.7,  color: 'bg-pp-warning' },
  { name: 'Lainnya',        pct: 6.4,  color: 'bg-pp-border' },
];

const AKTIVITAS = [
  { icon: <ArrowUp size={12} className="text-pp-success" />,  bg: 'bg-pp-success-soft',  name: 'Pembelian #PO-00521',  detail: '+15 kg Ayam Fillet',     time: '09:32' },
  { icon: <ArrowDown size={12} className="text-pp-danger" />,  bg: 'bg-pp-danger-soft',    name: 'Penjualan #INV-01234', detail: '-2 kg Tepung Terigu',     time: '09:18' },
  { icon: <Sliders size={12} className="text-pp-warning" />, bg: 'bg-pp-warning-soft', name: 'Penyesuaian Stok',     detail: 'Minyak Goreng -1 L',      time: '08:45' },
  { icon: <Scan size={12} className="text-pp-primary" />,    bg: 'bg-pp-primary-soft', name: 'Scan Nota #OCR-0211',  detail: '+5 item ditambahkan',     time: '08:12' },
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
      <div className="bg-gradient-to-br from-pp-primary to-pp-primary-dark rounded-pp-md p-3.5 text-white relative overflow-hidden">
        <h4 className="text-xs font-bold mb-1">AI Insight</h4>
        <p className="text-[10px] opacity-85 leading-relaxed mb-3">
          3 bahan bakal habis dalam 2 hari ke depan.
        </p>
        <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 border border-white/30 rounded-lg text-[10px] font-semibold">
          <Sparkles size={12} /> Tanya AI
        </button>
        <Sparkles className="absolute -right-2 -bottom-2 w-10 h-10 opacity-20" />
      </div>

      {/* Distribusi Kategori */}
      <div className="bg-pp-surface rounded-pp-md border border-pp-border-light p-3.5">
        <h4 className="text-xs font-bold text-pp-text mb-3">Distribusi Kategori</h4>
        <div className="flex flex-col gap-3">
          {DISTRIB.map((item, idx) => (
            <div key={idx} className="flex flex-col gap-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-pp-text">{item.name}</span>
                <span className="text-[10px] text-pp-text-muted">
                  {Math.round(item.pct * totalItem / 100)} item ({item.pct}%)
                </span>
              </div>
              <div className="h-1 rounded-full bg-pp-border-light overflow-hidden">
                <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Action */}
      <div className="bg-pp-surface rounded-pp-md border border-pp-border-light p-3.5">
        <h4 className="text-xs font-bold text-pp-text mb-3">Quick Action</h4>
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
              className="flex flex-col items-center gap-1 p-2 border border-pp-border rounded-pp-sm hover:bg-pp-primary-soft hover:border-pp-primary-muted transition-colors"
            >
              <span className="text-pp-primary">{btn.icon}</span>
              <span className="text-[9px] font-medium text-pp-text-secondary text-center">{btn.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Aktivitas Stok Terbaru */}
      <div className="bg-pp-surface rounded-pp-md border border-pp-border-light p-3.5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-pp-text">Aktivitas Stok Terbaru</h4>
          <a className="text-[10px] text-pp-primary cursor-pointer font-medium">Lihat Semua</a>
        </div>
        <div className="flex flex-col gap-3">
          {AKTIVITAS.map((item, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <div className={`w-6 h-6 ${item.bg} rounded-pp-sm flex items-center justify-center flex-shrink-0`}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] font-semibold text-pp-text leading-none">{item.name}</p>
                <p className="text-[9px] text-pp-text-muted mt-0.5">{item.detail}</p>
              </div>
              <span className="text-[9px] text-pp-text-muted flex-shrink-0">{item.time}</span>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
