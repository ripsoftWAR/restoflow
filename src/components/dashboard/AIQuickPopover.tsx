import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Brain, RefreshCw, ArrowRight, X,
  AlertTriangle,
} from 'lucide-react';
import type { Sale, Ingredient } from '../../types';
import { apiFetch } from '../../utils/api';

/* ═══════════════════════════════════════════════════════════════
   AIQuickPopover — klik Pilot AI → insight LOKAL langsung muncul
   → paralel panggil Claude → transisi mulus ganti konten AI
   
   Design Pattern: "Inline AI Quick Popover"
   - Instant: local insights render IMMEDIATELY saat popover terbuka
   - Enhance: AI response menggantikan saat sudah tersedia
   - Arrow: ▲ triangle pointing UP to the trigger button
   - States: idle → local-insights → (loading AI bg) → AI result | error
   - Close: ✕ button | Escape key | click outside
   ═══════════════════════════════════════════════════════════════ */

interface QuickInsight {
  icon: string;
  bold: string;
  detail: string;
}

interface Props {
  sales: Sale[];
  ingredients: Ingredient[];
  criticalCount: number;
  stockValue: number;
  totalOmset: number;
  totalTx: number;
  onNavigate: (tab: string) => void;
  onResult?: (text: string) => void;
  /** Pre-computed local insights — shown instantly while AI loads */
  quickInsights?: QuickInsight[];
}

/* ── Build context string dari data bisnis ───────────────── */
function buildContext(sales: Sale[], ingredients: Ingredient[], criticalCount: number, stockValue: number, totalOmset: number, totalTx: number): string {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  // Today sales
  const todaySales = sales.filter(s => {
    const d = new Date(s.created_at || '');
    return d.toDateString() === today.toDateString();
  });
  const todayTotal = todaySales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
  const todayQty = todaySales.reduce((sum, s) => sum + (Number(s.quantity) || 0), 0);

  // Yesterday sales
  const yesterdaySales = sales.filter(s => {
    const d = new Date(s.created_at || '');
    return d.toDateString() === yesterday.toDateString();
  });
  const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);

  // Weekly sales
  const weeklySales = sales.filter(s => {
    const d = new Date(s.created_at || '');
    return d >= weekAgo;
  });
  const weeklyTotal = weeklySales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);

  // Top menu
  const menuMap: Record<string, number> = {};
  weeklySales.forEach(s => {
    menuMap[s.menu_name] = (menuMap[s.menu_name] || 0) + (Number(s.quantity) || 0);
  });
  const topMenus = Object.entries(menuMap)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([name, qty]) => `${name} (${qty} porsi)`);

  // Critical items
  const critical = ingredients
    .filter(i => i.min_stock > 0 && i.stock <= i.min_stock)
    .map(i => `${i.name}: stok ${i.stock}/${i.min_stock} ${i.base_unit}`);

  // Payment methods
  const paymentMap: Record<string, number> = {};
  weeklySales.forEach(s => {
    const method = s.payment_method || 'Tunai';
    paymentMap[method] = (paymentMap[method] || 0) + (Number(s.total_price) || 0);
  });

  const lines = [
    `📊 DATA BISNIS HARI INI:`,
    `- Omset hari ini: Rp ${todayTotal.toLocaleString()} (${todayQty} transaksi)`,
    `- Omset kemarin: Rp ${yesterdayTotal.toLocaleString()}`,
    `- Omset 7 hari: Rp ${weeklyTotal.toLocaleString()}`,
    `- Total transaksi: ${totalTx}`,
    ``,
    `🍽️ MENU:`,
    `- Top 3 minggu ini: ${topMenus.join(' | ') || 'Belum ada data'}`,
    ``,
    `📦 STOK:`,
    `- Total nilai inventori: Rp ${stockValue.toLocaleString()}`,
    `- Bahan kritis (stok ≤ min): ${criticalCount} item`,
    critical.length > 0 ? critical.map(c => `  • ${c}`).join('\n') : '  • Semua stok aman',
    ``,
    `💳 PEMBAYARAN (7 hari):`,
    ...Object.entries(paymentMap).map(([method, amount]) => `- ${method}: Rp ${amount.toLocaleString()}`),
  ];

  return lines.join('\n');
}

export default function AIQuickPopover({
  sales, ingredients, criticalCount, stockValue, totalOmset, totalTx, onNavigate, onResult, quickInsights,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [aiText, setAiText] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [error, setError] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [isOpen]);

  const handleOpen = async () => {
    if (isOpen) {
      setIsOpen(false);
      return;
    }

    // ✅ BUKA popover INSTAN — local insights sudah siap tampil
    setIsOpen(true);
    setAiText('');
    setError('');

    // 🔄 AI fetch di background (tidak blocking tampilan)
    setLoadingAi(true);
    const context = buildContext(sales, ingredients, criticalCount, stockValue, totalOmset, totalTx);

    try {
      const response = await apiFetch('/api/gemini/chat/quick-summary', {
        method: 'POST',
        body: JSON.stringify({ context })
      });

      if (!response.ok) throw new Error('Gagal menghubungi AI');
      const data = await response.json();
      setAiText(data.text);
      onResult?.(data.text);
    } catch (err: any) {
      setError(err.message || 'Gagal mengambil insight');
    } finally {
      setLoadingAi(false);
    }
  };

  // ── Render helpers ───────────────────────────────────────
  const renderText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      const parts = line.split(/(\*\*.*?\*\*)/g).map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-bold text-[#1B2436]">{part.slice(2, -2)}</strong>;
        }
        return part;
      });

      if (!line.trim()) return <div key={idx} className="h-2" />;

      return (
        <p key={idx} className="text-[13px] leading-[1.6] text-[#3A4256] mb-1 last:mb-0">
          {parts}
        </p>
      );
    });
  };

  const renderLocalInsights = (insights: QuickInsight[]) => (
    <div className="flex flex-col gap-[10px]">
      {insights.map((insight, i) => (
        <div
          key={i}
          className="flex gap-[10px] rounded-xl p-3 bg-[#F2F5FF]"
        >
          <span className="text-[16px] mt-0.5">{insight.icon}</span>
          <div className="text-[12.5px] leading-[1.45] text-[#3A4256]">
            <b className="font-bold text-[#1B2436]">{insight.bold}</b>
            <br />
            {insight.detail}
          </div>
        </div>
      ))}
    </div>
  );

  const hasLocalInsights = quickInsights && quickInsights.length > 0;
  const showLocal = hasLocalInsights && !aiText && !error;

  return (
    <>
      {/* ── Trigger button ─────────────────────────────── */}
      <button
        ref={buttonRef}
        onClick={handleOpen}
        className="w-full bg-[#2E4FE0] text-white border-none rounded-[11px] py-3 text-[13px] font-semibold flex items-center justify-center gap-[6px] cursor-pointer hover:bg-[#1F3FBF] transition-colors"
      >
        <Sparkles size={14} strokeWidth={2} />
        Tanya Pilot AI
        <ArrowRight size={14} />
      </button>

      {/* ── Popover ────────────────────────────────────── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.22, 0.61, 0.36, 1] }}
            className="absolute right-0 top-[calc(100%+10px)] w-[400px] max-w-[calc(100vw-2rem)] bg-white border border-[#E9ECF5] rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.12),0_0_0_1px_rgba(0,0,0,0.03)] z-[100] overflow-hidden"
          >
            {/* ── Arrow (▲) pointing up to button ──── */}
            <div className="absolute -top-[7px] right-[18px] w-[14px] h-[14px] bg-white border-l border-t border-[#E9ECF5] rotate-45 rounded-[2px]" />
            {/* Header */}
            <div className="px-4 py-3 border-b border-[#E9ECF5] flex items-center justify-between bg-gradient-to-r from-[#F8FAFF] to-white">
              <div className="flex items-center gap-2.5">
                <div className="w-[26px] h-[26px] rounded-[8px] bg-[#2E4FE0] flex items-center justify-center shadow-[0_2px_6px_rgba(46,79,224,0.2)]">
                  <Brain size={13} className="text-white" />
                </div>
                <div>
                  <h4 className="text-[13px] font-bold text-[#1B2436] leading-tight">Pilot AI</h4>
                  <p className="text-[10px] text-[#9CA3AF]">Analisis real-time</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-[26px] h-[26px] rounded-lg flex items-center justify-center text-[#9CA3AF] hover:bg-[#F3F5FA] hover:text-[#4B5468] transition-colors"
              >
                <X size={14} strokeWidth={2} />
              </button>
            </div>

            {/* Content */}
            <div className="px-4 py-3.5 max-h-[300px] overflow-y-auto">
              {/* ── AI loading (subtle banner, konten tetap terlihat) ── */}
              {loadingAi && (
                <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 rounded-lg bg-[#F0F4FF] border border-[#E0E8FF]">
                  <RefreshCw size={12} className="text-[#2E4FE0] animate-spin" />
                  <span className="text-[11px] text-[#4A6CF7] font-medium">
                    Pilot AI menganalisis data...
                  </span>
                </div>
              )}

              {/* ── LOCAL INSIGHTS (instant) ── */}
              {showLocal && renderLocalInsights(quickInsights!)}

              {/* ── AI RESULT (ganti local insights saat sudah ready) ── */}
              {aiText && <div>{renderText(aiText)}</div>}

              {/* ── Error ── */}
              {error && (
                <div className="flex flex-col items-center justify-center py-4 gap-2">
                  <div className="w-[36px] h-[36px] rounded-full bg-[#FEF2F2] flex items-center justify-center">
                    <AlertTriangle size={16} className="text-[#EF4444]" />
                  </div>
                  <p className="text-[12.5px] text-[#EF4444] font-medium text-center">{error}</p>
                  <button
                    onClick={handleOpen}
                    className="mt-1 text-[11.5px] text-[#2E4FE0] font-semibold hover:underline cursor-pointer"
                  >
                    Coba lagi →
                  </button>
                </div>
              )}

              {/* ── True empty (no local insights, no AI, no error) ── */}
              {!loadingAi && !error && !aiText && !hasLocalInsights && (
                <div className="flex flex-col items-center justify-center py-5 gap-2">
                  <Sparkles size={18} className="text-[#9CA3AF]" />
                  <p className="text-[12px] text-[#9CA3AF]">Klik ulang untuk analisis baru</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-2.5 border-t border-[#E9ECF5] bg-[#F8FAFF] flex items-center justify-between">
              <span className="text-[10.5px] text-[#9CA3AF]">
                {loadingAi ? '🔄 Menganalisis dengan AI...' : aiText ? '💡 Klik tombol untuk analisis ulang' : '📊 Insight real-time dari database'}
              </span>
              <button
                onClick={() => { setIsOpen(false); onNavigate('ai'); }}
                className="flex items-center gap-1 text-[11.5px] font-semibold text-[#2E4FE0] hover:text-[#1F3FBF] transition-colors cursor-pointer"
              >
                Chat Lengkap
                <ArrowRight size={12} strokeWidth={2.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
