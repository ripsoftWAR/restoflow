import React, { useState, useRef, useEffect } from 'react';
import {
  Plus,
  Search,
  Eye,
  Edit2,
  ArrowUp,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Ingredient } from '../../../types';
import {
  formatIDR,
  formatStockRaw,
  formatPricePerUnit,
  formatPricePerBulk,
} from '../utils/format';
import { useFeatures } from '../../../hooks/useFeatures';

// ── Kategori badge styling ──
const CAT_STYLE: Record<string, string> = {
  'Bahan Mentah':   'bg-[#EAF3DE] text-[#27500A]',
  'Bumbu & Rempah': 'bg-[#FAEEDA] text-[#633806]',
  'Minuman':        'bg-[#E6F1FB] text-[#0C447C]',
  'Kemasan':        'bg-[#EEEDFE] text-[#3C3489]',
};

const CATEGORIES = ['Semua Bahan', 'Bahan Mentah', 'Bumbu & Rempah', 'Minuman', 'Kemasan', 'Lainnya'];
const STATUSES  = ['Semua', 'Aman', 'Kritis'];

interface TableSectionProps {
  filtered: Ingredient[];
  totalItem: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
  onAdjust: (ing: Ingredient) => void;
  onEdit: (ing: Ingredient) => void;
  onDelete: (ing: Ingredient) => void;
  onAddClick: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

export default function TableSection({
  filtered,
  totalItem,
  activeTab,
  onTabChange,
  statusFilter,
  onStatusChange,
  onAdjust,
  onEdit,
  onDelete,
  onAddClick,
  search,
  onSearchChange,
}: TableSectionProps) {
  const { can } = useFeatures();
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleMenu = (id: number) => {
    setOpenMenuId(prev => (prev === id ? null : id));
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm flex flex-col font-sans w-full"
         style={{ minHeight: 500 }}
    >
      {/* ── Toolbar ── */}
      <div className="flex items-center gap-2 p-4 border-b border-slate-200 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-[140px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari bahan..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 pl-9 pr-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-700 outline-none focus:border-slate-400 placeholder:text-slate-400"
          />
        </div>

        {/* Category filter */}
        <select
          value={activeTab}
          onChange={(e) => onTabChange(e.target.value)}
          className="h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 outline-none focus:border-slate-400"
        >
          {CATEGORIES.map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        {/* Status filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="h-9 px-3 text-xs border border-slate-200 rounded-lg bg-white text-slate-600 outline-none focus:border-slate-400"
        >
          {STATUSES.map(s => (
            <option key={s} value={s}>{s === 'Semua' ? 'Semua status' : s}</option>
          ))}
        </select>

        {/* Tambah Bahan button */}
        {can('inventory.add') && (
          <button
            onClick={onAddClick}
            className="inline-flex items-center gap-1.5 h-9 px-3.5 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors ml-auto"
          >
            <Plus size={14} />
            Tambah Bahan
          </button>
        )}
      </div>

      {/* ── Table ── */}
      <div className="flex-1 overflow-auto">
        <table className="w-full min-w-[720px] text-left border-collapse">
          <colgroup>
            <col style={{ width: 44 }} />
            <col style={{ width: 'auto' }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 90 }} />
            <col style={{ width: 56 }} />
            <col style={{ width: 130 }} />
            <col style={{ width: 110 }} />
            <col style={{ width: 80 }} />
            <col style={{ width: 48 }} />
          </colgroup>

          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {['#', 'Bahan', 'Kategori', 'Stok', 'Sat.', 'Harga beli', 'Nilai stok', 'Status', ''].map((h, i) => (
                <th
                  key={i}
                  className={`p-3 text-[11px] font-medium text-slate-500 tracking-wide align-middle ${i === 0 || i === 3 || i === 5 || i === 6 ? 'text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {filtered.length > 0 ? (
              filtered.map((ing, idx) => {
                const isLow = ing.stock <= ing.min_stock;
                const stockInBuyUnit =
                  ing.conversion_factor && ing.buy_unit && ing.buy_unit !== ing.base_unit
                    ? ing.stock / ing.conversion_factor
                    : ing.stock;
                const nilai = stockInBuyUnit * ing.unit_price;

                return (
                  <tr
                    key={ing.id}
                    className={`transition-colors ${isLow ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}
                  >
                    {/* # */}
                    <td className="p-3 text-[11px] text-slate-400 text-right align-middle">
                      {idx + 1}
                    </td>

                    {/* Bahan */}
                    <td className="p-3 align-middle">
                      <p className="text-[13px] font-medium text-slate-800 leading-tight">{ing.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{ing.supplier}</p>
                    </td>

                    {/* Kategori */}
                    <td className="p-3 align-middle">
                      <span className={`inline-block px-2 py-0.5 rounded text-[11px] font-medium ${CAT_STYLE[ing.category] ?? 'bg-slate-100 text-slate-500'}`}>
                        {ing.category}
                      </span>
                    </td>

                    {/* Stok (raw, dalam base unit) */}
                    <td className={`p-3 text-right align-middle text-[12.5px] font-semibold font-mono ${isLow ? 'text-red-600' : 'text-slate-800'}`}>
                      {ing.conversion_factor && ing.buy_unit && ing.buy_unit !== ing.base_unit
  ? `${formatStockRaw(Math.round(ing.stock / ing.conversion_factor * 100) / 100)}`
  : formatStockRaw(ing.stock)}
                    </td>

                    {/* Satuan */}
                    <td className="p-3 text-center text-[11px] text-slate-400 align-middle">
                      {ing.buy_unit && ing.buy_unit !== ing.base_unit ? ing.buy_unit : ing.base_unit}
                    </td>

                    {/* Harga beli */}
                    <td className="p-3 text-right align-middle">
                      <p className="text-[12.5px] font-medium text-slate-800 font-mono">
                        {formatPricePerUnit(ing.unit_price, ing.base_unit)}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {formatPricePerBulk(ing.unit_price, ing.base_unit)}
                      </p>
                    </td>

                    {/* Nilai stok */}
                    <td className="p-3 text-right text-[12.5px] font-semibold text-slate-700 font-mono align-middle">
                      Rp {formatIDR(nilai)}
                    </td>

                    {/* Status */}
                    <td className="p-3 align-middle">
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                          Kritis
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          Aman
                        </span>
                      )}
                    </td>

                    {/* Menu ⋮ */}
                    <td className="p-3 align-middle">
                      <div className="relative flex justify-center" ref={openMenuId === ing.id ? menuRef : undefined}>
                        <button
                          onClick={() => toggleMenu(ing.id)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                            <circle cx="8" cy="3" r="1.5" />
                            <circle cx="8" cy="8" r="1.5" />
                            <circle cx="8" cy="13" r="1.5" />
                          </svg>
                        </button>

                        {openMenuId === ing.id && (
                          <div className="absolute right-0 top-8 bg-white border border-slate-200 rounded-lg shadow-lg min-w-[150px] z-50 overflow-hidden">
                            <button
                              onClick={() => { setOpenMenuId(null); onEdit(ing); }}
                              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                              <Eye size={14} /> Detail
                            </button>
                            {can('inventory.edit') && (
                              <button
                                onClick={() => { setOpenMenuId(null); onEdit(ing); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <Edit2 size={14} /> Edit
                              </button>
                            )}
                            {can('inventory.adjust_stock') && (
                              <button
                                onClick={() => { setOpenMenuId(null); onAdjust(ing); }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
                              >
                                <ArrowUp size={14} /> Tambah stok
                              </button>
                            )}
                            {can('inventory.delete') && (
                              <>
                                <div className="h-px bg-slate-100" />
                                <button
                                  onClick={() => { setOpenMenuId(null); onDelete(ing); }}
                                  className="flex items-center gap-2 w-full px-3 py-2 text-xs text-red-600 hover:bg-red-50 transition-colors"
                                >
                                  <Trash2 size={14} /> Hapus
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="p-12 text-center text-slate-400 italic text-xs">
                  Tidak ada bahan yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Footer: pagination info ── */}
      <div className="flex items-center justify-between p-3 border-t border-slate-200 bg-slate-50/50 flex-shrink-0">
        <div className="text-[11px] text-slate-400">
          Menampilkan 1–{filtered.length} dari {totalItem} item
        </div>
        <div className="flex gap-1">
          <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-white">
            <ChevronLeft size={12} />
          </button>
          <button className="w-7 h-7 flex items-center justify-center border border-slate-900 bg-slate-900 text-white rounded-lg text-[11px]">
            1
          </button>
          <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-white">
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}