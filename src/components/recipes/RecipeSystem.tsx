import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Filter, Bell, LayoutGrid,
  ChevronDown, X, CheckCircle, AlertCircle,
} from 'lucide-react';
import type { Ingredient, RecipeWithDetails, AuthSession } from '../../types';

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
import DateRangePicker, { type DateRangeValue } from '../dashboard/DateRangePicker';
import RightSidebar from '../dashboard/RightSidebar';
import RecipeCard from './components/RecipeCard';
import RecipeBuilder from './components/RecipeBuilder';
import { useRecipeState } from './hooks/useRecipeState';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

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
  onDeleteRecipe: (menuName: string) => Promise<void>;
  authSession?: AuthSession;
  onNavigate?: (tab: string) => void;
}

type TabId = 'overview';

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */

export default function RecipeSystem({
  ingredients,
  recipes,
  onAddOrUpdateRecipe,
  onDeleteRecipe,
  authSession,
  onNavigate = () => {},
}: RecipeSystemProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: '30d' });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Recipe builder modal state
  const recipeState = useRecipeState(ingredients);

  const handleSaveRecipe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeState.menuName.trim()) {
      recipeState.setError('Nama menu tidak boleh kosong.');
      return;
    }
    if (recipeState.recipeLines.length === 0) {
      recipeState.setError('Resep harus memiliki minimal 1 bahan.');
      return;
    }
    const normalizedPrice = parseFloat(recipeState.menuPrice);
    if (isNaN(normalizedPrice) || normalizedPrice < 0) {
      recipeState.setError('Harga menu harus berupa angka positif.');
      return;
    }
    const validCustomOptions = recipeState.customOptionsList.filter(o => o.name.trim() !== '');
    const serializedOptions = validCustomOptions.length > 0 ? JSON.stringify(validCustomOptions) : '';

    recipeState.setIsSubmitting(true);
    try {
      await onAddOrUpdateRecipe(
        recipeState.menuName,
        recipeState.recipeLines,
        recipeState.menuCategory,
        recipeState.spiceLevelOption,
        recipeState.sugarLevelOption,
        serializedOptions,
        normalizedPrice,
      );
      recipeState.setSuccess(`✓ Menu "${recipeState.menuName}" berhasil disimpan!`);
      recipeState.closeBuilder();
    } catch (err: any) {
      recipeState.setError(`Gagal menyimpan: ${err.message || err}`);
    } finally {
      recipeState.setIsSubmitting(false);
    }
  };

  /* ── Derived: unique categories ───────────────── */
  const categories = useMemo(() => {
    const set = new Set<string>();
    recipes.forEach(r => set.add(r.category || 'Makanan'));
    return Array.from(set).sort();
  }, [recipes]);

  /* ── Derived: filtered recipes ────────────────── */
  const filteredRecipes = useMemo(() => {
    let list = recipes;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(r =>
        r.menu_name.toLowerCase().includes(q) ||
        r.items.some(i => (i.ingredient_name || '').toLowerCase().includes(q))
      );
    }

    if (selectedCategory) {
      list = list.filter(r => (r.category || 'Makanan') === selectedCategory);
    }

    return list;
  }, [recipes, searchQuery, selectedCategory]);

  /* ── Stat summary ─────────────────────────────── */
  const stats = useMemo(() => {
    const totalResep = recipes.length;
    const totalKategori = categories.length;
    const adaHarga = recipes.filter(r => (r.price ?? 0) > 0).length;
    const rataBahan = recipes.length > 0
      ? Math.round(recipes.reduce((sum, r) => sum + r.items.length, 0) / recipes.length)
      : 0;
    return { totalResep, totalKategori, adaHarga, rataBahan };
  }, [recipes, categories]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="p-[22px] px-[26px] min-w-0">
      {/* ═══════════════════════════════════════════════
          TOPBAR
          ═══════════════════════════════════════════════ */}
      <div className="flex items-start justify-between mb-[18px] flex-wrap gap-[14px]">
        <div>
          <h1 className="text-[24px] font-bold text-[#1B2436] tracking-[-0.02em]">
            Resep
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1 flex items-center gap-1">
            Kelola menu & resep
            <span className="text-[#9CA3AF] mx-1">•</span>
            <select className="border-none bg-transparent text-[13px] text-[#6B7280] font-medium cursor-pointer outline-none">
              <option>Semua Outlet</option>
              <option>PilotPOS Jakarta</option>
            </select>
          </p>
        </div>

        {/* Topbar Right */}
        <div className="flex items-center gap-[10px]">
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          <button className="flex items-center gap-2 bg-white border border-[#E9ECF5] px-[14px] py-[9px] rounded-[10px] text-[13px] font-medium text-[#1B2436] hover:border-[#D6DCEC] transition-colors">
            <Filter size={15} strokeWidth={1.8} />
            Filter
          </button>

          <div className="relative w-[38px] h-[38px] rounded-[10px] bg-white border border-[#E9ECF5] flex items-center justify-center">
            <Bell size={17} strokeWidth={1.8} color="#4B5468" />
            <span className="absolute -top-1 -right-1 bg-[#2E4FE0] text-white text-[10px] font-bold rounded-full w-[17px] h-[17px] flex items-center justify-center border-[2px] border-[#F3F5FA]">
              3
            </span>
          </div>

          <div className="flex items-center gap-[9px] py-1 pl-1 pr-2 rounded-[10px] hover:bg-white cursor-pointer transition-colors">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(authSession?.user?.nama || 'User')}&background=2E4FE0&color=fff&size=72`}
              alt={authSession?.user?.nama || 'User'}
              className="w-[36px] h-[36px] rounded-full object-cover"
            />
            <div>
              <div className="text-[13.5px] font-semibold leading-tight text-[#1B2436]">
                {authSession?.user?.nama || 'User'}
              </div>
              <div className="text-[11.5px] text-[#9CA3AF]">{authSession?.user?.role || 'Role'}</div>
            </div>
            <ChevronDown size={13} strokeWidth={2} color="#9CA3AF" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          TABS
          ═══════════════════════════════════════════════ */}
      <div className="flex gap-[22px] border-b border-[#E9ECF5] mb-5">
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-[7px] px-0.5 pb-3 text-[14px] font-medium border-b-[2px] transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'text-[#2E4FE0] font-semibold border-[#2E4FE0]'
                  : 'text-[#6B7280] border-transparent hover:text-[#2E4FE0]'
              }`}
            >
              <Icon size={15} strokeWidth={2} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════════════════════════════════════
          CONTENT — 2 zona: KIRI + KANAN
          ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-[1fr_340px] gap-5 max-[1180px]:grid-cols-1">
        {/* ─── LEFT ─────────────────────────────────── */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-5">
                  {/* ── STAT CARDS ROW ────────────────── */}
                  <div className="grid grid-cols-4 gap-3 max-[900px]:grid-cols-2">
                    <StatCard label="Total Resep" value={stats.totalResep} color="blue" />
                    <StatCard label="Kategori" value={stats.totalKategori} color="purple" />
                    <StatCard label="Sudah Ada Harga" value={stats.adaHarga} color="green" />
                    <StatCard label="Rata² Bahan/Resep" value={stats.rataBahan} color="amber" />
                  </div>

                  {/* ── SEARCH + FILTER + ADD ─────────── */}
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="flex-1 min-w-[220px] relative">
                      <Search size={15} strokeWidth={1.8} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                      <input
                        type="text"
                        placeholder="Cari resep atau bahan…"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-9 py-[9px] bg-white border border-[#E9ECF5] rounded-[10px] text-[13px] text-[#1B2436] placeholder:text-[#B0B7C3] focus:outline-none focus:border-[#2E4FE0] transition-colors"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]"
                        >
                          <X size={14} strokeWidth={2} />
                        </button>
                      )}
                    </div>

                    {/* Add Recipe Button */}
                    <button
                      id="btn-add-recipe"
                      onClick={() => recipeState.openBuilder()}
                      className="flex items-center gap-[6px] bg-[#2E4FE0] text-white px-[16px] py-[9px] rounded-[10px] text-[13px] font-semibold hover:bg-[#1E3FCC] transition-colors shadow-sm"
                    >
                      <Plus size={16} strokeWidth={2} />
                      Tambah Resep
                    </button>
                  </div>

                  {/* ── CATEGORY FILTER CHIPS ─────────── */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className={`px-3 py-[5px] rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                        selectedCategory === null
                          ? 'bg-[#2E4FE0] text-white'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      Semua
                    </button>
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`px-3 py-[5px] rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
                          selectedCategory === cat
                            ? 'bg-[#2E4FE0] text-white'
                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>

                  {/* ── RECIPE GRID ───────────────────── */}
                  {filteredRecipes.length === 0 ? (
                    <EmptyState
                      hasSearch={!!searchQuery || !!selectedCategory}
                      onClear={() => { setSearchQuery(''); setSelectedCategory(null); }}
                    />
                  ) : (
                    <div className="grid grid-cols-3 gap-4 max-[1100px]:grid-cols-2 max-[700px]:grid-cols-1">
                      {filteredRecipes.map((recipe, idx) => (
                        <RecipeCard
                          key={recipe.menu_name}
                          recipe={recipe}
                          ingredients={ingredients}
                          index={idx}
                          onEdit={(r) => recipeState.openBuilder(r)}
                          onDelete={onDeleteRecipe}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── RIGHT: Sidebar ───────────────────────── */}
        <div className="max-[1180px]:col-span-1 overflow-visible">
          <RightSidebar
            sales={[]}
            ingredients={ingredients}
            movements={[]}
            criticalCount={0}
            stockValue={0}
            totalOmset={0}
            totalTx={0}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          FEEDBACK BANNERS
          ═══════════════════════════════════════════════ */}
      {recipeState.success && (
        <div className="fixed bottom-4 right-4 z-[60] p-3 bg-green-50 border border-green-200 text-green-800 rounded-xl flex items-center gap-2.5 shadow-lg animate-in slide-in-from-right">
          <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
          <p className="text-[11px] font-medium">{recipeState.success}</p>
          <button onClick={() => recipeState.setSuccess('')} className="ml-auto text-green-400 hover:text-green-600">✕</button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════
          RECIPE BUILDER MODAL
          ═══════════════════════════════════════════════ */}
      {recipeState.showBuilder && (
        <RecipeBuilder
          ingredients={ingredients}
          recipes={recipes}
          menuName={recipeState.menuName} setMenuName={recipeState.setMenuName}
          menuCategory={recipeState.menuCategory} setMenuCategory={recipeState.setMenuCategory}
          menuPrice={recipeState.menuPrice} setMenuPrice={recipeState.setMenuPrice}
          spiceLevelOption={recipeState.spiceLevelOption} setSpiceLevelOption={recipeState.setSpiceLevelOption}
          sugarLevelOption={recipeState.sugarLevelOption} setSugarLevelOption={recipeState.setSugarLevelOption}
          customOptionsList={recipeState.customOptionsList} setCustomOptionsList={recipeState.setCustomOptionsList}
          recipeLines={recipeState.recipeLines}
          error={recipeState.error}
          isSubmitting={recipeState.isSubmitting}
          onClose={recipeState.closeBuilder}
          onAddLine={recipeState.handleAddLine}
          onRemoveLine={recipeState.handleRemoveLine}
          onLineChange={recipeState.handleLineChange}
          onSubmit={handleSaveRecipe}
        />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SUB-COMPONENTS
   ═══════════════════════════════════════════════════════════════ */

function StatCard({ label, value, color }: { label: string; value: number; color: 'blue' | 'purple' | 'green' | 'amber' }) {
  const colors: Record<string, { bg: string; text: string; dot: string }> = {
    blue:   { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-500' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
    green:  { bg: 'bg-green-50',  text: 'text-green-700',  dot: 'bg-green-500' },
    amber:  { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-500' },
  };
  const c = colors[color];

  return (
    <div className={`${c.bg} rounded-pp-xl px-4 py-3.5 border border-transparent`}>
      <div className="flex items-center gap-2 mb-0.5">
        <div className={`w-[6px] h-[6px] rounded-full ${c.dot}`} />
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
      <p className={`text-[20px] font-extrabold ${c.text} tracking-[-0.01em]`}>
        {value.toLocaleString('id-ID')}
      </p>
    </div>
  );
}

function EmptyState({ hasSearch, onClear }: { hasSearch: boolean; onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-[72px] h-[72px] rounded-full bg-slate-100 flex items-center justify-center mb-4">
        <LayoutGrid size={32} strokeWidth={1.2} className="text-slate-300" />
      </div>
      <h3 className="text-[15px] font-bold text-[#1B2436] mb-1">
        {hasSearch ? 'Tidak ada resep ditemukan' : 'Belum ada resep'}
      </h3>
      <p className="text-[13px] text-[#9CA3AF] max-w-[320px] mb-4">
        {hasSearch
          ? 'Coba ubah kata kunci atau hapus filter kategori.'
          : 'Tambahkan resep pertama untuk mulai mengelola menu & BOM restoran Anda.'}
      </p>
      {hasSearch ? (
        <button
          onClick={onClear}
          className="flex items-center gap-1.5 text-[13px] font-semibold text-[#2E4FE0] hover:underline cursor-pointer"
        >
          <X size={14} strokeWidth={2} /> Hapus Filter
        </button>
      ) : (
        <button
          id="btn-add-recipe-empty"
          onClick={() => recipeState.openBuilder()}
          className="flex items-center gap-[6px] bg-[#2E4FE0] text-white px-4 py-2 rounded-[10px] text-[13px] font-semibold hover:bg-[#1E3FCC] transition-colors shadow-sm cursor-pointer"
        >
          <Plus size={16} strokeWidth={2} />
          Tambah Resep Pertama
        </button>
      )}
    </div>
  );
}
