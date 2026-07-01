import {
  MapPin,
  Settings,
  MessageSquareMore,
  LogOut,
  LayoutDashboard,
  Layers,
  Utensils,
  ShoppingCart,
  Scan,
  ListOrdered,
  Download,
} from 'lucide-react';
import { DashboardStats, NavItem } from '../../types';
import StatChips from './StatChips';
import InstallPWA from '../InstallPWA';

const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'inventory', icon: Layers, label: 'Inventori' },
  { id: 'recipes', icon: Utensils, label: 'Resep' },
  { id: 'sales', icon: ShoppingCart, label: 'Penjualan' },
];

const NAV_SECONDARY: NavItem[] = [
  { id: 'ocr', icon: Scan, label: 'Scan OCR' },
  { id: 'logs', icon: ListOrdered, label: 'Log' },
];

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: DashboardStats | null;
  onLogout: () => void;
  children: React.ReactNode;
}

const SideBtn = ({ id, icon: Icon, label, activeTab, setActiveTab }: NavItem & { activeTab: string; setActiveTab: (t: string) => void }) => (
  <button
    onClick={() => setActiveTab(id)}
    aria-label={label}
    className={`w-11 h-11 rounded-xl flex items-center justify-center transition-colors ${
      activeTab === id
        ? 'bg-blue-50 text-blue-600'
        : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'
    }`}
  >
    <Icon size={20} strokeWidth={activeTab === id ? 2 : 1.6} />
  </button>
);

export default function TabletLayout({ activeTab, setActiveTab, stats, onLogout, children }: Props) {
  return (
    <div className="hidden md:flex lg:hidden h-screen bg-slate-50">
      {/* Sidebar icon-only */}
      <aside className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-4 gap-1 flex-shrink-0">
        <div className="bg-gradient-to-br from-blue-600 to-blue-500 w-9 h-9 rounded-2xl flex items-center justify-center mb-4 shadow-sm shadow-blue-200">
          <MapPin size={15} fill="white" className="text-white" strokeWidth={1.5} />
        </div>
        {NAV_ITEMS.map(item => (
          <SideBtn key={item.id} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />
        ))}
        <div className="w-7 h-px bg-slate-200 my-1" />
        {NAV_SECONDARY.map(item => (
          <SideBtn key={item.id} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />
        ))}
        <div className="flex-1" />
        <InstallPWA variant="sidebar" />
        <SideBtn id="ai" icon={MessageSquareMore} label="AI Asisten" activeTab={activeTab} setActiveTab={setActiveTab} />
        <SideBtn id="settings" icon={Settings} label="Pengaturan" activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[13px] font-semibold text-slate-900 leading-none capitalize">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? activeTab}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatChips stats={stats} />
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <LogOut size={14} />
              Keluar
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
