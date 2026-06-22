import { Scan, ShoppingCart, MessageSquareText, Package } from 'lucide-react';

const ACTIONS = [
  {
    label: 'Scan nota',
    subtitle: 'OCR otomatis',
    tab: 'ocr',
    icon: Scan,
    color: 'text-blue-600',
  },
  {
    label: 'Kasir',
    subtitle: 'Input pesanan',
    tab: 'sales',
    icon: ShoppingCart,
    color: 'text-violet-600',
  },
  {
    label: 'Tanya AI',
    subtitle: 'Asisten cerdas',
    tab: 'ai',
    icon: MessageSquareText,
    color: 'text-emerald-600',
  },
  {
    label: 'Inventori',
    subtitle: 'Kelola stok',
    tab: 'inventory',
    icon: Package,
    color: 'text-amber-600',
  },
];

interface Props {
  onNavigate: (tab: string) => void;
}

export default function QuickActions({ onNavigate }: Props) {
  return (
    <div className="bg-white h-full flex flex-col border-t border-slate-100 lg:border-t-0">
      {/* HEADER */}
      <div className="px-5 pt-4 pb-3 border-b border-slate-100">
        <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Aksi cepat
        </p>
      </div>

      {/* VERTICAL ACTION LIST */}
      <div className="px-4 pb-4 flex flex-col gap-2 flex-1">
        {ACTIONS.map(({ label, subtitle, tab, icon: Icon, color }) => (
          <button
            key={label}
            onClick={() => onNavigate(tab)}
            className="group flex items-center gap-3 px-5 py-3.5 border-b border-slate-100 hover:bg-slate-50 transition-colors duration-150 text-left w-full last:border-b-0"
          >
            <div className="p-1.5 rounded-lg bg-slate-50 group-hover:bg-white transition-colors duration-150">
              <Icon size={18} className={color} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-slate-700 group-hover:text-slate-900 transition-colors">
                {label}
              </p>
              <p className="text-[11px] text-slate-400">{subtitle}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}