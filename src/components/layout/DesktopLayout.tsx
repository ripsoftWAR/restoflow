import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Layers, Utensils, ShoppingCart, Scan,
  ListOrdered, Users, Brain, Sparkles, LogOut,
  Settings, Search, Bell, Store, BarChart3,
  Receipt, ClipboardList, Home, Package,
} from 'lucide-react';
import type { DashboardStats, NavItem } from '../../types';
import { formatIDR } from '../../utils/api';
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
  { id: 'recipes',   icon: Utensils,          label: 'Menu' },
  { id: 'inventory', icon: Package,           label: 'Inventori' },
  { id: 'resep',     icon: ListOrdered,       label: 'Resep',       navTo: 'recipes' },
  { id: 'pembelian', icon: ShoppingCart,      label: 'Pembelian',   navTo: 'inventory' },
  { id: 'outlet',    icon: Store,             label: 'Outlet',      navTo: 'settings' },
  { id: 'laporan',   icon: ClipboardList,     label: 'Laporan',     navTo: 'home' },
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
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);
  const isDashboard = activeTab === 'home';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

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

        {/* Pilot AI — Mode Gratis (replaces Upgrade Card) */}
        <div className="mt-4 bg-gradient-to-br from-[#2E4FE0] to-[#5B3FE0] rounded-2xl p-[18px_16px] text-white relative overflow-hidden">
          <div className="w-[34px] h-[34px] rounded-[9px] bg-white/20 flex items-center justify-center mb-[10px]">
            <svg width="17" height="17" viewBox="0 0 24 24" fill="#fff">
              <circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6 8-6s8 2 8 6"/>
            </svg>
          </div>
          <h4 className="text-[14.5px] font-bold mb-[6px]">Pilot AI</h4>
          <p className="text-[12px] leading-[1.5] text-white/85 mb-[14px]">
            AI membantu membaca data penjualan, inventori, dan insight dasar.
          </p>
          <button
            onClick={() => setActiveTab('ai')}
            className="w-full bg-white text-[#2E4FE0] border-none py-[9px] px-[14px] rounded-[9px] text-[13px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer hover:bg-white/90 transition-colors"
          >
            Pelajari AI
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M5 12h14M13 6l6 6-6 6"/>
            </svg>
          </button>
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
        {/* ── HEADER — Hidden on Dashboard (title is in-content) ── */}
        {!isDashboard && (
          <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-[#E9ECF5]/60 px-6 py-3 flex items-center justify-between flex-shrink-0">
            {/* Left: Page title */}
            <div>
              <p className="text-[15px] font-semibold text-[#1B2436] tracking-[-0.01em]">
                {{
                  home: 'Dashboard',
                  inventory: 'Inventori',
                  recipes: 'Menu',
                  sales: 'Penjualan',
                  ocr: 'Scan OCR',
                  logs: 'Log Aktivitas',
                  users: 'Pengguna',
                  ai: 'AI Asisten',
                  settings: 'Pengaturan',
                  pembelian: 'Pembelian',
                  laporan: 'Laporan',
                  outlet: 'Outlet',
                  resep: 'Resep',
                }[activeTab] || activeTab}
              </p>
            </div>

            {/* Right: Search, Notifications, AI, Avatar */}
            <div className="flex items-center gap-1.5">
              <button className="w-9 h-9 flex items-center justify-center rounded-[10px] text-[#6B7280] hover:text-[#1B2436] hover:bg-[#F5F7FC] transition-all duration-150">
                <Search size={18} strokeWidth={1.5} />
              </button>
              <button className="relative w-9 h-9 flex items-center justify-center rounded-[10px] text-[#6B7280] hover:text-[#1B2436] hover:bg-[#F5F7FC] transition-all duration-150">
                <Bell size={18} strokeWidth={1.5} />
                <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#EF4444] border-2 border-white" />
              </button>
              <button
                onClick={() => setActiveTab('ai')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-[10px] text-[12px] font-medium text-[#2E4FE0] bg-[#F2F5FF] hover:bg-[#E7EDFF] transition-all duration-150"
              >
                <Sparkles size={13} strokeWidth={2} />
                AI
              </button>

              <div className="relative ml-2" ref={profileRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="w-8 h-8 rounded-[10px] bg-[#F2F5FF] flex items-center justify-center hover:bg-[#E7EDFF] transition-all duration-150"
                >
                  <span className="text-[13px] font-bold text-[#2E4FE0]">P</span>
                </button>

                <AnimatePresence>
                  {showProfileMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -4 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white border border-[#E9ECF5] rounded-xl shadow-lg overflow-hidden z-50"
                    >
                      <div className="px-4 py-3 border-b border-[#E9ECF5]">
                        <p className="text-[13px] font-semibold text-[#1B2436]">Akun Saya</p>
                        <p className="text-[11px] text-[#9CA3AF] mt-0.5">Pemilik</p>
                      </div>
                      <div className="p-1.5">
                        <button
                          onClick={() => { setActiveTab('settings'); setShowProfileMenu(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#6B7280] hover:bg-[#F3F5FA] hover:text-[#1B2436] transition-all duration-150"
                        >
                          <Settings size={15} strokeWidth={1.5} />
                          Pengaturan
                        </button>
                        <button
                          onClick={() => { setShowProfileMenu(false); onLogout(); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[#6B7280] hover:bg-[#FDECEA] hover:text-[#EF4444] transition-all duration-150"
                        >
                          <LogOut size={15} strokeWidth={1.5} />
                          Keluar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </header>
        )}

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
