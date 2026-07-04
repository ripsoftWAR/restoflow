import { Wallet, Clock } from 'lucide-react';
import { DashboardStats } from '../../types';
import { formatIDR } from '../../utils/api';

interface Props {
  stats: DashboardStats | null;
}

export default function StatChips({ stats }: Props) {
  return (
    <>
      <div className="flex items-center gap-2.5 bg-pp-bg rounded-pp-md px-3 py-2">
        <div className="bg-pp-primary-soft w-[26px] h-[26px] rounded-pp-sm flex items-center justify-center flex-shrink-0">
          <Wallet size={13} className="text-pp-primary" />
        </div>
        <div>
          <p className="text-[9px] font-semibold text-pp-text-muted uppercase tracking-wide leading-none mb-0.5">
            Balance hari ini
          </p>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-pp-primary leading-none">
              {formatIDR(stats?.dailySales ?? 0)}
            </span>
            <span className="text-[9px] font-semibold text-pp-success bg-pp-success-soft px-1.5 py-0.5 rounded">
              +10%
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 bg-pp-bg rounded-pp-md px-3 py-2">
        <div className="bg-pp-primary-soft w-[26px] h-[26px] rounded-pp-sm flex items-center justify-center flex-shrink-0">
          <Clock size={13} className="text-pp-primary" />
        </div>
        <div>
          <p className="text-[9px] font-semibold text-pp-text-muted uppercase tracking-wide leading-none mb-0.5">
            Shift aktif
          </p>
          <span className="text-[12px] font-semibold text-pp-primary leading-none">Shift 1</span>
        </div>
      </div>
    </>
  );
}