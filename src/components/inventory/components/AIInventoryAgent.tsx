import { useState } from 'react';
import { Sparkles, CheckCircle2, Circle, Loader2, ArrowUpRight } from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════
   AIInventoryAgent — Pilot AI status agent card
   Menampilkan monitoring aktif untuk inventori
   ═══════════════════════════════════════════════════════════════ */

interface AnalysisTask {
  key: string;
  label: string;
  status: 'done' | 'progress' | 'pending';
}

const DEFAULT_TASKS: AnalysisTask[] = [
  { key: 'daily_usage', label: 'Analisis pemakaian harian', status: 'done' },
  { key: 'restock_prediction', label: 'Prediksi kebutuhan restock', status: 'progress' },
  { key: 'near_limit', label: 'Deteksi bahan mendekati batas', status: 'pending' },
  { key: 'efficiency', label: 'Ringkasan efisiensi gudang', status: 'pending' },
];

interface Props {
  onNavigate?: (tab: string) => void;
}

export default function AIInventoryAgent({ onNavigate = () => {} }: Props) {
  const [tasks] = useState<AnalysisTask[]>(DEFAULT_TASKS);

  return (
    <div className="bg-gradient-to-br from-[#F4F6FF] to-[#EDF1FE] border border-pp-primary-muted rounded-pp-lg p-5 relative overflow-hidden">
      {/* Decorative bg element */}
      <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-pp-primary-soft/60 blur-xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center gap-2 mb-2 relative">
        <div className="w-[30px] h-[30px] rounded-pp-xs bg-pp-primary flex items-center justify-center shadow-pp-brand">
          <Sparkles size={15} className="text-white" strokeWidth={2} />
        </div>
        <h3 className="text-[15.5px] font-bold text-pp-text">Pilot AI</h3>
        <span className="bg-pp-primary text-white text-[10px] font-bold px-1.5 py-0.5 rounded-pp-xs ml-0.5">
          Beta
        </span>
      </div>

      <p className="text-[12.5px] text-pp-text-secondary leading-relaxed mb-4 relative">
        AI Agent untuk membantumu memantau stok inventori lebih cerdas.
      </p>

      {/* Status Box */}
      <div className="bg-white/65 rounded-pp-md p-3.5 relative mb-3">
        {/* Title row */}
        <div className="flex items-center justify-between mb-1">
          <span className="text-[13px] font-bold text-pp-text">Status Agent</span>
          <span className="inline-flex items-center gap-1.5 text-[11.5px] font-semibold text-pp-success">
            <span className="w-1.5 h-1.5 rounded-full bg-pp-success animate-pulse" />
            Aktif
          </span>
        </div>

        <p className="text-[11.5px] text-pp-text-muted mb-3">
          Monitoring inventori PilotPOS
        </p>

        <p className="text-[12px] font-semibold text-[#4B5468] mb-2.5">
          Sedang Analisis
        </p>

        {/* Analysis checklist */}
        <div className="flex flex-col gap-2.5">
          {tasks.map((task) => (
            <div key={task.key} className="flex items-center gap-2.5">
              {/* Status icon */}
              {task.status === 'done' ? (
                <span className="w-4 h-4 rounded-full bg-pp-success flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 size={10} className="text-white" strokeWidth={3} />
                </span>
              ) : task.status === 'progress' ? (
                <span className="w-4 h-4 rounded-full bg-pp-primary flex items-center justify-center flex-shrink-0">
                  <Loader2 size={10} className="text-white animate-spin" strokeWidth={3} />
                </span>
              ) : (
                <span className="w-4 h-4 rounded-full border-2 border-[#D7DCEC] flex-shrink-0" />
              )}
              <span className={`text-[12.5px] ${
                task.status === 'done'
                  ? 'text-pp-text-secondary line-through decoration-pp-success/40'
                  : task.status === 'progress'
                    ? 'text-pp-primary font-medium'
                    : 'text-[#3A4256]'
              }`}>
                {task.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA button */}
      <button
        onClick={() => onNavigate('ai')}
        className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-pp-primary text-white border-none rounded-pp-md text-[13px] font-semibold hover:bg-pp-primary-hover transition-colors cursor-pointer shadow-pp-brand"
      >
        Buka Pilot AI Chat
        <ArrowUpRight size={13} strokeWidth={2.5} />
      </button>
    </div>
  );
}
