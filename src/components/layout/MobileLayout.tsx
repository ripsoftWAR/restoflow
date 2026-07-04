import { Brain, LogOut } from 'lucide-react';
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
    <div className="flex flex-col h-screen bg-pp-bg md:hidden">
      {/* Header — sticky glass */}
      <header className="sticky top-0 z-40 bg-pp-surface/75 backdrop-blur-xl border-b border-pp-border/60 px-4 pt-3 pb-2.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2.5">
            {/* Logo */}
            <div className="bg-pp-primary w-7 h-7 rounded-pp-xs flex-shrink-0 shadow-pp-brand" />
            <div>
              <h1 className="text-[15px] font-extrabold tracking-[-0.02em] leading-none">
                <span className="text-pp-text">Pilot</span>
                <span className="text-pp-primary">POS</span>
              </h1>
              <p className="text-[10px] text-pp-text-muted mt-0.5">Restaurant Operating System</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('ai')}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pp-md bg-pp-primary text-white text-[11px] font-semibold shadow-pp-brand transition-colors hover:bg-pp-primary-hover"
            >
              <Brain size={13} />
              AI
            </button>
            <InstallPWA variant="mobile-header" compact />
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-pp-md bg-pp-surface border border-pp-border text-pp-text-secondary text-[11px] font-semibold hover:bg-pp-bg transition-colors"
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
      <nav className="bg-pp-surface border-t border-pp-border flex-shrink-0 grid grid-cols-4 px-2 py-1.5 safe-area-bottom">
        {rolePrimaryTabs.slice(0, 4).map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex flex-col items-center justify-center gap-0.5 py-1 rounded-pp-md text-[11px] font-medium transition-colors ${
              activeTab === id
                ? 'text-pp-primary'
                : 'text-pp-text-muted hover:text-pp-text-secondary'
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
