import React, { useState } from 'react';
import { Plus, Trash2, BookOpen, AlertCircle, CheckCircle, Info, X } from 'lucide-react';
import { Ingredient, RecipeWithDetails, RecipeItem, BaseUnit } from '../types';

interface RecipeSystemProps {
  ingredients: Ingredient[];
  recipes: RecipeWithDetails[];
  onAddOrUpdateRecipe: (
    menuName: string, 
    items: { ingredient_id: number; amount: number }[],
    category?: string,
    spice_level_option?: boolean,
    sugar_level_option?: boolean,
    custom_options?: string
  ) => Promise<void>;
}

export default function RecipeSystem({ ingredients, recipes, onAddOrUpdateRecipe }: RecipeSystemProps) {
  const [showBuilder, setShowBuilder] = useState(false);
  const [menuName, setMenuName] = useState('');
  const [recipeLines, setRecipeLines] = useState<{ ingredient_id: number; amount: number }[]>([]);
  const [menuCategory, setMenuCategory] = useState<string>('Makanan');
  const [spiceLevelOption, setSpiceLevelOption] = useState(false);
  const [sugarLevelOption, setSugarLevelOption] = useState(false);
  const [customOptionsList, setCustomOptionsList] = useState<{ name: string; choices: string }[]>([]);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const existingCategories = Array.from(new Set(recipes.map(r => r.category || 'Makanan')));

  // helpers to display units
  const getIngredientUnit = (id: number): BaseUnit => {
    return ingredients.find(i => i.id === id)?.base_unit || 'gram';
  };

  const getIngredientStock = (id: number): number => {
    return ingredients.find(i => i.id === id)?.stock || 0;
  };

  const calculateCookablePortions = (recipe: RecipeWithDetails): number => {
    let minPortions = Infinity;
    recipe.items.forEach(item => {
      const stock = getIngredientStock(item.ingredient_id);
      if (item.amount <= 0) return;
      const portions = Math.floor(stock / item.amount);
      if (portions < minPortions) {
        minPortions = portions;
      }
    });
    return minPortions === Infinity ? 0 : Math.max(0, minPortions);
  };

  const handleAddLine = () => {
    // Pick the first available ingredient if any
    if (ingredients.length === 0) return;
    setRecipeLines([...recipeLines, { ingredient_id: ingredients[0].id, amount: 10 }]);
  };

  const handleRemoveLine = (idx: number) => {
    setRecipeLines(recipeLines.filter((_, i) => i !== idx));
  };

  const handleLineChange = (idx: number, field: 'ingredient_id' | 'amount', value: any) => {
    const updated = [...recipeLines];
    if (field === 'ingredient_id') {
      updated[idx].ingredient_id = parseInt(value);
    } else {
      updated[idx].amount = parseFloat(value) || 0;
    }
    setRecipeLines(updated);
  };

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuName.trim()) {
      setError('Dish name cannot be empty.');
      return;
    }
    if (recipeLines.length === 0) {
      setError('Recipe must contain at least 1 ingredient line requirement.');
      return;
    }

    const validCustomOptions = customOptionsList.filter(o => o.name.trim() !== '');
    const serializedOptions = validCustomOptions.length > 0 ? JSON.stringify(validCustomOptions) : '';

    try {
      await onAddOrUpdateRecipe(menuName, recipeLines, menuCategory, spiceLevelOption, sugarLevelOption, serializedOptions);
      setSuccess(`✓ Menu "${menuName}" BOM successfully saved!`);
      // Reset
      setMenuName('');
      setRecipeLines([]);
      setMenuCategory('Makanan');
      setSpiceLevelOption(false);
      setSugarLevelOption(false);
      setCustomOptionsList([]);
      setShowBuilder(false);
      setError('');
    } catch (err: any) {
      setError(`Failed to save: ${err.message || err}`);
    }
  };

  const formatUnitVal = (amount: number, unit: BaseUnit) => {
    if (unit === 'gram' && amount >= 1000) {
      return `${(amount / 1000).toFixed(2).replace(/\.00$/, '')} kg`;
    }
    if (unit === 'ml' && amount >= 1000) {
      return `${(amount / 1000).toFixed(1).replace(/\.0$/, '')} L`;
    }
    return `${amount} ${unit}`;
  };

  return (
    <div id="recipe-bom-section" className="space-y-6">
      {/* Search and Tabs line */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-display font-medium text-slate-800">Dish Recipe (BOM) System</h1>
          <p className="text-slate-500 text-sm mt-0.5">Define master bill of materials for each menu. Selling menu items automatically depletes stock from inventory.</p>
        </div>
        <button
          id="btn-recipe-builder-trigger"
          onClick={() => {
            setMenuName('');
            setRecipeLines([{ ingredient_id: ingredients[0]?.id || 0, amount: 50 }]);
            setMenuCategory('Makanan');
            setSpiceLevelOption(false);
            setSugarLevelOption(false);
            setCustomOptionsList([]);
            setShowBuilder(true);
          }}
          className="neo-interactive cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-full text-sm font-medium shadow-md shadow-blue-500/20 w-full sm:w-auto justify-center"
        >
          <Plus className="w-4 h-4" />
          Recipe Builder
        </button>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <p className="text-sm font-medium">{success}</p>
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-rose-500 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recipes.map(recipe => {
          const portions = calculateCookablePortions(recipe);
          const isDryStock = portions === 0;

          return (
            <div key={recipe.menu_name} className="glass-panel p-6 rounded-3xl flex flex-col justify-between h-96 relative overflow-hidden">
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-display font-bold text-slate-800 text-base">{recipe.menu_name}</h3>
                    <span className="text-[10px] text-slate-400 block tracking-wider uppercase font-medium">Kitchen BOM Card</span>
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${recipe.category === 'Minuman' ? 'bg-sky-50 text-sky-600 border border-sky-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>
                        {recipe.category || 'Makanan'}
                      </span>
                      {recipe.spice_level_option === 1 && (
                        <span className="text-[9px] px-2 py-0.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-md font-bold uppercase flex items-center gap-0.5">
                          🔥 Pedas
                        </span>
                      )}
                      {recipe.sugar_level_option === 1 && (
                        <span className="text-[9px] px-2 py-0.5 bg-teal-50 border border-teal-100 text-teal-600 rounded-md font-bold uppercase flex items-center gap-0.5">
                          🍬 Gula
                        </span>
                      )}
                      {recipe.custom_options ? (() => {
                        try {
                          const parsed = JSON.parse(recipe.custom_options);
                          return parsed.map((opt: any, oIdx: number) => (
                            <span key={oIdx} className="text-[9px] px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-600 rounded-md font-bold uppercase">
                              ⚙️ {opt.name}
                            </span>
                          ));
                        } catch (e) {
                          return null;
                        }
                      })() : null}
                    </div>
                  </div>
                  
                  {isDryStock ? (
                    <span className="text-[10px] py-1 px-2.5 bg-rose-50 text-rose-600 font-bold rounded-lg border border-rose-100 flex items-center gap-1.5">
                      <AlertCircle className="w-3 h-3" /> Out of stock
                    </span>
                  ) : (
                    <span className="text-[10px] py-1 px-2.5 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-100 flex items-center gap-1.5">
                      {portions} portions ready
                    </span>
                  )}
                </div>

                <div className="border-t border-slate-100 pt-3 h-44 overflow-y-auto space-y-1.5 pr-1">
                  {recipe.items.map((item: RecipeItem) => {
                    const currentStock = getIngredientStock(item.ingredient_id);
                    const isShort = currentStock < item.amount;
                    return (
                      <div key={item.id} className="flex justify-between items-center text-xs">
                        <span className="text-slate-500 font-medium">{item.ingredient_name}</span>
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-slate-700 font-semibold">{item.amount} {item.base_unit}</span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${isShort ? 'bg-rose-50 text-rose-500 font-bold' : 'bg-slate-100 text-slate-400'}`}>
                            {isShort ? 'Short' : 'Ok'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-3 border-t border-slate-100 mt-auto">
                <span className="text-slate-400 flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  BOM utilizes {recipe.items.length} materials
                </span>
                <button
                  id={`btn-edit-recipe-${recipe.menu_name.replace(/\s+/g, '-')}`}
                  onClick={() => {
                    setMenuName(recipe.menu_name);
                    setRecipeLines(recipe.items.map(i => ({ ingredient_id: i.ingredient_id, amount: i.amount })));
                    setMenuCategory(recipe.category || 'Makanan');
                    setSpiceLevelOption(recipe.spice_level_option === 1);
                    setSugarLevelOption(recipe.sugar_level_option === 1);
                    
                    if (recipe.custom_options) {
                      try {
                        setCustomOptionsList(JSON.parse(recipe.custom_options));
                      } catch (e) {
                        setCustomOptionsList([]);
                      }
                    } else {
                      setCustomOptionsList([]);
                    }
                    
                    setShowBuilder(true);
                  }}
                  className="text-blue-600 hover:text-blue-700 font-bold text-xs cursor-pointer"
                >
                  Edit recipe
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* MODAL RECIPE BUILDER DRAW/POPUP */}
      {showBuilder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
            <button 
              id="btn-close-recipe-modal"
              onClick={() => setShowBuilder(false)}
              className="absolute right-4 top-4 p-1.5 bg-slate-100 rounded-full text-slate-400/90 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <h2 className="text-lg font-display font-medium text-slate-800 mb-1">Recipe / BOM Builder</h2>
            <p className="text-slate-500 text-xs mb-4">Set exact ingredient proportions spent for every checkout invoice item.</p>

            <form onSubmit={handleSaveRecipe} className="space-y-4">
              <div>
                <label className="block text-slate-600 text-xs font-semibold mb-1">Menu/Dish Name</label>
                <input
                  id="recipe-menu-name-input"
                  type="text"
                  required
                  placeholder="e.g. Seblak Bakso Special"
                  value={menuName}
                  onChange={(e) => setMenuName(e.target.value)}
                  className="w-full px-3.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400"
                />
              </div>

              {/* Category & Option Toggle Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                <div>
                  <label className="block text-slate-600 text-[10px] font-bold uppercase tracking-wider mb-1">Kategori Menu</label>
                  <input
                    type="text"
                    list="existing-recipe-categories"
                    required
                    value={menuCategory}
                    onChange={(e) => setMenuCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 font-semibold text-slate-700"
                    placeholder="e.g. Makanan, Minuman, Dessert..."
                  />
                  <datalist id="existing-recipe-categories">
                    <option value="Makanan" />
                    <option value="Minuman" />
                    <option value="Dessert" />
                    <option value="Camilan" />
                    <option value="Kopi" />
                    {existingCategories.filter(c => !["Makanan", "Minuman", "Dessert", "Camilan", "Kopi"].includes(c)).map(c => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </div>
                
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-1 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={spiceLevelOption}
                      onChange={(e) => setSpiceLevelOption(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span>🔥 Opsi Pedas</span>
                  </label>
                  <span className="text-[9px] text-slate-400 block pl-5 leading-tight">Mendukung pilihan level pedas</span>
                </div>

                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 cursor-pointer py-1 text-xs font-medium text-slate-700">
                    <input
                      type="checkbox"
                      checked={sugarLevelOption}
                      onChange={(e) => setSugarLevelOption(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                    />
                    <span>🍬 Opsi Gula</span>
                  </label>
                  <span className="text-[9px] text-slate-400 block pl-5 leading-tight">Mendukung takaran normal/less</span>
                </div>
              </div>

              {/* DYNAMIC CUSTOM MODIFIER BUILDER SECTION */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-3">
                <div className="flex justify-between items-center">
                  <label className="block text-slate-600 text-[10px] font-bold uppercase tracking-wider">🛠️ Opsi Pilihan Kustom (Custom Modifiers)</label>
                  <button
                    type="button"
                    onClick={() => setCustomOptionsList([...customOptionsList, { name: '', choices: '' }])}
                    className="text-[10px] font-bold text-blue-600 hover:text-blue-700 bg-white border border-slate-200 px-2 py-0.5 rounded cursor-pointer"
                  >
                    + Tambah Opsi
                  </button>
                </div>
                {customOptionsList.length === 0 ? (
                  <p className="text-[10px] text-slate-400">Tidak ada opsi kustom tambahan. Pesanan akan mengikuti resep standar.</p>
                ) : (
                  <div className="space-y-2 max-h-32 overflow-y-auto pr-1">
                    {customOptionsList.map((opt, oIdx) => (
                      <div key={oIdx} className="flex gap-2 items-center bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex-1 space-y-1">
                          <input
                            type="text"
                            required
                            placeholder="Nama Opsi (misal: Ice Level)"
                            value={opt.name}
                            onChange={(e) => {
                              const updated = [...customOptionsList];
                              updated[oIdx].name = e.target.value;
                              setCustomOptionsList(updated);
                            }}
                            className="w-full px-2 py-1 bg-slate-50/50 border border-slate-200 rounded text-[10px] font-bold text-slate-700 focus:outline-none focus:border-blue-400"
                          />
                          <input
                            type="text"
                            required
                            placeholder="Pilihan (misal: Normal, Less, No Ice)"
                            value={opt.choices}
                            onChange={(e) => {
                              const updated = [...customOptionsList];
                              updated[oIdx].choices = e.target.value;
                              setCustomOptionsList(updated);
                            }}
                            className="w-full px-2 py-1 bg-slate-50/50 border border-slate-200 rounded text-[9px] text-slate-500 focus:outline-none focus:border-blue-400"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCustomOptionsList(customOptionsList.filter((_, idx) => idx !== oIdx))}
                          className="p-1 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded cursor-pointer flex-shrink-0"
                          title="Hapus opsi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-slate-600 text-xs font-semibold">Ingredients Required List</label>
                  <button
                    type="button"
                    onClick={handleAddLine}
                    className="text-blue-600 hover:text-blue-800 font-bold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Tambah Bahan
                  </button>
                </div>

                <div className="max-h-56 overflow-y-auto space-y-2.5 pr-1">
                  {recipeLines.map((line, idx) => (
                    <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-100">
                      <select
                        value={line.ingredient_id}
                        onChange={(e) => handleLineChange(idx, 'ingredient_id', e.target.value)}
                        className="flex-1 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-400"
                      >
                        {ingredients.map(i => (
                          <option key={i.id} value={i.id}>{i.name}</option>
                        ))}
                      </select>

                      <div className="relative w-28">
                        <input
                          type="number"
                          required
                          min="0.01"
                          step="0.01"
                          value={line.amount}
                          onChange={(e) => handleLineChange(idx, 'amount', e.target.value)}
                          className="w-full pl-3 pr-8 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-blue-400"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-mono italic">
                          {getIngredientUnit(line.ingredient_id)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveLine(idx)}
                        disabled={recipeLines.length <= 1}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 border border-rose-100 rounded-xl transition disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBuilder(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-500 rounded-xl text-xs font-semibold hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-save-recipe-submit"
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 hover:bg-blue-700 cursor-pointer"
                >
                  Save BOM Recipe
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
