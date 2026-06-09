import React, { useState } from 'react';
import { Ingredient } from '../../../types';
import { formatIDR, pricePerBulk, bulkLabel } from '../../utils/format';
import { inputCls } from '../../utils/styles';
import { Modal, Field, CatSelect, FormActions } from '../shared';

interface EditModalProps {
  ingredient: Ingredient;
  ingredients: Ingredient[];
  onClose: () => void;
  onEditIngredient: (id: number, data: any) => Promise<void>;
}

export default function EditModal({
  ingredient,
  ingredients,
  onClose,
  onEditIngredient,
}: EditModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editName, setEditName] = useState(ingredient.name);
  const [editCategory, setEditCategory] = useState(ingredient.category);
  const [editSupplier, setEditSupplier] = useState(ingredient.supplier);
  const [editMin, setEditMin] = useState(ingredient.min_stock.toString());
  const [editPrice, setEditPrice] = useState((ingredient.unit_price ?? 0).toString());

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onEditIngredient(ingredient.id, {
        name: editName,
        category: editCategory,
        supplier: editSupplier,
        min_stock: parseFloat(editMin) || 0,
        unit_price: parseFloat(editPrice) || 0,
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
      title={`Edit — ${ingredient.name}`}
      subtitle="Unit dasar tidak bisa diubah untuk menjaga integritas data."
      onClose={onClose}
    >
      <form onSubmit={handleEdit} className="space-y-3">
        <Field label="Nama Bahan">
          <input
            required
            className={inputCls}
            value={editName}
            onChange={e => setEditName(e.target.value)}
          />
        </Field>

        <Field label="Kategori">
          <CatSelect
            value={editCategory}
            onChange={setEditCategory}
            ingredients={ingredients}
          />
        </Field>

        <Field label="Supplier">
          <input
            required
            className={inputCls}
            value={editSupplier}
            onChange={e => setEditSupplier(e.target.value)}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Min Stok (${ingredient.base_unit})`}>
            <input
              type="number" min="0" step="0.01"
              className={inputCls}
              value={editMin}
              onChange={e => setEditMin(e.target.value)}
            />
          </Field>
          <Field label={`Harga (Rp/${ingredient.base_unit})`}>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px] font-mono">
                Rp
              </span>
              <input
                type="number" min="0" step="0.01"
                className={`${inputCls} pl-8`}
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
              />
            </div>
          </Field>
        </div>

        <p className="text-[10px] text-slate-400 -mt-1">
          = Rp {formatIDR(pricePerBulk(parseFloat(editPrice) || 0, ingredient.base_unit))} per {bulkLabel(ingredient.base_unit)}
        </p>

        <FormActions
          onCancel={onClose}
          submitLabel="Simpan Perubahan"
          loading={isSubmitting}
        />
      </form>
    </Modal>
  );
}
