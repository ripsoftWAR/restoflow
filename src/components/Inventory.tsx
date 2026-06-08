import React, { useState } from 'react';
import {
  Search, Plus, Edit2, Sliders, X,
  AlertTriangle, ChevronDown, ChevronUp, Trash2
} from 'lucide-react';
import { Ingredient, BaseUnit } from '../types';

interface InventoryProps {
  ingredients: Ingredient[];
  onAddIngredient: (data: any) => Promise<void>;
  onEditIngredient: (id: number, data: any) => Promise<void>;
  onAdjustStock: (id: number, finalStock: number, notes: string) => Promise<void>;
  onDeleteIngredient: (id: number) => Promise<void>;
}

const formatIDR = (n: number) =>
  new Intl.NumberFormat('id-ID').format(n);

const formatStock = (amount: number, unit: BaseUnit) => {
  if (unit === 'gram' && amount >= 1000)
    return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
  if (unit === 'ml' && amount >= 1000)
    return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} L`;
  return `${amount} ${unit}`;
};

const bulkLabel = (unit: BaseUnit) =>
  unit === 'gram' ? 'kg' : unit === 'ml' ? 'Liter' : 'pcs';

const pricePerBulk = (unitPrice: number, unit: BaseUnit) =>
  unit === 'pcs' ? unitPrice : unitPrice * 1000;

const DEFAULT_CATS = ['Bumbu', 'Sayuran', 'Bahan Cair', 'Protein', 'Kering'];

// ─── Shared Modal Shell ───────────────────────────────────────────────────────
const Modal = ({
  title, subtitle, onClose, children,
}: {
  title: string; subtitle: string; onClose: () => void; children: React.ReactNode;
}) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-0 sm:p-4">
    <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl relative animate-in fade-in slide-in-from-bottom-4 sm:zoom-in duration-200 max-h-[92vh] overflow-y-auto">
      <button
        onClick={onClose}
        className="absolute right-4 top-4 p-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors"
      >
        <X size={15} />
      </button>
      <p className="text-[14px] font-semibold text-slate-800 pr-8">{title}</p>
      <p className="text-[11px] text-slate-400 mt-0.5 mb-4">{subtitle}</p>
      {children}
    </div>
  </div>
);

// ─── Shared Field ─────────────────────────────────────────────────────────────
const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div>
    <label className="block text-[11px] font-semibold text-slate-500 mb-1">{label}</label>
    {children}
  </div>
);

const inputCls =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-400 transition-colors';

const selectCls =
  'w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-blue-400 transition-colors font-medium';

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Inventory({
  ingredients, onAddIngredient, onEditIngredient, onAdjustStock, onDeleteIngredient,
}: InventoryProps) {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // ── Delete state ──
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteLoading, setShowDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [selected, setSelected] = useState<Ingredient | null>(null);

  // ── Add form ──
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Bumbu');
  const [newCustomCat, setNewCustomCat] = useState(false);
  const [newCustomCatName, setNewCustomCatName] = useState('');
  const [newSupplier, setNewSupplier] = useState('');
  const [newUnit, setNewUnit] = useState<BaseUnit>('gram');
  const [newStock, setNewStock] = useState('0');
  const [newMin, setNewMin] = useState('0');
  const [newPrice, setNewPrice] = useState('0');

  // ── Edit form ──
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editCustomCat, setEditCustomCat] = useState(false);
  const [editCustomCatName, setEditCustomCatName] = useState('');
  const [editSupplier, setEditSupplier] = useState('');
  const [editMin, setEditMin] = useState('0');
  const [editPrice, setEditPrice] = useState('0');

  // ── Adjust form ──
  const [adjValue, setAdjValue] = useState('');
  const [adjUnit, setAdjUnit] = useState<'base' | 'bulk'>('base');
  const [adjNotes, setAdjNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Derived ──
  const existingCats = Array.from(new Set(ingredients.map(i => i.category))).filter(Boolean);
  const allCats = Array.from(new Set([...DEFAULT_CATS, ...existingCats]));
  const tabs = ['Semua', 'Stok Kritis', ...allCats];

  const filtered = ingredients.filter(ing => {
    const q = search.toLowerCase();
    const matchSearch = ing.name.toLowerCase().includes(q) || ing.supplier.toLowerCase().includes(q);
    if (activeTab === 'Semua') return matchSearch;
    if (activeTab === 'Stok Kritis') return matchSearch && ing.stock <= ing.min_stock;
    return matchSearch && ing.category === activeTab;
  });

  // ── Handlers ──
  const openEdit = (ing: Ingredient) => {
    setSelected(ing);
    setEditName(ing.name);
    setEditCategory(ing.category);
    setEditCustomCat(false);
    setEditCustomCatName('');
    setEditSupplier(ing.supplier);
    setEditMin(ing.min_stock.toString());
    setEditPrice((ing.unit_price ?? 0).toString());
    setShowEditModal(true);
  };

  const openAdjust = (ing: Ingredient) => {
    setSelected(ing);
    setAdjValue('');
    setAdjUnit('base');
    setAdjNotes('');
    setShowAdjustModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newCustomCat ? newCustomCatName : newCategory;
    if (!newName.trim() || !cat.trim() || !newSupplier.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddIngredient({
        name: newName, category: cat, supplier: newSupplier,
        stock: parseFloat(newStock) || 0,
        base_unit: newUnit,
        min_stock: parseFloat(newMin) || 0,
        unit_price: parseFloat(newPrice) || 0,
      });
      setNewName(''); setNewSupplier(''); setNewStock('0');
      setNewMin('0'); setNewPrice('0');
      setNewCustomCat(false); setNewCustomCatName('');
      setShowAddModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected) return;
    const cat = editCustomCat ? editCustomCatName : editCategory;
    if (!cat.trim()) return;
    setIsSubmitting(true);
    try {
      await onEditIngredient(selected.id, {
        name: editName, category: cat, supplier: editSupplier,
        min_stock: parseFloat(editMin) || 0,
        unit_price: parseFloat(editPrice) || 0,
      });
      setShowEditModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selected || !adjValue) return;
    let val = parseFloat(adjValue);
    if (isNaN(val)) return;
    if (adjUnit === 'bulk' && selected.base_unit !== 'pcs') val *= 1000;
    setIsSubmitting(true);
    try {
      await onAdjustStock(selected.id, val, adjNotes);
      setShowAdjustModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Category select helper ───────────────────────────────────────────────

  const openDelete = (ing: Ingredient) => {
    setSelected(ing);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    setShowDeleteLoading(true);
    setDeleteError(null);
    try {
      await onDeleteIngredient(selected.id);
      setShowDeleteModal(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus. Bahan mungkin masih digunakan dalam resep.');
    } finally {
      setShowDeleteLoading(false);
      setIsSubmitting(false);
    }
  };
  const CatSelect = ({
    value, custom, customName,
    onChange, onCustomChange,
  }: {
    value: string; custom: boolean; customName: string;
    onChange: (v: string, isCustom: boolean) => void;
    onCustomChange: (v: string) => void;
  }) => (
    <>
      <select
        className={selectCls}
        value={custom ? 'custom' : value}
        onChange={e => {
          const v = e.target.value;
          onChange(v, v === 'custom');
        }}
      >
        {allCats.map(c => <option key={c} value={c}>{c}</option>)}
        <option value="custom">+ Kategori baru…</option>
      </select>
      {custom && (
        <input
          className={`${inputCls} mt-1.5`}
          placeholder="Nama kategori baru"
          value={customName}
          onChange={e => onCustomChange(e.target.value)}
        />
      )}
    </>
  );

  // ─── Form action buttons ──────────────────────────────────────────────────
  const FormActions = ({
    onCancel, submitLabel, loading,
  }: { onCancel: () => void; submitLabel: string; loading: boolean }) => (
    <div className="flex gap-2 pt-1">
      <button
        type="button" onClick={onCancel}
        disabled={loading}
        className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-[12px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={loading}
        className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-[12px] font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Memproses...
          </>
        ) : submitLabel}
      </button>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-[16px] font-semibold text-slate-800">Inventori Bahan</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Kelola stok, harga, dan batas minimum bahan.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-[12px] font-semibold transition-colors flex-shrink-0"
        >
          <Plus size={14} /> Tambah
        </button>
      </div>

      {/* ── Search + Tabs ───────────────────────────────────────────────────── */}
      <div className="space-y-2.5">
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari bahan atau supplier…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-8 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[12px] text-slate-700 focus:outline-none focus:border-blue-400 transition-colors"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all flex-shrink-0
                ${activeTab === tab
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}
            >
              {tab === 'Stok Kritis' && (
                <span className={`w-1.5 h-1.5 rounded-full ${activeTab === tab ? 'bg-white' : 'bg-rose-500'}`} />
              )}
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* ── Table: Desktop & Tablet (md+) ──────────────────────────────────── */}
      <div className="hidden md:block bg-white border border-slate-100 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/60">
              {['Bahan', 'Kategori', 'Stok fisik', 'Min stok', 'Harga beli', 'Aksi'].map(h => (
                <th key={h} className={`py-2.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-wide ${h === 'Aksi' ? 'text-right' : h === 'Stok fisik' || h === 'Min stok' || h === 'Harga beli' ? 'text-right' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length > 0 ? filtered.map(ing => {
              const isLow = ing.stock <= ing.min_stock;
              return (
                <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Nama */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      {isLow && (
                        <div className="w-5 h-5 bg-rose-50 rounded-md flex items-center justify-center flex-shrink-0">
                          <AlertTriangle size={11} className="text-rose-500" />
                        </div>
                      )}
                      <div>
                        <p className="text-[13px] font-semibold text-slate-800 leading-none">{ing.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{ing.supplier}</p>
                      </div>
                    </div>
                  </td>
                  {/* Kategori */}
                  <td className="py-3 px-4">
                    <span className="bg-slate-100 text-slate-500 text-[10px] font-semibold px-2 py-0.5 rounded-md">
                      {ing.category}
                    </span>
                  </td>
                  {/* Stok */}
                  <td className="py-3 px-4 text-right">
                    <p className={`text-[13px] font-semibold font-mono leading-none ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                      {formatStock(ing.stock, ing.base_unit)}
                    </p>
                    {isLow && <p className="text-[10px] text-rose-400 mt-0.5">Perlu restock</p>}
                  </td>
                  {/* Min stok */}
                  <td className="py-3 px-4 text-right">
                    <p className="text-[12px] text-slate-400 font-mono">
                      {ing.min_stock.toLocaleString()} {ing.base_unit}
                    </p>
                  </td>
                  {/* Harga */}
                  <td className="py-3 px-4 text-right">
                    <p className="text-[12px] font-semibold text-blue-600 font-mono leading-none">
                      Rp {formatIDR(pricePerBulk(ing.unit_price ?? 0, ing.base_unit))}/{bulkLabel(ing.base_unit)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                      Rp {formatIDR(ing.unit_price ?? 0)}/{ing.base_unit}
                    </p>
                  </td>
                  {/* Aksi */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => openAdjust(ing)}
                        title="Opname stok"
                        className="w-7 h-7 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Sliders size={13} />
                      </button>
                      <button
                        onClick={() => openEdit(ing)}
                        title="Edit bahan"
                        className="w-7 h-7 flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        onClick={() => openDelete(ing)}
                        title="Hapus bahan"
                        className="w-7 h-7 flex items-center justify-center bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6} className="py-10 text-center text-[12px] text-slate-400 italic">
                  Tidak ada bahan yang cocok.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ── Card List: Mobile (< md) ────────────────────────────────────────── */}
      <div className="md:hidden bg-white border border-slate-100 rounded-2xl overflow-hidden divide-y divide-slate-50">
        {filtered.length > 0 ? filtered.map(ing => {
          const isLow = ing.stock <= ing.min_stock;
          const expanded = expandedId === ing.id;
          return (
            <div key={ing.id} className="transition-colors">
              {/* ── Row utama ── */}
              <div className="flex items-center gap-3 px-4 py-3">
                {/* Status dot */}
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isLow ? 'bg-rose-500' : 'bg-emerald-400'}`} />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-800 truncate leading-none">{ing.name}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{ing.category} · {ing.supplier}</p>
                </div>

                {/* Stok + expand */}
                <div className="text-right flex-shrink-0">
                  <p className={`text-[13px] font-semibold font-mono leading-none ${isLow ? 'text-rose-600' : 'text-slate-800'}`}>
                    {formatStock(ing.stock, ing.base_unit)}
                  </p>
                  <button
                    onClick={() => setExpandedId(expanded ? null : ing.id)}
                    className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-0.5 ml-auto"
                  >
                    {expanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    detail
                  </button>
                </div>
              </div>

              {/* ── Expanded detail ── */}
              {expanded && (
                <div className="px-4 pb-3 space-y-3 animate-in fade-in slide-in-from-top-1 duration-150">
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-xl p-3">
                    <div>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Min stok</p>
                      <p className="text-[11px] font-semibold text-slate-700 font-mono">
                        {ing.min_stock.toLocaleString()} {ing.base_unit}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Harga/kg</p>
                      <p className="text-[11px] font-semibold text-blue-600 font-mono">
                        Rp {formatIDR(pricePerBulk(ing.unit_price ?? 0, ing.base_unit))}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
                      {isLow
                        ? <p className="text-[11px] font-semibold text-rose-600">⚠ Kritis</p>
                        : <p className="text-[11px] font-semibold text-emerald-600">✓ Aman</p>
                      }
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => openAdjust(ing)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-xl text-[12px] font-semibold transition-colors"
                    >
                      <Sliders size={13} /> Opname
                    </button>
                    <button
                      onClick={() => openEdit(ing)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-xl text-[12px] font-semibold transition-colors"
                    >
                      <Edit2 size={13} /> Edit
                      {/* Di bawah button Edit pada Mobile Card: */}
                    </button>
                    <button
                      onClick={() => openDelete(ing)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-[12px] font-semibold transition-colors"
                    >
                      <Trash2 size={13} /> Hapus
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        }) : (
          <p className="py-10 text-center text-[12px] text-slate-400 italic">
            Tidak ada bahan yang cocok.
          </p>
        )}
      </div>

      {/* ── Modal: Hapus ────────────────────────────────────────────────────── */}
      {showDeleteModal && selected && (
        <Modal
          title="Hapus Bahan"
          subtitle="Tindakan ini tidak bisa dibatalkan."
          onClose={() => !showDeleteLoading && setShowDeleteModal(false)}
        >
          <div className="space-y-4">
            <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl">
              <div className="flex items-start gap-3">
                <AlertTriangle className="text-rose-500 mt-0.5" size={16} />
                <div>
                  <p className="text-[13px] font-bold text-rose-900">Konfirmasi Hapus</p>
                  <p className="text-[12px] text-rose-700 mt-1">
                    Apakah Anda yakin ingin menghapus <strong>{selected.name}</strong>?
                    {selected.stock > 0 && ` Saat ini masih ada stok sebanyak ${formatStock(selected.stock, selected.base_unit)}.`}
                  </p>
                </div>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 items-center animate-in fade-in zoom-in duration-200">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 font-medium">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                disabled={showDeleteLoading}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-[12px] font-semibold hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={showDeleteLoading}
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-[12px] font-semibold hover:bg-rose-700 transition-colors flex items-center justify-center gap-2"
              >
                {showDeleteLoading ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {showDeleteLoading ? 'Menghapus...' : 'Ya, Hapus Bahan'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Modal: Tambah ────────────────────────────────────────────────────── */}
      {showAddModal && (
        <Modal
          title="Tambah Bahan Baru"
          subtitle="Daftarkan bahan dengan unit dasar yang tetap."
          onClose={() => setShowAddModal(false)}
        >
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Nama bahan">
              <input required className={inputCls} placeholder="cth. Cabai Merah Lembang"
                value={newName} onChange={e => setNewName(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategori">
                <CatSelect
                  value={newCategory} custom={newCustomCat} customName={newCustomCatName}
                  onChange={(v, isC) => { if (isC) setNewCustomCat(true); else { setNewCustomCat(false); setNewCategory(v); } }}
                  onCustomChange={setNewCustomCatName}
                />
              </Field>
              <Field label="Unit dasar">
                <select className={selectCls} value={newUnit}
                  onChange={e => setNewUnit(e.target.value as BaseUnit)}>
                  <option value="gram">gram (g)</option>
                  <option value="ml">ml (cair)</option>
                  <option value="pcs">pcs (biji)</option>
                </select>
              </Field>
            </div>

            <Field label="Supplier">
              <input required className={inputCls} placeholder="cth. Supplier Sayur Segar"
                value={newSupplier} onChange={e => setNewSupplier(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Stok awal (${newUnit})`}>
                <input type="number" min="0" step="0.01" className={inputCls}
                  value={newStock} onChange={e => setNewStock(e.target.value)} />
              </Field>
              <Field label={`Min stok (${newUnit})`}>
                <input type="number" min="0" step="0.01" className={inputCls}
                  value={newMin} onChange={e => setNewMin(e.target.value)} />
              </Field>
            </div>

            <Field label={`Harga beli (Rp per ${newUnit})`}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-mono">Rp</span>
                <input type="number" min="0" step="0.01"
                  className={`${inputCls} pl-8`}
                  value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                = Rp {formatIDR(pricePerBulk(parseFloat(newPrice) || 0, newUnit))} per {bulkLabel(newUnit)}
              </p>
            </Field>

            <FormActions onCancel={() => setShowAddModal(false)} submitLabel="Simpan Bahan" loading={isSubmitting} />
          </form>
        </Modal>
      )}

      {/* ── Modal: Edit ──────────────────────────────────────────────────────── */}
      {showEditModal && selected && (
        <Modal
          title={`Edit — ${selected.name}`}
          subtitle="Unit dasar tidak bisa diubah untuk menjaga integritas data."
          onClose={() => setShowEditModal(false)}
        >
          <form onSubmit={handleEdit} className="space-y-3">
            <Field label="Nama bahan">
              <input required className={inputCls} value={editName}
                onChange={e => setEditName(e.target.value)} />
            </Field>

            <Field label="Kategori">
              <CatSelect
                value={editCategory} custom={editCustomCat} customName={editCustomCatName}
                onChange={(v, isC) => { if (isC) setEditCustomCat(true); else { setEditCustomCat(false); setEditCategory(v); } }}
                onCustomChange={setEditCustomCatName}
              />
            </Field>

            <Field label="Supplier">
              <input required className={inputCls} value={editSupplier}
                onChange={e => setEditSupplier(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Min stok (${selected.base_unit})`}>
                <input type="number" min="0" step="0.01" className={inputCls}
                  value={editMin} onChange={e => setEditMin(e.target.value)} />
              </Field>
              <Field label={`Harga (Rp/${selected.base_unit})`}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-mono">Rp</span>
                  <input type="number" min="0" step="0.01"
                    className={`${inputCls} pl-8`}
                    value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                </div>
              </Field>
            </div>
            <p className="text-[10px] text-slate-400 -mt-1">
              = Rp {formatIDR(pricePerBulk(parseFloat(editPrice) || 0, selected.base_unit))} per {bulkLabel(selected.base_unit)}
            </p>

            <FormActions onCancel={() => setShowEditModal(false)} submitLabel="Simpan Perubahan" loading={isSubmitting} />
          </form>
        </Modal>
      )}

      {/* ── Modal: Opname ────────────────────────────────────────────────────── */}
      {showAdjustModal && selected && (
        <Modal
          title="Opname Stok"
          subtitle={`Override stok fisik untuk ${selected.name}.`}
          onClose={() => setShowAdjustModal(false)}
        >
          <form onSubmit={handleAdjust} className="space-y-3">
            {/* Current stock info */}
            <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3 py-2.5">
              <span className="text-[11px] text-slate-500">Stok saat ini</span>
              <span className="text-[13px] font-semibold text-blue-700 font-mono">
                {formatStock(selected.stock, selected.base_unit)}
              </span>
            </div>

            {/* Unit toggle */}
            <Field label="Metode input">
              <div className="grid grid-cols-2 gap-1 bg-slate-100 rounded-xl p-0.5">
                {(['base', 'bulk'] as const).map(u => (
                  <button
                    key={u} type="button"
                    disabled={u === 'bulk' && selected.base_unit === 'pcs'}
                    onClick={() => setAdjUnit(u)}
                    className={`py-1.5 rounded-lg text-[11px] font-semibold transition-all
                      ${u === 'bulk' && selected.base_unit === 'pcs' ? 'opacity-30 cursor-not-allowed' : ''}
                      ${adjUnit === u ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                  >
                    {u === 'base' ? `${selected.base_unit} (satuan)` : `${bulkLabel(selected.base_unit)} (bulk)`}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="Jumlah stok baru">
              <div className="relative">
                <input
                  required type="number" min="0" step="0.01"
                  placeholder={adjUnit === 'bulk' ? 'cth. 2.5' : 'cth. 2500'}
                  className={`${inputCls} pr-14`}
                  value={adjValue} onChange={e => setAdjValue(e.target.value)}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-semibold">
                  {adjUnit === 'bulk' ? bulkLabel(selected.base_unit) : selected.base_unit}
                </span>
              </div>
              {adjUnit === 'bulk' && adjValue && (
                <p className="text-[10px] text-blue-500 mt-1 font-mono">
                  = {formatIDR(parseFloat(adjValue) * 1000)} {selected.base_unit} di database
                </p>
              )}
            </Field>

            <Field label="Catatan opname">
              <textarea
                required rows={2}
                placeholder="cth. Opname mingguan, sisa bumbu kering pasar."
                className={inputCls}
                value={adjNotes} onChange={e => setAdjNotes(e.target.value)}
              />
            </Field>

            <FormActions onCancel={() => setShowAdjustModal(false)} submitLabel="Konfirmasi Opname" loading={isSubmitting} />
          </form>
        </Modal>
      )}
    </div>
  );
}