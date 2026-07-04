import {
  Settings,
  Brain,
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
    className={`w-11 h-11 rounded-pp-md flex items-center justify-center transition-colors ${
      activeTab === id
        ? 'bg-pp-primary-soft text-pp-primary'
        : 'text-pp-text-muted hover:bg-pp-bg hover:text-pp-text-secondary'
    }`}
  >
    <Icon size={20} strokeWidth={activeTab === id ? 2 : 1.6} />
  </button>
);

export default function TabletLayout({ activeTab, setActiveTab, stats, onLogout, children }: Props) {
  return (
    <div className="hidden md:flex lg:hidden h-screen bg-pp-bg">
      {/* Sidebar icon-only */}
      <aside className="w-16 bg-pp-surface border-r border-pp-border flex flex-col items-center py-4 gap-1 flex-shrink-0">
        {/* Logo */}
        <div className="bg-pp-primary w-9 h-9 rounded-pp-sm mb-4 shadow-pp-brand" />
        {NAV_ITEMS.map(item => (
          <SideBtn key={item.id} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />
        ))}
        <div className="w-7 h-px bg-pp-border my-1" />
        {NAV_SECONDARY.map(item => (
          <SideBtn key={item.id} {...item} activeTab={activeTab} setActiveTab={setActiveTab} />
        ))}
        <div className="flex-1" />
        <InstallPWA variant="sidebar" />
        <SideBtn id="ai" icon={Brain} label="AI Asisten" activeTab={activeTab} setActiveTab={setActiveTab} />
        <SideBtn id="settings" icon={Settings} label="Pengaturan" activeTab={activeTab} setActiveTab={setActiveTab} />
      </aside>

      {/* Main */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="sticky top-0 z-40 bg-pp-surface/75 backdrop-blur-xl border-b border-pp-border/60 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[13px] font-semibold text-pp-text leading-none capitalize">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? activeTab}
            </p>
            <p className="text-[10px] text-pp-text-muted mt-0.5">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatChips stats={stats} />
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 rounded-pp-md border border-pp-border bg-pp-surface px-3 py-2 text-xs font-semibold text-pp-text-secondary hover:bg-pp-bg transition-colors"
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
