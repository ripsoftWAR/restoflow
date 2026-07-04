import { useMemo } from 'react';
import { BellRing, AlertTriangle, TrendingDown, ChevronRight } from 'lucide-react';
import { Ingredient, Sale } from '../../types';

interface Props {
  ingredients: Ingredient[];
  sales: Sale[];
  dateRangeLabel: string;
  onNavigate: (tab: string) => void;
}

export default function TabAlerts({ ingredients, sales, dateRangeLabel, onNavigate }: Props) {
  const alerts = useMemo(() => {
    const result: {
      type: 'Kritis' | 'Warning' | 'Anomali';
      detail: string;
      time: string;
      action: string;
      actionTab: string;
    }[] = [];

    // Critical stock alerts
    ingredients
      .filter(ing => Number(ing.stock) <= (Number(ing.min_stock) || 0))
      .forEach(ing => {
        const ratio = ing.min_stock > 0 ? ing.stock / ing.min_stock : 0;
        result.push({
          type: ratio <= 0.5 ? 'Kritis' : 'Warning',
          detail: `${ing.name} sisa ${ing.stock} ${ing.base_unit}`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          action: ratio <= 0.5 ? 'Beli sekarang' : 'Pantau',
          actionTab: 'inventory',
        });
      });

    // Anomaly: menu sales decline
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek: Record<string, number> = {};
    const lastWeek: Record<string, number> = {};

    sales.forEach(s => {
      const dateStr = s.created_at ? String(s.created_at ?? '') : '';
      const saleDate = new Date(dateStr);
      if (saleDate >= weekAgo) {
        thisWeek[s.menu_name] = (thisWeek[s.menu_name] || 0) + (Number(s.quantity) || 0);
      } else if (saleDate >= twoWeeksAgo) {
        lastWeek[s.menu_name] = (lastWeek[s.menu_name] || 0) + (Number(s.quantity) || 0);
      }
    });

    Object.entries(thisWeek).forEach(([menu, qty]) => {
      const prev = lastWeek[menu] || 0;
      if (prev > 0 && qty < prev * 0.85) {
        const pct = Math.round(((qty - prev) / prev) * 100);
        result.push({
          type: 'Anomali',
          detail: `${menu} turun ${Math.abs(pct)}%`,
          time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          action: 'Lihat',
          actionTab: 'sales',
        });
      }
    });

    return result.slice(0, 10);
  }, [ingredients, sales]);

  const alertStyle = (type: string) => {
    if (type === 'Kritis') return {
      icon: AlertTriangle,
      bg: 'var(--pp-danger-soft)',
      text: 'var(--pp-danger)',
      border: 'var(--pp-danger-border)',
      dot: 'var(--pp-danger)',
    };
    if (type === 'Warning') return {
      icon: AlertTriangle,
      bg: 'var(--pp-warning-soft)',
      text: 'var(--pp-warning)',
      border: 'var(--pp-warning-border)',
      dot: 'var(--pp-warning)',
    };
    return {
      icon: TrendingDown,
      bg: 'var(--pp-info-soft)',
      text: 'var(--pp-info)',
      border: 'var(--pp-info-border)',
      dot: 'var(--pp-info)',
    };
  };

  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-md shadow-pp-xs overflow-hidden">
      {/* HEADER */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-pp-border-light">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-pp-xs bg-pp-danger-soft flex items-center justify-center">
            <BellRing size={16} className="text-pp-danger" />
          </div>
          <div>
            <h3 className="text-[14px] font-semibold text-pp-text">Alerts aktif</h3>
            <p className="text-[12px] text-pp-text-muted mt-0.5">Stok kritis & anomali penjualan</p>
          </div>
        </div>
        {alerts.length > 0 && (
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{
              backgroundColor: 'var(--pp-danger-soft)',
              color: 'var(--pp-danger)',
              border: '1px solid var(--pp-danger-border)',
            }}
          >
            {alerts.length} aktif
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 py-16">
          <div className="w-10 h-10 rounded-full bg-pp-success-soft flex items-center justify-center">
            <BellRing size={18} className="text-pp-success" />
          </div>
          <p className="text-[13px] font-medium text-pp-text">Tidak ada alerts aktif</p>
          <p className="text-[12px] text-pp-text-muted">Semua berjalan normal</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13px]">
            <thead>
              <tr className="bg-pp-bg/50">
                <th className="py-2.5 pl-5 pr-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">
                  Jenis
                </th>
                <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">
                  Detail
                </th>
                <th className="py-2.5 px-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">
                  Waktu
                </th>
                <th className="py-2.5 pl-2 pr-5 text-right text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert, i) => {
                const style = alertStyle(alert.type);
                const IconComp = style.icon;
                return (
                  <tr
                    key={i}
                    className="border-t border-pp-border-light hover:bg-pp-bg/50 transition-colors"
                  >
                    <td className="py-3 pl-5 pr-2">
                      <span
                        className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                        style={{
                          backgroundColor: style.bg,
                          color: style.text,
                          border: `1px solid ${style.border}`,
                        }}
                      >
                        <div
                          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ backgroundColor: style.dot }}
                        />
                        {alert.type}
                      </span>
                    </td>
                    <td className="py-3 px-2 text-pp-text font-medium">
                      {alert.detail}
                    </td>
                    <td className="py-3 px-2 text-pp-text-muted">
                      {alert.time}
                    </td>
                    <td className="py-3 pl-2 pr-5 text-right">
                      <button
                        onClick={() => onNavigate(alert.actionTab)}
                        className="inline-flex items-center gap-1 text-[12px] font-medium px-3 py-1.5 border border-pp-border rounded-pp-xs bg-pp-surface text-pp-text-secondary hover:bg-pp-bg hover:text-pp-text transition-all duration-150"
                      >
                        {alert.action}
                        <ChevronRight size={12} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
