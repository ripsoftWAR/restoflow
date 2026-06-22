import { Send, FileText } from 'lucide-react';
import { Ingredient } from '../../types';

interface ShoppingListProps {
  items: Ingredient[];
  totalCount: number;
  onNavigate: (tab: string) => void;
}

export default function ShoppingList({ items, totalCount, onNavigate }: ShoppingListProps) {
  const getStatus = (item: Ingredient) => {
    if (!item.min_stock || item.min_stock <= 0) return { label: 'Warning', badge: 'b-amb', dot: '#EF9F27' };
    const ratio = item.stock / item.min_stock;
    if (ratio <= 0.5) return { label: 'Kritis', badge: 'b-red', dot: '#E24B4A' };
    return { label: 'Warning', badge: 'b-amb', dot: '#EF9F27' };
  };

  const getBuyAmount = (item: Ingredient) => {
    const need = Math.max(1, (item.min_stock || 0) - item.stock);
    return `${need} ${item.base_unit}`;
  };

  const badgeClass = (type: string) => {
    if (type === 'b-red') return 'bg-[#FCEBEB] text-[#791F1F] border border-[#F7C1C1]';
    return 'bg-[#FAEEDA] text-[#633806] border border-[#FAC775]';
  };

  return (
    <div className="bg-white h-full flex flex-col">
      {/* HEADER */}
      <div className="flex items-center justify-between px-4 pt-4 pb-3">
        <div>
          <h3 className="text-[13px] font-medium text-slate-800">Perlu restock</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">Di bawah stok minimum</p>
        </div>
        {totalCount > 0 && (
          <span className="text-[10px] font-medium bg-[#FCEBEB] text-[#791F1F] border border-[#F7C1C1] px-2 py-0.5 rounded-full">
            {totalCount} item
          </span>
        )}
      </div>

      {/* ITEM LIST */}
      <div className="px-4 pb-3 flex flex-col flex-1">
        {items.length > 0 ? (
          items.slice(0, 4).map((item) => {
            const status = getStatus(item);
            return (
              <div
                key={item.id || item.name}
                className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-b-0"
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: status.dot }}
                  />
                  <div>
                    <div className="text-[12px] text-slate-700">{item.name}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      Sisa {item.stock} {item.base_unit} · min {item.min_stock} {item.base_unit}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${badgeClass(status.badge)}`}>
                    {status.label}
                  </span>
                  <button
                    onClick={() => onNavigate('inventory')}
                    className="text-[10px] px-2 py-1 border border-slate-200 rounded-md bg-white text-slate-600 hover:bg-slate-50 whitespace-nowrap"
                  >
                    Beli {getBuyAmount(item)}
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center mb-2">
              <div className="w-3 h-3 rounded-full bg-emerald-400" />
            </div>
            <p className="text-xs text-slate-400">Semua stok aman!</p>
          </div>
        )}
      </div>

      {/* ACTION BUTTONS */}
      {items.length > 0 && (
        <div className="px-4 pb-4 pt-1 flex gap-2">
          <button
            onClick={() => onNavigate('inventory')}
            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg py-2 hover:bg-slate-50 transition-all"
          >
            <Send size={11} />
            Kirim ke supplier
          </button>
          <button
            onClick={() => onNavigate('inventory')}
            className="flex-1 flex items-center justify-center gap-1.5 text-[10px] font-medium text-slate-600 bg-white border border-slate-200 rounded-lg py-2 hover:bg-slate-50 transition-all"
          >
            <FileText size={11} />
            Export PDF
          </button>
        </div>
      )}
    </div>
  );
}