import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { Sale } from '../../types';
import { formatIDRCompact } from '../dashboard/shared/utils';

/* ═══════════════════════════════════════════════════════════════
   TabOverview — Tab 1 halaman Penjualan
   • Chart tren penjualan harian (AreaChart, full width)
   • Top Menu bar chart (dari Dashboard Breakdown)
   • Payment Breakdown (card seperti Dashboard)
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
  startDate: Date;
  endDate: Date;
}

/* ── Aggregate sales harian untuk chart ─────────────── */
function aggregateDaily(sales: Sale[], from: Date, to: Date) {
  const map = new Map<string, number>();
  const cursor = new Date(from);
  while (cursor <= to) {
    const key = cursor.toISOString().split('T')[0];
    map.set(key, 0);
    cursor.setDate(cursor.getDate() + 1);
  }
  for (const s of sales) {
    if (!s.created_at) continue;
    const d = new Date(s.created_at);
    if (isNaN(d.getTime()) || d < from || d > to) continue;
    const key = d.toISOString().split('T')[0];
    map.set(key, (map.get(key) || 0) + Number(s.total_price || 0));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, revenue]) => {
      const d = new Date(date);
      const days = ['Min','Sen','Sel','Rab','Kam','Jum','Sab'];
      return {
        date,
        revenue,
        label: `${d.getDate()}/${d.getMonth()+1} ${days[d.getDay()]}`,
      };
    });
}

/* ── Top menu aggregation (bar chart style, 15 teratas) ─ */
function aggregateTopMenu(sales: Sale[]) {
  const agg: Record<string, number> = {};
  for (const s of sales) {
    const name = (s.menu_name || 'Tanpa Nama').trim();
    agg[name] = (agg[name] || 0) + (Number(s.total_price) || 0);
  }
  return Object.entries(agg)
    .map(([name, revenue]) => ({ name, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 15);
}

export default function TabOverview({ sales, dateRangeLabel, startDate, endDate }: Props) {
  const chartData = useMemo(() => aggregateDaily(sales, startDate, endDate), [sales, startDate, endDate]);
  const topMenuData = useMemo(() => aggregateTopMenu(sales), [sales]);
  const maxMenuRevenue = topMenuData[0]?.revenue || 1;

  const maxRev = useMemo(() => Math.max(...chartData.map(d => d.revenue), 1), [chartData]);
  const isEmpty = chartData.length === 0 || chartData.every(d => d.revenue === 0);

  return (
    <motion.div
      key="overview"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-5"
    >
      {/* ═══════════════════════════════════════════
          ROW 1: TREN PENJUALAN (full width)
          ═══════════════════════════════════════════ */}
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
        <div className="mb-3">
          <div className="text-[15.5px] font-bold text-pp-text">Tren Penjualan</div>
          <div className="text-[12px] text-pp-text-muted mt-0.5">{dateRangeLabel}</div>
        </div>

        {isEmpty ? (
          <div className="h-[240px] flex flex-col items-center justify-center gap-2">
            <span className="text-[36px]">📈</span>
            <p className="text-[13px] text-pp-text-muted">Belum ada data penjualan</p>
            <p className="text-[11px] text-pp-text-muted">Data akan muncul setelah ada transaksi</p>
          </div>
        ) : (
          <div className="h-[240px] -mx-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="sales-overview-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563EB" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563EB" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#EEF0F7" />
                <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }} interval="preserveStartEnd" minTickGap={50} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9CA3AF' }}
                  tickFormatter={v => v >= 1_000_000 ? `${(v/1_000_000).toFixed(1)}jt` : v >= 1_000 ? `${Math.round(v/1_000)}rb` : '0'}
                  domain={[0, 'auto']} width={45} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-[#1B2436] text-white px-3 py-2 rounded-[10px] text-[12px] shadow-lg">
                        <div className="text-[#B9C1D9] text-[11px] mb-0.5">{d.label}</div>
                        <div className="font-semibold">Rp {formatIDRCompact(d.revenue)}</div>
                      </div>
                    );
                  }}
                  cursor={{ stroke: '#D7DCEC', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="natural"
                  dataKey="revenue"
                  stroke="#2563EB"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#sales-overview-grad)"
                  dot={false}
                  activeDot={{ r: 5, fill: 'white', stroke: '#2563EB', strokeWidth: 2.5 }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          ROW 2: TOP MENU (full width)
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
    </motion.div>
  );
}
