import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Filter, Bell, LayoutGrid, Scan, ShoppingCart, ChevronDown, HelpCircle } from 'lucide-react';
import type { Ingredient, AuthSession, Sale, MovementLog } from '../../types';
import { useInventoryState } from './hooks/useInventoryState';

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
import DateRangePicker, { type DateRangeValue } from '../dashboard/DateRangePicker';
import InsightHariIni from '../dashboard/shared/InsightHariIni';
import ReceiptScanner from '../ReceiptScanner';
import IngredientListSidebar from './components/IngredientListSidebar';
import RekomendasiBelanja from './components/RekomendasiBelanja';
import DetailPanel from './components/DetailPanel';
import ScanHistoryTable from './components/ScanHistoryTable';
import AIInventoryAgent from './components/AIInventoryAgent';
import AddModal from './modals/AddModal';
import EditModal from './modals/EditModal';
import AdjustModal from './modals/AdjustModal';
import DeleteModal from './modals/DeleteModal';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface InventoryProps {
  ingredients: Ingredient[];
  sales: Sale[];
  movements: MovementLog[];
  onAddIngredient: (ing: any) => Promise<void>;
  onEditIngredient: (id: number, data: any) => Promise<void>;
  onAdjustStock: (id: number, qty: number) => Promise<void>;
  onDeleteIngredient: (id: number) => Promise<void>;
  onScanReceipt: (base64: string, mimeType: string) => Promise<{ items: any[]; simulated: boolean }>;
  onConfirmReceiptItems: (confirmedItems: any[]) => Promise<void>;
  onRefreshStats: () => void;
  authSession: AuthSession;
  onNavigate?: (tab: string) => void;
}

type TabId = 'overview' | 'scan' | 'rekomendasi';

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'scan', label: 'Scan Struk', icon: Scan },
  { id: 'rekomendasi', label: 'Rekomendasi Belanja', icon: ShoppingCart },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */

export default function Inventory({
  ingredients,
  sales,
  movements,
  onAddIngredient,
  onEditIngredient,
  onAdjustStock,
  onDeleteIngredient,
  onScanReceipt,
  onConfirmReceiptItems,
  onRefreshStats,
  authSession,
  onNavigate = () => {},
}: InventoryProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: '30d' });

  /* ── Inventory state (search, filter, modals) ── */
  const {
    search, setSearch,
    activeTab: activeCategory, setActiveTab: setActiveCategory,
    statusFilter, setStatusFilter,
    activeModal, selected,
    openModal, closeModal,
    filtered, stats,
  } = useInventoryState(ingredients);

  /* ── Category tabs ── */
  const categories = useMemo(() => {
    const cats = new Set(ingredients.map(i => i.category || 'Lainnya'));
    return ['Semua Bahan', ...Array.from(cats)];
  }, [ingredients]);

  /* ── Map dateRange preset to days for mini chart ── */
  const globalDays = useMemo(() => {
    switch (dateRange.preset) {
      case '7d': return 7;
      case '30d': return 30;
      case '90d': return 90;
      case '1y': return 365;
      default: return 30;
    }
  }, [dateRange.preset]);

  /* ── Selected ingredient for detail panel ── */
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const selectedIngredient = useMemo(
    () => ingredients.find(i => i.id === selectedId) ?? null,
    [ingredients, selectedId],
  );

  /* ── Auto-select first item ── */
  const prevFilteredLen = useRef(filtered.length);
  useEffect(() => {
    if (filtered.length > 0 && (!selectedId || prevFilteredLen.current !== filtered.length)) {
      const stillExists = filtered.find(f => f.id === selectedId);
      if (!stillExists) setSelectedId(filtered[0].id);
    }
    prevFilteredLen.current = filtered.length;
  }, [filtered, selectedId]);

  /* ── Handle ingredient select: switch to overview if on other tab ── */
  const handleSelectIngredient = (id: number) => {
    setSelectedId(id);
    if (activeTab !== 'overview') setActiveTab('overview');
  };

  /* ── Derived stats for Insight ── */
  const totalOmset = useMemo(
    () => sales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0),
    [sales],
  );
  const totalTx = sales.length;

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
            Inventori
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1 flex items-center gap-1">
            Kelola stok bahan baku
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
          <button className="flex items-center gap-2 bg-white border border-[#E9ECF5] px-[14px] py-[9px] rounded-[10px] text-[13px] font-medium text-[#1B2436] hover:border-[#D6DCEC] transition-colors cursor-pointer">
            <Filter size={15} strokeWidth={1.8} />
            Filter
          </button>
          <div className="relative w-[38px] h-[38px] rounded-[10px] bg-white border border-[#E9ECF5] flex items-center justify-center">
            <Bell size={17} strokeWidth={1.8} color="#4B5468" />
            {stats.kritisCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-[#2E4FE0] text-white text-[10px] font-bold rounded-full w-[17px] h-[17px] flex items-center justify-center border-[2px] border-[#F3F5FA]">
                {stats.kritisCount > 99 ? '99+' : stats.kritisCount}
              </span>
            )}
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
              <div className="text-[11.5px] text-[#9CA3AF]">{authSession?.user?.role}</div>
            </div>
            <ChevronDown size={13} strokeWidth={2} color="#9CA3AF" />
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          TAB BAR — hanya tabs, tanpa search/filter
          ═══════════════════════════════════════════════ */}
      <div className="flex items-center border-b border-[#E9ECF5] mb-5">
        <div className="flex gap-[22px]">
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
      </div>

      {/* ═══════════════════════════════════════════════
          3-COLUMN GRID — KHUSUS INVENTORI
          ═══════════════════════════════════════════════ */}
      <div className="grid grid-cols-12 gap-5 items-start">
        {/* ── KOLOM KIRI: Daftar Bahan (col-span-3, ~25%) ── */}
        <div className="col-span-3">
          <IngredientListSidebar
            ingredients={ingredients}
            selectedId={selectedId}
            onSelect={handleSelectIngredient}
            search={search}
            onSearchChange={setSearch}
            activeCategory={activeCategory}
            categories={categories}
            onCategoryChange={setActiveCategory}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            onAdd={() => openModal('add')}
            totalCount={ingredients.length}
          />
        </div>

        {/* ── KOLOM TENGAH: Konten utama (col-span-6, ~50%) ── */}
        <div className="col-span-6 space-y-4">
          <AnimatePresence mode="wait">
            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Detail Panel */}
                <DetailPanel
                  ingredient={selectedIngredient}
                  movements={movements}
                  onAdjust={() => selectedIngredient && openModal('adjust', selectedIngredient)}
                  onEdit={() => selectedIngredient && openModal('edit', selectedIngredient)}
                  onDelete={() => selectedIngredient && openModal('delete', selectedIngredient)}
                  globalDays={globalDays}
                />
              </motion.div>
            )}

            {/* ── SCAN STRUK TAB ── */}
            {activeTab === 'scan' && (
              <motion.div
                key="scan"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                {/* Scanner */}
                <ReceiptScanner
                  ingredients={ingredients}
                  onScanReceipt={onScanReceipt}
                  onConfirmReceiptItems={onConfirmReceiptItems}
                  onRefreshStats={onRefreshStats}
                />

                {/* Cara Kerja + Riwayat */}
                <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-pp-sm bg-pp-primary-soft flex items-center justify-center">
                      <HelpCircle size={15} strokeWidth={1.8} className="text-pp-primary" />
                    </div>
                    <h3 className="text-[14px] font-semibold text-pp-text">Cara Kerja</h3>
                  </div>
                  <ol className="space-y-3 mb-5">
                    {[
                      { step: '1', text: 'Upload foto atau PDF struk pembelian.' },
                      { step: '2', text: 'Pilot AI mengekstrak nama bahan, qty, dan harga.' },
                      { step: '3', text: 'Konfirmasi data sebelum masuk ke stok.' },
                    ].map((item) => (
                      <li key={item.step} className="flex gap-3 text-[12.5px] text-pp-text-secondary leading-snug">
                        <span className="w-5 h-5 rounded-full bg-pp-primary-soft text-pp-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                          {item.step}
                        </span>
                        {item.text}
                      </li>
                    ))}
                  </ol>

                  {/* Riwayat Scan */}
                  <ScanHistoryTable />
                </div>
              </motion.div>
            )}

            {/* ── REKOMENDASI BELANJA TAB ── */}
            {activeTab === 'rekomendasi' && (
              <motion.div
                key="rekomendasi"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <RekomendasiBelanja
                  ingredients={ingredients}
                  onNavigate={onNavigate}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── KOLOM KANAN: Pilot AI + Insight (col-span-3, ~25%)
            SELALU tampil untuk SEMUA tab ── */}
        <div className="col-span-3 space-y-4">
          {/* Pilot AI — Status Agent */}
          <AIInventoryAgent onNavigate={onNavigate} />

          {/* Insight Hari Ini */}
          <InsightHariIni
            sales={sales}
            ingredients={ingredients}
            movements={movements}
            criticalCount={stats.kritisCount}
            stockValue={stats.totalNilai}
            totalOmset={totalOmset}
            totalTx={totalTx}
            onNavigate={onNavigate}
          />
        </div>
      </div>

      {/* ── MODALS ── */}
      {activeModal === 'add' && (
        <AddModal
          ingredients={ingredients}
          onClose={closeModal}
          onAddIngredient={onAddIngredient}
        />
      )}
      {activeModal === 'edit' && selected && (
        <EditModal
          ingredient={selected}
          ingredients={ingredients}
          onClose={closeModal}
          onEditIngredient={onEditIngredient}
        />
      )}
      {activeModal === 'adjust' && selected && (
        <AdjustModal
          ingredient={selected}
          onClose={closeModal}
          onAdjustStock={onAdjustStock}
        />
      )}
      {activeModal === 'delete' && selected && (
        <DeleteModal
          ingredient={selected}
          onClose={closeModal}
          onDeleteIngredient={onDeleteIngredient}
        />
      )}
    </div>
  );
}
