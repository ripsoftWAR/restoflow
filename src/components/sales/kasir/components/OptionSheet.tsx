import React from 'react';
import { X, Plus, Flame, Droplets } from 'lucide-react';
import { RecipeWithDetails } from '../../../../types';
import { OptionSheetState } from '../../../sales/utils/cartHelpers';

interface OptionSheetProps {
  state: OptionSheetState;
  recipe: RecipeWithDetails | undefined;
  onChange: (patch: Partial<OptionSheetState>) => void;
  onConfirm: () => void;
  onClose: () => void;
}

export default function OptionSheet({ state, recipe, onChange, onConfirm, onClose }: OptionSheetProps) {
  if (!state.open || !recipe) return null;

  return (
    <div
      className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 flex items-end sm:items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-sm p-5 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-200"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <div>
            <p className="text-[13px] font-bold text-slate-800">{state.menuName}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Pilih preferensi pelanggan</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        </div>

        <div className="space-y-4">
          {recipe.spice_level_option === 1 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Flame size={11} className="text-red-400" /> Level Pedas
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {['Tidak Pedas', 'Sedang', 'Pedas', 'Super Pedas'].map(s => (
                  <button
                    key={s}
                    onClick={() => onChange({ spice: s })}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition
                      ${state.spice === s ? 'bg-red-500 text-white border-red-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {recipe.sugar_level_option === 1 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1">
                <Droplets size={11} className="text-sky-400" /> Tingkat Gula
              </p>
              <div className="flex gap-1.5 flex-wrap">
                {['Normal', 'Less Sugar', 'Half Sugar', 'No Sugar'].map(s => (
                  <button
                    key={s}
                    onClick={() => onChange({ sugar: s })}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition
                      ${state.sugar === s ? 'bg-sky-500 text-white border-sky-500' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {state.customFields.map(field => (
            <div key={field.name}>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-2">
                ⚙️ {field.name}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {field.choices.map(choice => (
                  <button
                    key={choice}
                    onClick={() => onChange({ customChoices: { ...state.customChoices, [field.name]: choice } })}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition
                      ${state.customChoices[field.name] === choice
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'}`}
                  >
                    {choice}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onConfirm}
          className="w-full mt-5 py-3 rounded-xl text-[12px] font-bold text-white bg-purple-600 hover:bg-purple-700 flex items-center justify-center gap-2 transition"
        >
          <Plus size={14} /> Masukkan Keranjang
        </button>
      </div>
    </div>
  );
}
