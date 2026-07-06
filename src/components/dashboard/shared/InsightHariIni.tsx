import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Loader2, Sparkles } from 'lucide-react';
import type { Sale, Ingredient, MovementLog } from '../../../types';
import { formatIDRCompact } from './utils';

/* ═══════════════════════════════════════════════════════════════
   InsightHariIni — Shared insight component
   Used by: Dashboard RightSidebar, Inventory right panel
   ═══════════════════════════════════════════════════════════════ */

interface InsightItem {
  type: 'success' | 'warning' | 'info';
  icon: string;
  title: string;
  detail: string;
  analysisType: 'sales' | 'stock' | 'menu' | 'profit';
}

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

/* ── Cache ────────────────────────────────────── */
const insightResponseCache: Record<string, string> = {};

try {
  const stored = sessionStorage.getItem('pilot_insight_cache');
  if (stored) {
    const parsed = JSON.parse(stored);
    Object.assign(insightResponseCache, parsed);
  }
} catch { /* ignore */ }

function persistCache() {
  try {
    sessionStorage.setItem('pilot_insight_cache', JSON.stringify(insightResponseCache));
  } catch { /* ignore */ }
}

function generateLocalResponse(insight: InsightItem): string {
  switch (insight.analysisType) {
    case 'sales':
      return `${insight.title}. ${insight.detail}.\n\nFaktor utama:\n• Traffic jam makan siang yang konsisten tinggi\n• Menu best-seller mendominasi transaksi\n\nSaran:\n• Optimalkan stok menu terlaris\n• Pantau tren per jam untuk prediksi akurat.`;
    case 'stock':
      return `${insight.title}. ${insight.detail}.\n\nRekomendasi:\n• Segera lakukan restock sebelum jam sibuk\n• Naikkan batas minimum stok untuk buffer\n• Cek ketersediaan & harga di supplier terdekat`;
    case 'menu':
      return `${insight.title}. ${insight.detail}.\n\nAnalisis:\n• Menu ini kontributor utama omset minggu ini\n• Pertimbangkan bundling dengan menu lain\n• Pastikan supply chain bahan baku stabil`;
    case 'profit':
      return `${insight.title}. ${insight.detail}.\n\nStrategi:\n• Naikkan margin via efisiensi bahan baku\n• Evaluasi harga jual vs kompetitor\n• Pantau food cost ratio mingguan`;
    default:
      return `${insight.title}. ${insight.detail}.`;
  }
}

/* ═══════════════════════════════════════════════════════════════
   MAIN
   ═══════════════════════════════════════════════════════════════ */
export default function InsightHariIni({
  sales, ingredients, movements, criticalCount, onNavigate, totalOmset, totalTx, stockValue,
}: Props) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [insightResponses, setInsightResponses] = useState<Record<number, string>>({});
  const [insightLoading, setInsightLoading] = useState<Record<number, boolean>>({});

  const rawApiBaseUrl = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');
  const normalizeApiBaseUrl = (url: string) => {
    if (!url) return '';
    if (/^https?:\/\//.test(url)) return url.replace(/\/$/, '');
    return `https://${url.replace(/\/$/, '')}`;
  };
  const apiBaseUrl = normalizeApiBaseUrl(rawApiBaseUrl);
  const resolveApiUrl = useCallback((url: string) =>
    url.startsWith('http') ? url : (apiBaseUrl ? `${apiBaseUrl}${url}` : url),
  [apiBaseUrl]);

  /* ── Compute insights from real data ──────── */
  const insights: InsightItem[] = useMemo(() => {
    const result: InsightItem[] = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todaySales = sales.filter(s => {
      const d = s.created_at ? new Date(s.created_at) : null;
      return d && d >= today;
    });
    const yesterdaySales = sales.filter(s => {
      const d = s.created_at ? new Date(s.created_at) : null;
      return d && d >= yesterday && d < today;
    });

    const todayTotal = todaySales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
    const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
    const todayTxCount = todaySales.length;

    if (todayTotal > 0) {
      if (yesterdayTotal > 0) {
        const pct = Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100);
        if (pct !== 0) {
          const avgTx = todayTxCount > 0 ? Math.round(todayTotal / todayTxCount) : 0;
          result.push({
            type: pct > 0 ? 'success' : 'warning',
            icon: pct > 0 ? '📈' : '📉',
            title: `Omset ${pct > 0 ? 'naik' : 'turun'} ${Math.abs(pct)}%`,
            detail: `${formatIDRCompact(todayTotal)} hari ini • rata² ${formatIDRCompact(avgTx)}/transaksi`,
            analysisType: 'sales',
          });
        } else {
          result.push({
            type: 'info', icon: '📊',
            title: `Omset stabil ${formatIDRCompact(todayTotal)}`,
            detail: `${todayTxCount} transaksi • rata² ${formatIDRCompact(todayTxCount > 0 ? Math.round(todayTotal / todayTxCount) : 0)}/transaksi`,
            analysisType: 'sales',
          });
        }
      } else {
        result.push({
          type: 'info', icon: '🆕',
          title: `Omset hari ini ${formatIDRCompact(todayTotal)}`,
          detail: `${todayTxCount} transaksi sejauh ini`,
          analysisType: 'sales',
        });
      }
    }

    if (criticalCount > 0) {
      const criticalItems = ingredients
        .filter(i => i.stock <= (i.min_stock || 0))
        .sort((a, b) => a.stock - b.stock);
      if (criticalItems.length > 0) {
        const worst = criticalItems[0];
        const recentMovements = movements.filter(m => m.ingredient_id === worst.id && m.type === 'OUT');
        const dailyUsage = recentMovements.length > 0
          ? recentMovements.reduce((s, m) => s + (Number(m.amount) || 0), 0) / Math.max(1, recentMovements.length)
          : 0;
        const estimatedDays = dailyUsage > 0 ? Math.floor(worst.stock / dailyUsage) : null;
        const urgency = estimatedDays !== null
          ? `estimasi habis ${estimatedDays} hari lagi`
          : `stok tinggal ${worst.stock} ${worst.base_unit}`;
        result.push({
          type: 'warning', icon: '⚠️',
          title: `${worst.name} kritis`,
          detail: `${urgency} • ${criticalCount} bahan di bawah minimum`,
          analysisType: 'stock',
        });
      }
    }

    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const recentSales = sales.filter(s => {
      const d = s.created_at ? new Date(s.created_at) : null;
      return d && d >= weekAgo;
    });

    if (recentSales.length > 0) {
      const menuStats: Record<string, { qty: number; revenue: number }> = {};
      recentSales.forEach(s => {
        const name = s.menu_name || 'Unknown';
        if (!menuStats[name]) menuStats[name] = { qty: 0, revenue: 0 };
        menuStats[name].qty += Number(s.quantity) || 0;
        menuStats[name].revenue += Number(s.total_price) || 0;
      });
      const totalRevenue = Object.values(menuStats).reduce((s, m) => s + m.revenue, 0);
      const sorted = Object.entries(menuStats).sort((a, b) => b[1].qty - a[1].qty);

      if (sorted.length > 0) {
        const [name, stats] = sorted[0];
        const contributionPct = totalRevenue > 0 ? Math.round((stats.revenue / totalRevenue) * 100) : 0;
        result.push({
          type: 'info', icon: '⭐',
          title: `${name} terlaris`,
          detail: `${stats.qty} porsi • ${contributionPct}% kontribusi omset minggu ini`,
          analysisType: 'menu',
        });
      }

      if (sorted.length >= 3 && result.length < 4) {
        const byAvgPrice = Object.entries(menuStats)
          .map(([name, s]) => ({ name, avgPrice: s.qty > 0 ? s.revenue / s.qty : 0 }))
          .sort((a, b) => b.avgPrice - a.avgPrice);
        if (byAvgPrice.length > 0 && byAvgPrice[0].avgPrice > 0) {
          result.push({
            type: 'success', icon: '💰',
            title: `${byAvgPrice[0].name} margin tertinggi`,
            detail: `rata² ${formatIDRCompact(Math.round(byAvgPrice[0].avgPrice))}/porsi • dorong penjualannya`,
            analysisType: 'profit',
          });
        }
      }
    }

    return result.slice(0, 4);
  }, [sales, ingredients, movements, criticalCount]);

  /* ── Accordion handler ─────────────────────── */
  const handleInsightClick = useCallback(async (idx: number) => {
    if (expandedIdx === idx) { setExpandedIdx(null); return; }
    setExpandedIdx(idx);
    const cacheKey = `${idx}-${insights[idx]?.title}`;
    if (insightResponseCache[cacheKey]) {
      setInsightResponses(prev => ({ ...prev, [idx]: insightResponseCache[cacheKey] }));
      return;
    }
    if (insightResponses[idx]) return;

    setInsightLoading(prev => ({ ...prev, [idx]: true }));
    const insight = insights[idx];
    const localResponse = generateLocalResponse(insight);
    const authToken = typeof window !== 'undefined' ? localStorage.getItem('restoflow_session_id') : null;

    try {
      const response = await fetch(resolveApiUrl('/api/gemini/chat/quick-summary'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({
          context: `Analisis spesifik: ${insight.title}. ${insight.detail}. Berikan rekomendasi singkat sebagai business advisor.`,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        const text = data.text || localResponse;
        insightResponseCache[cacheKey] = text;
        persistCache();
        setInsightResponses(prev => ({ ...prev, [idx]: text }));
      } else {
        throw new Error('API error');
      }
    } catch {
      const fallback = localResponse;
      insightResponseCache[cacheKey] = fallback;
      persistCache();
      setInsightResponses(prev => ({ ...prev, [idx]: fallback }));
    } finally {
      setInsightLoading(prev => ({ ...prev, [idx]: false }));
    }
  }, [expandedIdx, insightResponses, insights, resolveApiUrl]);

  const renderAiText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (!line.trim()) return <div key={idx} className="h-1.5" />;
      return <p key={idx} className="text-[13px] leading-relaxed text-pp-text-secondary mb-0.5 last:mb-0">{line}</p>;
    });
  };

  const bgMap: Record<string, string> = {
    success: 'bg-pp-success-soft', warning: 'bg-pp-warning-soft', info: 'bg-pp-primary-soft',
  };
  const borderLeftMap: Record<string, string> = {
    success: 'border-l-pp-success', warning: 'border-l-pp-warning', info: 'border-l-pp-primary',
  };

  /* ══════════════════════════════════════════════
     RENDER
     ══════════════════════════════════════════════ */
  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-6">
      <h3 className="text-base font-semibold text-pp-text mb-0.5">Insight Hari Ini</h3>
      <p className="text-xs text-pp-text-muted mb-4">
        Update {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
        {' • '}Klik untuk rekomendasi AI
      </p>

      {insights.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-12 h-12 rounded-pp-md bg-pp-bg flex items-center justify-center">
            <Sparkles size={22} className="text-pp-text-placeholder" />
          </div>
          <p className="text-[13px] text-pp-text-muted text-center">Belum cukup data untuk analisis</p>
          <p className="text-xs text-pp-text-placeholder text-center">Insight akan muncul setelah ada aktivitas penjualan & inventori</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {insights.map((insight, i) => {
            const isExpanded = expandedIdx === i;
            const isLoading = insightLoading[i];
            const response = insightResponses[i];
            return (
              <div key={i}>
                <motion.button
                  onClick={() => handleInsightClick(i)}
                  className={`w-full flex gap-3 rounded-pp-md p-3 text-left cursor-pointer transition-colors border-l-[3px] ${bgMap[insight.type]} ${borderLeftMap[insight.type]} ${isExpanded ? 'shadow-pp-sm' : ''}`}
                  whileTap={{ scale: 0.985 }}
                >
                  <span className="text-base mt-0.5 flex-shrink-0">{insight.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] leading-snug text-pp-text-secondary">
                      <b className="font-semibold text-pp-text">{insight.title}</b>
                      <br />
                      <span className="text-xs text-pp-text-muted">{insight.detail}</span>
                    </div>
                  </div>
                  <motion.span className="flex-shrink-0 text-pp-text-placeholder mt-1" animate={{ rotate: isExpanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </motion.span>
                </motion.button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 0.61, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="pt-3 pb-1">
                        <div className="bg-pp-primary-soft rounded-pp-md p-4 border border-pp-info-border/50">
                          <div className="flex items-center gap-2 mb-3">
                            <div className="w-5 h-5 rounded-full bg-pp-primary flex items-center justify-center flex-shrink-0">
                              <Sparkles size={10} className="text-white" />
                            </div>
                            <span className="text-[11px] font-semibold text-pp-primary tracking-wide uppercase">Pilot AI</span>
                            {!isLoading && response && (
                              <span className="ml-auto text-[10px] text-pp-text-placeholder">✓ Tersimpan</span>
                            )}
                          </div>
                          <div className="mb-3">
                            {isLoading ? (
                              <div className="flex items-center gap-2 py-1">
                                <Loader2 size={13} className="text-pp-primary animate-spin" />
                                <span className="text-[13px] text-pp-text-muted">Menganalisis...</span>
                              </div>
                            ) : response ? (
                              renderAiText(response)
                            ) : (
                              <p className="text-[13px] text-pp-text-placeholder">Menunggu respons...</p>
                            )}
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onNavigate('ai'); }}
                            className="flex items-center gap-1 text-xs font-semibold text-pp-primary hover:text-pp-primary-hover transition-colors cursor-pointer"
                          >
                            Buka Chat Lengkap
                            <ArrowRight size={11} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
