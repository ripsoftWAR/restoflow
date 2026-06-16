import React, { useState } from 'react';
import { BaseUnit } from '../../../types';
import { Ingredient } from '../../../types';
import { formatIDR, pricePerBulk, bulkLabel } from '../utils/format';
import { inputCls, selectCls } from '../utils/styles';
import Modal from '../shared/Modal';
import Field from '../shared/Field';
import CatSelect from '../shared/CatSelect';
import FormActions from '../shared/FormActions';

interface AddModalProps {
  ingredients: Ingredient[];
  onClose: () => void;
  onAddIngredient: (data: any) => Promise<void>;
}

export default function AddModal({ ingredients, onClose, onAddIngredient }: AddModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCategory, setNewCategory] = useState('Bahan Mentah');
  const [newSupplier, setNewSupplier] = useState('');
  const [newUnit, setNewUnit] = useState<BaseUnit>('gram');
  const [newStock, setNewStock] = useState('0');
  const [newMin, setNewMin] = useState('0');
  const [newPrice, setNewPrice] = useState('0');

  // Field baru: unit beli & faktor konversi
  const [buyUnit, setBuyUnit] = useState('');
  const [conversionFactor, setConversionFactor] = useState('1');

  // Kalau buyUnit kosong, anggap sama dengan base unit (tidak ada konversi)
  const effectiveBuyUnit = buyUnit.trim() || newUnit;
  const effectiveFactor = parseFloat(conversionFactor) || 1;
  const isBuyUnitDifferent = buyUnit.trim() !== '' && buyUnit.trim() !== newUnit;
  const stockInBaseUnit = isBuyUnitDifferent
    ? (parseFloat(newStock) || 0) * effectiveFactor
    : parseFloat(newStock) || 0;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSupplier.trim()) return;
    setIsSubmitting(true);
    try {
      // 🔑 Konversi harga: dari per-unit-beli → per-base-unit
      // Contoh: Rp 50.000/kaleng ÷ 400 gram/kaleng = Rp 125/gram
      const rawPrice = parseFloat(newPrice) || 0;
      const pricePerBaseUnit = effectiveFactor > 0 ? rawPrice / effectiveFactor : rawPrice;

      await onAddIngredient({
        name: newName,
        category: newCategory,
        supplier: newSupplier,
        stock: stockInBaseUnit,
        base_unit: newUnit,
        min_stock: parseFloat(newMin) || 0,
        unit_price: pricePerBaseUnit,
        buy_unit: effectiveBuyUnit,
        conversion_factor: effectiveFactor,
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Tambah Bahan Baru"
      subtitle="Daftarkan bahan dengan unit dasar yang tetap."
      onClose={onClose}
    >
      <form onSubmit={handleAdd} className="space-y-3">
        <Field label="Nama Bahan">
          <input
            required
            className={inputCls}
            placeholder="cth. Susu Kental Manis"
            value={newName}
            onChange={e => setNewName(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Kategori">
            <CatSelect
              value={newCategory}
              onChange={setNewCategory}
              ingredients={ingredients}
            />
          </Field>
          <Field label="Unit Dasar">
            <select
              className={selectCls}
              value={newUnit}
              onChange={e => setNewUnit(e.target.value as BaseUnit)}
            >
              <option value="gram">gram (g)</option>
              <option value="ml">ml (cair)</option>
              <option value="pcs">pcs (biji)</option>
            </select>
          </Field>
        </div>

        <Field label="Supplier">
          <input
            required
            className={inputCls}
            placeholder="cth. Supplier Sayur Segar"
            value={newSupplier}
            onChange={e => setNewSupplier(e.target.value)}
          />
        </Field>

        {/* ── Seksi unit beli ── */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Unit Pembelian (opsional)
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit Beli">
              <input
                className={inputCls}
                placeholder={`cth. kaleng, dus, karung`}
                value={buyUnit}
                onChange={e => setBuyUnit(e.target.value)}
              />
            </Field>
            <Field label={`Isi per ${effectiveBuyUnit || 'unit beli'} (${newUnit})`}>
              <input
                type="number"
                min="0.001"
                step="0.001"
                className={inputCls}
                value={conversionFactor}
                onChange={e => setConversionFactor(e.target.value)}
                disabled={!isBuyUnitDifferent}
              />
            </Field>
          </div>

          {isBuyUnitDifferent && (
            <p className="text-[11px] text-slate-500">
              1 <span className="font-medium text-slate-700">{effectiveBuyUnit}</span>
              {' '}={' '}
              <span className="font-medium text-slate-700">{effectiveFactor} {newUnit}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Stok Awal (${effectiveBuyUnit})`}>
            <input
              type="number" min="0" step="0.01"
              className={inputCls}
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
            />
          </Field>
          <Field label={`Min Stok (${newUnit})`}>
            <input
              type="number" min="0" step="0.01"
              className={inputCls}
              value={newMin}
              onChange={e => setNewMin(e.target.value)}
            />
          </Field>
        </div>

        {/* Preview konversi stok awal */}
        {isBuyUnitDifferent && (parseFloat(newStock) || 0) > 0 && (
          <p className="text-[11px] text-emerald-700 bg-emerald-50 rounded px-3 py-2">
            Stok awal akan disimpan sebagai{' '}
            <span className="font-medium">{stockInBaseUnit.toLocaleString('id-ID')} {newUnit}</span>
          </p>
        )}

        <Field label={`Harga Beli (Rp per ${effectiveBuyUnit})`}>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-mono">
              Rp
            </span>
            <input
              type="number" min="0" step="0.01"
              className={`${inputCls} pl-8`}
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
            />
          </div>
          {isBuyUnitDifferent && effectiveFactor > 0 && (parseFloat(newPrice) || 0) > 0 && (
            <p className="text-[10px] text-slate-400 mt-1">
              ≈ Rp {formatIDR((parseFloat(newPrice) || 0) / effectiveFactor)} per {newUnit}
            </p>
          )}
          {!isBuyUnitDifferent && (
            <p className="text-[10px] text-slate-400 mt-1">
              = Rp {formatIDR(pricePerBulk(parseFloat(newPrice) || 0, newUnit))} per {bulkLabel(newUnit)}
            </p>
          )}
        </Field>

        <FormActions
          onCancel={onClose}
          submitLabel="Simpan Bahan"
          loading={isSubmitting}
        />
      </form>
    </Modal>
  );
}