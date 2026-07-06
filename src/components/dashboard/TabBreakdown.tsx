import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import type { Sale, RecipeWithDetails, Ingredient } from '../../types';
import { formatIDRCompact } from './shared/utils';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const formatIDRFull = (num: number) =>
  `Rp${Math.round(num).toLocaleString('id-ID')}`;

const CAT_COLORS = [
  'var(--pp-chart-blue)',
  'var(--pp-chart-green)',
  'var(--pp-chart-purple)',
  'var(--pp-chart-orange)',
  '#E11D48',
  '#0891B2',
  '#D946EF',
  '#84CC16',
  '#F59E0B',
  '#6366F1',
];

const SHIFT_DEFS = [
  { label: '🌅 Pagi (06–11)', start: 6, end: 11, color: '#F59E0B', bg: '#FFFBEB' },
  { label: '☀️ Siang (11–17)', start: 11, end: 17, color: '#2563EB', bg: '#EFF6FF' },
  { label: '🌙 Malam (17–24)', start: 17, end: 24, color: '#7C3AED', bg: '#F5F3FF' },
];

/* ═══════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sales: Sale[];
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  dateRangeLabel: string;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

/** Parse jam dari ISO string (0-23), return -1 jika invalid */
function extractHour(isoString?: string): number {
  if (!isoString) return -1;
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return -1;
    return d.getHours();
  } catch {
    return -1;
  }
}

/** Build map: menu_name → category dari recipes */
function buildCategoryMap(recipes: RecipeWithDetails[]): Map<string, string> {
  const map = new Map<string, string>();
  recipes.forEach(r => {
    const name = (r.menu_name || '').trim();
    const cat = (r.category || '').trim();
    if (name && cat) map.set(name.toLowerCase(), cat);
  });
  return map;
}

/** Build map: menu_name → estimated cost (HPP) dari recipes + ingredients */
function buildHPPMap(
  recipes: RecipeWithDetails[],
  ingredients: Ingredient[],
): Map<string, number> {
  const ingPriceMap = new Map<number, number>();
  ingredients.forEach(ing => {
    ingPriceMap.set(ing.id, Number(ing.unit_price) || 0);
  });

  const hppMap = new Map<string, number>();
  recipes.forEach(r => {
    const name = (r.menu_name || '').trim().toLowerCase();
    if (!name) return;
    let totalCost = 0;
    (r.items || []).forEach(item => {
      const price = ingPriceMap.get(item.ingredient_id) || 0;
      totalCost += price * (Number(item.amount) || 0);
    });
    hppMap.set(name, totalCost);
  });
  return hppMap;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */

export default function TabBreakdown({ sales, recipes, ingredients, dateRangeLabel }: Props) {
  /* ── Category map ─────────────────────────── */
  const catMap = useMemo(() => buildCategoryMap(recipes), [recipes]);
  const hppMap = useMemo(() => buildHPPMap(recipes, ingredients), [recipes, ingredients]);

  /* ── Category aggregation ─────────────────── */
  const categoryData = useMemo(() => {
    const agg: Record<string, number> = {};
    let matched = 0;
    let unmatched = 0;

    sales.forEach(s => {
      const menuKey = (s.menu_name || '').trim().toLowerCase();
      const cat = catMap.get(menuKey);
      const revenue = Number(s.total_price) || 0;
      if (cat) {
        agg[cat] = (agg[cat] || 0) + revenue;
        matched++;
      } else {
        agg['Lainnya'] = (agg['Lainnya'] || 0) + revenue;
        unmatched++;
      }
    });

    const matchRate = matched + unmatched > 0
      ? Math.round((matched / (matched + unmatched)) * 100)
      : 0;

    const list = Object.entries(agg)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const total = list.reduce((sum, i) => sum + i.value, 0);

    console.log(
      `[TabBreakdown] Category match rate: ${matchRate}% ` +
      `(${matched} matched, ${unmatched} unmatched → "Lainnya")`
    );

    return { list, total, matchRate };
  }, [sales, catMap]);

  /* ── Payment method aggregation ───────────── */
  const paymentData = useMemo(() => {
    const agg: Record<string, { revenue: number; tx: number }> = {};
    sales.forEach(s => {
      const method = s.payment_method || 'CASH';
      if (!agg[method]) agg[method] = { revenue: 0, tx: 0 };
      agg[method].revenue += Number(s.total_price) || 0;
      agg[method].tx += 1;
    });
    const total = Object.values(agg).reduce((s, v) => s + v.revenue, 0);
    const list = Object.entries(agg)
      .map(([method, data]) => ({ method, ...data }))
      .sort((a, b) => b.revenue - a.revenue);
    return { list, total };
  }, [sales]);

  /* ── Top menu aggregation ─────────────────── */
  const topMenuData = useMemo(() => {
    const agg: Record<string, number> = {};
    sales.forEach(s => {
      const name = (s.menu_name || 'Tanpa Nama').trim();
      agg[name] = (agg[name] || 0) + (Number(s.total_price) || 0);
    });
    return Object.entries(agg)
      .map(([name, revenue]) => ({ name, revenue }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 15);
  }, [sales]);

  const maxMenuRevenue = topMenuData[0]?.revenue || 1;

  /* ── Shift/hour aggregation ───────────────── */
  const shiftData = useMemo(() => {
    const buckets = SHIFT_DEFS.map(def => ({
      label: def.label,
      revenue: 0,
      tx: 0,
      color: def.color,
      bg: def.bg,
    }));

    let hasData = false;
    sales.forEach(s => {
      const h = extractHour(s.created_at);
      if (h < 0) return;
      hasData = true;
      for (let i = 0; i < SHIFT_DEFS.length; i++) {
        if (h >= SHIFT_DEFS[i].start && h < SHIFT_DEFS[i].end) {
          buckets[i].revenue += Number(s.total_price) || 0;
          buckets[i].tx += 1;
          break;
        }
      }
    });

    const total = buckets.reduce((s, b) => s + b.revenue, 0);
    return { buckets, total, hasData };
  }, [sales]);

  /* ── HPP / Margin ──────────────────────────── */
  const marginData = useMemo(() => {
    const agg: Record<string, { revenue: number; hpp: number }> = {};
    sales.forEach(s => {
      const name = (s.menu_name || 'Tanpa Nama').trim();
      if (!agg[name]) agg[name] = { revenue: 0, hpp: 0 };
      agg[name].revenue += Number(s.total_price) || 0;
    });

    // Attach HPP
    Object.keys(agg).forEach(name => {
      const key = name.toLowerCase();
      const unitHpp = hppMap.get(key) || 0;
      // Hitung berapa kali menu ini dijual
      const count = sales.filter(s => (s.menu_name || '').trim() === name).length;
      agg[name].hpp = unitHpp * count;
    });

    return Object.entries(agg)
      .map(([name, d]) => ({
        name,
        revenue: d.revenue,
        hpp: d.hpp,
        margin: d.revenue - d.hpp,
        marginPct: d.revenue > 0 ? Math.round(((d.revenue - d.hpp) / d.revenue) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 12);
  }, [sales, hppMap]);

  const totalMarginRevenue = useMemo(
    () => marginData.reduce((s, i) => s + i.revenue, 0),
    [marginData],
  );

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ═══════════════════════════════════════════
          ROW 1: OMSET PER KATEGORI + METODE BAYAR
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-[1fr_1fr] gap-5 max-[900px]:grid-cols-1">

        {/* ── SECTION: Omset per Kategori ──────────── */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="mb-4">
            <div className="text-[15.5px] font-bold text-pp-text">Omset per Kategori</div>
            <div className="text-[12px] text-pp-text-muted mt-0.5">{dateRangeLabel}</div>
            {/* Match rate badge */}
            {categoryData.matchRate < 100 && (
              <div className="inline-flex items-center gap-1 mt-1.5 text-[10.5px] font-medium text-pp-warning bg-pp-warning-soft border border-pp-warning-border px-2 py-0.5 rounded-full">
                ⚠️ {categoryData.matchRate}% menu terpetakan — {(100 - categoryData.matchRate)}% dikelompokkan "Lainnya"
              </div>
            )}
          </div>

          {categoryData.list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-[32px]">📂</span>
              <p className="text-[13px] text-pp-text-muted">Belum ada data kategori</p>
            </div>
          ) : (
            <div className="flex items-center gap-5">
              {/* Donut */}
              <div className="w-[140px] h-[140px] flex-shrink-0 relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData.list}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={62}
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {categoryData.list.map((_, i) => (
                        <Cell key={i} fill={CAT_COLORS[i % CAT_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (!active || !payload?.[0]) return null;
                        const d = payload[0].payload;
                        const pct = categoryData.total > 0
                          ? Math.round((d.value / categoryData.total) * 100)
                          : 0;
                        return (
                          <div className="bg-[#1B2436] text-white px-3 py-2 rounded-[10px] text-[12px]">
                            <div className="font-semibold">{d.name}</div>
                            <div className="text-[#B9C1D9]">{formatIDRCompact(d.value)} · {pct}%</div>
                          </div>
                        );
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                {/* Center label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] text-pp-text-muted leading-tight">Total</span>
                  <span className="text-[13px] font-bold text-pp-text leading-tight tabular-nums">
                    {formatIDRCompact(categoryData.total)}
                  </span>
                </div>
              </div>

              {/* Legend list */}
              <div className="flex-1 min-w-0 space-y-2">
                {categoryData.list.map((item, i) => {
                  const pct = categoryData.total > 0
                    ? Math.round((item.value / categoryData.total) * 100)
                    : 0;
                  return (
                    <div key={item.name} className="flex items-center gap-2.5">
                      <span
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CAT_COLORS[i % CAT_COLORS.length] }}
                      />
                      <span className="text-[12.5px] text-pp-text flex-1 truncate">{item.name}</span>
                      <span className="text-[11.5px] font-semibold text-pp-text tabular-nums ml-auto">
                        {pct}%
                      </span>
                      <span className="text-[11px] text-pp-text-muted tabular-nums w-[70px] text-right">
                        {formatIDRCompact(item.value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── SECTION: Metode Pembayaran ──────────── */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="mb-4">
            <div className="text-[15.5px] font-bold text-pp-text">Metode Pembayaran</div>
            <div className="text-[12px] text-pp-text-muted mt-0.5">{dateRangeLabel}</div>
          </div>

          {paymentData.list.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-[32px]">💳</span>
              <p className="text-[13px] text-pp-text-muted">Belum ada data pembayaran</p>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentData.list.map(pm => {
                const pct = paymentData.total > 0
                  ? Math.round((pm.revenue / paymentData.total) * 100)
                  : 0;
                const isCash = pm.method === 'CASH';
                const icon = isCash ? '💵' : '📱';
                const color = isCash ? 'var(--pp-chart-green)' : 'var(--pp-chart-blue)';
                const softBg = isCash ? 'var(--pp-success-soft)' : 'var(--pp-primary-soft)';

                return (
                  <div
                    key={pm.method}
                    className="border border-pp-border-light rounded-pp-md p-4"
                    style={{ backgroundColor: softBg }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{icon}</span>
                        <div>
                          <div className="text-[13px] font-semibold text-pp-text">{pm.method}</div>
                          <div className="text-[11px] text-pp-text-muted">{pm.tx} transaksi</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[16px] font-bold text-pp-text tabular-nums">
                          {formatIDRCompact(pm.revenue)}
                        </div>
                        <div className="text-[12px] font-semibold" style={{ color }}>
                          {pct}%
                        </div>
                      </div>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-pp-border-light rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          ROW 2: TOP MENU BAR CHART (full width)
          ═══════════════════════════════════════════ */}
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
        <div className="mb-4">
          <div className="text-[15.5px] font-bold text-pp-text">Top Menu</div>
          <div className="text-[12px] text-pp-text-muted mt-0.5">
            {dateRangeLabel} · {topMenuData.length} menu teratas
          </div>
        </div>

        {topMenuData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-[32px]">🍽️</span>
            <p className="text-[13px] text-pp-text-muted">Belum ada data penjualan</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {topMenuData.map((item, i) => {
              const barW = Math.max(2, Math.round((item.revenue / maxMenuRevenue) * 100));
              // Gradient dari solid pp-primary ke lebih terang sesuai rank
              const alpha = 1 - i * 0.045;
              const barColor = `rgba(37, 99, 235, ${alpha.toFixed(2)})`;
              const isTop = i === 0;

              return (
                <div key={item.name} className="flex items-center gap-3">
                  {/* Rank + Name */}
                  <div className="w-[150px] flex-shrink-0 flex items-center gap-2 min-w-0">
                    <span className={`text-[12px] font-bold tabular-nums w-[18px] ${
                      isTop ? 'text-pp-primary' : 'text-pp-text-muted'
                    }`}>
                      {i + 1}
                    </span>
                    <span className={`text-[12.5px] truncate ${
                      isTop ? 'font-semibold text-pp-text' : 'text-pp-text-secondary'
                    }`}>
                      {item.name}
                    </span>
                  </div>

                  {/* Bar */}
                  <div className="flex-1 h-[22px] bg-pp-bg rounded-pp-xs overflow-hidden relative">
                    <div
                      className="h-full rounded-pp-xs transition-all duration-500 flex items-center pl-2"
                      style={{
                        width: `${barW}%`,
                        backgroundColor: barColor,
                        minWidth: barW > 0 ? '2px' : 0,
                      }}
                    >
                      {barW > 18 && (
                        <span className="text-[10px] font-semibold text-white/90 whitespace-nowrap">
                          {Math.round((item.revenue / maxMenuRevenue) * 100)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Value */}
                  <span className="text-[13px] font-semibold text-pp-text tabular-nums w-[90px] text-right flex-shrink-0">
                    {formatIDRCompact(item.revenue)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          ROW 3: BREAKDOWN JAM + ESTIMASI MARGIN
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-[1fr_1fr] gap-5 max-[900px]:grid-cols-1">

        {/* ── SECTION: Breakdown per Jam/Shift ─────── */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="mb-4">
            <div className="text-[15.5px] font-bold text-pp-text">Breakdown per Jam</div>
            <div className="text-[12px] text-pp-text-muted mt-0.5">
              {dateRangeLabel} · pembagian shift otomatis
            </div>
          </div>

          {!shiftData.hasData ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-[32px]">🕐</span>
              <p className="text-[13px] text-pp-text-muted">Data tidak memiliki info jam</p>
            </div>
          ) : (
            <div className="space-y-3">
              {shiftData.buckets.map(bucket => {
                const pct = shiftData.total > 0
                  ? Math.round((bucket.revenue / shiftData.total) * 100)
                  : 0;
                const barW = Math.max(2, pct);

                return (
                  <div
                    key={bucket.label}
                    className="border border-pp-border-light rounded-pp-md p-4"
                    style={{ backgroundColor: bucket.bg }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-[13px] font-semibold text-pp-text">{bucket.label}</div>
                      <div className="text-[11px] text-pp-text-muted">{bucket.tx} tx</div>
                    </div>

                    {/* Mini bar */}
                    <div className="h-2 bg-white/60 rounded-full overflow-hidden mb-2">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${barW}%`, backgroundColor: bucket.color }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-pp-text-muted">{pct}% dari total</span>
                      <span className="text-[13px] font-bold text-pp-text tabular-nums">
                        {formatIDRCompact(bucket.revenue)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── SECTION: Estimasi Margin / HPP ───────── */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="mb-1">
            <div className="text-[15.5px] font-bold text-pp-text">Estimasi Margin</div>
            <div className="text-[12px] text-pp-text-muted mt-0.5">{dateRangeLabel}</div>
            <p className="text-[10.5px] text-pp-text-muted mt-1 italic leading-relaxed">
              Estimasi dari biaya bahan baku saja, belum termasuk biaya operasional lain
            </p>
          </div>

          {marginData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <span className="text-[32px]">📊</span>
              <p className="text-[13px] text-pp-text-muted">Belum ada data</p>
            </div>
          ) : (
            <div className="space-y-2 mt-4">
              {/* Header row */}
              <div className="flex items-center text-[10.5px] font-semibold text-pp-text-muted uppercase tracking-wider px-1 pb-1.5 border-b border-pp-border-light">
                <span className="flex-1">Menu</span>
                <span className="w-[80px] text-right">Omset</span>
                <span className="w-[70px] text-right">Est. HPP</span>
                <span className="w-[58px] text-right">Margin</span>
              </div>

              {marginData.slice(0, 10).map(item => {
                const marginColor = item.marginPct >= 50
                  ? 'var(--pp-chart-green)'
                  : item.marginPct >= 30
                    ? 'var(--pp-chart-orange)'
                    : 'var(--pp-danger)';

                return (
                  <div key={item.name} className="flex items-center px-1 py-1.5 hover:bg-pp-bg/40 rounded-pp-xs transition-colors">
                    <span className="flex-1 text-[12px] text-pp-text truncate pr-2">{item.name}</span>
                    <span className="w-[80px] text-right text-[11.5px] text-pp-text-secondary tabular-nums">
                      {formatIDRCompact(item.revenue)}
                    </span>
                    <span className="w-[70px] text-right text-[11.5px] text-pp-text-muted tabular-nums">
                      {item.hpp > 0 ? formatIDRCompact(item.hpp) : '—'}
                    </span>
                    <span
                      className="w-[58px] text-right text-[11.5px] font-semibold tabular-nums"
                      style={{ color: marginColor }}
                    >
                      {item.hpp > 0 ? `${item.marginPct}%` : '—'}
                    </span>
                  </div>
                );
              })}

              {marginData.length > 10 && (
                <p className="text-[11px] text-pp-text-muted text-center pt-1">
                  +{marginData.length - 10} menu lainnya
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
