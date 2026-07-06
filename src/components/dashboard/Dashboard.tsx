import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Filter, Bell, LayoutGrid,
  TrendingUp, PieChart, AlertTriangle, FileText,
  ChevronDown,
} from 'lucide-react';
import type { DashboardStats, Ingredient, MovementLog, RecipeWithDetails, Sale, AuthSession } from '../../types';
import { totalStockValue } from '../../types';

/* ═══════════════════════════════════════════════════════════════
   COMPONENTS
   ═══════════════════════════════════════════════════════════════ */
import StatCards from './StatCards';
import SalesChart from './SalesChart';
import MenuTerlaris from './MenuTerlaris';
import InventoryInsight from './InventoryInsight';
import ShoppingList from './ShoppingList';
import RightSidebar from './RightSidebar';
import PageLayout from '../layout/PageLayout';
import TabTren from './TabTren';
import TabBreakdown from './TabBreakdown';
import TabAlerts from './TabAlerts';
import TabLaporan from './TabLaporan';
import DateRangePicker, { getPresetRange, type DateRangeValue } from './DateRangePicker';
import { parseDashboardDate, buildSalesChartData, formatIDRCompact } from './shared/utils';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface DashboardProps {
  stats: DashboardStats;
  authSession: AuthSession;
  onNavigate: (tab: string) => void;
  movements: MovementLog[];
  ingredients: Ingredient[];
  recipes: RecipeWithDetails[];
  sales: Sale[];
}

type TabId = 'overview' | 'trend' | 'breakdown' | 'alerts' | 'laporan';

const TABS: { id: TabId; label: string; icon: typeof LayoutGrid }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutGrid },
  { id: 'trend', label: 'Trend', icon: TrendingUp },
  { id: 'breakdown', label: 'Breakdown', icon: PieChart },
  { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
  { id: 'laporan', label: 'Laporan', icon: FileText },
];

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */

export default function Dashboard({
  stats, authSession, onNavigate,
  movements, ingredients, recipes, sales,
}: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [dateRange, setDateRange] = useState<DateRangeValue>({ preset: '30d' });

  // ── Computed dates from DateRangePicker value ──────────
  const { startDate, endDate } = useMemo(() => {
    if (dateRange.preset === 'custom' && dateRange.from && dateRange.to) {
      return { startDate: dateRange.from, endDate: dateRange.to };
    }
    const range = getPresetRange(dateRange.preset);
    return { startDate: range.from, endDate: range.to };
  }, [dateRange]);

  // ── Filtered data ───────────────────────────────────────
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = parseDashboardDate(s.created_at);
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });
  }, [sales, startDate, endDate]);

  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const d = parseDashboardDate(m.created_at);
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });
  }, [movements, startDate, endDate]);

  const fallbackTrend = useMemo(() => {
    if (!Array.isArray(stats?.salesTrend)) return [];
    return stats.salesTrend.map(item => ({
      date: String(item?.date || '').trim(),
      amount: Number(item?.amount) || 0,
    })).filter(item => item.date);
  }, [stats]);

  // ── Computed stats ──────────────────────────────────────
  const filteredStats = useMemo(() => {
    const totalOmsetFromSales = filteredSales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
    const totalOmset = totalOmsetFromSales > 0
      ? totalOmsetFromSales
      : fallbackTrend.reduce((sum, item) => sum + item.amount, 0);
    const totalTx = filteredSales.length > 0
      ? filteredSales.length
      : (stats?.totalTransactionsByDay || 0);
    const profit = Math.round(totalOmset * 0.42);

    const dayMap: Record<string, number> = {};
    if (filteredSales.length > 0) {
      filteredSales.forEach(s => {
        const dateStr = parseDashboardDate(s.created_at)?.toISOString().split('T')[0];
        if (dateStr) dayMap[dateStr] = (dayMap[dateStr] || 0) + (Number(s.total_price) || 0);
      });
    } else {
      fallbackTrend.forEach(item => { dayMap[item.date] = (dayMap[item.date] || 0) + item.amount; });
    }
    const sparkline = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    return { totalOmset, totalTx, profit, sparkline };
  }, [filteredSales, fallbackTrend, stats]);

  // ── Chart data ──────────────────────────────────────────
  const chartData = useMemo(() => {
    return buildSalesChartData(filteredSales, dateRange.preset, fallbackTrend);
  }, [filteredSales, dateRange, fallbackTrend]);

  // ── Critical items ──────────────────────────────────────
  const criticalItems = useMemo(
    () => stats.criticalStockItems?.items || [],
    [stats.criticalStockItems],
  );
  const criticalCount = stats.criticalStockItems?.count || 0;

  // ── Stock value ─────────────────────────────────────────
  const stockValue = useMemo(() => {
    return ingredients.reduce((sum, ing) => sum + totalStockValue(ing as Ingredient), 0);
  }, [ingredients]);

  // ── Date label for display (used in chart titles, etc) ──
  const dateLabel = useMemo(() => {
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    const to = `${endDate.getDate()} ${monthNames[endDate.getMonth()]} ${endDate.getFullYear()}`;

    if (dateRange.preset === 'today') return `Hari ini, ${to}`;
    if (dateRange.preset === 'thisMonth') return `Bulan ini (${monthNames[endDate.getMonth()]} ${endDate.getFullYear()})`;
    if (dateRange.preset === '1year') return `Tahun ${endDate.getFullYear()}`;

    const from = `${startDate.getDate()} ${monthNames[startDate.getMonth()]} ${startDate.getFullYear()}`;
    return `${from} – ${to}`;
  }, [dateRange, startDate, endDate]);

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="p-[22px] px-[26px] min-w-0">
      {/* ═══════════════════════════════════════════════
          TOPBAR
          ═══════════════════════════════════════════════ */}
      <div className="flex items-start justify-between mb-[18px] flex-wrap gap-[14px]">
        <div>
          <h1 className="text-[24px] font-bold text-[#1B2436] tracking-[-0.02em]">
            Dashboard
          </h1>
          <p className="text-[13px] text-[#6B7280] mt-1 flex items-center gap-1">
            Ringkasan operasional
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
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(authSession.user.nama || 'User')}&background=2E4FE0&color=fff&size=72`}
              alt={authSession.user.nama}
              className="w-[36px] h-[36px] rounded-full object-cover"
            />
            <div>
              <div className="text-[13.5px] font-semibold leading-tight text-[#1B2436]">
                {authSession.user.nama || 'User'}
              </div>
              <div className="text-[11.5px] text-[#9CA3AF]">{authSession.user.role}</div>
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
      <PageLayout
        rightPanel={
          <RightSidebar
            sales={filteredSales}
            ingredients={ingredients}
            movements={filteredMovements}
            criticalCount={criticalCount}
            stockValue={stockValue}
            totalOmset={filteredStats.totalOmset}
            totalTx={filteredStats.totalTx}
            onNavigate={onNavigate}
          />
        }
      >
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
                  {/* STAT CARDS ROW */}
                  <StatCards
                    sales={sales}
                    ingredients={ingredients}
                    globalDateRange={dateRange}
                  />

                  {/* TWO COL: Sales Chart + Menu Terlaris */}
                  <div className="grid grid-cols-[1fr_1fr] gap-5 max-[760px]:grid-cols-1">
                    <SalesChart chartData={chartData} dateRangeLabel={dateLabel} isHourly={dateRange.preset === 'today'} />
                    <MenuTerlaris sales={filteredSales} dateRangeLabel={dateLabel} />
                  </div>

                  {/* TWO COL: Inventory Insight + Perlu Restock */}
                  <div className="grid grid-cols-[1fr_1fr] gap-5 max-[760px]:grid-cols-1">
                    <InventoryInsight
                      ingredients={ingredients}
                      movements={filteredMovements}
                      criticalCount={criticalCount}
                      stockValue={stockValue}
                      dateRangeLabel={dateLabel}
                      onNavigate={onNavigate}
                    />
                    <ShoppingList
                      items={criticalItems}
                      totalCount={criticalCount}
                      onNavigate={onNavigate}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── TREND ───────────────────────────────── */}
            {activeTab === 'trend' && (
              <motion.div
                key="trend"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <TabTren
                  sales={sales}
                  filteredSales={filteredSales}
                  dateRangeLabel={dateLabel}
                  dateRange={dateRange.preset}
                  startDate={startDate}
                  endDate={endDate}
                />
              </motion.div>
            )}

            {/* ── BREAKDOWN ───────────────────────────── */}
            {activeTab === 'breakdown' && (
              <motion.div
                key="breakdown"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <TabBreakdown sales={filteredSales} recipes={recipes} ingredients={ingredients} dateRangeLabel={dateLabel} />
              </motion.div>
            )}

            {/* ── ALERTS ──────────────────────────────── */}
            {activeTab === 'alerts' && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <TabAlerts
                  ingredients={ingredients}
                  sales={filteredSales}
                  dateRangeLabel={dateLabel}
                  onNavigate={onNavigate}
                />
              </motion.div>
            )}

            {/* ── LAPORAN ─────────────────────────────── */}
            {activeTab === 'laporan' && (
              <motion.div
                key="laporan"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
              >
                <TabLaporan sales={filteredSales} recipes={recipes} ingredients={ingredients} dateRangeLabel={dateLabel} startDate={startDate} endDate={endDate} />
              </motion.div>
            )}
          </AnimatePresence>
      </PageLayout>
    </div>
  );
}
