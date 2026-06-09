import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Plus, Edit2, Sliders, X, AlertTriangle, ChevronDown, ChevronUp, Trash2,
  Bell, Filter, Box, DollarSign, Clock, AlertCircle, ArrowUp, ArrowDown,
  Scan, Upload, Tag, Store, Printer, Sparkles, List, LayoutGrid,
  ChevronLeft, ChevronRight, Check, Package, ShoppingCart, FileText, CheckCircle
} from 'lucide-react';
import { Ingredient, BaseUnit } from '../types';

interface InventoryProps {
  ingredients: Ingredient[];
  onAddIngredient: (data: any) => Promise<void>;
  onEditIngredient: (id: number, data: any) => Promise<void>;
  onAdjustStock: (id: number, finalStock: number, notes: string) => Promise<void>;
  onDeleteIngredient: (id: number) => Promise<void>;
}

// --- Helper Functions ---
const formatIDR = (n: number) => new Intl.NumberFormat('id-ID').format(n);

const formatStock = (amount: number, unit: BaseUnit) => {
  if (unit === 'gram' && amount >= 1000) return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
  if (unit === 'ml' && amount >= 1000) return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} L`;
  return `${amount} ${unit}`;
};

const pricePerBulk = (unitPrice: number, unit: BaseUnit) =>
  unit === 'pcs' ? unitPrice : unitPrice * 1000;

const bulkLabel = (unit: BaseUnit) =>
  unit === 'gram' ? 'kg' : unit === 'ml' ? 'Liter' : 'pcs';

const DEFAULT_CATS = ['Bahan Mentah', 'Bumbu & Rempah', 'Minuman', 'Kemasan', 'Lainnya'];

// --- Shared Components ---
const Modal = ({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
    <div className="bg-white w-full max-w-md rounded-2xl p-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
      <button onClick={onClose} className="absolute right-4 top-4 p-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
        <X size={15} />
      </button>
      <p className="text-[14px] font-bold text-slate-800 pr-8">{title}</p>
      <p className="text-[11px] text-slate-400 mt-1 mb-4">{subtitle}</p>
      {children}
    </div>
  </div>
);

const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <div className="mb-3">
    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">{label}</label>
    {children}
  </div>
);

const inputCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-purple-500 transition-colors";
const selectCls = "w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-purple-500 transition-colors font-medium";

// --- Main Component ---
export default function Inventory({
  ingredients, onAddIngredient, onEditIngredient, onAdjustStock, onDeleteIngredient,
}: InventoryProps) {

  // -- State --
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Semua Bahan');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // -- Modal States --
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  
  const [selected, setSelected] = useState<Ingredient | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // -- Form States --
  // Add
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Bahan Mentah');
  const [newSupplier, setNewSupplier] = useState('');
  const [newUnit, setNewUnit] = useState<BaseUnit>('gram');
  const [newStock, setNewStock] = useState('0');
  const [newMin, setNewMin] = useState('0');
  const [newPrice, setNewPrice] = useState('0');

  // Edit
  const [editName, setEditName] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editSupplier, setEditSupplier] = useState('');
  const [editMin, setEditMin] = useState('0');
  const [editPrice, setEditPrice] = useState('0');

  // Adjust
  const [adjValue, setAdjValue] = useState('');
  const [adjNotes, setAdjNotes] = useState('');

  // -- Derived Data --
  const existingCats = Array.from(new Set(ingredients.map(i => i.category))).filter(Boolean);
  const allCats = [...DEFAULT_CATS, ...existingCats.filter(c => !DEFAULT_CATS.includes(c))];
  
  const filtered = useMemo(() => ingredients.filter(ing => {
    const q = search.toLowerCase();
    const matchSearch = ing.name.toLowerCase().includes(q) || ing.supplier.toLowerCase().includes(q);
    
    if (activeTab === 'Semua Bahan') return matchSearch;
    if (activeTab === 'Stok Kritis') return matchSearch && ing.stock <= ing.min_stock;
    return matchSearch && ing.category === activeTab;
  }), [ingredients, search, activeTab, ingredients.length]); // Optimized re-renders

  // Stats
  const totalItem = ingredients.length;
  const totalNilai = ingredients.reduce((acc, i) => acc + (i.stock * i.unit_price), 0);
  const kritisCount = ingredients.filter(i => i.stock <= i.min_stock).length;
  const akanHabis = ingredients.filter(i => i.stock <= i.min_stock * 1.5 && i.stock > i.min_stock).length;

  // -- Handlers --
  const openEdit = (ing: Ingredient) => {
    setSelected(ing);
    setEditName(ing.name);
    setEditCategory(ing.category);
    setEditSupplier(ing.supplier);
    setEditMin(ing.min_stock.toString());
    setEditPrice((ing.unit_price ?? 0).toString());
    setShowEditModal(true);
  };

  const openAdjust = (ing: Ingredient) => {
    setSelected(ing);
    setAdjValue(ing.stock.toString());
    setAdjNotes('');
    setShowAdjustModal(true);
  };

  const openDelete = (ing: Ingredient) => {
    setSelected(ing);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSupplier.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddIngredient({
        name: newName, category: newCategory, supplier: newSupplier,
        stock: parseFloat(newStock) || 0,
        base_unit: newUnit,
        min_stock: parseFloat(newMin) || 0,
        unit_price: parseFloat(newPrice) || 0,
      });
      setNewName(''); setNewSupplier(''); setNewStock('0');
      setNewMin('0'); setNewPrice('0');
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
    setIsSubmitting(true);
    try {
      await onEditIngredient(selected.id, {
        name: editName, category: editCategory, supplier: editSupplier,
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
    const val = parseFloat(adjValue);
    if (isNaN(val)) return;
    
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

  const handleDelete = async () => {
    if (!selected) return;
    setIsSubmitting(true);
    try {
      await onDeleteIngredient(selected.id);
      setShowDeleteModal(false);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const CatSelect = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <>
      <select className={selectCls} value={value} onChange={e => onChange(e.target.value)}>
        {allCats.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
    </>
  );

  const selectedIngredient = selected ?? null;

  return (
    <>
      <div className="min-h-full w-full bg-transparent p-4">
      <div className="flex gap-4 min-h-0">
          <div className="body-left flex-1 min-w-0 flex flex-col gap-3 overflow-y-auto">
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="stat-card bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="stat-icon purple w-8 h-8 rounded-lg flex items-center justify-center bg-purple-50 text-purple-600">
                    <Box size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Total Item</div>
                    <div className="text-xl font-extrabold text-slate-800 leading-tight">{totalItem}</div>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400">Semua bahan aktif</div>
              </div>

              <div className="stat-card bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="stat-icon green w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600">
                    <DollarSign size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Total Nilai Stok</div>
                    <div className="text-base font-extrabold text-green-600 leading-tight">Rp {formatIDR(totalNilai)}</div>
                  </div>
                </div>
                <div className="text-[10px] text-green-600 font-medium">▲ 12% dari bulan lalu</div>
              </div>

              <div className="stat-card bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="stat-icon red w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 text-red-500">
                    <AlertTriangle size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Stok Kritis</div>
                    <div className="text-xl font-extrabold text-red-500 leading-tight">{kritisCount} Item</div>
                  </div>
                </div>
                <div className="text-[10px] text-red-500 font-medium">▲ 2 item baru</div>
              </div>

              <div className="stat-card bg-white rounded-xl p-3.5 border border-slate-100 shadow-sm">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="stat-icon blue w-8 h-8 rounded-lg flex items-center justify-center bg-blue-50 text-blue-600">
                    <Clock size={16} />
                  </div>
                  <div>
                    <div className="text-[10px] font-semibold text-slate-400 uppercase">Akan Habis (7 hari)</div>
                    <div className="text-xl font-extrabold text-blue-600 leading-tight">{akanHabis} Item</div>
                  </div>
                </div>
                <div className="text-[10px] text-blue-600 font-medium">Perlu perhatian</div>
              </div>
            </div>

                        {/* Mid Row: Donut, Kritis, Prediksi */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Ringkasan Donut */}
              <div className="bg-white rounded-xl border border-slate-100 p-3.5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-800">Ringkasan Stok</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative w-20 h-20 flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f1f5f9" strokeWidth="6" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#7c6af7" strokeWidth="6" strokeDasharray="43 57" strokeDashoffset="0" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#2563eb" strokeWidth="6" strokeDasharray="27 73" strokeDashoffset="-43" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#16a34a" strokeWidth="6" strokeDasharray="15.4 84.6" strokeDashoffset="-70" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f97316" strokeWidth="6" strokeDasharray="7.7 92.3" strokeDashoffset="-85.4" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#e5e7eb" strokeWidth="6" strokeDasharray="6.4 93.6" strokeDashoffset="-93.1" />
                    </svg>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
                      <div className="text-sm font-extrabold text-slate-800">{totalItem}</div>
                      <div className="text-[8px] text-slate-400">Total Item</div>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 flex-1">
                    {[
                      { label: 'Bahan Mentah', pct: '43.6%', color: 'bg-purple-600' },
                      { label: 'Bumbu & Rempah', pct: '26.9%', color: 'bg-blue-600' },
                      { label: 'Minuman', pct: '15.4%', color: 'bg-green-600' },
                      { label: 'Kemasan', pct: '7.7%', color: 'bg-orange-500' },
                      { label: 'Lainnya', pct: '6.4%', color: 'bg-slate-300' },
                    ].map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${item.color}`} />
                        <span className="text-[10px] text-slate-600 flex-1 truncate">{item.label}</span>
                        <span className="text-[10px] font-bold text-slate-800">{item.pct}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stok Kritis */}
              <div className="bg-white rounded-xl border border-slate-100 p-3.5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-800">Stok Kritis <span className="ml-1 px-1.5 py-0.5 bg-red-100 text-red-600 text-[9px] font-bold rounded-full">{kritisCount}</span></h3>
                  <a className="text-[10px] text-purple-600 cursor-pointer font-medium">Lihat Semua</a>
                </div>
                <div className="flex flex-col gap-1.5 overflow-y-auto max-h-32">
                  {ingredients.filter(i => i.stock <= i.min_stock).slice(0, 5).map(ing => (
                    <div key={ing.id} className="flex items-center gap-2 p-1.5 bg-slate-50 rounded-lg">
                      <div className="w-5 h-5 bg-red-100 rounded flex items-center justify-center flex-shrink-0">
                        <AlertTriangle size={10} className="text-red-500" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-slate-800 truncate leading-none">{ing.name}</p>
                        <p className="text-[9px] text-slate-400 mt-0.5">Sisa: {formatStock(ing.stock, ing.base_unit)}</p>
                      </div>
                    </div>
                  ))}
                  {kritisCount === 0 && <p className="text-[10px] text-slate-400 italic">Tidak ada stok kritis.</p>}
                </div>
              </div>

              {/* Prediksi Habis */}
              <div className="bg-white rounded-xl border border-slate-100 p-3.5 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-800">Prediksi Habis</h3>
                  <a className="text-[10px] text-purple-600 cursor-pointer font-medium">Selanjutnya →</a>
                </div>
                <div className="flex flex-col gap-1.5">
                  {[
                    { name: 'Tepung Terigu', day: 1, color: 'red' },
                    { name: 'Ayam Fillet', day: 2, color: 'orange' },
                    { name: 'Saus Sambal', day: 2, color: 'orange' },
                    { name: 'Bawang Putih', day: 3, color: 'blue' },
                    { name: 'Telur Ayam', day: 4, color: 'green' },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-purple-50 rounded flex items-center justify-center flex-shrink-0">
                        <Clock size={10} className="text-purple-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800 truncate leading-none">{item.name}</p>
                        <p className="text-[9px] text-slate-400">Habis dalam</p>
                      </div>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 
                        ${item.color === 'red' ? 'bg-red-100 text-red-600' : 
                          item.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                          item.color === 'blue' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                        {item.day} hari
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="bg-white border border-slate-100 rounded-xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-0 border-b border-slate-100 px-4 overflow-x-auto">
                {['Semua Bahan', 'Bahan Mentah', 'Bumbu & Rempah', 'Minuman', 'Kemasan', 'Lainnya'].map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`py-2.5 px-3 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors
                      ${activeTab === tab 
                        ? 'text-purple-600 border-purple-600' 
                        : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              <div className="flex items-center justify-between p-3 border-b border-slate-50">
                <div className="flex items-center gap-2">
                  <select className="text-[11px] py-1.5 px-2.5 border border-slate-200 rounded-lg bg-white text-slate-600 outline-none focus:border-purple-500">
                    <option>Semua Unit</option>
                    <option>gram / kg</option>
                    <option>ml / L</option>
                    <option>pcs</option>
                  </select>
                </div>
                <div className="flex gap-1">
                  <button className="p-1.5 border border-purple-200 bg-purple-50 text-purple-600 rounded-lg"><List size={14} /></button>
                  <button className="p-1.5 border border-slate-200 text-slate-400 rounded-lg"><LayoutGrid size={14} /></button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/60 border-b border-slate-100">
                      <th className="p-3 w-7"><input type="checkbox" className="rounding" /></th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Bahan ↓</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kategori</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Stok</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Satuan</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Harga Beli</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Nilai Stok</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Status</th>
                      <th className="p-3 text-[10px] font-bold text-slate-400 uppercase tracking-wide text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.length > 0 ? filtered.map(ing => {
                      const isLow = ing.stock <= ing.min_stock;
                      const nilai = ing.stock * ing.unit_price;
                      return (
                        <tr key={ing.id} className="hover:bg-slate-50/50 transition-colors group">
                          <td className="p-3"><input type="checkbox" className="rounding" /></td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {isLow && <div className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                                {ing.category === 'Bahan Mentah' ? '🥩' : ing.category === 'Bumbu & Rempah' ? '🧄' : '📦'}
                              </div>
                              <div>
                                <p className="text-[12px] font-semibold text-slate-800 leading-none">{ing.name}</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">{ing.supplier}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-50 text-purple-600">
                              {ing.category}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <p className={`text-[12px] font-semibold font-mono leading-none ${isLow ? 'text-red-500' : 'text-slate-800'}`}>
                              {formatStock(ing.stock, ing.base_unit)}
                            </p>
                          </td>
                          <td className="p-3 text-right text-[11px] text-slate-400 font-mono">
                            {ing.base_unit === 'gram' ? 'kg' : ing.base_unit === 'ml' ? 'L' : 'pcs'}
                          </td>
                          <td className="p-3 text-right">
                            <div className="text-[12px] font-semibold text-blue-600 font-mono">
                              Rp {formatIDR(pricePerBulk(ing.unit_price, ing.base_unit))}/{bulkLabel(ing.base_unit)}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Rp {formatIDR(ing.unit_price)}/{ing.base_unit}
                            </div>
                          </td>
                          <td className="p-3 text-right text-[12px] font-semibold text-slate-700 font-mono">
                            Rp {formatIDR(nilai)}
                          </td>
                          <td className="p-3 text-right">
                            {isLow ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-600">Kritis</span>
                            ) : ing.stock <= ing.min_stock * 1.5 ? (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-600">Perhatian</span>
                            ) : (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-600">Aman</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button onClick={() => openAdjust(ing)} title="Opname" className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-purple-50 hover:text-purple-600 text-slate-400">
                                <Sliders size={12} />
                              </button>
                              <button onClick={() => openEdit(ing)} title="Edit" className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-100 text-slate-400">
                                <Edit2 size={12} />
                              </button>
                              <button onClick={() => openDelete(ing)} title="Hapus" className="p-1.5 border border-slate-200 rounded-lg bg-white hover:bg-red-50 hover:text-red-500 text-slate-400">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr>
                        <td colSpan={9} className="p-10 text-center text-slate-400 italic text-xs">
                          Tidak ada bahan yang cocok.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between p-3 border-t border-slate-100 bg-slate-50/30">
                <div className="text-[11px] text-slate-400">Menampilkan 1–{filtered.length} dari {totalItem} item</div>
                <div className="flex gap-1">
                  <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-white"><ChevronLeft size={12} /></button>
                  <button className="w-7 h-7 flex items-center justify-center border border-purple-600 bg-purple-600 text-white rounded-lg">1</button>
                  <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-white">2</button>
                  <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-white">3</button>
                  <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-white">4</button>
                  <span className="w-7 h-7 flex items-center justify-center text-slate-400">…</span>
                  <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-600 hover:bg-white">20</button>
                  <button className="w-7 h-7 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:bg-white"><ChevronRight size={12} /></button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
                    <div className="body-right w-52 flex-shrink-0 flex flex-col gap-3">
            {/* AI Insight */}
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-3.5 text-white relative overflow-hidden">
              <h4 className="text-xs font-bold mb-1">AI Insight</h4>
              <p className="text-[10px] opacity-85 leading-relaxed mb-3">3 bahan bakal habis dalam 2 hari ke depan.</p>
              <button className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-white/20 border border-white/30 rounded-lg text-[10px] font-semibold">
                <Sparkles size={12} /> Tanya AI
              </button>
              <div className="absolute -right-2 -bottom-2 text-5xl opacity-20">🤖</div>
            </div>

            {/* Distribusi Kategori */}
            <div className="bg-white rounded-xl border border-slate-100 p-3.5">
              <h4 className="text-xs font-bold text-slate-800 mb-3">Distribusi Kategori</h4>
              <div className="flex flex-col gap-3">
                {[
                  { name: 'Bahan Mentah', pct: 43.6, color: 'bg-purple-600' },
                  { name: 'Bumbu & Rempah', pct: 26.9, color: 'bg-blue-600' },
                  { name: 'Minuman', pct: 15.4, color: 'bg-green-600' },
                  { name: 'Kemasan', pct: 7.7, color: 'bg-orange-500' },
                  { name: 'Lainnya', pct: 6.4, color: 'bg-slate-400' },
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-800">{item.name}</span>
                      <span className="text-[10px] text-slate-400">{Math.round(item.pct * totalItem / 100)} item ({item.pct}%)</span>
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
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setShowAddModal(true)} className="flex flex-col items-center gap-1 p-2 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors">
                  <Plus size={16} className="text-purple-600" />
                  <span className="text-[9px] font-medium text-slate-600 text-center">Tambah Bahan</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors">
                  <Upload size={16} className="text-purple-600" />
                  <span className="text-[9px] font-medium text-slate-600 text-center">Import Stok</span>
                </button>
                <button
                  onClick={() => {
                    const first = ingredients[0];
                    if (first) openAdjust(first);
                  }}
                  className="flex flex-col items-center gap-1 p-2 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors"
                >
                  <Sliders size={16} className="text-purple-600" />
                  <span className="text-[9px] font-medium text-slate-600 text-center">Penyesuaian</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors">
                  <Tag size={16} className="text-purple-600" />
                  <span className="text-[9px] font-medium text-slate-600 text-center">Kategori</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors">
                  <Store size={16} className="text-purple-600" />
                  <span className="text-[9px] font-medium text-slate-600 text-center">Supplier</span>
                </button>
                <button className="flex flex-col items-center gap-1 p-2 border border-slate-200 rounded-lg hover:bg-purple-50 hover:border-purple-200 transition-colors">
                  <Printer size={16} className="text-purple-600" />
                  <span className="text-[9px] font-medium text-slate-600 text-center">Print Laporan</span>
                </button>
              </div>
            </div>

            {/* Aktivitas Stok */}
            <div className="bg-white rounded-xl border border-slate-100 p-3.5">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-slate-800">Aktivitas Stok Terbaru</h4>
                <a className="text-[10px] text-purple-600 cursor-pointer font-medium">Lihat Semua</a>
              </div>
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowUp size={12} className="text-green-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 leading-none">Pembelian #PO-00521</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">+15 kg Ayam Fillet</p>
                  </div>
                  <span className="text-[9px] text-slate-400">09:32</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <ArrowDown size={12} className="text-red-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 leading-none">Penjualan #INV-01234</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">-2 kg Tepung Terigu</p>
                  </div>
                  <span className="text-[9px] text-slate-400">09:18</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sliders size={12} className="text-orange-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 leading-none">Penyesuaian Stok</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">Minyak Goreng -1 L</p>
                  </div>
                  <span className="text-[9px] text-slate-400">08:45</span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-6 h-6 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Scan size={12} className="text-purple-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 leading-none">Scan Nota #OCR-0211</p>
                    <p className="text-[9px] text-slate-400 mt-0.5">+5 item ditambahkan</p>
                  </div>
                  <span className="text-[9px] text-slate-400">08:12</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- MODALS --- */}

      {/* Add Modal */}
      {showAddModal && (
        <Modal title="Tambah Bahan Baru" subtitle="Daftarkan bahan dengan unit dasar yang tetap." onClose={() => setShowAddModal(false)}>
          <form onSubmit={handleAdd} className="space-y-3">
            <Field label="Nama Bahan">
              <input required className={inputCls} placeholder="cth. Cabai Merah Lembang" value={newName} onChange={e => setNewName(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Kategori">
                <CatSelect value={newCategory} onChange={setNewCategory} />
              </Field>
              <Field label="Unit Dasar">
                <select className={selectCls} value={newUnit} onChange={e => setNewUnit(e.target.value as BaseUnit)}>
                  <option value="gram">gram (g)</option>
                  <option value="ml">ml (cair)</option>
                  <option value="pcs">pcs (biji)</option>
                </select>
              </Field>
            </div>

            <Field label="Supplier">
              <input required className={inputCls} placeholder="cth. Supplier Sayur Segar" value={newSupplier} onChange={e => setNewSupplier(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Stok Awal (${newUnit})`}>
                <input type="number" min="0" step="0.01" className={inputCls} value={newStock} onChange={e => setNewStock(e.target.value)} />
              </Field>
              <Field label={`Min Stok (${newUnit})`}>
                <input type="number" min="0" step="0.01" className={inputCls} value={newMin} onChange={e => setNewMin(e.target.value)} />
              </Field>
            </div>

            <Field label={`Harga Beli (Rp per ${newUnit})`}>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-mono">Rp</span>
                <input type="number" min="0" step="0.01" className={`${inputCls} pl-8`} value={newPrice} onChange={e => setNewPrice(e.target.value)} />
              </div>
              <p className="text-[10px] text-slate-400 mt-1">
                = Rp {formatIDR(pricePerBulk(parseFloat(newPrice) || 0, newUnit))} per {bulkLabel(newUnit)}
              </p>
            </Field>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-[12px] font-semibold hover:bg-slate-50">Batal</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-[12px] font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Simpan Bahan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedIngredient && (
        <Modal title={`Edit — ${selectedIngredient.name}`} subtitle="Unit dasar tidak bisa diubah untuk menjaga integritas data." onClose={() => setShowEditModal(false)}>
          <form onSubmit={handleEdit} className="space-y-3">
            <Field label="Nama Bahan">
              <input required className={inputCls} value={editName} onChange={e => setEditName(e.target.value)} />
            </Field>

            <Field label="Kategori">
              <CatSelect value={editCategory} onChange={setEditCategory} />
            </Field>

            <Field label="Supplier">
              <input required className={inputCls} value={editSupplier} onChange={e => setEditSupplier(e.target.value)} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label={`Min Stok (${selectedIngredient.base_unit})`}>
                <input type="number" min="0" step="0.01" className={inputCls} value={editMin} onChange={e => setEditMin(e.target.value)} />
              </Field>
              <Field label={`Harga (Rp/${selectedIngredient.base_unit})`}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-mono">Rp</span>
                  <input type="number" min="0" step="0.01" className={`${inputCls} pl-8`} value={editPrice} onChange={e => setEditPrice(e.target.value)} />
                </div>
              </Field>
            </div>

            <p className="text-[10px] text-slate-400 -mt-1">
              = Rp {formatIDR(pricePerBulk(parseFloat(editPrice) || 0, selectedIngredient.base_unit))} per {bulkLabel(selectedIngredient.base_unit)}
            </p>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-[12px] font-semibold hover:bg-slate-50">Batal</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-[12px] font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Simpan Perubahan
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Adjust Modal (Opname) */}
      {showAdjustModal && selectedIngredient && (
        <Modal title="Opname Stok" subtitle={`Override stok fisik untuk ${selectedIngredient.name}.`} onClose={() => setShowAdjustModal(false)}>
          <form onSubmit={handleAdjust} className="space-y-3">
            <div className="flex items-center justify-between bg-purple-50 rounded-xl px-3 py-2.5">
              <span className="text-[11px] text-slate-500">Stok saat ini</span>
              <span className="text-[13px] font-semibold text-purple-700 font-mono">
                {formatStock(selectedIngredient.stock, selectedIngredient.base_unit)}
              </span>
            </div>

            <Field label={`Jumlah Stok Baru (${selectedIngredient.base_unit})`}>
              <input required type="number" min="0" step="0.01" className={inputCls} value={adjValue} onChange={e => setAdjValue(e.target.value)} />
            </Field>

            <Field label="Catatan Opname">
              <textarea required rows={2} className={inputCls} placeholder="cth. Opname mingguan, sisa bumbu kering pasar." value={adjNotes} onChange={e => setAdjNotes(e.target.value)} />
            </Field>

            <div className="flex gap-2 pt-2">
              <button type="button" onClick={() => setShowAdjustModal(false)} className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-[12px] font-semibold hover:bg-slate-50">Batal</button>
              <button type="submit" disabled={isSubmitting} className="flex-1 py-2 bg-purple-600 text-white rounded-xl text-[12px] font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
                {isSubmitting ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : null}
                Konfirmasi Opname
              </button>
            </div>
          </form>
        </Modal>
      )}

            {/* Delete Modal */}
      {showDeleteModal && selectedIngredient && (
        <Modal title="Hapus Bahan" subtitle="Tindakan ini tidak bisa dibatalkan." onClose={() => !isSubmitting && setShowDeleteModal(false)}>
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
              <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
              <div>
                <p className="text-[13px] font-bold text-red-900">Konfirmasi Hapus</p>
                <p className="text-[12px] text-red-700 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus <strong>{selectedIngredient.name}</strong>?
                  {selectedIngredient.stock > 0 && ` Saat ini masih ada stok sebanyak ${formatStock(selectedIngredient.stock, selectedIngredient.base_unit)}.`}
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex gap-2 items-center">
                <AlertTriangle size={14} className="text-amber-600 flex-shrink-0" />
                <p className="text-[11px] text-amber-700 font-medium">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-[12px] font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[12px] font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Trash2 size={14} />
                )}
                {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Bahan'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}