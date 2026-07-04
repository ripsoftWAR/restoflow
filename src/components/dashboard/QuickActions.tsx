/* ═══════════════════════════════════════════════════════════════
   QuickActions — 4 action buttons: Tambah Menu, Buat Promo, Tambah Stok, Laporan Harian
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  onNavigate: (tab: string) => void;
}

const ACTIONS = [
  {
    title: 'Tambah Menu',
    subtitle: 'Buat menu baru',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E4FE0" strokeWidth="2">
        <path d="M4 19V5a2 2 0 012-2h9l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2z"/><path d="M12 11v6M9 14h6"/>
      </svg>
    ),
    iconBg: 'bg-[#F2F5FF]',
    tab: 'recipes',
  },
  {
    title: 'Buat Promo',
    subtitle: 'Buat promo/voucher',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2">
        <circle cx="12" cy="12" r="9"/><path d="M12 8v4l3 3"/>
      </svg>
    ),
    iconBg: 'bg-[#F1E9FE]',
    tab: 'sales', // navigates to Penjualan where promo management lives
  },
  {
    title: 'Tambah Stok',
    subtitle: 'Update inventori',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#149355" strokeWidth="2">
        <path d="M21 8L12 3 3 8l9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 12v5"/>
      </svg>
    ),
    iconBg: 'bg-[#E4F7EC]',
    tab: 'inventory',
  },
  {
    title: 'Laporan Harian',
    subtitle: 'Ringkasan hari ini',
    icon: (
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2E4FE0" strokeWidth="2">
        <path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6"/><rect x="12" y="8" width="3" height="10"/><rect x="17" y="5" width="3" height="13"/>
      </svg>
    ),
    iconBg: 'bg-[#E7EDFF]',
    tab: 'home', // returns to dashboard overview for daily reports
  },
];

export default function QuickActions({ onNavigate }: Props) {
  return (
    <div className="bg-white border border-[#E9ECF5] rounded-2xl p-5 h-full">
      <div className="text-[15.5px] font-bold text-[#1B2436] mb-[2px]">Aksi Cepat</div>
      <div className="grid grid-cols-4 gap-[14px] mt-[14px] max-[760px]:grid-cols-2">
        {ACTIONS.map(action => (
          <button
            key={action.title}
            onClick={() => onNavigate(action.tab)}
            className="flex items-center gap-[11px] border border-[#E9ECF5] rounded-xl p-[13px] bg-white hover:border-[#E7EDFF] hover:bg-[#F2F5FF] transition-colors cursor-pointer text-left"
          >
            <div className={`w-[36px] h-[36px] rounded-[9px] flex items-center justify-center flex-shrink-0 ${action.iconBg}`}>
              {action.icon}
            </div>
            <div>
              <div className="text-[13px] font-semibold text-[#1B2436]">{action.title}</div>
              <div className="text-[11px] text-[#9CA3AF] mt-0.5">{action.subtitle}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
