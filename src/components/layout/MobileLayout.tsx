import { Zap, MessageSquareMore, LogOut } from 'lucide-react';
import { NavItem } from '../../types';

interface Props {
  activeTab:       string;
  setActiveTab:    (tab: string) => void;
  rolePrimaryTabs: NavItem[];
  onLogout:        () => void;
  children:        React.ReactNode;
}

export default function MobileLayout({ activeTab, setActiveTab, rolePrimaryTabs, onLogout, children }: Props) {
  return (
    <div className="flex flex-col h-screen bg-[e3e5e6] md:hidden">
      <header className="bg-white border-b border-slate-100 px-4 pt-3 pb-2.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-7 h-7 rounded-lg flex items-center justify-center">
              <Zap size={13} fill="white" className="text-white" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-slate-900 leading-none">RestFlow</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium mt-0.5">
                Powered by Finework
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setActiveTab('ai')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white text-[11px] font-semibold shadow-lg shadow-blue-500/20 transition-all hover:brightness-110">
              <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
                <MessageSquareMore size={14} className="text-white" />
              </span>
              AI Asisten
            </button>
            <button onClick={onLogout}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-slate-100 text-slate-700 text-[11px] font-semibold hover:bg-slate-200 transition-all">
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </header>

      {children}

      <nav className="bg-white border-t border-slate-100 flex-shrink-0 grid grid-cols-4 px-2 py-1.5 safe-area-bottom">
        {rolePrimaryTabs.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
              ${activeTab === id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </nav>
    </div>
  );
}