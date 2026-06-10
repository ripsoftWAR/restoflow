import React, { useMemo } from 'react';
import {
  Search, Plus, Filter, List, LayoutGrid,
  CheckCircle, AlertCircle,
} from 'lucide-react';
import { Ingredient, RecipeWithDetails } from '../../types';
import { useRecipeState } from './hooks/useRecipeState';
import RecipeStatsBar from './components/RecipeStatsBar';
import RecipeCard from './components/RecipeCard';
import RecipeRightPanel from './components/RecipeRightPanel';
import RecipeBuilder from './components/RecipeBuilder';

interface RecipeSystemProps {
  ingredients: Ingredient[];
  recipes: RecipeWithDetails[];
  onAddOrUpdateRecipe: (
    menuName: string,
    items: { ingredient_id: number; amount: number }[],
    category?: string,
    spice_level_option?: boolean,
    sugar_level_option?: boolean,
    custom_options?: string,
    price?: number
  ) => Promise<void>;
}

const TABS_BASE = ['Semua Menu', 'Makanan Utama', 'Minuman', 'Camilan', 'Saus/Bumbu Base'];

export default function RecipeSystem({
  ingredients,
  recipes,
  onAddOrUpdateRecipe,
}: RecipeSystemProps) {
  const state = useRecipeState(ingredients);

  // Derive tabs from actual recipe categories + base tabs
  const dynamicTabs = useMemo(() => {
    const cats = Array.from(new Set(recipes.map(r => r.category || 'Makanan')));
    const extra = cats.filter(c => !TABS_BASE.includes(c));
    return [...TABS_BASE, ...extra];
  }, [recipes]);

  // Filtered recipes
  const filteredRecipes = useMemo(() => {
    const q = state.search.toLowerCase();
    return recipes.filter(r => {
      const matchSearch =
        r.menu_name.toLowerCase().includes(q) ||
        (r.category || '').toLowerCase().includes(q);
      if (state.activeTab === 'Semua Menu') return matchSearch;
      return matchSearch && (r.category || 'Makanan') === state.activeTab;
    });
  }, [recipes, state.search, state.activeTab]);

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!state.menuName.trim()) {
      state.setError('Nama menu tidak boleh kosong.');
      return;
    }
    if (state.recipeLines.length === 0) {
      state.setError('Resep harus memiliki minimal 1 bahan.');
      return;
    }
    const normalizedPrice = parseFloat(state.menuPrice);
    if (isNaN(normalizedPrice) || normalizedPrice < 0) {
      state.setError('Harga menu harus berupa angka positif.');
      return;
    }
    const validCustomOptions = state.customOptionsList.filter(o => o.name.trim() !== '');
    const serializedOptions = validCustomOptions.length > 0 ? JSON.stringify(validCustomOptions) : '';

    state.setIsSubmitting(true);
    try {
      await onAddOrUpdateRecipe(
        state.menuName,
        state.recipeLines,
        state.menuCategory,
        state.spiceLevelOption,
        state.sugarLevelOption,
        serializedOptions,
        normalizedPrice,
      );
      state.setSuccess(`✓ Menu "${state.menuName}" berhasil disimpan!`);
      state.closeBuilder();
    } catch (err: any) {
      state.setError(`Gagal menyimpan: ${err.message || err}`);
    } finally {
      state.setIsSubmitting(false);
    }
  };

  return (
    <div id="recipe-bom-section" className="min-h-full w-full bg-transparent p-4 space-y-4">


      {/* ── Stats bar ── */}
      <RecipeStatsBar recipes={recipes} ingredients={ingredients} />

      {/* ── Feedback banners ── */}
      {state.success && (
        <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2.5">
          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
          <p className="text-[11px] font-medium">{state.success}</p>
          <button onClick={() => state.setSuccess('')} className="ml-auto text-green-400 hover:text-green-600">✕</button>
        </div>
      )}
      {state.error && !state.showBuilder && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl flex items-center gap-2.5">
          <AlertCircle size={14} className="text-red-500 flex-shrink-0" />
          <p className="text-[11px] font-medium">{state.error}</p>
          <button onClick={() => state.setError('')} className="ml-auto text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ── Main content: tabs + grid + right panel ── */}
      <div className="flex gap-4">
        {/* Left: tabs + grid */}
        <div className="flex-1 min-w-0">

          {/* Tabs + toolbar */}
          <div className="bg-white rounded-xl border border-slate-100 mb-3 overflow-hidden">
            <div className="flex flex-col gap-3 border-b border-slate-100 p-3">
              <div className="flex items-center justify-between gap-2">
                {/* Scrollable tabs */}
                <div className="flex gap-0 overflow-x-auto no-scrollbar flex-1">
                  {dynamicTabs.map(tab => (
                    <button
                      key={tab}
                      onClick={() => state.setActiveTab(tab)}
                      className={`py-2 px-3 text-[11px] font-semibold whitespace-nowrap border-b-2 transition-colors
                        ${state.activeTab === tab
                          ? 'text-purple-600 border-purple-600'
                          : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <button
                  id="btn-recipe-builder-trigger"
                  onClick={() => state.openBuilder()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-semibold transition-colors flex-shrink-0"
                >
                  <Plus size={13} /> Tambah Resep
                </button>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari bahan, kategori, SKU…"
                    value={state.search}
                    onChange={e => state.setSearch(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>
                <button className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-600 hover:bg-slate-50 bg-white flex-shrink-0">
                  <Filter size={13} /> Filter
                </button>
                <div className="flex gap-1 flex-shrink-0">
                  <button className="p-1.5 border border-purple-200 bg-purple-50 text-purple-600 rounded-lg">
                    <List size={13} />
                  </button>
                  <button className="p-1.5 border border-slate-200 text-slate-400 rounded-lg">
                    <LayoutGrid size={13} />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Recipe grid */}
          {filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredRecipes.map((recipe, idx) => (
                <RecipeCard
                  key={recipe.menu_name}
                  recipe={recipe}
                  ingredients={ingredients}
                  index={idx}
                  onEdit={r => state.openBuilder(r)}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white border border-slate-100 rounded-xl p-12 text-center">
              <p className="text-[12px] text-slate-400 italic">Tidak ada resep yang cocok.</p>
            </div>
          )}
        </div>

        {/* Right panel */}
        <RecipeRightPanel recipes={recipes} ingredients={ingredients} />
      </div>

      {/* ── Builder Modal ── */}
      {state.showBuilder && (
        <RecipeBuilder
          ingredients={ingredients}
          recipes={recipes}
          menuName={state.menuName}          setMenuName={state.setMenuName}
          menuCategory={state.menuCategory}  setMenuCategory={state.setMenuCategory}
          menuPrice={state.menuPrice}        setMenuPrice={state.setMenuPrice}
          spiceLevelOption={state.spiceLevelOption} setSpiceLevelOption={state.setSpiceLevelOption}
          sugarLevelOption={state.sugarLevelOption} setSugarLevelOption={state.setSugarLevelOption}
          customOptionsList={state.customOptionsList} setCustomOptionsList={state.setCustomOptionsList}
          recipeLines={state.recipeLines}
          error={state.error}
          isSubmitting={state.isSubmitting}
          onClose={state.closeBuilder}
          onAddLine={state.handleAddLine}
          onRemoveLine={state.handleRemoveLine}
          onLineChange={state.handleLineChange}
          onSubmit={handleSaveRecipe}
        />
      )}
    </div>
  );
}
