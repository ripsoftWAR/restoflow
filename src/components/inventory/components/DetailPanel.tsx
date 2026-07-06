import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Package, MoreVertical, History, ArrowUpRight,
  ShoppingBag, Coins, TrendingUp, Calendar, Hash,
  ArrowDown, ArrowUp, Settings, Pencil, Trash2,
  Store, Phone, AlertTriangle, Layers, Truck, BarChart3,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Tooltip, ResponsiveContainer,
  LineChart, Line,
} from 'recharts';
import {
  Ingredient,
  MovementLog,
  pricePerBuyUnit,
  totalStockValue,
  formatStockWithBase,
} from '../../../types';
import { formatIDR } from '../utils/format';
import { resolveApiUrl } from '../../../utils/api';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */

interface DetailPanelProps {
  ingredient: Ingredient | null;
  movements: MovementLog[];
  onAdjust: () => void;
  onEdit: () => void;
  onDelete: () => void;
  globalDays?: number;
}

/* ═══════════════════════════════════════════════════════════════
   STATUS BADGE — solid colored, matching Pilot AI badge pattern
   ═══════════════════════════════════════════════════════════════ */

function StatusBadge({ ing }: { ing: Ingredient }) {
  if (ing.stock <= 0) {
    return (
      <span className="bg-pp-danger text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-pp-xs flex-shrink-0">
        Habis
      </span>
    );
  }
  if (ing.stock <= ing.min_stock) {
    return (
      <span className="bg-pp-warning text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-pp-xs flex-shrink-0">
        Kritis
      </span>
    );
  }
  if (ing.stock <= ing.min_stock * 1.5) {
    return (
      <span className="bg-pp-info text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-pp-xs flex-shrink-0">
        Akan Habis
      </span>
    );
  }
  return (
    <span className="bg-pp-success text-white text-[11px] font-semibold px-2.5 py-0.5 rounded-pp-xs flex-shrink-0">
      Aman
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CAPACITY PROGRESS BAR — gradient, rounded-full, "alive"
   ═══════════════════════════════════════════════════════════════ */

function CapacityBar({ ing }: { ing: Ingredient }) {
  const capacity = ing.storage_capacity;
  if (!capacity || capacity <= 0) return null;

  const pct = Math.min((ing.stock / capacity) * 100, 100);
  const isOver = ing.stock > capacity;

  const gradient = isOver
    ? 'bg-pp-danger'
    : pct > 80
      ? 'bg-gradient-to-r from-pp-warning to-pp-chart-orange'
      : 'bg-gradient-to-r from-pp-primary to-pp-chart-blue';

  const stockLabel = ing.buy_unit && ing.conversion_factor && ing.conversion_factor !== 1
    ? `${(ing.stock / ing.conversion_factor).toFixed(1).replace(/\.0$/, '')} / ${capacity} ${ing.storage_capacity_unit || ''}`
    : `${ing.stock} / ${capacity} ${ing.storage_capacity_unit || ing.base_unit}`;

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider">
          Kapasitas Penyimpanan
        </span>
        <span className={`text-[11px] font-bold tabular-nums ${
          isOver ? 'text-pp-danger' : pct > 80 ? 'text-pp-warning' : 'text-pp-text-secondary'
        }`}>
          {Math.round(pct)}%
        </span>
      </div>
      <div className="h-2.5 bg-pp-border-light rounded-full overflow-hidden shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)]">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out shadow-pp-xs ${gradient}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <p className="text-[10px] text-pp-text-muted mt-1.5 font-medium">
        {stockLabel}
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   KEBAB DROPDOWN — ⋮ menu di header
   ═══════════════════════════════════════════════════════════════ */

const MENU_OPTIONS = [
  { key: 'adjust', label: 'Adjust Stok', icon: ArrowUpRight, danger: false },
  { key: 'edit', label: 'Edit Bahan', icon: Pencil, danger: false },
  { key: 'delete', label: 'Hapus', icon: Trash2, danger: true },
] as const;

function KebabDropdown({
  onAdjust,
  onEdit,
  onDelete,
}: {
  onAdjust: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  const handleSelect = (key: string) => {
    setOpen(false);
    if (key === 'adjust') onAdjust();
    else if (key === 'edit') onEdit();
    else if (key === 'delete') onDelete();
  };

  return (
    <div className="relative inline-flex" ref={ref}>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        className="flex items-center justify-center w-8 h-8 rounded-pp-xs hover:bg-pp-bg transition cursor-pointer"
      >
        <MoreVertical size={17} strokeWidth={1.8} className="text-pp-text-muted" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="absolute top-full right-0 mt-1 z-[60] bg-pp-surface border border-pp-border rounded-pp-md shadow-pp-lg py-1 min-w-[155px]"
          >
            {MENU_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={(e) => { e.stopPropagation(); handleSelect(opt.key); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-[12px] transition-colors cursor-pointer ${
                  opt.danger
                    ? 'text-pp-danger hover:bg-pp-danger-soft'
                    : 'text-pp-text-secondary hover:bg-pp-bg'
                }`}
              >
                <opt.icon size={13.5} strokeWidth={1.8} />
                {opt.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MOVEMENT ROW — dipakai di tab Riwayat
   ═══════════════════════════════════════════════════════════════ */

function MovementRow({ m }: { m: MovementLog }) {
  const typeConfig = {
    IN: { icon: ArrowDown, bg: 'bg-pp-success-soft', text: 'text-pp-success', label: 'Masuk' },
    OUT: { icon: ArrowUp, bg: 'bg-pp-danger-soft', text: 'text-pp-danger', label: 'Keluar' },
    ADJUST: { icon: Settings, bg: 'bg-pp-primary-soft', text: 'text-pp-primary', label: 'Adjust' },
  };
  const cfg = typeConfig[m.type] || typeConfig.ADJUST;
  const Icon = cfg.icon;

  const dateStr = m.created_at
    ? new Date(m.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const amountStr = `${m.amount.toLocaleString('id-ID')} ${m.base_unit || ''}`;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-pp-border last:border-b-0">
      <div className={`w-7 h-7 rounded-pp-xs flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
        <Icon size={13} strokeWidth={2} className={cfg.text} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${cfg.text}`}>{cfg.label}</span>
          <span className="text-[12px] font-bold text-pp-text tabular-nums">{amountStr}</span>
        </div>
        {m.notes && (
          <p className="text-[11px] text-pp-text-muted truncate mt-0.5">{m.notes}</p>
        )}
      </div>
      <span className="text-[10px] text-pp-text-muted flex-shrink-0">{dateStr}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MINI USAGE CHART — line chart mini di header (2 garis: Masuk & Kontribusi)
   ═══════════════════════════════════════════════════════════════ */

interface MiniUsagePoint {
  date: string;
  total_out: number;
  total_in: number;
  unit: string;
}

function MiniUsageChart({
  ingredientId,
  globalDays,
}: {
  ingredientId: number;
  globalDays: number;
}) {
  const [days, setDays] = useState<7 | 30>(globalDays === 30 ? 30 : 7);
  const [data, setData] = useState<MiniUsagePoint[] | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUsage = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('restoflow_session_id');
      const res = await fetch(resolveApiUrl(`/api/ingredients/${ingredientId}/usage?days=${days}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed');
      const json: MiniUsagePoint[] = await res.json();
      setData(json);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [ingredientId, days]);

  useEffect(() => { fetchUsage(); }, [fetchUsage]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    return data.map(d => ({
      date: new Date(d.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      Masuk: d.total_in || 0,
      Kontribusi: d.total_out || 0,
      _raw: d,
    }));
  }, [data]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-[60px]">
        <span className="w-4 h-4 border-2 border-pp-primary/20 border-t-pp-primary rounded-full animate-spin" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center h-[60px]">
        <span className="text-[10px] text-pp-text-muted">—</span>
      </div>
    );
  }

  return (
    <div className="flex-1 min-w-0 relative" style={{ height: 60 }}>
      {/* Toggle 7h / 30h — pojok kanan atas */}
      <div className="absolute top-0 right-0 z-10 flex items-center bg-pp-bg rounded-pp-xs p-[2px]">
        {([7, 30] as const).map(d => (
          <button
            key={d}
            type="button"
            onClick={(e) => { e.stopPropagation(); setDays(d); }}
            className={`text-[10px] font-semibold px-1.5 py-[2px] rounded-[4px] transition-colors cursor-pointer leading-none ${
              days === d
                ? 'bg-pp-surface text-pp-primary shadow-sm'
                : 'text-pp-text-muted hover:text-pp-text-secondary'
            }`}
          >
            {d}h
          </button>
        ))}
      </div>

      {/* Chart */}
      <div
        className="w-full h-full"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 12%, black 88%, transparent 100%)',
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <Line
              type="monotone"
              dataKey="Masuk"
              stroke="var(--pp-chart-green)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#fff', stroke: 'var(--pp-chart-green)', strokeWidth: 2 }}
            />
            <Line
              type="monotone"
              dataKey="Kontribusi"
              stroke="#EC4899"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 3, fill: '#fff', stroke: '#EC4899', strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════ */

function EmptyState() {
  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-8 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-pp-sm bg-pp-bg flex items-center justify-center mb-4">
        <Package size={22} className="text-pp-text-muted" />
      </div>
      <p className="text-[14px] font-semibold text-pp-text-muted mb-1">Pilih Bahan</p>
      <p className="text-[12px] text-pp-text-muted text-center max-w-[220px] leading-relaxed">
        Klik bahan dari daftar di sebelah kiri untuk melihat detail.
      </p>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — SINGLE CARD, DIVIDERS BETWEEN SECTIONS
   ═══════════════════════════════════════════════════════════════ */

export default function DetailPanel({
  ingredient,
  movements,
  onAdjust,
  onEdit,
  onDelete,
  globalDays = 7,
}: DetailPanelProps) {
  if (!ingredient) return <EmptyState />;

  const ingredientMovements = useMemo(
    () => movements.filter(m => m.ingredient_id === ingredient.id),
    [movements, ingredient.id],
  );

  const sortedMovements = useMemo(
    () => [...ingredientMovements].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [ingredientMovements],
  );

  const inMovements = useMemo(
    () => ingredientMovements.filter(m => m.type === 'IN'),
    [ingredientMovements],
  );

  const [infoTab, setInfoTab] = useState<'overview' | 'pergerakan' | 'pembelian' | 'supplier' | 'mutasi'>('overview');

  const { display: stockDisplay, baseEquivalent } = formatStockWithBase(ingredient);
  const buyPrice = pricePerBuyUnit(ingredient);
  const totalVal = totalStockValue(ingredient);

  /* ── Parse big number & unit ── */
  const stockParts = stockDisplay.includes(' ') ? stockDisplay.split(' ') : [stockDisplay, ''];
  const bigNumber = stockParts[0];
  const bigUnit = stockParts.slice(1).join(' ');

  /* ── Min stock dalam buy unit ── */
  const minStockBuy = ingredient.conversion_factor && ingredient.conversion_factor !== 1
    ? ingredient.min_stock / ingredient.conversion_factor
    : ingredient.min_stock;
  const minStockLabel = ingredient.buy_unit || ingredient.base_unit;
  const minStockDisplay = Number.isInteger(minStockBuy)
    ? minStockBuy.toString()
    : minStockBuy.toFixed(1);

  /* ── Reorder point display — 0/null = "Belum diatur" ── */
  const reorderDisplay = ingredient.reorder_point != null && ingredient.reorder_point > 0
    ? `${ingredient.reorder_point.toLocaleString('id-ID')} ${ingredient.base_unit}`
    : null;

  /* ── Harga per buy unit display ── */
  const buyUnitLabel = ingredient.buy_unit || ingredient.base_unit;
  const hargaDisplay = ingredient.buy_unit && ingredient.conversion_factor && ingredient.conversion_factor !== 1
    ? `Rp ${formatIDR(buyPrice)}`
    : `Rp ${formatIDR(ingredient.unit_price)}`;

  /* ── Dates ── */
  const updatedDisplay = ingredient.updated_at
    ? new Date(ingredient.updated_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      })
    : '—';

  const createdDisplay = ingredient.created_at
    ? new Date(ingredient.created_at).toLocaleDateString('id-ID', {
        day: 'numeric', month: 'short', year: 'numeric',
      })
    : '—';

  /* ── Status determiner ── */
  const isLow = ingredient.stock <= ingredient.min_stock;
  const daysLeft = ingredient.stock > 0
    ? Math.max(1, Math.ceil(ingredient.stock / Math.max(0.1, (ingredientMovements
        .filter(m => m.type === 'OUT')
        .reduce((s, m) => s + (Number(m.amount) || 0), 0) / Math.max(1, ingredientMovements.filter(m => m.type === 'OUT').length)
      ))))
    : 0;

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */
  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg overflow-hidden">

      {/* ═══════════════════════════════════════════
          SECTION 1 — HERO: Identity + Stock
          ═══════════════════════════════════════════ */}
      <div className="px-6 pt-5 pb-4">

        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-pp-sm bg-pp-primary flex items-center justify-center shadow-pp-brand flex-shrink-0">
            <Package size={18} className="text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[17px] font-bold text-pp-text leading-tight tracking-[-0.02em] truncate">
              {ingredient.name}
            </h3>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {ingredient.sku && (
                <span className="text-[11px] text-pp-text-muted font-mono tracking-wide">
                  {ingredient.sku}
                </span>
              )}
              {ingredient.category && (
                <>
                  {ingredient.sku && (
                    <span className="text-pp-text-placeholder text-[10px]">•</span>
                  )}
                  <span className="text-[11px] text-pp-text-muted font-medium">
                    {ingredient.category}
                  </span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <StatusBadge ing={ingredient} />
            <KebabDropdown onAdjust={onAdjust} onEdit={onEdit} onDelete={onDelete} />
          </div>
        </div>

        {/* ── BIG STOCK NUMBER + MINI CHART ── */}
        <div className="mt-5 flex items-center gap-4">
          <div className="flex-shrink-0">
            <div className="flex items-baseline gap-2">
              <span className="text-[36px] font-extrabold tracking-[-0.04em] text-pp-text tabular-nums leading-none">
                {bigNumber}
              </span>
              <span className="text-[16px] text-pp-text-secondary font-semibold">
                {bigUnit}
              </span>
            </div>
            {baseEquivalent && (
              <p className="text-[12px] text-pp-text-muted mt-1 ml-0.5">
                {baseEquivalent}
              </p>
            )}
          </div>
          <MiniUsageChart ingredientId={ingredient.id} globalDays={globalDays} />
        </div>

        {/* ── PROGRESS BAR ── */}
        <CapacityBar ing={ingredient} />
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 1.5 — KPI CARDS ROW (4 cards)
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-3 px-5 pb-4">
        {/* KPI 1: Stok Saat Ini */}
        <div className="border border-pp-border rounded-pp-md p-3">
          <div className={`w-8 h-8 rounded-pp-xs flex items-center justify-center mb-2.5 ${
            isLow ? 'bg-pp-danger-soft' : 'bg-pp-primary-soft'
          }`}>
            <Package size={14} strokeWidth={2} className={isLow ? 'text-pp-danger' : 'text-pp-primary'} />
          </div>
          <p className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider">Stok Saat Ini</p>
          <p className="text-[15px] font-bold text-pp-text mt-0.5 tabular-nums leading-tight">
            {bigNumber} <span className="text-[12px] font-medium text-pp-text-secondary">{bigUnit}</span>
          </p>
          <p className={`text-[10px] mt-1 ${isLow ? 'text-pp-warning font-semibold' : 'text-pp-text-muted'}`}>
            {isLow ? '⚠ Di bawah minimum' : 'Stok mencukupi'}
          </p>
        </div>

        {/* KPI 2: Nilai Persediaan */}
        <div className="border border-pp-border rounded-pp-md p-3">
          <div className="w-8 h-8 rounded-pp-xs bg-pp-primary-soft flex items-center justify-center mb-2.5">
            <Coins size={14} strokeWidth={2} className="text-pp-primary" />
          </div>
          <p className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider">Nilai Persediaan</p>
          <p className="text-[15px] font-bold text-pp-text mt-0.5 tabular-nums leading-tight">
            Rp {formatIDR(totalVal)}
          </p>
          <p className="text-[10px] text-pp-text-muted mt-1">Berdasarkan harga terakhir</p>
        </div>

        {/* KPI 3: Minimum Stok */}
        <div className="border border-pp-border rounded-pp-md p-3">
          <div className="w-8 h-8 rounded-pp-xs bg-pp-warning-soft flex items-center justify-center mb-2.5">
            <AlertTriangle size={14} strokeWidth={2} className="text-pp-warning" />
          </div>
          <p className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider">Minimum Stok</p>
          <p className="text-[15px] font-bold text-pp-text mt-0.5 tabular-nums leading-tight">
            {minStockDisplay} <span className="text-[12px] font-medium text-pp-text-secondary">{minStockLabel}</span>
          </p>
          <p className="text-[10px] text-pp-text-muted mt-1">Batas aman gudang</p>
        </div>

        {/* KPI 4: Harga Rata-rata */}
        <div className="border border-pp-border rounded-pp-md p-3">
          <div className="w-8 h-8 rounded-pp-xs bg-pp-success-soft flex items-center justify-center mb-2.5">
            <TrendingUp size={14} strokeWidth={2} className="text-pp-success" />
          </div>
          <p className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider">Harga/{buyUnitLabel}</p>
          <p className="text-[15px] font-bold text-pp-text mt-0.5 tabular-nums leading-tight">
            {hargaDisplay}
          </p>
          <p className="text-[10px] text-pp-text-muted mt-1">
            Harga pembelian terbaru
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          DIVIDER
          ═══════════════════════════════════════════ */}
      <div className="border-b border-pp-border" />

      {/* ═══════════════════════════════════════════
          SECTION 2 — Min Stock + Reorder (2 col)
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-2 divide-x divide-pp-border">
        <div className="px-6 py-4">
          <span className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider">
            Min. Stok
          </span>
          <p className="text-[16px] font-bold text-pp-text mt-1 tabular-nums leading-tight">
            {minStockDisplay}{' '}
            <span className="text-[13px] font-medium text-pp-text-secondary">
              {minStockLabel}
            </span>
          </p>
        </div>
        <div className="px-6 py-4">
          <span className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider">
            Reorder Point
          </span>
          <p className="text-[16px] font-bold text-pp-text mt-1 tabular-nums leading-tight">
            {reorderDisplay ? (
              reorderDisplay
            ) : (
              <span className="text-[13px] font-normal text-pp-text-muted italic">
                Belum diatur
              </span>
            )}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          DIVIDER
          ═══════════════════════════════════════════ */}
      <div className="border-b border-pp-border" />

      {/* ═══════════════════════════════════════════
          TAB SWITCHER — Underline style (5 tabs)
          ═══════════════════════════════════════════ */}
      <div className="px-6 pt-3">
        <div className="flex items-center border-b border-pp-border overflow-x-auto no-scrollbar">
          {([
            { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { key: 'pergerakan' as const, label: 'Riwayat Pergerakan', icon: Layers },
            { key: 'pembelian' as const, label: 'Riwayat Pembelian', icon: ShoppingBag },
            { key: 'supplier' as const, label: 'Supplier', icon: Truck },
            { key: 'mutasi' as const, label: 'Mutasi Stok', icon: ArrowUpRight },
          ]).map(({ key, label }) => {
            const active = infoTab === key;
            const badge = key === 'pergerakan' && ingredientMovements.length > 0
              ? ingredientMovements.length
              : key === 'pembelian' && inMovements.length > 0
                ? inMovements.length
                : null;
            return (
              <button
                key={key}
                onClick={() => setInfoTab(key)}
                className={`relative px-3.5 pb-2.5 pt-1 text-[12px] font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'text-pp-primary'
                    : 'text-pp-text-muted hover:text-pp-text-secondary'
                }`}
              >
                {label}
                {badge != null && (
                  <span className={`ml-1.5 text-[10px] font-medium ${
                    active ? 'text-pp-primary/70' : 'text-pp-text-placeholder'
                  }`}>
                    {badge}
                  </span>
                )}
                {active && (
                  <motion.span
                    layoutId="tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-pp-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 33 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TAB CONTENT — 5 tabs
          ═══════════════════════════════════════════ */}
      <AnimatePresence mode="wait">
        {infoTab === 'overview' ? (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.15 }}
            className="px-6 py-4"
          >
            {/* ── Insight strip ── */}
            <div className="flex items-center gap-2 text-[12px] text-pp-text-secondary">
              <span className="text-[15px]">💡</span>
              <span>
                {isLow ? (
                  <>
                    <b className="text-pp-text">{ingredient.name}</b> diperkirakan habis dalam{' '}
                    <span className="text-pp-danger font-semibold">{daysLeft} hari</span>{' '}
                    dengan stok di bawah minimum.
                  </>
                ) : (
                  <>
                    Stok <b className="text-pp-text">{ingredient.name}</b> dalam kondisi{' '}
                    <span className="text-pp-success font-semibold">aman</span> —{' '}
                    {bigNumber} {bigUnit} tersedia.
                  </>
                )}
              </span>
            </div>
          </motion.div>

        ) : infoTab === 'pergerakan' ? (

          <motion.div
            key="pergerakan"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.15 }}
            className="px-6 py-4"
          >
            {ingredientMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2.5 text-center">
                <div className="w-9 h-9 rounded-pp-sm bg-pp-bg flex items-center justify-center">
                  <History size={16} className="text-pp-text-muted" />
                </div>
                <p className="text-[12px] text-pp-text-muted">Belum ada riwayat pergerakan</p>
              </div>
            ) : (
              <div className="max-h-[240px] overflow-y-auto -mx-1 px-1">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-pp-text-muted sticky top-0 bg-pp-surface z-10">
                      <th className="font-medium py-1.5 pr-2 whitespace-nowrap">Tanggal</th>
                      <th className="font-medium py-1.5 px-1.5 whitespace-nowrap">Jenis</th>
                      <th className="font-medium py-1.5 px-1.5 whitespace-nowrap">Referensi</th>
                      <th className="font-medium py-1.5 px-1.5 text-right whitespace-nowrap">Masuk</th>
                      <th className="font-medium py-1.5 px-1.5 text-right whitespace-nowrap">Keluar</th>
                      <th className="font-medium py-1.5 pl-1.5 text-right whitespace-nowrap">Sisa</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pp-border">
                    {sortedMovements.map((m) => {
                      const dateStr = m.created_at
                        ? new Date(m.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short',
                          })
                        : '—';
                      const unit = m.base_unit || '';
                      return (
                        <tr key={m.id} className="hover:bg-pp-bg/50 transition-colors">
                          <td className="py-2 pr-2 text-pp-text-muted whitespace-nowrap">{dateStr}</td>
                          <td className="py-2 px-1.5">
                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-pp-xs text-[10px] font-semibold ${
                              m.type === 'IN'
                                ? 'bg-pp-success-soft text-pp-success'
                                : m.type === 'OUT'
                                  ? 'bg-pp-warning-soft text-pp-warning'
                                  : 'bg-pp-primary-soft text-pp-primary'
                            }`}>
                              {m.type === 'IN' ? 'Masuk' : m.type === 'OUT' ? 'Keluar' : 'Adjust'}
                            </span>
                          </td>
                          <td className="py-2 px-1.5 text-pp-text-muted font-mono text-[10px] whitespace-nowrap max-w-[80px] truncate">
                            {m.notes || '—'}
                          </td>
                          <td className="py-2 px-1.5 text-right tabular-nums font-medium whitespace-nowrap">
                            {m.type === 'IN' ? (
                              <span className="text-pp-success">+{m.amount.toLocaleString('id-ID')} {unit}</span>
                            ) : (
                              <span className="text-pp-text-placeholder">—</span>
                            )}
                          </td>
                          <td className="py-2 px-1.5 text-right tabular-nums font-medium whitespace-nowrap">
                            {m.type === 'OUT' ? (
                              <span className="text-pp-warning">-{m.amount.toLocaleString('id-ID')} {unit}</span>
                            ) : (
                              <span className="text-pp-text-placeholder">—</span>
                            )}
                          </td>
                          <td className="py-2 pl-1.5 text-right tabular-nums font-semibold text-pp-text whitespace-nowrap">
                            {m.balance?.toLocaleString('id-ID') ?? '—'} {unit}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

        ) : infoTab === 'pembelian' ? (

          <motion.div
            key="pembelian"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.15 }}
            className="px-6 py-4"
          >
            {inMovements.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 gap-2.5 text-center">
                <div className="w-9 h-9 rounded-pp-sm bg-pp-bg flex items-center justify-center">
                  <ShoppingBag size={16} className="text-pp-text-muted" />
                </div>
                <p className="text-[12px] text-pp-text-muted">Belum ada riwayat pembelian</p>
              </div>
            ) : (
              <div className="max-h-[240px] overflow-y-auto -mx-1 px-1">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="text-pp-text-muted sticky top-0 bg-pp-surface z-10">
                      <th className="font-medium py-1.5 pr-2 whitespace-nowrap">Tanggal</th>
                      <th className="font-medium py-1.5 px-1.5 whitespace-nowrap">Supplier</th>
                      <th className="font-medium py-1.5 px-1.5 text-right whitespace-nowrap">Qty</th>
                      <th className="font-medium py-1.5 px-1.5 text-right whitespace-nowrap">Harga Satuan</th>
                      <th className="font-medium py-1.5 pl-1.5 text-right whitespace-nowrap">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-pp-border">
                    {inMovements.slice(0, 20).map((m) => {
                      const dateStr = m.created_at
                        ? new Date(m.created_at).toLocaleDateString('id-ID', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })
                        : '—';
                      const unit = m.base_unit || '';
                      const unitPrice = m.unit_price || ingredient.unit_price;
                      const total = (m.amount || 0) * unitPrice;
                      return (
                        <tr key={m.id} className="hover:bg-pp-bg/50 transition-colors">
                          <td className="py-2 pr-2 text-pp-text-muted whitespace-nowrap">{dateStr}</td>
                          <td className="py-2 px-1.5 text-pp-text-secondary whitespace-nowrap truncate max-w-[120px]">
                            {ingredient.supplier || '—'}
                          </td>
                          <td className="py-2 px-1.5 text-right tabular-nums font-medium whitespace-nowrap">
                            {m.amount.toLocaleString('id-ID')} {unit}
                          </td>
                          <td className="py-2 px-1.5 text-right tabular-nums text-pp-text-secondary whitespace-nowrap">
                            Rp {formatIDR(unitPrice)}
                          </td>
                          <td className="py-2 pl-1.5 text-right tabular-nums font-semibold text-pp-text whitespace-nowrap">
                            Rp {formatIDR(total)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>

        ) : infoTab === 'mutasi' ? (

          <motion.div
            key="mutasi"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.15 }}
            className="px-6 py-4"
          >
            <div className="flex flex-col items-center justify-center py-8 gap-2.5 text-center border border-dashed border-pp-border rounded-pp-md">
              <div className="w-9 h-9 rounded-pp-sm bg-pp-bg flex items-center justify-center">
                <ArrowUpRight size={16} className="text-pp-text-muted" />
              </div>
              <p className="text-[12px] font-medium text-pp-text-muted">Belum ada mutasi stok antar outlet</p>
              <p className="text-[11px] text-pp-text-placeholder max-w-[240px]">
                Mutasi stok antar outlet akan muncul di sini setelah fitur multi-outlet diaktifkan.
              </p>
            </div>
          </motion.div>

        ) : (
          /* ═══════════ TAB SUPPLIER ═══════════ */
          <motion.div
            key="supplier"
            initial={{ opacity: 0, y: 2 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -2 }}
            transition={{ duration: 0.15 }}
            className="px-6 py-4"
          >
            {ingredient.supplier ? (
              <div className="space-y-3.5">
                {/* ── Nama Supplier ── */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-pp-sm bg-pp-primary-soft flex items-center justify-center flex-shrink-0">
                    <Store size={17} strokeWidth={1.8} className="text-pp-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-bold text-pp-text truncate">
                      {ingredient.supplier}
                    </p>
                    <p className="text-[11px] text-pp-text-muted">
                      Supplier utama untuk {ingredient.name}
                    </p>
                  </div>
                </div>

                {/* ── Info grid ── */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 bg-pp-bg rounded-pp-md p-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-pp-text-muted">Kategori</span>
                    <span className="text-[12px] font-semibold text-pp-text">{ingredient.category || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-pp-text-muted">Lokasi</span>
                    <span className="text-[12px] font-semibold text-pp-text">{ingredient.supplier || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-pp-text-muted">Harga/{buyUnitLabel}</span>
                    <span className="text-[12px] font-semibold text-pp-text tabular-nums">{hargaDisplay}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-pp-text-muted">Status</span>
                    <span className="text-[12px] font-semibold text-pp-success">Aktif</span>
                  </div>
                </div>

                {/* Placeholder info */}
                <div className="bg-pp-warning-soft border border-pp-warning/20 rounded-pp-sm px-3 py-2.5 flex items-start gap-2">
                  <Phone size={13} strokeWidth={1.5} className="text-pp-warning mt-0.5 flex-shrink-0" />
                  <p className="text-[11px] text-pp-warning leading-relaxed">
                    Info kontak supplier belum tersedia. Gunakan fitur <strong>Chat AI</strong> atau edit bahan untuk menambahkan detail.
                  </p>
                </div>

                {/* ── Riwayat Pembelian ringkas ── */}
                {inMovements.length > 0 && (
                  <div>
                    <h5 className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider mb-2">
                      Pembelian Terakhir
                    </h5>
                    <div className="max-h-[120px] overflow-y-auto">
                      {inMovements.slice(0, 10).map((m, i) => (
                        <div key={m.id || i} className="flex items-center justify-between py-1.5 border-b border-pp-border/50 last:border-b-0">
                          <div className="flex items-center gap-2">
                            <ArrowDown size={12} strokeWidth={2.5} className="text-pp-success" />
                            <span className="text-[12px] font-semibold text-pp-text tabular-nums">
                              +{m.amount.toLocaleString('id-ID')} {m.base_unit || ''}
                            </span>
                          </div>
                          <span className="text-[10px] text-pp-text-muted">
                            {m.created_at
                              ? new Date(m.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric', month: 'short', year: 'numeric',
                                })
                              : '—'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 gap-2.5 text-center">
                <div className="w-10 h-10 rounded-pp-sm bg-pp-bg flex items-center justify-center">
                  <Store size={18} className="text-pp-text-muted" />
                </div>
                <div>
                  <p className="text-[13px] font-medium text-pp-text-muted">Supplier belum diisi</p>
                  <p className="text-[11px] text-pp-text-placeholder mt-0.5">
                    Edit bahan untuk menambahkan nama supplier
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
