import { Sparkles, CheckCircle2, ArrowRight } from 'lucide-react';
import type { Sale, Ingredient, MovementLog } from '../../types';
import InsightHariIni from './shared/InsightHariIni';

/* ═══════════════════════════════════════════════════════════════
   RightSidebar — Pilot AI Dashboard Monitoring Panel
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sales: Sale[];
  ingredients: Ingredient[];
  movements: MovementLog[];
  criticalCount: number;
  stockValue: number;
  totalOmset: number;
  totalTx: number;
  onNavigate: (tab: string) => void;
}

const COMPLETED_TASKS = [
  'Analisis Penjualan',
  'Analisis Inventori',
  'Prediksi Restock',
  'Analisis Voucher',
  'Analisis Customer',
] as const;

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */
export default function RightSidebar({
  sales, ingredients, movements, criticalCount, onNavigate, totalOmset, totalTx, stockValue,
}: Props) {
  return (
    <div className="flex flex-col gap-4">
      {/* ═══════════════════════════════════════════
          PILOT AI — SIMPLE CLEAN CARD
          ═══════════════════════════════════════════ */}
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-6">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="w-8 h-8 rounded-pp-sm bg-pp-primary flex items-center justify-center shadow-pp-brand">
            <Sparkles size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-pp-text leading-tight">Pilot AI</h3>
          </div>
          <span className="bg-pp-primary text-white text-[11px] font-semibold px-2 py-0.5 rounded-pp-xs ml-auto">
            Beta
          </span>
        </div>

        <p className="text-[13px] text-pp-text-secondary leading-relaxed mb-4">
          Asisten AI untuk monitoring & analisis bisnis restoranmu secara real-time.
        </p>

        <div className="bg-pp-bg rounded-pp-md p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 size={16} className="text-pp-success" />
            <span className="text-[13px] font-semibold text-pp-text">Agent Siap</span>
            <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-pp-success">
              <span className="w-1.5 h-1.5 rounded-full bg-pp-success" />
              Aktif
            </span>
          </div>
          <div className="flex flex-col gap-2">
            {COMPLETED_TASKS.map((task, i) => (
              <div key={i} className="flex items-center gap-2 text-[13px] text-pp-text-secondary">
                <span className="w-[18px] h-[18px] rounded-full bg-pp-success flex items-center justify-center flex-shrink-0">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </span>
                <span>{task}</span>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={() => onNavigate('ai')}
          className="w-full bg-pp-primary text-white rounded-pp-md py-3 text-sm font-semibold flex items-center justify-center gap-2 hover:bg-pp-primary-hover transition-colors shadow-pp-brand cursor-pointer"
        >
          <Sparkles size={14} strokeWidth={2} />
          Buka Pilot AI Chat
          <ArrowRight size={14} />
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          INSIGHT HARI INI — Shared component
          ═══════════════════════════════════════════ */}
      <InsightHariIni
        sales={sales}
        ingredients={ingredients}
        movements={movements}
        criticalCount={criticalCount}
        stockValue={stockValue}
        totalOmset={totalOmset}
        totalTx={totalTx}
        onNavigate={onNavigate}
      />

      {/* ═══════════════════════════════════════════
          QUOTE AI
          ═══════════════════════════════════════════ */}
      <div className="rounded-pp-lg p-[18px_20px] bg-gradient-to-r from-[#EFF3FF] to-[#E7ECFB] border border-[#E7EDFF] flex gap-[14px] items-start">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="#2E4FE0" opacity="0.5" className="flex-shrink-0 mt-0.5">
          <path d="M7 7h4v4c0 2.2-1.8 4-4 4v2c3.3 0 6-2.7 6-6V7H7zm10 0h4v4c0 2.2-1.8 4-4 4v2c3.3 0 6-2.7 6-6V7h-6z"/>
        </svg>
        <div>
          <p className="text-[13.5px] leading-[1.55] text-[#3A4256] font-medium">
            Data yang akurat hari ini, keputusan yang lebih baik esok hari.
          </p>
          <div className="mt-2 text-[11.5px] text-[#2E4FE0] font-bold">
            — Pilot AI
          </div>
        </div>
      </div>
    </div>
  );
}
