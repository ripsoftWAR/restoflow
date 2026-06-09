import React, { useState } from 'react';
import { Trash2, AlertTriangle } from 'lucide-react';
import { Ingredient } from '../../../types';
import { formatStock } from '../../utils/format';
import { Modal } from '../shared';

interface DeleteModalProps {
  ingredient: Ingredient;
  onClose: () => void;
  onDeleteIngredient: (id: number) => Promise<void>;
}

export default function DeleteModal({
  ingredient,
  onClose,
  onDeleteIngredient,
}: DeleteModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsSubmitting(true);
    setDeleteError(null);
    try {
      await onDeleteIngredient(ingredient.id);
      onClose();
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      title="Hapus Bahan"
      subtitle="Tindakan ini tidak bisa dibatalkan."
      onClose={() => !isSubmitting && onClose()}
    >
      <div className="space-y-4">
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex gap-3">
          <AlertTriangle className="text-red-500 flex-shrink-0" size={16} />
          <div>
            <p className="text-[13px] font-bold text-red-900">Konfirmasi Hapus</p>
            <p className="text-[12px] text-red-700 mt-1 leading-relaxed">
              Apakah Anda yakin ingin menghapus <strong>{ingredient.name}</strong>?
              {ingredient.stock > 0 &&
                ` Saat ini masih ada stok sebanyak ${formatStock(ingredient.stock, ingredient.base_unit)}.`
              }
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
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-[12px] font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleDelete}
            className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[12px] font-semibold hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting
              ? <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              : <Trash2 size={14} />
            }
            {isSubmitting ? 'Menghapus...' : 'Ya, Hapus Bahan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
