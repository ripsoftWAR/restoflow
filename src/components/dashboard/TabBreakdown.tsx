import { useMemo, useState } from 'react';
import { Sale } from '../../types';
import { formatIDRCompact } from './shared/utils';

const formatIDRFull = (num: number) =>
  `Rp${Math.round(num).toLocaleString('id-ID')}`;

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
}

const MOCK_TRENDS: Record<number, number> = { 0: 12, 1: 5, 2: 0, 3: 22 };
function getTrend(idx: number): number {
  return MOCK_TRENDS[idx] ?? -8;
}

function TrendBadge({ value }: { value: number }) {
  if (value > 0)
    return (
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ backgroundColor: 'var(--pp-success-soft)', color: 'var(--pp-success)', border: '1px solid var(--pp-success-border)' }}
      >
        ↑ {value}%
      </span>
    );
  if (value < 0)
    return (
      <span
        className="text-[11px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
        style={{ backgroundColor: 'var(--pp-danger-soft)', color: 'var(--pp-danger)', border: '1px solid var(--pp-danger-border)' }}
      >
        ↓ {Math.abs(value)}%
      </span>
    );
  return (
    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-pp-bg text-pp-text-muted whitespace-nowrap border border-pp-border-light">
      → 0%
    </span>
  );
}

type SortKey = 'revenue' | 'qty' | 'avg';
type PaymentFilter = 'ALL' | 'CASH' | 'QRIS';

export default function TabBreakdown({ sales, dateRangeLabel }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('revenue');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('ALL');

  // Filter by payment method
  const filteredSales = useMemo(() => {
    if (paymentFilter === 'ALL') return sales;
    return sales.filter(s => s.payment_method === paymentFilter);
  }, [sales, paymentFilter]);

  // Aggregate per menu
  const breakdown = useMemo(() => {
    const menuMap: Record<string, { qty: number; revenue: number }> = {};
    filteredSales.forEach(s => {
      if (!menuMap[s.menu_name]) menuMap[s.menu_name] = { qty: 0, revenue: 0 };
      menuMap[s.menu_name].qty += Number(s.quantity) || 0;
      menuMap[s.menu_name].revenue += Number(s.total_price) || 0;
    });
    return Object.entries(menuMap)
      .map(([name, data]) => ({
        name,
        ...data,
        avg: data.qty > 0 ? data.revenue / data.qty : 0,
      }))
      .sort((a, b) => b[sortKey] - a[sortKey]);
  }, [filteredSales, sortKey]);

  const totalRevenue = useMemo(
    () => breakdown.reduce((sum, i) => sum + i.revenue, 0),
    [breakdown],
  );
  const totalQty = useMemo(
    () => breakdown.reduce((sum, i) => sum + i.qty, 0),
    [breakdown],
  );
  const avgPerPorsi = totalQty > 0 ? totalRevenue / totalQty : 0;
  const maxRevenue = breakdown[0]?.revenue || 1;

  // Top 3 highlights
  const topOmset = [...breakdown].sort((a, b) => b.revenue - a.revenue)[0];
  const topQty = [...breakdown].sort((a, b) => b.qty - a.qty)[0];
  const topAvg = [...breakdown].sort((a, b) => b.avg - a.avg)[0];

  // Export CSV
  const handleExport = () => {
    const header = ['#', 'Menu', 'Porsi', 'Omset', 'Avg/Porsi', 'Kontribusi (%)'];
    const rows = breakdown.map((item, i) => [
      i + 1,
      item.name,
      item.qty,
      Math.round(item.revenue),
      Math.round(item.avg),
      totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0,
    ]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breakdown-${dateRangeLabel.replace(/\s/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'revenue', label: 'Omset' },
    { key: 'qty', label: 'Porsi' },
    { key: 'avg', label: 'Avg/Porsi' },
  ];

  return (
    <div className="space-y-5">

      {/* ── TOP 3 HIGHLIGHT CARDS ─────────────────────────────── */}
      {breakdown.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            {
              label: 'Omset tertinggi',
              name: topOmset?.name,
              value: formatIDRCompact(topOmset?.revenue || 0),
              color: 'var(--pp-chart-green)',
              bg: 'var(--pp-success-soft)',
              dot: 'var(--pp-chart-green)',
            },
            {
              label: 'Paling laris',
              name: topQty?.name,
              value: `${topQty?.qty || 0} porsi`,
              color: 'var(--pp-chart-blue)',
              bg: 'var(--pp-primary-soft)',
              dot: 'var(--pp-chart-blue)',
            },
            {
              label: 'Harga tertinggi',
              name: topAvg?.name,
              value: formatIDRCompact(topAvg?.avg || 0) + '/porsi',
              color: 'var(--pp-chart-purple)',
              bg: 'var(--pp-info-soft)',
              dot: 'var(--pp-chart-purple)',
            },
          ].map(card => (
            <div
              key={card.label}
              className="bg-pp-surface border border-pp-border rounded-pp-md p-4 shadow-pp-xs"
            >
              <div
                className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-0.5 rounded-full mb-2"
                style={{ backgroundColor: card.bg, color: card.color }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: card.dot }}
                />
                {card.label}
              </div>
              <p className="text-[13px] font-medium text-pp-text truncate leading-snug">
                {card.name || '—'}
              </p>
              <p className="text-[12px] font-semibold mt-0.5" style={{ color: card.color }}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── SUMMARY STRIP ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total omset', value: formatIDRCompact(totalRevenue) },
          { label: 'Total porsi', value: `${totalQty} porsi` },
          { label: 'Rata-rata/porsi', value: formatIDRCompact(avgPerPorsi) },
        ].map(s => (
          <div key={s.label} className="bg-pp-bg border border-pp-border-light rounded-pp-md px-4 py-3">
            <p className="text-[11px] font-medium text-pp-text-muted mb-0.5">{s.label}</p>
            <p className="text-[16px] font-bold text-pp-text tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── TABLE CARD ────────────────────────────────────────── */}
      <div className="bg-pp-surface border border-pp-border rounded-pp-md shadow-pp-xs overflow-hidden">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-pp-border-light">
          <div>
            <h3 className="text-[14px] font-semibold text-pp-text">Breakdown per menu</h3>
            <p className="text-[12px] text-pp-text-muted mt-0.5">
              {dateRangeLabel} · {breakdown.length} menu aktif
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Payment filter */}
            <div className="flex gap-0.5 bg-pp-bg border border-pp-border-light rounded-pp-xs p-0.5">
              {(['ALL', 'CASH', 'QRIS'] as PaymentFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setPaymentFilter(f)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-pp-xs transition-all duration-150 cursor-pointer ${
                    paymentFilter === f
                      ? 'bg-pp-surface text-pp-text shadow-pp-xs'
                      : 'text-pp-text-muted hover:text-pp-text-secondary'
                  }`}
                >
                  {f === 'ALL' ? 'Semua' : f}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex gap-0.5 bg-pp-bg border border-pp-border-light rounded-pp-xs p-0.5">
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.key}
                  onClick={() => setSortKey(o.key)}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded-pp-xs transition-all duration-150 cursor-pointer ${
                    sortKey === o.key
                      ? 'bg-pp-surface text-pp-text shadow-pp-xs'
                      : 'text-pp-text-muted hover:text-pp-text-secondary'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Export */}
            <button
              onClick={handleExport}
              className="text-[12px] font-medium px-3 py-1.5 bg-pp-primary text-white rounded-pp-xs hover:bg-pp-primary-hover transition-colors duration-150 cursor-pointer"
            >
              Export CSV
            </button>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <div className="w-10 h-10 rounded-full bg-pp-bg flex items-center justify-center">
              <span className="text-pp-text-placeholder text-lg">📋</span>
            </div>
            <p className="text-[13px] text-pp-text-muted">Belum ada data penjualan</p>
            <p className="text-[11px] text-pp-text-placeholder">Data akan muncul setelah ada transaksi</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: 36 }} />
                <col />
                <col style={{ width: 72 }} />
                <col style={{ width: 100 }} />
                <col style={{ width: 96 }} />
                <col style={{ width: 120 }} />
                <col style={{ width: 76 }} />
              </colgroup>
              <thead>
                <tr className="bg-pp-bg/50">
                  <th className="py-2.5 pl-5 pr-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">#</th>
                  <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">MENU</th>
                  <th className="py-2.5 px-2 text-right text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">PORSI</th>
                  <th className="py-2.5 px-2 text-right text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">OMSET</th>
                  <th className="py-2.5 px-2 text-right text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">AVG/PORSI</th>
                  <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">KONTRIBUSI</th>
                  <th className="py-2.5 pl-2 pr-5 text-center text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">TREND</th>
                </tr>
              </thead>
              <tbody>
                {breakdown.map((item, i) => {
                  const pct = totalRevenue > 0 ? Math.round((item.revenue / totalRevenue) * 100) : 0;
                  const barW = Math.round((item.revenue / maxRevenue) * 100);
                  const trend = getTrend(i);
                  const isTop = i === 0;

                  return (
                    <tr
                      key={item.name}
                      className={`border-t border-pp-border-light transition-colors ${
                        isTop ? 'bg-pp-primary-soft/30' : 'hover:bg-pp-bg/50'
                      }`}
                    >
                      <td className="py-3 pl-5 pr-2 text-[12px] text-pp-text-muted tabular-nums">{i + 1}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[13px] ${isTop ? 'font-semibold text-pp-text' : 'text-pp-text-secondary'}`}>
                            {item.name}
                          </span>
                          {isTop && (
                            <span
                              className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full whitespace-nowrap"
                              style={{
                                backgroundColor: 'var(--pp-success-soft)',
                                color: 'var(--pp-success)',
                                border: '1px solid var(--pp-success-border)',
                              }}
                            >
                              Terlaris
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-pp-text-muted tabular-nums">{item.qty}</td>
                      <td className="py-3 px-2 text-right font-semibold text-pp-text tabular-nums">
                        {formatIDRCompact(item.revenue)}
                      </td>
                      <td className="py-3 px-2 text-right text-pp-text-muted tabular-nums">
                        {formatIDRCompact(item.avg)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-pp-border-light rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${barW}%`,
                                backgroundColor: 'var(--pp-chart-green)',
                              }}
                            />
                          </div>
                          <span className="text-[11px] text-pp-text-muted tabular-nums min-w-[28px] text-right">
                            {pct}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3 pl-2 pr-5 text-center">
                        <TrendBadge value={trend} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}