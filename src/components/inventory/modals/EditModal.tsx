import React, { useState } from 'react';
import { Ingredient } from '../../../types';
import { formatIDR, bulkLabel } from '../utils/format';
import { inputCls, selectCls } from '../utils/styles';
import Modal from '../shared/Modal';
import Field from '../shared/Field';
import CatSelect from '../shared/CatSelect';
import FormActions from '../shared/FormActions';

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
  const existingBuyUnit = ingredient.buy_unit || ingredient.base_unit;
  const existingFactor = ingredient.conversion_factor || 1;
  const isBuyUnitDifferent = existingBuyUnit !== ingredient.base_unit;

  // unit_price di DB sudah per buy_unit — tampilkan apa adanya
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editName, setEditName] = useState(ingredient.name);
  const [editCategory, setEditCategory] = useState(ingredient.category);
  const [editSupplier, setEditSupplier] = useState(ingredient.supplier);
  const [editMin, setEditMin] = useState(ingredient.min_stock.toString());
  const [editPrice, setEditPrice] = useState((ingredient.unit_price ?? 0).toString());
  const [editBuyUnit, setEditBuyUnit] = useState(existingBuyUnit);
  const [editFactor, setEditFactor] = useState(existingFactor.toString());

  const effectiveBuyUnit = editBuyUnit.trim() || ingredient.base_unit;
  const effectiveFactor = parseFloat(editFactor) || 1;
  const showBuySection = effectiveBuyUnit !== ingredient.base_unit;

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // unit_price disimpan per buy_unit — langsung dari input user
      const rawPrice = parseFloat(editPrice) || 0;

      await onEditIngredient(ingredient.id, {
        name: editName,
        category: editCategory,
        supplier: editSupplier,
        min_stock: parseFloat(editMin) || 0,
        unit_price: rawPrice,
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

        {/* ── Seksi unit beli ── */}
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-3">
          <p className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">
            Unit Pembelian
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Unit Beli">
              <input
                className={inputCls}
                placeholder={`cth. kaleng, dus`}
                value={editBuyUnit}
                onChange={e => setEditBuyUnit(e.target.value)}
              />
            </Field>
            <Field label={`Isi per ${effectiveBuyUnit} (${ingredient.base_unit})`}>
              <input
                type="number"
                min="0.001"
                step="0.001"
                className={inputCls}
                value={editFactor}
                onChange={e => setEditFactor(e.target.value)}
              />
            </Field>
          </div>

          {showBuySection && (
            <p className="text-[11px] text-slate-500">
              1 <span className="font-medium text-slate-700">{effectiveBuyUnit}</span>
              {' '}={' '}
              <span className="font-medium text-slate-700">{effectiveFactor} {ingredient.base_unit}</span>
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label={`Min Stok (${ingredient.base_unit})`}>
            <input
              type="number" min="0" step="0.01"
              className={inputCls}
              value={editMin}
              onChange={e => setEditMin(e.target.value)}
            />
          </Field>
          <Field label={`Harga Beli (Rp per ${showBuySection ? effectiveBuyUnit : ingredient.base_unit})`}>
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

        {/* Preview harga per base unit */}
        {(parseFloat(editPrice) || 0) > 0 && (
          <p className="text-[10px] text-slate-400 -mt-1">
            {showBuySection ? (
              <>
                ≈ Rp {formatIDR(Math.round((parseFloat(editPrice) || 0) / effectiveFactor))} per {ingredient.base_unit}
                {' · '}
              </>
            ) : (
              <>
                ≈ Rp {formatIDR(Math.round((parseFloat(editPrice) || 0) / 1000))} per {bulkLabel(ingredient.base_unit)}
                {' · '}
              </>
            )}
          </p>
        )}

        <FormActions
          onCancel={onClose}
          submitLabel="Simpan Perubahan"
          loading={isSubmitting}
        />
      </form>
    </Modal>
  );
}
