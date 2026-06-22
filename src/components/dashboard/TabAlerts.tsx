import { useMemo } from 'react';
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

    // Anomaly: check for menu with declining sales (simple heuristic)
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const thisWeek: Record<string, number> = {};
    const lastWeek: Record<string, number> = {};

    sales.forEach(s => {
      const dateStr = s.created_at
        ? String(s.created_at ?? '')
        : '';
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

  const badgeClass = (type: string) => {
    if (type === 'Kritis') return 'bg-[#FCEBEB] text-[#791F1F] border border-[#F7C1C1]';
    if (type === 'Warning') return 'bg-[#FAEEDA] text-[#633806] border border-[#FAC775]';
    return 'bg-[#FAEEDA] text-[#633806] border border-[#FAC775]';
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[13px] font-medium text-slate-800">Alerts aktif</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Stok kritis & anomali</p>
        </div>
        {alerts.length > 0 && (
          <span className="text-[10px] font-medium bg-[#FCEBEB] text-[#791F1F] border border-[#F7C1C1] px-2 py-0.5 rounded-full">
            {alerts.length} aktif
          </span>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-xs text-slate-400">Tidak ada alerts aktif</p>
        </div>
      ) : (
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr>
              <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                Jenis
              </th>
              <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                Detail
              </th>
              <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                Waktu
              </th>
              <th className="text-[10px] uppercase tracking-wide text-slate-400 font-medium text-left py-1.5 px-2 border-b border-slate-100">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody>
            {alerts.map((alert, i) => (
              <tr key={i}>
                <td className="py-2.5 px-2 border-b border-slate-100">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeClass(alert.type)}`}>
                    {alert.type}
                  </span>
                </td>
                <td className="py-2.5 px-2 border-b border-slate-100 text-slate-700">
                  {alert.detail}
                </td>
                <td className="py-2.5 px-2 border-b border-slate-100 text-slate-400">
                  {alert.time}
                </td>
                <td className="py-2.5 px-2 border-b border-slate-100">
                  <button
                    onClick={() => onNavigate(alert.actionTab)}
                    className="text-[10px] px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50"
                  >
                    {alert.action}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}