import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Ingredient, RecipeWithDetails } from '../../../types';
import { CustomOption, RecipeLine } from '../hooks/useRecipeState';
import { getIngredientUnit, formatIDR, calculateMarginPct } from '../utils/recipeHelpers';

interface RecipeBuilderProps {
  ingredients: Ingredient[];
  recipes: RecipeWithDetails[];
  // form state
  menuName: string; setMenuName: (v: string) => void;
  menuCategory: string; setMenuCategory: (v: string) => void;
  menuPrice: string; setMenuPrice: (v: string) => void;
  spiceLevelOption: boolean; setSpiceLevelOption: (v: boolean) => void;
  sugarLevelOption: boolean; setSugarLevelOption: (v: boolean) => void;
  customOptionsList: CustomOption[]; setCustomOptionsList: (v: CustomOption[]) => void;
  recipeLines: RecipeLine[];
  error: string;
  isSubmitting: boolean;
  // actions
  onClose: () => void;
  onAddLine: () => void;
  onRemoveLine: (idx: number) => void;
  onLineChange: (idx: number, field: 'ingredient_id' | 'amount', value: any) => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
}

const inputCls = 'w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] focus:outline-none focus:border-purple-500 transition-colors';

export default function RecipeBuilder({
  ingredients, recipes,
  menuName, setMenuName,
  menuCategory, setMenuCategory,
  menuPrice, setMenuPrice,
  spiceLevelOption, setSpiceLevelOption,
  sugarLevelOption, setSugarLevelOption,
  customOptionsList, setCustomOptionsList,
  recipeLines, error, isSubmitting,
  onClose, onAddLine, onRemoveLine, onLineChange, onSubmit,
}: RecipeBuilderProps) {

  const existingCats = Array.from(new Set(recipes.map(r => r.category || 'Makanan')));

  // Live HPP calculation for preview
  const liveHPP = recipeLines.reduce((total, line) => {
    const ing = ingredients.find(i => i.id === line.ingredient_id);
    return total + line.amount * (ing?.unit_price || 0);
  }, 0);
  const liveMargin = calculateMarginPct(liveHPP, parseFloat(menuPrice) || 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl relative flex flex-col max-h-[92vh] overflow-hidden
        animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="text-[14px] font-bold text-slate-800">Recipe / BOM Builder</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Set proporsi bahan untuk setiap menu. Penjualan otomatis kurangi stok.
            </p>
          </div>
          <button
            id="btn-close-recipe-modal"
            onClick={onClose}
            className="p-1.5 bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors ml-4 flex-shrink-0"
          >
            <X size={15} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">

          {/* Live HPP preview bar */}
          {(liveHPP > 0 || parseFloat(menuPrice) > 0) && (
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-purple-400 uppercase tracking-wide">HPP Estimasi</p>
                <p className="text-[13px] font-extrabold text-purple-700">Rp {formatIDR(Math.round(liveHPP))}</p>
              </div>
              {parseFloat(menuPrice) > 0 && (
                <div className="text-right">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Margin</p>
                  <p className={`text-[13px] font-extrabold ${liveMargin >= 50 ? 'text-green-600' : liveMargin >= 20 ? 'text-amber-500' : 'text-red-500'}`}>
                    {liveMargin}%
                  </p>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Menu name */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
              Nama Menu / Hidangan
            </label>
            <input
              id="recipe-menu-name-input"
              required
              type="text"
              placeholder="cth. Ayam Goreng Kari"
              value={menuName}
              onChange={e => setMenuName(e.target.value)}
              className={inputCls}
            />
          </div>

          {/* Category + Price + Toggles grid */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Kategori Menu
                </label>
                <input
                  type="text"
                  list="recipe-cat-list"
                  required
                  value={menuCategory}
                  onChange={e => setMenuCategory(e.target.value)}
                  className={inputCls}
                  placeholder="Makanan, Minuman…"
                />
                <datalist id="recipe-cat-list">
                  {['Makanan', 'Minuman', 'Dessert', 'Camilan', 'Kopi',
                    ...existingCats.filter(c => !['Makanan','Minuman','Dessert','Camilan','Kopi'].includes(c))
                  ].map(c => <option key={c} value={c} />)}
                </datalist>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide mb-1.5">
                  Harga Jual / Porsi
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono">Rp</span>
                  <input
                    type="number" min="0" step="100"
                    value={menuPrice}
                    onChange={e => setMenuPrice(e.target.value)}
                    className={`${inputCls} pl-8`}
                    placeholder="45000"
                  />
                </div>
              </div>
            </div>

            {/* Toggles */}
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={spiceLevelOption}
                  onChange={e => setSpiceLevelOption(e.target.checked)}
                  className="w-3.5 h-3.5 accent-purple-600"
                />
                <span className="text-[11px] font-medium text-slate-600">🔥 Opsi Pedas</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sugarLevelOption}
                  onChange={e => setSugarLevelOption(e.target.checked)}
                  className="w-3.5 h-3.5 accent-purple-600"
                />
                <span className="text-[11px] font-medium text-slate-600">🍬 Opsi Gula</span>
              </label>
            </div>
          </div>

          {/* Custom Modifiers */}
          <div className="bg-slate-50 rounded-xl border border-slate-100 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                🛠️ Opsi Kustom
              </label>
              <button
                type="button"
                onClick={() => setCustomOptionsList([...customOptionsList, { name: '', choices: '' }])}
                className="text-[10px] font-bold text-purple-600 hover:text-purple-700 bg-white border border-slate-200 px-2 py-0.5 rounded-lg"
              >
                + Tambah
              </button>
            </div>
            {customOptionsList.length === 0
              ? <p className="text-[10px] text-slate-400 italic">Tidak ada opsi kustom.</p>
              : (
                <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                  {customOptionsList.map((opt, oIdx) => (
                    <div key={oIdx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-100">
                      <div className="flex-1 space-y-1">
                        <input
                          type="text" required
                          placeholder="Nama Opsi (cth: Ice Level)"
                          value={opt.name}
                          onChange={e => {
                            const u = [...customOptionsList];
                            u[oIdx].name = e.target.value;
                            setCustomOptionsList(u);
                          }}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[10px] font-bold text-slate-700 focus:outline-none focus:border-purple-400"
                        />
                        <input
                          type="text" required
                          placeholder="Pilihan (cth: Normal, Less, No Ice)"
                          value={opt.choices}
                          onChange={e => {
                            const u = [...customOptionsList];
                            u[oIdx].choices = e.target.value;
                            setCustomOptionsList(u);
                          }}
                          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[9px] text-slate-500 focus:outline-none focus:border-purple-400"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => setCustomOptionsList(customOptionsList.filter((_, i) => i !== oIdx))}
                        className="p-1.5 text-red-400 hover:bg-red-50 border border-red-100 rounded-lg flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              )
            }
          </div>

          {/* Ingredients list */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                Daftar Bahan (BOM)
              </label>
              <button
                type="button"
                onClick={onAddLine}
                className="flex items-center gap-1 text-[10px] font-bold text-purple-600 hover:text-purple-700"
              >
                <Plus size={11} /> Tambah Bahan
              </button>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {recipeLines.map((line, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <select
                    value={line.ingredient_id}
                    onChange={e => onLineChange(idx, 'ingredient_id', e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-purple-400"
                  >
                    {ingredients.map(i => (
                      <option key={i.id} value={i.id}>{i.name}</option>
                    ))}
                  </select>

                  <div className="relative w-28">
                    <input
                      type="number" required min="0.01" step="0.01"
                      value={line.amount}
                      onChange={e => onLineChange(idx, 'amount', e.target.value)}
                      className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-[11px] font-mono focus:outline-none focus:border-purple-400"
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-mono italic">
                      {getIngredientUnit(ingredients, line.ingredient_id)}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => onRemoveLine(idx)}
                    disabled={recipeLines.length <= 1}
                    className="p-1.5 text-red-400 hover:bg-red-50 border border-red-100 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-5 border-t border-slate-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 border border-slate-200 text-slate-500 rounded-xl text-[12px] font-semibold hover:bg-slate-50"
          >
            Batal
          </button>
          <button
            id="btn-save-recipe-submit"
            type="button"
            onClick={onSubmit as any}
            disabled={isSubmitting}
            className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-[12px] font-semibold hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            )}
            Simpan Resep
          </button>
        </div>
      </div>
    </div>
  );
}
