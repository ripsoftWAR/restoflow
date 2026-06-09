import React from 'react';

interface FormActionsProps {
  onCancel: () => void;
  submitLabel: string;
  loading: boolean;
  submitClassName?: string;
}

export default function FormActions({
  onCancel,
  submitLabel,
  loading,
  submitClassName = 'bg-purple-600 hover:bg-purple-700',
}: FormActionsProps) {
  return (
    <div className="flex gap-2 pt-2">
      <button
        type="button"
        onClick={onCancel}
        disabled={loading}
        className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-[12px] font-semibold hover:bg-slate-50 disabled:opacity-50"
      >
        Batal
      </button>
      <button
        type="submit"
        disabled={loading}
        className={`flex-1 py-2 text-white rounded-xl text-[12px] font-semibold disabled:opacity-50 flex items-center justify-center gap-2 ${submitClassName}`}
      >
        {loading && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        {submitLabel}
      </button>
    </div>
  );
}
