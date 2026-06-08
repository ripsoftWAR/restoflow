import { Zap, Settings, MessageSquareMore, LogOut, LayoutDashboard, Layers, Utensils, ShoppingCart, Scan, ListOrdered } from 'lucide-react';
import { DashboardStats, NavItem } from '../../types';
import { formatIDR } from '../../utils/api';

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
  activeTab:         string;
  setActiveTab:      (tab: string) => void;
  stats:             DashboardStats | null;
  rolePrimaryTabs:   NavItem[];
  roleSecondaryTabs: NavItem[];
  onLogout:          () => void;
  children:          React.ReactNode;
}

export default function DesktopLayout({ activeTab, setActiveTab, stats, rolePrimaryTabs, roleSecondaryTabs, onLogout, children }: Props) {
  const NavBtn = ({ id, icon: Icon, label }: NavItem) => (
    <button onClick={() => setActiveTab(id)}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
        ${activeTab === id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}>
      <Icon size={17} /> {label}
    </button>
  );

  return (
    <div className="hidden lg:flex h-screen bg-[#F8FAFC]">
      <aside className="w-52 bg-white border-r border-slate-100 flex flex-col py-4 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 mb-6">
          <div className="bg-blue-600 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={14} fill="white" className="text-white" />
          </div>
          <div>
            <h1 className="text-[14px] font-semibold text-slate-900 leading-none">RestFlow</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Finework</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="px-3 space-y-0.5 flex-1">
          <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest px-2 mb-2">Menu Utama</p>
          {rolePrimaryTabs.map(item => <NavBtn key={item.id} {...item} />)}

          {roleSecondaryTabs.length > 0 && (
            <>
              <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest px-2 mt-4 mb-2">Tools</p>
              {roleSecondaryTabs.map(item => <NavBtn key={item.id} {...item} />)}
            </>
          )}
        </nav>

        {/* Stats */}
        <div className="px-3 mt-4 space-y-2">
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Balance hari ini</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-blue-600">{formatIDR(stats?.dailySales ?? 0)}</span>
              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">+10%</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Shift aktif</p>
            <span className="text-[13px] font-semibold text-blue-600">Shift 1</span>
          </div>
        </div>

        {/* Settings */}
        <div className="px-3 mt-3">
          <button onClick={() => setActiveTab('settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all">
            <Settings size={17} /> Pengaturan
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[15px] font-semibold text-slate-800 leading-none capitalize">
              {[...NAV_ITEMS, ...NAV_SECONDARY].find(n => n.id === activeTab)?.label ?? activeTab}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('ai')}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold px-4 py-2 rounded-xl transition-all">
              <MessageSquareMore size={15} /> AI Asisten
            </button>
            <button onClick={onLogout}
              className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[12px] font-semibold px-4 py-2 rounded-xl transition-all">
              <LogOut size={15} /> Keluar
            </button>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}