import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Bell, LayoutGrid,
  ChevronDown,
} from 'lucide-react';
import type { Ingredient, RecipeWithDetails, AuthSession } from '../../types';

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
import DateRangePicker, { type DateRangeValue } from '../dashboard/DateRangePicker';
import RightSidebar from '../dashboard/RightSidebar';

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
  authSession,
  onNavigate = () => {},
}: RecipeSystemProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: '30d' });

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
          {/* Date Range Picker — Tokopedia-style */}
          <DateRangePicker value={dateRange} onChange={setDateRange} />

          {/* Filter Button */}
          <button className="flex items-center gap-2 bg-white border border-[#E9ECF5] px-[14px] py-[9px] rounded-[10px] text-[13px] font-medium text-[#1B2436] hover:border-[#D6DCEC] transition-colors">
            <Filter size={15} strokeWidth={1.8} />
            Filter
          </button>

          {/* Bell */}
          <div className="relative w-[38px] h-[38px] rounded-[10px] bg-white border border-[#E9ECF5] flex items-center justify-center">
            <Bell size={17} strokeWidth={1.8} color="#4B5468" />
            <span className="absolute -top-1 -right-1 bg-[#2E4FE0] text-white text-[10px] font-bold rounded-full w-[17px] h-[17px] flex items-center justify-center border-[2px] border-[#F3F5FA]">
              3
            </span>
          </div>

          {/* Profile */}
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
          TAB CONTENT — 2 zona: KIRI (konten tab) + KANAN (sidebar tetap)
          Panel kanan TIDAK berubah saat pindah tab
          ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-[1fr_340px] gap-5 max-[1180px]:grid-cols-1">
        {/* ─── LEFT: Tab Content (switches) ──────────── */}
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {/* ── OVERVIEW ────────────────────────────── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex flex-col gap-5">
                  {/* PLACEHOLDER: Stat Cards Row */}
                  <div className="h-[120px] flex items-center justify-center rounded-pp-xl bg-pp-surface border border-dashed border-pp-border text-pp-text-muted text-sm">
                    📊 KPI Cards — Resep
                  </div>

                  {/* PLACEHOLDER: Recipe Grid/List */}
                  <div className="h-[500px] flex items-center justify-center rounded-pp-xl bg-pp-surface border border-dashed border-pp-border text-pp-text-muted text-sm">
                    📋 Grid Resep — Card Menu + Filter Kategori
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── RIGHT: Sidebar (SELALU VISIBLE, tidak re-render saat ganti tab) ─── */}
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
    </div>
  );
}
