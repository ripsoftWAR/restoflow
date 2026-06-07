import React, { useState, useRef } from 'react';
import {
  Upload, FileText, CheckCircle2, RotateCw, AlertCircle,
  ChevronRight, X, Plus, Minus
} from 'lucide-react';
import { Ingredient, OCRItemReview } from '../types';

interface ReceiptScannerProps {
  ingredients: Ingredient[];
  onScanReceipt: (base64: string, mimeType: string) => Promise<{ items: OCRItemReview[]; simulated: boolean }>;
  onConfirmReceiptItems: (confirmedItems: any[]) => Promise<void>;
  onRefreshStats: () => void;
}

const PRESET_RECEIPTS = [
  {
    id: 'receipt-pasar',
    title: 'Pasar Baru Grosir',
    description: 'Cabai 2.5kg, Bawang Merah 3kg',
    totalText: 'Rp 270.000',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    mimeType: 'image/png',
  },
  {
    id: 'receipt-indofood',
    title: 'Koperasi Tani Lembang',
    description: 'Daging Ayam 4.5kg, Wortel 3kg',
    totalText: 'Rp 412.500',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    mimeType: 'image/png',
  },
  {
    id: 'receipt-sembako',
    title: 'Toko Sembako Jaya',
    description: 'Minyak 5L, Telur 30pcs',
    totalText: 'Rp 150.000',
    base64: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
    mimeType: 'image/png',
  },
];

export default function ReceiptScanner({
  ingredients,
  onScanReceipt,
  onConfirmReceiptItems,
  onRefreshStats,
}: ReceiptScannerProps) {
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [reviewItems, setReviewItems] = useState<OCRItemReview[]>([]);
  const [simulated, setSimulated] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ base64: string; mimeType: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const existingCategories = Array.from(new Set(ingredients.map(i => i.category))).filter(Boolean);
  const DEFAULT_CATEGORIES = ['Bumbu', 'Sayuran', 'Bahan Cair', 'Protein', 'Kering'];
  const allCategories = Array.from(new Set([...DEFAULT_CATEGORIES, ...existingCategories]));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedPreset(null);
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = event => {
      const base64Str = (event.target?.result as string).split(',')[1];
      setSelectedFile({ base64: base64Str, mimeType: file.type });
      setImagePreview(URL.createObjectURL(file));
      setReviewItems([]);
      setSuccessMsg('');
    };
    reader.readAsDataURL(file);
  };

  const handleSelectPreset = (id: string) => {
    const p = PRESET_RECEIPTS.find(r => r.id === id);
    if (!p) return;
    setSelectedPreset(id);
    setSelectedFile({ base64: p.base64, mimeType: p.mimeType });
    setImagePreview('dummy_preset');
    setReviewItems([]);
    setSuccessMsg('');
    setErrorMsg('');
  };

  const clearFile = () => {
    setImagePreview(null);
    setSelectedPreset(null);
    setSelectedFile(null);
    setReviewItems([]);
  };

  const executeOcrScan = async () => {
    if (!selectedFile) {
      setErrorMsg('Pilih foto atau preset terlebih dahulu.');
      return;
    }
    setScanning(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      let payload = { ...selectedFile };
      if (selectedPreset === 'receipt-pasar') payload.base64 = 'SimulatedPasar';
      else if (selectedPreset === 'receipt-indofood') payload.base64 = 'SimulatedKoperasi';
      else if (selectedPreset === 'receipt-sembako') payload.base64 = 'SimulatedSembako';

      const res = await onScanReceipt(payload.base64, payload.mimeType);
      let items = res.items;

      if (selectedPreset === 'receipt-pasar') {
        const cabai = ingredients.find(i => i.name.toLowerCase().includes('cabai'))?.id;
        const bawang = ingredients.find(i => i.name.toLowerCase().includes('bawang'))?.id;
        items = [
          { rawName: 'Cabai Merah Segar 2.5 kg', quantity: 2.5, unit: 'kg', pricePerUnit: 60000, totalPrice: 150000, mappedIngredientId: cabai, convertedQuantity: 2500 },
          { rawName: 'Bawang Merah Lembang 3 kg', quantity: 3, unit: 'kg', pricePerUnit: 40000, totalPrice: 120000, mappedIngredientId: bawang, convertedQuantity: 3000 },
        ];
      } else if (selectedPreset === 'receipt-indofood') {
        const ayam = ingredients.find(i => i.name.toLowerCase().includes('daging'))?.id;
        const wortel = ingredients.find(i => i.name.toLowerCase().includes('wortel'))?.id;
        items = [
          { rawName: 'Daging Ayam Negeri 4.5 kg', quantity: 4.5, unit: 'kg', pricePerUnit: 75000, totalPrice: 337500, mappedIngredientId: ayam, convertedQuantity: 4500 },
          { rawName: 'Wortel Segar 3 kg', quantity: 3, unit: 'kg', pricePerUnit: 25000, totalPrice: 75000, mappedIngredientId: wortel, convertedQuantity: 3000 },
        ];
      } else if (selectedPreset === 'receipt-sembako') {
        const minyak = ingredients.find(i => i.name.toLowerCase().includes('minyak'))?.id;
        const telur = ingredients.find(i => i.name.toLowerCase().includes('telur'))?.id;
        items = [
          { rawName: 'Minyak Goreng Sania 5 L', quantity: 5, unit: 'L', pricePerUnit: 18000, totalPrice: 90000, mappedIngredientId: minyak, convertedQuantity: 5000 },
          { rawName: 'Telur Ayam Negeri 30 pcs', quantity: 30, unit: 'pcs', pricePerUnit: 2000, totalPrice: 60000, mappedIngredientId: telur, convertedQuantity: 30 },
        ];
      }

      setReviewItems(items);
      setSimulated(res.simulated);
    } catch (err: any) {
      setErrorMsg(`OCR gagal: ${err.message || err}`);
    } finally {
      setScanning(false);
    }
  };

  const handleReviewFieldChange = (index: number, field: keyof OCRItemReview, value: any) => {
    const updated = [...reviewItems];
    (updated[index] as any)[field] = value;

    if (field === 'quantity' || field === 'pricePerUnit') {
      updated[index].totalPrice =
        (parseFloat(updated[index].quantity as any) || 0) *
        (parseFloat(updated[index].pricePerUnit as any) || 0);
    }

    if (field === 'mappedIngredientId' || field === 'quantity' || field === 'unit' || field === 'newIngBaseUnit') {
      const ingId = updated[index].mappedIngredientId;
      const lowerUnit = (updated[index].unit || '').trim().toLowerCase();
      let baseQty = parseFloat(updated[index].quantity as any) || 0;

      if (ingId === 'new') {
        const baseUnit = updated[index].newIngBaseUnit || 'gram';
        if ((lowerUnit === 'kg' || lowerUnit === 'kilogram') && baseUnit === 'gram') baseQty *= 1000;
        else if ((lowerUnit === 'liter' || lowerUnit === 'l') && baseUnit === 'ml') baseQty *= 1000;
        updated[index].convertedQuantity = baseQty;
      } else if (ingId) {
        const ing = ingredients.find(i => i.id === ingId);
        if (ing) {
          if ((lowerUnit === 'kg' || lowerUnit === 'kilogram') && ing.base_unit === 'gram') baseQty *= 1000;
          else if ((lowerUnit === 'liter' || lowerUnit === 'l') && ing.base_unit === 'ml') baseQty *= 1000;
          updated[index].convertedQuantity = baseQty;
        }
      }
    }

    setReviewItems(updated);
  };

  const handleReviewMappingChange = (index: number, value: string | number) => {
    const updated = [...reviewItems];
    if (value === 'new') {
      updated[index].mappedIngredientId = 'new';
      updated[index].newIngName = updated[index].newIngName || updated[index].rawName;
      updated[index].newIngCategory = updated[index].newIngCategory || 'Bumbu';
      updated[index].newIngSupplier = updated[index].newIngSupplier || 'Struk Scanner';
      const lowerUnit = (updated[index].unit || '').trim().toLowerCase();
      updated[index].newIngBaseUnit =
        lowerUnit === 'kg' || lowerUnit === 'g' || lowerUnit === 'gram' ? 'gram'
        : lowerUnit === 'l' || lowerUnit === 'ml' || lowerUnit === 'liter' ? 'ml'
        : 'pcs';
      updated[index].isCustomCategory = false;
      updated[index].customCategoryName = '';
      let baseQty = parseFloat(updated[index].quantity as any) || 0;
      if (lowerUnit === 'kg' && updated[index].newIngBaseUnit === 'gram') baseQty *= 1000;
      else if (lowerUnit === 'l' && updated[index].newIngBaseUnit === 'ml') baseQty *= 1000;
      updated[index].convertedQuantity = baseQty;
    } else {
      updated[index].mappedIngredientId = value ? Number(value) : undefined;
      const ingId = updated[index].mappedIngredientId;
      if (ingId) {
        const ing = ingredients.find(i => i.id === ingId);
        if (ing) {
          let baseQty = parseFloat(updated[index].quantity as any) || 0;
          const lowerUnit = (updated[index].unit || '').trim().toLowerCase();
          if ((lowerUnit === 'kg' || lowerUnit === 'kilogram') && ing.base_unit === 'gram') baseQty *= 1000;
          else if ((lowerUnit === 'liter' || lowerUnit === 'l') && ing.base_unit === 'ml') baseQty *= 1000;
          updated[index].convertedQuantity = baseQty;
        }
      }
    }
    setReviewItems(updated);
  };

  const handleConfirmMergeStock = async () => {
    const validItems = reviewItems.filter(item => {
      if (item.mappedIngredientId === 'new') return true;
      if (typeof item.mappedIngredientId === 'number' && !isNaN(item.mappedIngredientId)) return true;
      return false;
    });
    if (validItems.length === 0) {
      setErrorMsg('Belum ada item yang dipetakan. Pilih bahan untuk minimal satu baris.');
      return;
    }
    try {
      await onConfirmReceiptItems(validItems);
      setSuccessMsg(`Stok berhasil ditambahkan: ${validItems.length} baris diproses.`);
      setReviewItems([]);
      setSelectedPreset(null);
      setImagePreview(null);
      setSelectedFile(null);
      onRefreshStats();
    } catch (err: any) {
      setErrorMsg(`Gagal: ${err.message || err}`);
    }
  };

  const formatIDR = (n: number) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

  const grandTotal = reviewItems.reduce((s, i) => s + (i.totalPrice || 0), 0);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-4">

      {/* Toast messages */}
      {successMsg && (
        <div className="flex items-center gap-2.5 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium">
          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
          {successMsg}
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center gap-2.5 p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-medium">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          {errorMsg}
          <button onClick={() => setErrorMsg('')} className="ml-auto text-red-400 hover:text-red-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

        {/* ── LEFT: Upload + Presets ── */}
        <div className="lg:col-span-2 space-y-3">

          {/* Upload zone */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            {imagePreview ? (
              <div className="relative bg-slate-900 aspect-video flex items-center justify-center">
                {imagePreview === 'dummy_preset' ? (
                  <div className="text-center space-y-2 p-6">
                    <FileText className="w-10 h-10 text-blue-400 mx-auto" />
                    <p className="text-xs text-slate-300 font-mono">
                      {PRESET_RECEIPTS.find(r => r.id === selectedPreset)?.title}
                    </p>
                    <p className="text-[10px] text-slate-500 italic">Siap untuk OCR scan</p>
                  </div>
                ) : (
                  <img src={imagePreview} alt="Preview struk" className="w-full h-full object-contain" />
                )}
                {scanning && (
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-blue-400 animate-bounce" />
                )}
                <button
                  onClick={clearFile}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full bg-slate-800/70 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 py-8 cursor-pointer group hover:bg-slate-50 transition border-2 border-dashed border-slate-200 hover:border-blue-300 rounded-2xl m-2"
              >
                <div className="w-10 h-10 rounded-full bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition">
                  <Upload className="w-4 h-4 text-slate-400 group-hover:text-blue-500" />
                </div>
                <p className="text-xs font-medium text-slate-600">Upload foto struk</p>
                <p className="text-[10px] text-slate-400">PNG, JPG, atau PDF</p>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            <div className="p-3">
              <button
                onClick={executeOcrScan}
                disabled={scanning || !selectedFile}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition shadow-sm shadow-blue-200"
              >
                {scanning ? (
                  <><RotateCw className="w-3.5 h-3.5 animate-spin" />AI Memproses...</>
                ) : (
                  <><FileText className="w-3.5 h-3.5" />Scan Struk</>
                )}
              </button>
            </div>
          </div>

          {/* Preset shortcuts */}
          <div className="bg-white border border-slate-200 rounded-2xl p-3 space-y-1.5">
            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider px-1 mb-2">
              Preset uji coba
            </p>
            {PRESET_RECEIPTS.map(preset => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                className={`w-full text-left p-2.5 rounded-xl flex items-center justify-between gap-3 border transition ${
                  selectedPreset === preset.id
                    ? 'bg-blue-50 border-blue-200'
                    : 'border-slate-100 hover:border-slate-200 bg-slate-50/50'
                }`}
              >
                <div>
                  <p className={`text-xs font-semibold ${selectedPreset === preset.id ? 'text-blue-800' : 'text-slate-700'}`}>
                    {preset.title}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{preset.description}</p>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                  <span className="text-[11px] font-mono font-semibold text-slate-600">{preset.totalText}</span>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── RIGHT: Review panel ── */}
        <div className="lg:col-span-3">
          {reviewItems.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">

              {/* Grand total banner */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-center gap-2">
                  {simulated && (
                    <span className="text-[9px] px-2 py-0.5 bg-blue-100 text-blue-600 rounded-md font-semibold uppercase tracking-wide">
                      Simulasi
                    </span>
                  )}
                  <span className="text-xs text-slate-500 font-medium">Total struk</span>
                </div>
                <span className="text-base font-bold font-mono text-slate-800">{formatIDR(grandTotal)}</span>
              </div>

              {/* Desktop table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[10px] text-slate-400 uppercase border-b border-slate-100 bg-slate-50/40">
                      <th className="py-2.5 px-3">Item struk</th>
                      <th className="py-2.5 px-2 text-center">Qty / Sat</th>
                      <th className="py-2.5 px-2 text-right">Harga/sat</th>
                      <th className="py-2.5 px-3">Pemetaan bahan</th>
                      <th className="py-2.5 px-3 text-right">Konversi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {reviewItems.map((item, index) => {
                      const ing = ingredients.find(i => i.id === item.mappedIngredientId);
                      return (
                        <tr key={index} className="hover:bg-slate-50/40 align-top">
                          <td className="py-3 px-3 min-w-[160px]">
                            <input
                              type="text"
                              value={item.rawName}
                              onChange={e => handleReviewFieldChange(index, 'rawName', e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 hover:border-slate-300 focus:border-blue-400 rounded-lg text-xs font-medium focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-400 font-mono block mt-1 pl-1">
                              {formatIDR(item.totalPrice)}
                            </span>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                step="any"
                                value={item.quantity}
                                onChange={e => handleReviewFieldChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="w-14 px-1.5 py-1 text-center font-mono bg-white border border-slate-200 focus:border-blue-400 rounded-lg text-xs focus:outline-none"
                              />
                              <input
                                type="text"
                                value={item.unit}
                                onChange={e => handleReviewFieldChange(index, 'unit', e.target.value)}
                                className="w-11 px-1.5 py-1 text-center font-mono bg-white border border-slate-200 focus:border-blue-400 rounded-lg text-xs focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-2">
                            <div className="flex items-center justify-end gap-1">
                              <span className="text-[10px] text-slate-400">Rp</span>
                              <input
                                type="number"
                                value={item.pricePerUnit}
                                onChange={e => handleReviewFieldChange(index, 'pricePerUnit', parseInt(e.target.value) || 0)}
                                className="w-20 px-1.5 py-1 text-right font-mono bg-white border border-slate-200 focus:border-blue-400 rounded-lg text-xs focus:outline-none"
                              />
                            </div>
                          </td>
                          <td className="py-3 px-3 min-w-[180px]">
                            <select
                              value={item.mappedIngredientId || ''}
                              onChange={e => {
                                const v = e.target.value;
                                handleReviewMappingChange(index, v === 'new' ? 'new' : v ? parseInt(v) : '');
                              }}
                              className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] focus:outline-none focus:border-blue-400 font-medium"
                            >
                              <option value="">— Abaikan baris —</option>
                              <option value="new">+ Daftarkan bahan baru...</option>
                              {ingredients.map(i => (
                                <option key={i.id} value={i.id}>{i.name} ({i.base_unit})</option>
                              ))}
                            </select>

                            {item.mappedIngredientId === 'new' && (
                              <div className="mt-2 p-2.5 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                                <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">Bahan baru</p>
                                <input
                                  type="text"
                                  placeholder="Nama bahan..."
                                  value={item.newIngName || ''}
                                  onChange={e => handleReviewFieldChange(index, 'newIngName', e.target.value)}
                                  className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
                                />
                                <div className="grid grid-cols-2 gap-1.5">
                                  <select
                                    value={item.newIngBaseUnit || 'gram'}
                                    onChange={e => handleReviewFieldChange(index, 'newIngBaseUnit', e.target.value)}
                                    className="px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-blue-400"
                                  >
                                    <option value="gram">gram</option>
                                    <option value="ml">ml</option>
                                    <option value="pcs">pcs</option>
                                  </select>
                                  <input
                                    type="text"
                                    placeholder="Supplier"
                                    value={item.newIngSupplier || ''}
                                    onChange={e => handleReviewFieldChange(index, 'newIngSupplier', e.target.value)}
                                    className="px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
                                  />
                                </div>
                                <select
                                  value={item.isCustomCategory ? 'custom' : (item.newIngCategory || 'Bumbu')}
                                  onChange={e => {
                                    const v = e.target.value;
                                    if (v === 'custom') {
                                      handleReviewFieldChange(index, 'isCustomCategory', true);
                                    } else {
                                      handleReviewFieldChange(index, 'isCustomCategory', false);
                                      handleReviewFieldChange(index, 'newIngCategory', v);
                                    }
                                  }}
                                  className="w-full px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px] focus:outline-none focus:border-blue-400"
                                >
                                  {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                  <option value="custom">+ Kategori lain...</option>
                                </select>
                                {item.isCustomCategory && (
                                  <input
                                    type="text"
                                    placeholder="Nama kategori..."
                                    value={item.customCategoryName || ''}
                                    onChange={e => handleReviewFieldChange(index, 'customCategoryName', e.target.value)}
                                    className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
                                  />
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            {item.mappedIngredientId && (item.mappedIngredientId === 'new' || ing) ? (
                              <div className="space-y-1 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <input
                                    type="number"
                                    value={item.convertedQuantity || 0}
                                    onChange={e => handleReviewFieldChange(index, 'convertedQuantity', parseFloat(e.target.value) || 0)}
                                    className="w-20 px-1.5 py-1 text-right text-emerald-600 font-bold font-mono bg-white border border-slate-200 focus:border-blue-400 rounded-lg text-xs focus:outline-none"
                                  />
                                  <span className="text-[10px] text-slate-500 font-semibold">
                                    {item.mappedIngredientId === 'new' ? (item.newIngBaseUnit || 'gram') : ing?.base_unit}
                                  </span>
                                </div>
                                <span className="text-[9px] text-slate-400 block">
                                  1 {item.unit} = {((item.convertedQuantity || 0) / (item.quantity || 1)).toFixed(2)}{' '}
                                  {item.mappedIngredientId === 'new' ? (item.newIngBaseUnit || 'gram') : ing?.base_unit}
                                </span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-slate-300 italic">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile card list */}
              <div className="block md:hidden divide-y divide-slate-100">
                {reviewItems.map((item, index) => {
                  const ing = ingredients.find(i => i.id === item.mappedIngredientId);
                  return (
                    <div key={index} className="p-3.5 space-y-3">
                      <input
                        type="text"
                        value={item.rawName}
                        onChange={e => handleReviewFieldChange(index, 'rawName', e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-blue-400"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'Qty', field: 'quantity' as keyof OCRItemReview, type: 'number' },
                          { label: 'Satuan', field: 'unit' as keyof OCRItemReview, type: 'text' },
                          { label: 'Harga/sat', field: 'pricePerUnit' as keyof OCRItemReview, type: 'number' },
                        ].map(({ label, field, type }) => (
                          <div key={field} className="space-y-1">
                            <p className="text-[9px] uppercase text-slate-400 font-bold tracking-wide">{label}</p>
                            <input
                              type={type}
                              step={type === 'number' ? 'any' : undefined}
                              value={(item as any)[field]}
                              onChange={e => handleReviewFieldChange(index, field, type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value)}
                              className="w-full px-2 py-1 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-400 text-center"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="flex justify-between text-[10px] bg-slate-50 px-2.5 py-1.5 rounded-lg">
                        <span className="text-slate-400">Subtotal</span>
                        <span className="font-mono font-semibold text-slate-700">{formatIDR(item.totalPrice)}</span>
                      </div>
                      <select
                        value={item.mappedIngredientId || ''}
                        onChange={e => {
                          const v = e.target.value;
                          handleReviewMappingChange(index, v === 'new' ? 'new' : v ? parseInt(v) : '');
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400 font-medium"
                      >
                        <option value="">— Abaikan baris —</option>
                        <option value="new">+ Daftarkan bahan baru...</option>
                        {ingredients.map(i => <option key={i.id} value={i.id}>{i.name} ({i.base_unit})</option>)}
                      </select>

                      {item.mappedIngredientId === 'new' && (
                        <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl space-y-2">
                          <p className="text-[9px] font-bold text-blue-700 uppercase tracking-wide">Bahan baru</p>
                          <input
                            type="text"
                            placeholder="Nama bahan..."
                            value={item.newIngName || ''}
                            onChange={e => handleReviewFieldChange(index, 'newIngName', e.target.value)}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={item.newIngBaseUnit || 'gram'}
                              onChange={e => handleReviewFieldChange(index, 'newIngBaseUnit', e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                            >
                              <option value="gram">gram</option>
                              <option value="ml">ml</option>
                              <option value="pcs">pcs</option>
                            </select>
                            <input
                              type="text"
                              placeholder="Supplier"
                              value={item.newIngSupplier || ''}
                              onChange={e => handleReviewFieldChange(index, 'newIngSupplier', e.target.value)}
                              className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                            />
                          </div>
                          <select
                            value={item.isCustomCategory ? 'custom' : (item.newIngCategory || 'Bumbu')}
                            onChange={e => {
                              const v = e.target.value;
                              if (v === 'custom') handleReviewFieldChange(index, 'isCustomCategory', true);
                              else { handleReviewFieldChange(index, 'isCustomCategory', false); handleReviewFieldChange(index, 'newIngCategory', v); }
                            }}
                            className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none"
                          >
                            {allCategories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="custom">+ Kategori lain...</option>
                          </select>
                          {item.isCustomCategory && (
                            <input
                              type="text"
                              placeholder="Nama kategori..."
                              value={item.customCategoryName || ''}
                              onChange={e => handleReviewFieldChange(index, 'customCategoryName', e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400"
                            />
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                        <span className="text-slate-400 text-[10px]">Konversi</span>
                        {item.mappedIngredientId && (item.mappedIngredientId === 'new' || ing) ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              value={item.convertedQuantity || 0}
                              onChange={e => handleReviewFieldChange(index, 'convertedQuantity', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 text-right text-emerald-600 font-bold font-mono bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:border-blue-400"
                            />
                            <span className="text-xs text-slate-500 font-semibold">
                              {item.mappedIngredientId === 'new' ? (item.newIngBaseUnit || 'gram') : ing?.base_unit}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">Diabaikan</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 bg-slate-50/40">
                <button
                  onClick={() => setReviewItems([])}
                  className="text-[11px] text-slate-400 hover:text-slate-600 font-medium px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-slate-200 transition"
                >
                  Buang hasil
                </button>
                <button
                  onClick={handleConfirmMergeStock}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-emerald-200 transition"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Konfirmasi & gabung stok
                </button>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center py-16 px-6 min-h-[320px]">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-slate-300 stroke-[1.5]" />
              </div>
              <p className="text-sm font-medium text-slate-500">Antrian scan kosong</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[240px] leading-relaxed">
                Pilih preset di kiri atau upload foto struk, lalu tekan <span className="font-semibold">Scan Struk</span>.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}