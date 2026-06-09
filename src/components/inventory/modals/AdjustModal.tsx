import React, { useState } from 'react';
import { Ingredient } from '../../../types';
import { formatStock } from '../../utils/format';
import { inputCls } from '../../utils/styles';
import { Modal, Field, FormActions } from '../shared';

interface AdjustModalProps {
  ingredient: Ingredient;
  onClose: () => void;
  onAdjustStock: (id: number, finalStock: number, notes: string) => Promise<void>;
}

export default function AdjustModal({
  ingredient,
  onClose,
  onAdjustStock,
}: AdjustModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adjValue, setAdjValue] = useState(ingredient.stock.toString());
  const [adjNotes, setAdjNotes] = useState('');

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjValue) return;
    const val = parseFloat(adjValue);
    if (isNaN(val)) return;
    setIsSubmitting(true);
    try {
      await onAdjustStock(ingredient.id, val, adjNotes);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Opname Stok"
      subtitle={`Override stok fisik untuk ${ingredient.name}.`}
      onClose={onClose}
    >
      <form onSubmit={handleAdjust} className="space-y-3">
        <div className="flex items-center justify-between bg-purple-50 rounded-xl px-3 py-2.5">
          <span className="text-[11px] text-slate-500">Stok saat ini</span>
          <span className="text-[13px] font-semibold text-purple-700 font-mono">
            {formatStock(ingredient.stock, ingredient.base_unit)}
          </span>
        </div>

        <Field label={`Jumlah Stok Baru (${ingredient.base_unit})`}>
          <input
            required
            type="number" min="0" step="0.01"
            className={inputCls}
            value={adjValue}
            onChange={e => setAdjValue(e.target.value)}
          />
        </Field>

        <Field label="Catatan Opname">
          <textarea
            required
            rows={2}
            className={inputCls}
            placeholder="cth. Opname mingguan, sisa bumbu kering pasar."
            value={adjNotes}
            onChange={e => setAdjNotes(e.target.value)}
          />
        </Field>

        <FormActions
          onCancel={onClose}
          submitLabel="Konfirmasi Opname"
          loading={isSubmitting}
        />
      </form>
    </Modal>
  );
}
