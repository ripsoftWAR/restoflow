import {
  Zap,
  Settings,
  MessageSquareMore,
  LogOut,
  LayoutDashboard,
  Layers,
  Utensils,
  ShoppingCart,
  Scan,
  ListOrdered,
} from 'lucide-react';
import { DashboardStats, NavItem } from '../../types';
import StatChips from './StatChips';

const NAV_ITEMS: NavItem[] = [
  { id: 'home',      icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'inventory', icon: Layers,          label: 'Inventori' },
  { id: 'recipes',   icon: Utensils,        label: 'Resep'     },
  { id: 'sales',     icon: ShoppingCart,    label: 'Penjualan' },
];

const NAV_SECONDARY: NavItem[] = [
  { id: 'ocr',  icon: Scan,        label: 'Scan OCR' },
  { id: 'logs', icon: ListOrdered, label: 'Log'      },
];

interface Props {
  activeTab:    string;
  setActiveTab: (tab: string) => void;
  stats:        DashboardStats | null;
  onLogout:     () => void;
  children:     React.ReactNode;
}

const SideBtn = ({ id, icon: Icon, label, activeTab, setActiveTab }: NavItem & { activeTab: string; setActiveTab: (t: string) => void }) => (
  <button onClick={() => setActiveTab(id)} aria-label={label}
    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all
      ${activeTab === id ? 'bg-blue-50 text-blue-600' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
    <Icon size={20} />
  </button>
);

export default function TabletLayout({ activeTab, setActiveTab, stats, onLogout, children }: Props) {
  return (
    <div className="hidden md:flex lg:hidden h-screen bg-[#F8FAFC]">
      <aside className="w-16 bg-white border-r border-slate-100 flex flex-col items-center py-3 gap-1 flex-shrink-0">
        <div className="bg-blue-600 w-8 h-8 rounded-xl flex items-center justify-center mb-3">
          <Zap size={14} fill="white" className="text-white" />
        </div>
        {NAV_ITEMS.map(item => <SideBtn key={item.id} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />)}
        <div className="w-7 h-px bg-slate-100 my-1" />
        {NAV_SECONDARY.map(item => <SideBtn key={item.id} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />)}
        <div className="flex-1" />
        <SideBtn id="ai"       icon={MessageSquareMore} label="AI Asisten" activeTab={activeTab} setActiveTab={setActiveTab} />
        <SideBtn id="settings" icon={Settings}          label="Pengaturan" activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[13px] font-semibold text-slate-800 leading-none capitalize">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? activeTab}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatChips stats={stats} />
            <button onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50 transition-all">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}