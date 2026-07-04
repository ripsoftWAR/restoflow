import { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, Tooltip, ResponsiveContainer } from 'recharts';
import CountUp from 'react-countup';
import { TrendingUp, TrendingDown, ChevronDown } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   PremiumKPICard — KPI card with separate period + compare dropdowns
   
   Features:
   • Animated CountUp value (idle) / instant text (hover)
   • Interactive sparkline (hover scrubs main value + shows dot)
   • SEPARATE dropdowns: Period (top-right, duration only) + Compare (bottom row, "vs ...")
   • Growth badge + "vs" compare dropdown — sejajar di baris yang sama
   • Subtle hover: border highlight only (no lift/translateY/scale)
   • Skeleton loading state | Empty state
   • Fully memoized (React.memo + useMemo + useCallback)
   ═══════════════════════════════════════════════════════════════ */

/* ── Types ─────────────────────────────────────── */
export interface KpiDataPoint {
  date: Date;
  value: number;
  txCount?: number;
  label?: string;
}

export interface KpiCardConfig {
  id: string;
  label: string;
  icon: React.ReactNode;
  iconBg: string;
  color: string;
  softColor: string;
  formatValue: (v: number) => string;
  formatCountUp: (v: number) => string;
  valuePrefix?: string;
  valueSuffix?: string;
}

export type KpiPeriod = 'today' | 'yesterday' | '7d' | '30d' | 'thisMonth' | 'lastMonth' | '3months' | '1year' | 'custom';

export type KpiComparePeriod = 'yesterday' | 'lastWeek' | 'lastMonth' | 'lastYear';

import { getPeriodLabel } from './useKpiData';

/* ── Period-only dropdown options ──────────── */
const PERIOD_OPTIONS: { period: KpiPeriod; label: string }[] = [
  { period: 'today', label: 'Hari ini' },
  { period: '7d', label: '7 Hari' },
  { period: '30d', label: '30 Hari' },
  { period: 'thisMonth', label: 'Bulan ini' },
  { period: '3months', label: '3 Bulan' },
  { period: '1year', label: '1 Tahun' },
];

/* ── Compare dropdown options ───────────────── */
const COMPARE_OPTIONS: { comparePeriod: KpiComparePeriod; label: string }[] = [
  { comparePeriod: 'yesterday', label: 'vs kemarin' },
  { comparePeriod: 'lastWeek', label: 'vs minggu lalu' },
  { comparePeriod: 'lastMonth', label: 'vs bulan lalu' },
  { comparePeriod: 'lastYear', label: 'vs tahun lalu' },
];

interface Props {
  config: KpiCardConfig;
  dataPoints: KpiDataPoint[];
  totalValue: number;
  growthPct: number;
  growthDirection: 'up' | 'down' | 'flat';
  period: KpiPeriod;
  comparePeriod: KpiComparePeriod;
  onPeriodChange: (period: KpiPeriod) => void;
  onCompareChange: (comparePeriod: KpiComparePeriod) => void;
  loading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
}

/* ═══════════════════════════════════════════════
   PERIOD DROPDOWN (duration only — no "vs")
   Pojok kanan atas card, dekat icon.
   ═══════════════════════════════════════════════ */

function PeriodDropdown({
  period,
  onChange,
}: {
  period: KpiPeriod;
  onChange: (p: KpiPeriod) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedLabel = getPeriodLabel(period);

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1.5 text-[11px] font-medium text-pp-text-muted px-2.5 py-1.5 rounded-pp-xs hover:bg-pp-surface-alt transition-colors cursor-pointer whitespace-nowrap"
      >
        <span className="max-w-[90px] truncate">{selectedLabel}</span>
        <ChevronDown size={10} strokeWidth={2} className={`transition-transform duration-150 flex-shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1 z-[60] bg-pp-surface border border-pp-border rounded-pp-md shadow-pp-lg py-1 min-w-[130px]"
          >
            {PERIOD_OPTIONS.map(opt => (
              <button
                key={opt.period}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.period);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors cursor-pointer whitespace-nowrap ${
                  opt.period === period
                    ? 'bg-pp-primary/10 text-pp-primary font-semibold'
                    : 'text-pp-text-secondary hover:bg-pp-surface-alt'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   COMPARE DROPDOWN (small "vs ...")
   Di baris bawah, bersebelahan dengan badge %.
   ═══════════════════════════════════════════════ */

function CompareDropdown({
  comparePeriod,
  onChange,
}: {
  comparePeriod: KpiComparePeriod;
  onChange: (cp: KpiComparePeriod) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const selectedLabel = COMPARE_OPTIONS.find(o => o.comparePeriod === comparePeriod)?.label || 'vs bulan lalu';

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center gap-1 text-[11px] text-pp-text-muted hover:text-pp-text-secondary px-1.5 py-0.5 rounded hover:bg-pp-surface-alt transition-colors cursor-pointer whitespace-nowrap"
      >
        <span>{selectedLabel}</span>
        <ChevronDown size={10} strokeWidth={2} className={`transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-full left-0 mb-1 z-[60] bg-pp-surface border border-pp-border rounded-pp-md shadow-pp-lg py-1 min-w-[140px]"
          >
            {COMPARE_OPTIONS.map(opt => (
              <button
                key={opt.comparePeriod}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(opt.comparePeriod);
                  setOpen(false);
                }}
                className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors cursor-pointer whitespace-nowrap ${
                  opt.comparePeriod === comparePeriod
                    ? 'bg-pp-primary/10 text-pp-primary font-semibold'
                    : 'text-pp-text-secondary hover:bg-pp-surface-alt'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT (memoized)
   ═══════════════════════════════════════════════ */
const PremiumKPICard = memo(function PremiumKPICard({
  config, dataPoints, totalValue, growthPct, growthDirection,
  period, comparePeriod, onPeriodChange, onCompareChange,
  loading, isEmpty, emptyMessage,
}: Props) {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [hoveredLabel, setHoveredLabel] = useState<string | null>(null);
  const [tooltipX, setTooltipX] = useState<number | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const displayValue = hoveredValue ?? totalValue;

  /* ── Sparkline data ────────────────────────── */
  const chartData = useMemo(() => {
    if (!dataPoints || dataPoints.length === 0) return [];
    return dataPoints.map((dp) => ({
      ...dp,
      formattedValue: config.formatValue(dp.value),
    }));
  }, [dataPoints, config]);

  /* ── Hover callbacks (snappy — no delay) ──── */
  const handleChartMouseMove = useCallback((nextState: any, _event: any) => {
    /* Recharts v3: gunakan activeTooltipIndex — activePayload TIDAK ADA di v3 */
    if (!nextState?.isTooltipActive) return;

    const raw = nextState.activeTooltipIndex;

    /* ── DEBUG ── */
    console.log('[KPI hover]', {
      raw,
      type: typeof raw,
      isNull: raw === null,
      isUndef: raw === undefined,
      chartDataLen: chartData.length,
    });

    /* null = "no active index" per Recharts v3 semantics — jangan proses */
    if (raw == null) {
      console.log('[KPI hover] ⚠️ SKIP — index is null/undefined (no active data point)');
      return;
    }

    const idx = Number(raw);
    if (Number.isNaN(idx) || idx < 0 || idx >= chartData.length) {
      console.log('[KPI hover] ❌ INVALID INDEX', { raw, idx, chartDataLen: chartData.length });
      return;
    }

    const point = chartData[idx];
    if (!point || typeof point.value !== 'number' || Number.isNaN(point.value)) {
      console.log('[KPI hover] ❌ INVALID POINT', { idx, point, chartDataSlice: chartData.slice(0, 3) });
      return;
    }

    console.log('[KPI hover] ✅ SET', { idx, value: point.value, label: point.label });
    setHoveredValue(point.value);
    setHoveredLabel(point.label || null);

    /* ── Track cursor X relative to chart for date popup ── */
    if (chartRef.current) {
      const rect = chartRef.current.getBoundingClientRect();
      const clientX = (_event as { clientX?: number })?.clientX;
      if (typeof clientX === 'number') {
        setTooltipX(Math.max(0, Math.min(clientX - rect.left, rect.width)));
      } else {
        /* fallback: interpolate from data index */
        setTooltipX((idx / Math.max(chartData.length - 1, 1)) * rect.width);
      }
    }
  }, [chartData]);

  const handleChartMouseLeave = useCallback(() => {
    setHoveredValue(null);
    setHoveredLabel(null);
    setTooltipX(null);
  }, []);

  const handlePeriodChange = useCallback(
    (p: KpiPeriod) => {
      onPeriodChange(p);
    },
    [onPeriodChange],
  );

  const handleCompareChange = useCallback(
    (cp: KpiComparePeriod) => {
      onCompareChange(cp);
    },
    [onCompareChange],
  );

  const isHovering = hoveredValue !== null;

  /* ── Loading skeleton ──────────────────────── */
  if (loading) {
    return (
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-xl bg-pp-surface-alt" />
          <div className="w-24 h-6 rounded-lg bg-pp-surface-alt" />
        </div>
        <div className="space-y-2 mb-4">
          <div className="w-32 h-3 rounded bg-pp-surface-alt" />
          <div className="w-40 h-7 rounded bg-pp-border" />
          <div className="w-24 h-4 rounded bg-pp-surface-alt" />
        </div>
        <div className="w-full h-12 rounded-lg bg-pp-bg" />
      </div>
    );
  }

  /* ── Empty state ───────────────────────────── */
  if (isEmpty) {
    return (
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5">
        <div className="flex items-center justify-between mb-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: config.softColor }}
          >
            {config.icon}
          </div>
          <PeriodDropdown
            period={period}
            onChange={handlePeriodChange}
          />
        </div>
        <p className="text-[12px] text-pp-text-placeholder mb-1">{config.label}</p>
        <p className="text-[22px] font-bold text-pp-border mb-1">—</p>
        <p className="text-[12px] text-pp-text-placeholder">{emptyMessage || 'Belum ada data'}</p>
        <div className="w-full h-12 mt-2 rounded-lg flex items-center justify-center">
          <span className="text-[11px] text-pp-text-placeholder">Belum ada transaksi</span>
        </div>
      </div>
    );
  }

  /* ═══════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════ */
  return (
    <div
      className="group relative bg-pp-surface border border-pp-border rounded-pp-lg p-5 cursor-default transition-colors duration-150 hover:border-pp-border-strong"
      style={{ overflow: 'visible' }}
    >
      {/* ═══════════════════════════════════════════
          TOP ROW: Icon + Period Dropdown
          ═══════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-4">
        {/* Icon */}
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:rotate-3"
          style={{ backgroundColor: config.softColor }}
        >
          {config.icon}
        </div>

        {/* Period-only dropdown — TANPA "vs" */}
        <PeriodDropdown
          period={period}
          onChange={handlePeriodChange}
        />
      </div>

      {/* ═══════════════════════════════════════════
          LABEL
          ═══════════════════════════════════════════ */}
      <p className="text-[11.5px] font-medium text-pp-text-muted uppercase tracking-wider mb-1">
        {config.label}
      </p>

      {/* ═══════════════════════════════════════════
          MAIN VALUE
          • Idle: CountUp animasi smooth (duration 0.6s)
          • Hover: render langsung — bypass CountUp
          Dipisahkan untuk menghindari race condition internal
          CountUp saat duration berubah (0.6 ↔ 0) yang memicu
          elapsed/duration = X/0 → NaN di internal easing.
          ═══════════════════════════════════════════ */}
      <div
        className="text-[26px] font-bold tracking-[-0.03em] tabular-nums mb-1 text-pp-text"
      >
        {isHovering ? (
          <span>{config.formatCountUp(displayValue)}</span>
        ) : (
          <CountUp
            end={displayValue}
            duration={0.6}
            separator="."
            decimals={0}
            preserveValue
            useEasing
            formattingFn={config.formatCountUp}
          />
        )}
      </div>

      {/* ═══════════════════════════════════════════
          GROWTH ROW: Badge % + "vs" dropdown
          ═══════════════════════════════════════════ */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${
            growthDirection === 'up'
              ? 'bg-pp-success-soft text-pp-success'
              : growthDirection === 'down'
              ? 'bg-pp-danger-soft text-pp-danger'
              : 'bg-pp-surface-alt text-pp-text-muted'
          }`}
        >
          {growthDirection === 'up' && <TrendingUp size={12} strokeWidth={2.5} />}
          {growthDirection === 'down' && <TrendingDown size={12} strokeWidth={2.5} />}
          {growthDirection === 'up' && '+'}{growthPct}%
        </div>
        <CompareDropdown
          comparePeriod={comparePeriod}
          onChange={handleCompareChange}
        />
      </div>

      {/* ═══════════════════════════════════════════
          SPARKLINE CHART + HOVER DOT + DATE POPUP
          Scrubbing: hover mengubah angka utama & dot, + popup tanggal kecil
          di atas titik hover (popup hanya berisi tanggal, bukan nilai).
          ═══════════════════════════════════════════ */}
      {chartData.length > 1 && (
        <div ref={chartRef} className="relative w-full h-[52px] -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              onMouseMove={handleChartMouseMove}
              onMouseLeave={handleChartMouseLeave}
            >
              {/* Invisible Tooltip — supplies activePayload to onMouseMove without rendering popup */}
              <Tooltip content={() => null} />
              <defs>
                <linearGradient id={`gradient-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={config.color} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={config.color} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <Area
                type="natural"
                dataKey="value"
                stroke={config.color}
                strokeWidth={isHovering ? 2.5 : 2}
                fill={`url(#gradient-${config.id})`}
                dot={false}
                activeDot={{
                  r: 5,
                  fill: 'white',
                  stroke: config.color,
                  strokeWidth: 2.5,
                }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* ═══════════════════════════════════════
              DATE TOOLTIP POPUP
              • Hanya muncul saat hover + hoveredLabel ada
              • Isi: tanggal saja (bukan nilai — nilai di angka besar)
              • Posisi: di atas dot, mengikuti X cursor
              • Edge-clamping: tidak overflow kiri/kanan card
              ═══════════════════════════════════════ */}
          {tooltipX !== null && hoveredLabel && (
            <div
              className="absolute z-50 pointer-events-none"
              style={{
                left: tooltipX,
                bottom: '100%',
                marginBottom: 10,
                ...(tooltipX < 44
                  ? { transform: 'translateX(0)' }
                  : tooltipX > (chartRef.current?.getBoundingClientRect().width || 200) - 44
                    ? { transform: 'translateX(-100%)' }
                    : { transform: 'translateX(-50%)' }),
              }}
            >
              <div className="bg-gray-900 text-white text-[11px] font-medium px-2.5 py-1 rounded-lg shadow-lg whitespace-nowrap">
                {hoveredLabel}
                {/* ── arrow kecil di bawah ── */}
                <div
                  className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0
                    border-l-[5px] border-r-[5px] border-t-[5px]
                    border-l-transparent border-r-transparent border-t-gray-900"
                  style={{
                    ...(tooltipX < 44
                      ? { left: '12px', transform: 'none' }
                      : tooltipX > (chartRef.current?.getBoundingClientRect().width || 200) - 44
                        ? { left: 'auto', right: '12px', transform: 'none' }
                        : {}),
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export default PremiumKPICard;
