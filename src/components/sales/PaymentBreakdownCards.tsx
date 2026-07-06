import { memo, useMemo } from 'react';
import { Banknote, QrCode, Landmark, CreditCard } from 'lucide-react';
import type { Sale } from '../../types';
import { formatIDRCompact } from '../dashboard/shared/utils';

/* ═══════════════════════════════════════════════════════════════
   PaymentBreakdownCards — Card per metode pembayaran
   Pattern persis Dashboard TabBreakdown: icon + label + progress bar
   ═══════════════════════════════════════════════════════════════ */

const ICON_SIZE = 16;

const PM_STYLE: Record<string, { icon: React.ReactNode; color: string }> = {
  CASH:     { icon: <Banknote size={ICON_SIZE} strokeWidth={2} />,       color: '#059669' },
  QRIS:     { icon: <QrCode size={ICON_SIZE} strokeWidth={2} />,         color: '#2563EB' },
  TRANSFER: { icon: <Landmark size={ICON_SIZE} strokeWidth={2} />,       color: '#7C3AED' },
  EDC:      { icon: <CreditCard size={ICON_SIZE} strokeWidth={2} />,     color: '#D97706' },
};

interface Props {
  sales: Sale[];
  dateRangeLabel: string;
}

const PaymentBreakdownCards = memo(function PaymentBreakdownCards({ sales, dateRangeLabel }: Props) {
  const breakdown = useMemo(() => {
    const agg: Record<string, { revenue: number; tx: number }> = {};
    sales.forEach(s => {
      const method = (s.payment_method || 'CASH').toUpperCase();
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

  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
      <div className="mb-4">
        <div className="text-[15.5px] font-bold text-pp-text">Metode Pembayaran</div>
        <div className="text-[12px] text-pp-text-muted mt-0.5">{dateRangeLabel}</div>
      </div>

      {breakdown.list.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <span className="text-[32px]">💳</span>
          <p className="text-[13px] text-pp-text-muted">Belum ada data pembayaran</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {breakdown.list.map(pm => {
            const pct = breakdown.total > 0
              ? Math.round((pm.revenue / breakdown.total) * 100)
              : 0;
            const barW = Math.max(2, pct);
            const style = PM_STYLE[pm.method] || PM_STYLE.CASH;
            const isTop = breakdown.list[0]?.method === pm.method;

            return (
              <div key={pm.method} className="flex items-center gap-3">
                {/* Icon + Name */}
                <div className="w-[100px] flex-shrink-0 flex items-center gap-2">
                  <span className="text-pp-text-secondary flex-shrink-0">{style.icon}</span>
                  <span className={`text-[12.5px] whitespace-nowrap ${
                    isTop ? 'font-semibold text-pp-text' : 'text-pp-text-secondary'
                  }`}>
                    {pm.method}
                  </span>
                </div>

                {/* Bar */}
                <div className="flex-1 h-[22px] bg-pp-bg rounded-pp-xs overflow-hidden relative">
                  <div
                    className="h-full rounded-pp-xs transition-all duration-500 flex items-center pl-2"
                    style={{
                      width: `${barW}%`,
                      backgroundColor: style.color,
                      minWidth: barW > 0 ? '2px' : 0,
                    }}
                  >
                    {barW > 18 && (
                      <span className="text-[10px] font-semibold text-white/90 whitespace-nowrap">
                        {pct}%
                      </span>
                    )}
                  </div>
                </div>

                {/* Value */}
                <span className="text-[13px] font-semibold text-pp-text tabular-nums w-[90px] text-right flex-shrink-0">
                  Rp {formatIDRCompact(pm.revenue)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default PaymentBreakdownCards;
