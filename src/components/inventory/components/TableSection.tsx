import React from 'react';
import { Sliders, Edit2, Trash2, ChevronLeft, ChevronRight, List, LayoutGrid } from 'lucide-react';
import { Ingredient } from '../../types';
import { formatIDR, formatStock, pricePerBulk, bulkLabel } from '../utils/format';

const TABS = ['Semua Bahan', 'Bahan Mentah', 'Bumbu & Rempah', 'Minuman', 'Kemasan', 'Lainnya'];

const CAT_EMOJI: Record<string, string> = {
  'Bahan Mentah': '🥩',
  'Bumbu & Rempah': '🧄',
  'Minuman': '🥤',
  'Kemasan': '📦',
};

interface TableSectionProps {
  filtered: Ingredient[];
  totalItem: number;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAdjust: (ing: Ingredient) => void;
  onEdit: (ing: Ingredient) => void;
  onDelete: (ing: Ingredient) => void;
}

export default function TableSection({
  filtered,
  totalItem,
  activeTab,
  onTabChange,
  onAdjust,
  onEdit,
  onDelete,
}: TableSectionProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">

      {/* Tabs */}
      <div className="flex items-center gap-0 border-b border-slate-100 px-4 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab)}
            className={`py-2.5 px-3 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors
              ${activeTab === tab
                ? 'text-purple-600 border-purple-600'
                : 'text-slate-400 border-transparent hover:text-slate-600'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-50">
        <select className="text-[11px] py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-600 outline-none focus:border-purple-500">
          <option>Semua Unit</option>
          <option>gram / kg</option>
          <option>ml / L</option>
          <option>pcs</option>
        </select>
        <div className="flex gap-1">
          <button className="p-1.5 border border-purple-200 bg-purple-50 text-purple-600 rounded-lg">
            <List size={14} />
          </button>
          <button className="p-1.5 border border-slate-200 text-slate-400 rounded-lg">
            <LayoutGrid size={14} />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50/60 border-b border-slate-100">
              <th className="p-3 w-7"><input type="checkbox" /></th>
              {['Bahan ↓', 'Kategori', 'Stok', 'Satuan', 'Harga Beli', 'Nilai Stok', 'Status', 'Aksi'].map((h, i) => (
                <th
                  key={h}
                  className={`p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide ${i >= 2 ? 'text-right' : ''}`}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length > 0
              ? filtered.map(ing => {
                  const isLow = ing.stock <= ing.min_stock;
                  const isWarning = !isLow && ing.stock <= ing.min_stock * 1.5;
                  const nilai = ing.stock * ing.unit_price;

                  return (
                    <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors group">
                      <td className="p-3"><input type="checkbox" /></td>

                      {/* Nama */}
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {isLow && <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />}
                          <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                            {CAT_EMOJI[ing.category] ?? '📦'}
                          </div>
                          <div>
                            <p className="text-[12px] font-semibold text-slate-800 leading-none">{ing.name}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{ing.supplier}</p>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="p-3">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                          {ing.category}
                        </span>
                      </td>

                      {/* Stok */}
                      <td className="p-3 text-right">
                        <p className={`text-[12px] font-semibold font-mono leading-none ${isLow ? 'text-red-500' : 'text-slate-800'}`}>
                          {formatStock(ing.stock, ing.base_unit)}
                        </p>
                      </td>

                      {/* Satuan */}
                      <td className="p-3 text-right text-[11px] text-slate-400 font-mono">
                        {ing.base_unit === 'gram' ? 'kg' : ing.base_unit === 'ml' ? 'L' : 'pcs'}
                      </td>

                      {/* Harga Beli */}
                      <td className="p-3 text-right">
                        <div className="text-[12px] font-semibold text-blue-600 font-mono">
                          Rp {formatIDR(pricePerBulk(ing.unit_price, ing.base_unit))}/{bulkLabel(ing.base_unit)}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Rp {formatIDR(ing.unit_price)}/{ing.base_unit}
                        </div>
                      </td>

                      {/* Nilai Stok */}
                      <td className="p-3 text-right text-[12px] font-semibold text-slate-700 font-mono">
                        Rp {formatIDR(nilai)}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-right">
                        {isLow
                          ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Kritis</span>
                          : isWarning
                            ? <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Perhatian</span>
                            : <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600">Aman</span>
                        }
                      </td>

                      {/* Aksi */}
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => onAdjust(ing)}
                            title="Opname"
                            className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-purple-50 hover:text-purple-600 text-slate-400"
                          >
                            <Sliders size={12} />
                          </button>
                          <button
                            onClick={() => onEdit(ing)}
                            title="Edit"
                            className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 text-slate-400"
                          >
                            <Edit2 size={12} />
                          </button>
                          <button
                            onClick={() => onDelete(ing)}
                            title="Hapus"
                            className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-red-50 hover:text-red-500 text-slate-400"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              : (
                <tr>
                  <td colSpan={9} className="p-10 text-center text-slate-400 italic text-xs">
                    Tidak ada bahan yang cocok.
                  </td>
                </tr>
              )
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/30">
        <div className="text-[11px] text-slate-400">
          Menampilkan 1–{filtered.length} dari {totalItem} item
        </div>
        <div className="flex gap-1">
          <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-white">
            <ChevronLeft size={12} />
          </button>
          {[1, 2, 3, 4].map(n => (
            <button
              key={n}
              className={`w-7 h-7 flex items-center justify-center border rounded-lg text-[11px]
                ${n === 1
                  ? 'border-purple-600 bg-purple-600 text-white'
                  : 'border-slate-200 text-slate-600 hover:bg-white'}`}
            >
              {n}
            </button>
          ))}
          <span className="w-7 h-7 flex items-center justify-center text-slate-400 text-[11px]">…</span>
          <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-white text-[11px]">
            20
          </button>
          <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-white">
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
