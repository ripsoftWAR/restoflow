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
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#EAF3DE] text-[#27500A] whitespace-nowrap">
        ↑ {value}%
      </span>
    );
  if (value < 0)
    return (
      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-[#FCEBEB] text-[#791F1F] whitespace-nowrap">
        ↓ {Math.abs(value)}%
      </span>
    );
  return (
    <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 whitespace-nowrap">
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
    <div className="space-y-3">

      {/* ── TOP 3 HIGHLIGHT CARDS ─────────────────────────────── */}
      {breakdown.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: 'Omset tertinggi',
              name: topOmset?.name,
              value: formatIDRCompact(topOmset?.revenue || 0),
              color: 'text-[#0F6E56]',
              bg: 'bg-[#E1F5EE]',
              dot: 'bg-[#1D9E75]',
            },
            {
              label: 'Paling laris',
              name: topQty?.name,
              value: `${topQty?.qty || 0} porsi`,
              color: 'text-[#185FA5]',
              bg: 'bg-[#E6F1FB]',
              dot: 'bg-[#378ADD]',
            },
            {
              label: 'Harga tertinggi',
              name: topAvg?.name,
              value: formatIDRCompact(topAvg?.avg || 0) + '/porsi',
              color: 'text-[#533AB7]',
              bg: 'bg-[#EEEDFE]',
              dot: 'bg-[#7F77DD]',
            },
          ].map(card => (
            <div
              key={card.label}
              className="bg-white border border-slate-200 rounded-xl p-4"
            >
              <div className={`inline-flex items-center gap-1.5 text-[10px] font-medium px-2 py-0.5 rounded-full mb-2 ${card.bg} ${card.color}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${card.dot}`} />
                {card.label}
              </div>
              <p className="text-[13px] font-medium text-slate-800 truncate leading-snug">
                {card.name || '—'}
              </p>
              <p className={`text-[12px] font-medium mt-0.5 ${card.color}`}>
                {card.value}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── SUMMARY STRIP ─────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total omset', value: formatIDRCompact(totalRevenue) },
          { label: 'Total porsi', value: `${totalQty} porsi` },
          { label: 'Rata-rata/porsi', value: formatIDRCompact(avgPerPorsi) },
        ].map(s => (
          <div key={s.label} className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3">
            <p className="text-[11px] text-slate-400 mb-0.5">{s.label}</p>
            <p className="text-[15px] font-semibold text-slate-800 tabular-nums">{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── TABLE CARD ────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 border-b border-slate-100">
          <div>
            <h3 className="text-[14px] font-medium text-slate-800">Breakdown per menu</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {dateRangeLabel} · {breakdown.length} menu aktif
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Payment filter */}
            <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
              {(['ALL', 'CASH', 'QRIS'] as PaymentFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setPaymentFilter(f)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    paymentFilter === f
                      ? 'bg-white text-slate-800 shadow-sm font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {f === 'ALL' ? 'Semua' : f}
                </button>
              ))}
            </div>

            {/* Sort */}
            <div className="flex gap-0.5 bg-slate-100 rounded-lg p-0.5">
              {SORT_OPTIONS.map(o => (
                <button
                  key={o.key}
                  onClick={() => setSortKey(o.key)}
                  className={`text-[11px] px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    sortKey === o.key
                      ? 'bg-white text-slate-800 shadow-sm font-medium'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {o.label}
                </button>
              ))}
            </div>

            {/* Export */}
            <button
              onClick={handleExport}
              className="text-[11px] px-3 py-1.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Export CSV
            </button>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[13px] text-slate-400">Belum ada data penjualan</p>
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
                <tr className="bg-slate-50">
                  <th className="py-2 pl-5 pr-2 text-left text-[10px] font-medium text-slate-400 tracking-wide">#</th>
                  <th className="py-2 px-2 text-left text-[10px] font-medium text-slate-400 tracking-wide">MENU</th>
                  <th className="py-2 px-2 text-right text-[10px] font-medium text-slate-400 tracking-wide">PORSI</th>
                  <th className="py-2 px-2 text-right text-[10px] font-medium text-slate-400 tracking-wide">OMSET</th>
                  <th className="py-2 px-2 text-right text-[10px] font-medium text-slate-400 tracking-wide">AVG/PORSI</th>
                  <th className="py-2 px-2 text-left text-[10px] font-medium text-slate-400 tracking-wide">KONTRIBUSI</th>
                  <th className="py-2 pl-2 pr-5 text-center text-[10px] font-medium text-slate-400 tracking-wide">TREND</th>
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
                      className={`border-t border-slate-100 transition-colors ${
                        isTop ? 'bg-slate-50/80' : 'hover:bg-slate-50/60'
                      }`}
                    >
                      <td className="py-3 pl-5 pr-2 text-[12px] text-slate-400">{i + 1}</td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[13px] ${isTop ? 'font-medium text-slate-800' : 'text-slate-700'}`}>
                            {item.name}
                          </span>
                          {isTop && (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-[#EAF3DE] text-[#27500A] whitespace-nowrap">
                              Terlaris
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-2 text-right text-slate-500 tabular-nums">{item.qty}</td>
                      <td className="py-3 px-2 text-right font-medium text-slate-800 tabular-nums">
                        {formatIDRCompact(item.revenue)}
                      </td>
                      <td className="py-3 px-2 text-right text-slate-500 tabular-nums">
                        {formatIDRCompact(item.avg)}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-[#1D9E75] rounded-full"
                              style={{ width: `${barW}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-slate-400 tabular-nums min-w-[28px] text-right">
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