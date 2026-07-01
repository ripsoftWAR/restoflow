import { MapPin, MessageSquareMore, LogOut } from 'lucide-react';
import { NavItem } from '../../types';
import InstallPWA from '../InstallPWA';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  rolePrimaryTabs: NavItem[];
  onLogout: () => void;
  children: React.ReactNode;
}

export default function MobileLayout({ activeTab, setActiveTab, rolePrimaryTabs, onLogout, children }: Props) {
  return (
    <div className="flex flex-col h-screen bg-slate-50 md:hidden">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 pt-3 pb-2.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            <div className="bg-gradient-to-br from-blue-600 to-blue-500 w-8 h-8 rounded-2xl flex items-center justify-center shadow-sm shadow-blue-200">
              <MapPin size={14} fill="white" className="text-white" strokeWidth={1.5} />
            </div>
            <div>
              <h1 className="text-[15px] font-extrabold tracking-[-0.02em] leading-none">
                <span className="text-slate-900">Pilot</span>
                <span className="text-blue-600">POS</span>
              </h1>
              <p className="text-[10px] text-slate-400 mt-0.5">Restaurant POS System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 text-white text-[11px] font-semibold shadow-sm shadow-blue-200 transition-colors hover:bg-blue-700"
            >
              <MessageSquareMore size={13} />
              AI
            </button>
            <InstallPWA variant="mobile-header" compact />
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 text-[11px] font-semibold hover:bg-slate-50 transition-colors"
            >
              <LogOut size={13} />
              Keluar
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      {children}

      {/* Bottom Nav */}
      <nav className="bg-white border-t border-slate-200 flex-shrink-0 grid grid-cols-4 px-2 py-1.5 safe-area-bottom">
        {rolePrimaryTabs.slice(0, 4).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-xl text-[11px] font-medium transition-colors ${
              activeTab === id
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Icon size={19} strokeWidth={activeTab === id ? 2 : 1.6} />
            <span className="truncate max-w-[64px]">{label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
