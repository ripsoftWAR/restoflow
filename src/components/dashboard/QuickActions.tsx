import { 
  Scan, 
  ShoppingCart, 
  MessageSquareText, 
  PackagePlus,
  Plus
} from 'lucide-react';

const ACTIONS = [
  { 
    label: 'Scan Nota',       
    tab: 'ocr',
    icon: Scan,
    bg: 'bg-blue-50 hover:bg-blue-100',
    text: 'text-blue-600',
    border: 'border-blue-100 hover:border-blue-300'
  },
  { 
    label: 'Input Penjualan', 
    tab: 'sales',
    icon: ShoppingCart,
    bg: 'bg-violet-50 hover:bg-violet-100',
    text: 'text-violet-600',
    border: 'border-violet-100 hover:border-violet-300'
  },
  { 
    label: 'Tanya AI',        
    tab: '',
    icon: MessageSquareText,
    bg: 'bg-emerald-50 hover:bg-emerald-100',
    text: 'text-emerald-600',
    border: 'border-emerald-100 hover:border-emerald-300'
  },
  { 
    label: 'Tambah Produk',   
    tab: 'inventory',
    icon: PackagePlus,
    bg: 'bg-amber-50 hover:bg-amber-100',
    text: 'text-amber-600',
    border: 'border-amber-100 hover:border-amber-300'
  },
];

export default function QuickActions({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden h-full flex flex-col">
      {/* HEADER */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-slate-800">Menu Utama</h3>
        <span className="text-[10px] font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full border border-slate-100">
          4 shortcuts
        </span>
      </div>

      {/* GRID ACTIONS */}
      <div className="px-5 pb-5 grid grid-cols-2 gap-3">
        {ACTIONS.map(({ label, tab, icon: Icon, bg, text, border }) => (
          <button
            key={label}
            onClick={() => tab && onNavigate(tab)}
            className={`
              group relative flex flex-col items-center justify-center gap-2
              p-4 rounded-xl border ${border} ${bg} 
              transition-all duration-300 hover:-translate-y-1 hover:shadow-md
              active:scale-[0.98]
            `}
          >
            {/* Icon Container */}
            <div className={`
              p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 
              group-hover:scale-110 transition-transform duration-300
            `}>
              <Icon size={20} className={text} />
            </div>
            
            {/* Label */}
            <span className="text-xs font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
              {label}
            </span>
            
            {/* Subtle Shine Effect on Hover */}
            <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" 
                 style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.4) 0%, transparent 50%)' }} 
            />
          </button>
        ))}
      </div>
    </div>
  );
}