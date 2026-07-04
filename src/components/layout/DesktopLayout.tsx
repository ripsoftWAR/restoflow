import { Settings, Brain, Sparkles, LogOut, ChevronRight } from 'lucide-react';
import { DashboardStats, NavItem } from '../../types';
import { formatIDR } from '../../utils/api';
import InstallPWA from '../InstallPWA';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: DashboardStats | null;
  rolePrimaryTabs: NavItem[];
  roleSecondaryTabs: NavItem[];
  onLogout: () => void;
  children: React.ReactNode;
}

const NavBtn = ({ id, icon: Icon, label, activeTab, onClick }: NavItem & { activeTab: string; onClick: () => void }) => {
  const isActive = activeTab === id;
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 ${
        isActive
          ? 'bg-[#F3F3FF] text-[#5B5BED]'
          : 'text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5]'
      }`}
    >
      <Icon size={18} strokeWidth={isActive ? 2 : 1.6} />
      {label}
      {isActive && <ChevronRight size={14} className="ml-auto text-[#5B5BED] opacity-70" />}
    </button>
  );
};

const sectionLabelCls = "text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-[0.08em] px-2 mb-2";

export default function DesktopLayout({
  activeTab, setActiveTab, stats, rolePrimaryTabs, roleSecondaryTabs, onLogout, children,
}: Props) {
  return (
    <div className="hidden lg:flex h-screen bg-[#FAFAFA]">
      {/* ── Sidebar ──────────────────────────── */}
      <aside className="w-60 bg-white border-r border-[#F5F5F5] flex flex-col py-6 flex-shrink-0">
        {/* Logo — cleaner */}
        <div className="px-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="bg-[#5B5BED] w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-white text-sm font-bold tracking-tight">R</span>
            </div>
            <div>
              <h1 className="text-[16px] font-semibold tracking-[-0.02em] text-[#171717]">
                RestoFlow
              </h1>
              <p className="text-[10px] text-[#A3A3A3] tracking-wide mt-0.5">Management System</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-0.5 flex-1">
          <p className={sectionLabelCls}>Menu</p>
          {rolePrimaryTabs.map(item => (
            <NavBtn
              key={item.id}
              {...item}
              activeTab={activeTab}
              onClick={() => setActiveTab(item.id)}
            />
          ))}

          {roleSecondaryTabs.length > 0 && (
            <>
              <p className={`${sectionLabelCls} mt-6`}>Tools</p>
              {roleSecondaryTabs.map(item => (
                <NavBtn
                  key={item.id}
                  {...item}
                  activeTab={activeTab}
                  onClick={() => setActiveTab(item.id)}
                />
              ))}
            </>
          )}
        </nav>

        {/* Quick stats — more subtle */}
        <div className="px-3 mb-3">
          <div className="bg-[#FAFAFA] rounded-xl px-4 py-3 border border-[#F5F5F5]">
            <p className="text-[10px] font-semibold text-[#A3A3A3] uppercase tracking-[0.06em] mb-1">
              Hari Ini
            </p>
            <span className="text-[15px] font-semibold text-[#171717] tabular-nums tracking-[-0.02em]">
              {formatIDR(stats?.dailySales ?? 0)}
            </span>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-3 space-y-0.5 border-t border-[#F5F5F5] pt-3">
          <InstallPWA variant="sidebar" />
          <button
            onClick={() => setActiveTab('ai')}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-[#737373] hover:text-[#171717] hover:bg-[#F5F5F5] transition-all duration-150"
          >
            <Brain size={18} strokeWidth={1.6} />
            AI Asisten
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium text-[#737373] hover:text-[#B91C1C] hover:bg-[#FEF2F2] transition-all duration-150"
          >
            <LogOut size={18} strokeWidth={1.6} />
            Keluar
          </button>
        </div>
      </aside>

      {/* ── Main area ────────────────────────── */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar — breadcrumb style, cleaner */}
        <header className="bg-white border-b border-[#F5F5F5] px-8 py-3.5 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[15px] font-semibold text-[#171717] tracking-[-0.01em]">
              {activeTab === 'home' ? 'Dasbor' :
               activeTab === 'inventory' ? 'Inventori' :
               activeTab === 'recipes' ? 'Resep' :
               activeTab === 'sales' ? 'Penjualan' :
               activeTab === 'ocr' ? 'Scan OCR' :
               activeTab === 'logs' ? 'Log Aktivitas' :
               activeTab === 'users' ? 'Pengguna' :
               activeTab}
            </p>
            <p className="text-[12px] text-[#A3A3A3] mt-0.5 tracking-wide">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <InstallPWA variant="topbar" />
            <button
              onClick={() => setActiveTab('ai')}
              className="flex items-center gap-2 bg-[#5B5BED] hover:bg-[#4A4AD6] text-white text-[12px] font-medium px-4 py-2 rounded-xl transition-colors"
            >
              <Brain size={14} strokeWidth={2} />
              AI Asisten
            </button>
            <button
              onClick={onLogout}
              className="flex items-center gap-2 bg-white hover:bg-[#F5F5F5] text-[#737373] text-[12px] font-medium px-4 py-2 rounded-xl border border-[#F5F5F5] transition-colors"
            >
              <LogOut size={14} strokeWidth={2} />
              Keluar
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="relative flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
