import React, { useState } from 'react';
import { BaseUnit } from '../../../types';
import { Ingredient } from '../../../types';
import { formatIDR, pricePerBulk, bulkLabel } from '../../utils/format';
import { inputCls, selectCls } from '../../utils/styles';
import { Modal, Field, CatSelect, FormActions } from '../shared';

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newSupplier.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddIngredient({
        name: newName,
        category: newCategory,
        supplier: newSupplier,
        stock: parseFloat(newStock) || 0,
        base_unit: newUnit,
        min_stock: parseFloat(newMin) || 0,
        unit_price: parseFloat(newPrice) || 0,
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
            placeholder="cth. Cabai Merah Lembang"
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

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Stok Awal (${newUnit})`}>
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

        <Field label={`Harga Beli (Rp per ${newUnit})`}>
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
          <p className="text-[10px] text-slate-400 mt-1">
            = Rp {formatIDR(pricePerBulk(parseFloat(newPrice) || 0, newUnit))} per {bulkLabel(newUnit)}
          </p>
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
