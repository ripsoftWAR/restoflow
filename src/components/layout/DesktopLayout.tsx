import {
  LayoutDashboard, Users, BarChart3,
  Package, Scan, Settings, Utensils,
} from 'lucide-react';
import type { DashboardStats, NavItem } from '../../types';
import InstallPWA from '../InstallPWA';

/* ═══════════════════════════════════════════════════════════════
   MOCKUP-STYLE SIDEBAR NAV ITEMS — flat list, no groups
   ═══════════════════════════════════════════════════════════════ */

interface MockNavItem {
  id: string;
  icon: typeof LayoutDashboard;
  label: string;
  navTo?: string; // optional redirect target (for sub-items that route to parent tab)
}

const MOCKUP_NAV: MockNavItem[] = [
  { id: 'home',      icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'sales',     icon: BarChart3,        label: 'Penjualan' },
  { id: 'inventory', icon: Package,           label: 'Inventori' },
  { id: 'recipes',   icon: Utensils,          label: 'Resep' },
  { id: 'ocr',       icon: Scan,             label: 'Scan OCR' },
  { id: 'users',     icon: Users,             label: 'Pengguna' },
  { id: 'settings',  icon: Settings,          label: 'Pengaturan' },
];

/* ═══════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  stats: DashboardStats | null;
  rolePrimaryTabs: NavItem[];
  roleSecondaryTabs: NavItem[];
  onLogout: () => void;
  children: React.ReactNode;
  rightPanel?: React.ReactNode;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN LAYOUT
   ═══════════════════════════════════════════════════════════════ */

export default function DesktopLayout({
  activeTab, setActiveTab, stats, onLogout, children, rightPanel,
}: Props) {
  const isDashboard = activeTab === 'home';

  return (
    <div
      className="hidden lg:grid h-screen"
      style={{
        gridTemplateColumns: rightPanel && isDashboard
          ? '236px 1fr 340px'
          : '236px 1fr',
        backgroundColor: '#F3F5FA',
      }}
    >
      {/* ═══════════════════════════════════════════════
          SIDEBAR — Mockup style, 236px
          ═══════════════════════════════════════════════ */}
      <aside className="bg-white border-r border-[#E9ECF5] flex flex-col py-[22px] px-4 flex-shrink-0 overflow-y-auto">
        {/* Brand */}
        <div className="flex items-center gap-[10px] px-2 pb-6">
          <div className="w-[38px] h-[38px] rounded-[10px] bg-gradient-to-br from-[#3E6DF6] to-[#1F3FBF] flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L3 7l9 5 9-5-9-5z" fill="#fff"/>
              <path d="M3 12l9 5 9-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <div className="font-bold text-[16.5px] leading-[1.1] text-[#1B2436]">PilotPOS</div>
            <div className="text-[11px] text-[#9CA3AF] mt-0.5">Restaurant POS System</div>
          </div>
        </div>

        {/* Navigation — flat list style */}
        <nav className="flex flex-col gap-0.5 flex-1">
          {MOCKUP_NAV.map((item) => {
            const targetTab = item.navTo || item.id;
            const isActive = activeTab === item.id || activeTab === targetTab;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(targetTab)}
                className={`flex items-center gap-[11px] px-3 py-[10px] rounded-[10px] text-[14px] font-medium transition-all duration-150 cursor-pointer ${
                  isActive
                    ? 'bg-[#F2F5FF] text-[#2E4FE0] font-semibold border border-[#E7EDFF]'
                    : 'text-[#4B5468] border border-transparent hover:bg-[#F5F7FC]'
                }`}
              >
                <item.icon size={18} strokeWidth={isActive ? 2 : 1.6} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Outlet Box */}
        <div className="mt-[14px] border border-[#E9ECF5] rounded-xl p-3 px-[14px]">
          <div className="text-[11px] text-[#9CA3AF] mb-[6px]">Outlet Aktif</div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-[#1B2436] flex items-center gap-[6px]">
              <span className="w-[7px] h-[7px] rounded-full bg-[#18A659] inline-block" />
              PilotPOS Jakarta
            </span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="2">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
          <div className="text-[11px] text-[#9CA3AF] ml-[13px]">Pusat</div>
        </div>

        {/* Bottom actions */}
        <div className="mt-3 border-t border-[#E9ECF5] pt-3">
          <InstallPWA variant="sidebar" />
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════
          MAIN AREA
          ═══════════════════════════════════════════════ */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* ── Content ───────────────────────────── */}
        <div className="relative flex-1 overflow-y-auto">
          {children}
        </div>
      </div>

      {/* ═══════════════════════════════════════════════
          RIGHT PANEL — Only for dashboard
          ═══════════════════════════════════════════════ */}
      {rightPanel && isDashboard && (
        <aside className="border-l border-[#E9ECF5] flex flex-col overflow-y-auto flex-shrink-0 bg-transparent">
          {rightPanel}
        </aside>
      )}
    </div>
  );
}
