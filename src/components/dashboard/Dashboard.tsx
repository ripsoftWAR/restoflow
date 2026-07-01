import { useState, useMemo, useRef, useEffect } from 'react';
import { DashboardStats, Ingredient, MovementLog, RecipeWithDetails, Sale } from '../../types';
import MetricCards from './MetricCards';
import SalesChart from './SalesChart';
import ShoppingList from './ShoppingList';
import InventoryInsight from './InventoryInsight';
import MenuTerlaris from './MenuTerlaris';
import TabTren from './TabTren';
import TabBreakdown from './TabBreakdown';
import TabAlerts from './TabAlerts';
import TabLaporan from './TabLaporan';
import { AlertTriangle, ChevronRight, Calendar, Clock, ChevronDown, X } from 'lucide-react';
import { parseDashboardDate, buildSalesChartData } from './shared/utils';

interface DashboardProps {
  stats: DashboardStats;
  onNavigate: (tab: string) => void;
  movements: MovementLog[];
  ingredients: Ingredient[];
  recipes: RecipeWithDetails[];
  sales: Sale[];
}

type TabId = 'overview' | 'tren' | 'breakdown' | 'alerts' | 'laporan';
type DateRangeKey = 'today' | '7d' | '30d' | 'custom';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tren', label: 'Tren' },
  { id: 'breakdown', label: 'Breakdown' },
  { id: 'alerts', label: 'Alerts' },
  { id: 'laporan', label: 'Laporan' },
];

const DATE_RANGES: { key: DateRangeKey; label: string }[] = [
  { key: 'today', label: 'Hari ini' },
  { key: '7d', label: '7 hari' },
  { key: '30d', label: '30 hari' },
  { key: 'custom', label: 'Custom' },
];

/** Dapatkan tanggal mulai berdasarkan range */
function getStartDate(range: DateRangeKey, customStart?: string): Date {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  switch (range) {
    case 'today': {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '7d': {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case '30d': {
      const d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case 'custom':
      return customStart ? new Date(customStart) : new Date(0);
    default:
      return new Date(0);
  }
}

function getEndDate(range: DateRangeKey, customEnd?: string): Date {
  const now = new Date();
  now.setHours(23, 59, 59, 999);
  if (range === 'custom' && customEnd) {
    const d = new Date(customEnd);
    d.setHours(23, 59, 59, 999);
    return d;
  }
  return now;
}

/** Parse date string dari Sale/Movement ke Date object */
function parseDate(val: string | Date | undefined): Date | null {
  if (!val) return null;
  if (val instanceof Date) return val;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

export default function Dashboard({ stats, onNavigate, movements, ingredients, recipes, sales }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // ── Date range state (SINGLE SOURCE OF TRUTH) ──────────────────
  const [dateRange, setDateRange] = useState<DateRangeKey>('today');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');
  const [showCalendar, setShowCalendar] = useState(false);
  const calRef = useRef<HTMLDivElement>(null);
  const [dismissWarning, setDismissWarning] = useState(false);

  // Close calendar on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Computed date boundaries ────────────────────────────────────
  const { startDate, endDate } = useMemo(() => ({
    startDate: getStartDate(dateRange, customStart),
    endDate: getEndDate(dateRange, customEnd),
  }), [dateRange, customStart, customEnd]);

  // ── Filtered sales ──────────────────────────────────────────────
  const filteredSales = useMemo(() => {
    return sales.filter(s => {
      const d = parseDashboardDate(s.created_at);
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });
  }, [sales, startDate, endDate]);

  // ── Filtered movements ──────────────────────────────────────────
  const filteredMovements = useMemo(() => {
    return movements.filter(m => {
      const d = parseDashboardDate(m.created_at);
      if (!d) return false;
      return d >= startDate && d <= endDate;
    });
  }, [movements, startDate, endDate]);

  // ── Computed stats dari filtered sales ──────────────────────────
  const fallbackTrend = useMemo(() => {
    if (!Array.isArray(stats?.salesTrend)) return [];
    return stats.salesTrend.map(item => ({
      date: String(item?.date || '').trim(),
      amount: Number(item?.amount) || 0,
    })).filter(item => item.date);
  }, [stats]);

  const filteredStats = useMemo(() => {
    const totalOmsetFromSales = filteredSales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
    const totalOmset = totalOmsetFromSales > 0 ? totalOmsetFromSales : fallbackTrend.reduce((sum, item) => sum + item.amount, 0);
    const totalTx = filteredSales.length > 0 ? filteredSales.length : (stats?.totalTransactionsByDay || 0);
    const totalQty = filteredSales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0) || (stats?.totalItemsSoldByDay || 0);
    const profit = Math.round(totalOmset * 0.42);

    // Aggregate per day for sparkline
    const dayMap: Record<string, number> = {};
    if (filteredSales.length > 0) {
      filteredSales.forEach(s => {
        const dateStr = parseDashboardDate(s.created_at)?.toISOString().split('T')[0];
        if (dateStr) {
          dayMap[dateStr] = (dayMap[dateStr] || 0) + (Number(s.total_price) || 0);
        }
      });
    } else {
      fallbackTrend.forEach(item => {
        dayMap[item.date] = (dayMap[item.date] || 0) + item.amount;
      });
    }
    const sparkline = Object.entries(dayMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => v);

    return { totalOmset, totalTx, totalQty, profit, sparkline };
  }, [filteredSales, fallbackTrend, stats]);

  // ── Chart data dari filtered sales (aggregate per day) ──────────
  const chartData = useMemo(() => {
    return buildSalesChartData(filteredSales, dateRange, fallbackTrend);
  }, [filteredSales, dateRange, fallbackTrend]);

  // ── Critical items ──────────────────────────────────────────────
  const criticalItems = useMemo(
    () => stats.criticalStockItems?.items || [],
    [stats.criticalStockItems],
  );
  const criticalCount = stats.criticalStockItems?.count || 0;

  // ── Stock value ─────────────────────────────────────────────────
  const stockValue = useMemo(() => {
    return ingredients.reduce((sum, ing) => {
      return sum + (Number(ing.stock) || 0) * (Number(ing.unit_price) || 0);
    }, 0);
  }, [ingredients]);

  // ── Today date string ───────────────────────────────────────────
  const todayStr = useMemo(() => {
    const d = new Date();
    const days = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  }, []);

  // ── Date range display label ────────────────────────────────────
  const dateRangeLabel = useMemo(() => {
    if (dateRange === 'custom' && customStart && customEnd) {
      const s = new Date(customStart).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      const e = new Date(customEnd).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      return `${s} – ${e}`;
    }
    const opt = DATE_RANGES.find(d => d.key === dateRange);
    return opt?.label || 'Hari ini';
  }, [dateRange, customStart, customEnd]);

  // ── Most critical item name ─────────────────────────────────────
  const mostCritical = criticalItems[0];

  // ── Handle date range click ─────────────────────────────────────
  const handleRangeClick = (key: DateRangeKey) => {
    if (key === 'custom') {
      setShowCalendar(!showCalendar);
      return;
    }
    setShowCalendar(false);
    setDateRange(key);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      setDateRange('custom');
      setShowCalendar(false);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* ═══════════════════════════════════════════════════════════
          TOPBAR — dengan filter tanggal fungsional
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-2xl text-primary">Overview</h1>
          <p className="text-sm text-slate-600 mt-1">
            Ringkasan operasional · Shift 1 · Budi
          </p>
        </div>

        {/* DATE RANGE FILTER */}
        <div className="flex items-center gap-2">
          {/* Range pills */}
          <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
            {DATE_RANGES.map(({ key, label }) => (
              <button
                key={key}
                onClick={() => handleRangeClick(key)}
                className={`font-sm px-4 py-2 rounded-md transition-all cursor-pointer whitespace-nowrap ${
                  dateRange === key && key !== 'custom'
                    ? 'bg-white text-slate-800 shadow-sm font-medium'
                    : key === 'custom' && showCalendar
                    ? 'bg-white text-slate-800 shadow-sm font-medium'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {key === 'custom' ? (
                  <span className="flex items-center gap-1">
                    <Calendar size={10} />
                    {label}
                  </span>
                ) : (
                  label
                )}
              </button>
            ))}
          </div>

          {/* Current date display */}
          <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Clock size={12} />
            {todayStr}
          </div>
        </div>
      </div>

      {/* Calendar dropdown */}
      {showCalendar && (
        <div ref={calRef} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-3 shadow-sm">
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
          />
          <span className="text-[12px] text-slate-400">s/d</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className="text-[12px] border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700"
          />
          <button
            onClick={handleCustomApply}
            disabled={!customStart || !customEnd}
            className="text-[12px] px-4 py-1.5 bg-[#185FA5] text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            Terapkan
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          WARNING BAR
          ═══════════════════════════════════════════════════════════ */}
      {criticalCount > 0 && mostCritical && !dismissWarning && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-[#FAEEDA] border border-[#FAC775] rounded-xl px-4 py-2.5">
          <span className="text-[12px] text-[#633806] flex items-center gap-1.5">
            <AlertTriangle size={13} className="flex-shrink-0" />
            <span>
              {criticalCount} bahan perlu restock —{' '}
              <strong>{mostCritical.name}</strong> paling kritis, sisa {mostCritical.stock} {mostCritical.base_unit}
            </span>
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigate('inventory')}
              className="text-[11px] text-[#854F0B] underline cursor-pointer whitespace-nowrap"
            >
              Lihat detail →
            </button>
            <button
              onClick={() => setDismissWarning(true)}
              className="text-[#854F0B] hover:text-[#633806] cursor-pointer"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TABS
          ═══════════════════════════════════════════════════════════ */}
      <div className="flex gap-0 border-b border-slate-200">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`text-[13px] px-4 py-2.5 cursor-pointer border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'text-slate-800 border-slate-800 font-medium'
                : 'text-slate-400 border-transparent hover:text-slate-500'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════════════
          TAB: OVERVIEW
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* Metric Cards — pakai filteredStats */}
          <MetricCards
            filteredStats={filteredStats}
            criticalCount={criticalCount}
            dateRangeLabel={dateRangeLabel}
            onNavigate={onNavigate}
          />

          {/* Row 2: Sales Chart + Menu Terlaris */}
          <div className="grid lg:grid-cols-12 gap-3">
            <div className="lg:col-span-8 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <SalesChart chartData={chartData} dateRangeLabel={dateRangeLabel} isHourly={dateRange === 'today'} />
            </div>
            <div className="lg:col-span-4 bg-white border border-slate-200 rounded-xl overflow-hidden">
              <MenuTerlaris sales={filteredSales} dateRangeLabel={dateRangeLabel} />
            </div>
          </div>

          {/* Row 3: Inventory Insight + Shopping List */}
          <div className="grid lg:grid-cols-2 gap-3">
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <InventoryInsight
                ingredients={ingredients}
                movements={filteredMovements}
                criticalCount={criticalCount}
                stockValue={stockValue}
                dateRangeLabel={dateRangeLabel}
              />
            </div>
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <ShoppingList
                items={criticalItems}
                totalCount={criticalCount}
                onNavigate={onNavigate}
              />
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: TREN
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'tren' && (
        <TabTren sales={filteredSales} dateRangeLabel={dateRangeLabel} dateRange={dateRange} />
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: BREAKDOWN
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'breakdown' && (
        <TabBreakdown sales={filteredSales} dateRangeLabel={dateRangeLabel} />
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: ALERTS
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'alerts' && (
        <TabAlerts ingredients={ingredients} sales={filteredSales} dateRangeLabel={dateRangeLabel} onNavigate={onNavigate} />
      )}

      {/* ═══════════════════════════════════════════════════════════
          TAB: LAPORAN
          ═══════════════════════════════════════════════════════════ */}
      {activeTab === 'laporan' && (
        <TabLaporan sales={filteredSales} dateRangeLabel={dateRangeLabel} />
      )}
    </div>
  );
}