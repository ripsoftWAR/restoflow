import { AlertTriangle, ChevronRight, Package } from 'lucide-react';
import { Ingredient } from '../../types';

interface ShoppingListProps {
  items: Ingredient[];
  totalCount: number;
  onNavigate: (tab: string) => void;
}

export default function ShoppingList({ items, totalCount, onNavigate }: ShoppingListProps) {
  return (
    <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
      <div className="p-5 border-b border-slate-50 flex items-center justify-between">
        <h3 className="font-bold text-slate-800">Daftar Belanja</h3>
        {totalCount > 0 && (
          <span className="text-xs font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">{totalCount}</span>
        )}
      </div>
      <div className="p-2">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.name} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                  <AlertTriangle size={14} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700">{item.name}</p>
                  <p className="text-xs text-slate-400">Sisa {item.stock} {item.base_unit}</p>
                </div>
              </div>
              <button onClick={() => onNavigate('inventory')} className="text-slate-300 hover:text-blue-500 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-8 text-center">
            <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-2">
              <Package size={18} className="text-emerald-500" />
            </div>
            <p className="text-sm text-slate-400 font-medium">Semua stok aman!</p>
          </div>
        )}
      </div>
    </div>
  );
}
