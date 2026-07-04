import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles, Brain, TrendingUp, Package, Zap, Clock,
  CheckCircle2, AlertTriangle, ChevronRight, ArrowRight,
  ShoppingBag, BarChart3,
} from 'lucide-react';
import type { Sale, Ingredient, MovementLog } from '../../types';
import { formatIDRCompact } from '../dashboard/shared/utils';

/* ═══════════════════════════════════════════════════════════════
   AI WORKSPACE PANEL — 340px Right Panel
   Compact enterprise AI assistant for dashboard context.
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sales: Sale[];
  ingredients: Ingredient[];
  movements: MovementLog[];
  criticalCount: number;
  stockValue: number;
  onNavigate: (tab: string) => void;
}

/* ── Micro card component ──────────────────── */
function InsightCard({
  icon: Icon,
  label,
  value,
  color,
  bg,
  onClick,
}: {
  icon: typeof Sparkles;
  label: string;
  value: string;
  color: string;
  bg: string;
  onClick?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ x: 3 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-pp-sm hover:bg-pp-bg transition-colors duration-150 text-left group cursor-pointer"
    >
      <div className={`w-8 h-8 rounded-pp-xs ${bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={14} className={color} strokeWidth={1.5} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-[0.04em] leading-tight">
          {label}
        </p>
        <p className="text-[12px] font-medium text-pp-text-secondary truncate mt-0.5">
          {value}
        </p>
      </div>
      <ChevronRight size={12} className="text-pp-text-placeholder opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
    </motion.button>
  );
}

/* ── Status dot indicator ──────────────────── */
function StatusDot({ status }: { status: 'online' | 'warning' | 'critical' }) {
  const colors = {
    online: 'bg-pp-success',
    warning: 'bg-pp-warning',
    critical: 'bg-pp-danger',
  };
  return (
    <span className="relative flex h-2 w-2">
      <span className={`absolute inline-flex h-full w-full rounded-full ${colors[status]} opacity-75`} />
      <span className={`relative inline-flex rounded-full h-2 w-2 ${colors[status]}`} />
    </span>
  );
}

export default function AIWorkspacePanel({
  sales, ingredients, movements, criticalCount, stockValue, onNavigate,
}: Props) {
  /* ── AI-computed insights ────────────────── */
  const insights = useMemo(() => {
    const result: { icon: typeof Sparkles; label: string; value: string; color: string; bg: string; tab?: string }[] = [];

    // 1. Sales today vs yesterday
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todaySales = sales.filter(s => {
      const d = new Date(s.created_at || '');
      return d.toDateString() === today.toDateString();
    });
    const yesterdaySales = sales.filter(s => {
      const d = new Date(s.created_at || '');
      return d.toDateString() === yesterday.toDateString();
    });

    const todayTotal = todaySales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);
    const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);

    if (yesterdayTotal > 0 && todayTotal > 0) {
      const pctChange = Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100);
      result.push({
        icon: TrendingUp,
        label: 'Hari ini vs kemarin',
        value: pctChange > 0 ? `+${pctChange}% · ${formatIDRCompact(todayTotal)}` : `${pctChange}% · ${formatIDRCompact(todayTotal)}`,
        color: pctChange >= 0 ? 'text-pp-success' : 'text-pp-danger',
        bg: pctChange >= 0 ? 'bg-pp-success-soft' : 'bg-pp-danger-soft',
        tab: 'sales',
      });
    } else if (todayTotal > 0) {
      result.push({
        icon: TrendingUp,
        label: 'Penjualan hari ini',
        value: formatIDRCompact(todayTotal),
        color: 'text-pp-primary',
        bg: 'bg-pp-primary-soft',
        tab: 'sales',
      });
    }

    // 2. Stock status
    if (criticalCount === 0) {
      result.push({
        icon: CheckCircle2,
        label: 'Status stok',
        value: 'Semua aman',
        color: 'text-pp-success',
        bg: 'bg-pp-success-soft',
      });
    } else {
      result.push({
        icon: AlertTriangle,
        label: 'Perlu restock',
        value: `${criticalCount} bahan kritis`,
        color: 'text-pp-danger',
        bg: 'bg-pp-danger-soft',
        tab: 'inventory',
      });
    }

    // 3. Top menu
    const menuMap: Record<string, number> = {};
    sales.forEach(s => {
      menuMap[s.menu_name] = (menuMap[s.menu_name] || 0) + (Number(s.quantity) || 0);
    });
    const topMenu = Object.entries(menuMap).sort(([, a], [, b]) => b - a)[0];
    if (topMenu && topMenu[1] > 0) {
      result.push({
        icon: Zap,
        label: 'Menu trending',
        value: `${topMenu[0]} · ${topMenu[1]} porsi`,
        color: 'text-pp-chart-purple',
        bg: 'bg-pp-info-soft',
      });
    }

    // 4. Peak hours
    const hourMap: Record<number, number> = {};
    sales.forEach(s => {
      const d = new Date(s.created_at || '');
      if (!isNaN(d.getTime())) {
        hourMap[d.getHours()] = (hourMap[d.getHours()] || 0) + 1;
      }
    });
    const sortedHours = Object.entries(hourMap).sort(([, a], [, b]) => b - a);
    if (sortedHours.length >= 2) {
      const [h1, h2] = [parseInt(sortedHours[0][0]), parseInt(sortedHours[1][0])].sort((a, b) => a - b);
      result.push({
        icon: Clock,
        label: 'Jam ramai',
        value: `${String(h1).padStart(2, '0')}:00 – ${String(h2 + 1).padStart(2, '0')}:30`,
        color: 'text-pp-chart-blue',
        bg: 'bg-pp-primary-soft',
      });
    }

    // 5. Stock value
    result.push({
      icon: Package,
      label: 'Nilai inventori',
      value: formatIDRCompact(stockValue),
      color: 'text-pp-chart-green',
      bg: 'bg-pp-success-soft',
      tab: 'inventory',
    });

    return result.slice(0, 6);
  }, [sales, ingredients, criticalCount, stockValue]);

  /* ── Restock recommendations ─────────────── */
  const recommendations = useMemo(() => {
    return ingredients
      .filter(i => i.min_stock > 0 && i.stock <= i.min_stock)
      .map(i => ({
        id: i.id,
        name: i.name,
        current: i.stock,
        min: i.min_stock,
        need: Math.max(1, i.min_stock - i.stock),
      }))
      .sort((a, b) => (b.need / b.min) - (a.need / a.min))
      .slice(0, 4);
  }, [ingredients]);

  /* ── Recent activity ─────────────────────── */
  const recentActivity = useMemo(() => {
    const items: { time: string; text: string; type: string }[] = [];
    movements.slice(-3).reverse().forEach(m => {
      const time = new Date(m.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      items.push({ time, text: `${m.type === 'IN' ? 'Masuk' : m.type === 'OUT' ? 'Keluar' : 'Adjust'}: ${m.ingredient_name || '#' + m.ingredient_id}`, type: m.type });
    });
    sales.slice(-2).reverse().forEach(s => {
      const time = new Date(s.created_at || '').toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      items.push({ time, text: `Jual: ${s.menu_name} x${s.quantity}`, type: 'sale' });
    });
    return items.slice(0, 4);
  }, [movements, sales]);

  return (
    <div className="flex flex-col h-full">
      {/* ═══════════════════════════════════════════
          HEADER — Pilot AI
          ═══════════════════════════════════════════ */}
      <div className="px-5 pt-5 pb-3 border-b border-pp-border-light flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-pp-primary w-7 h-7 rounded-pp-xs flex items-center justify-center flex-shrink-0">
            <Sparkles size={14} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-[14px] font-semibold text-pp-text tracking-[-0.01em] leading-tight">
              Pilot AI
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <StatusDot status="online" />
              <span className="text-[10px] font-medium text-pp-success">Agent aktif</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          TODAY'S INSIGHT — Compact cards
          ═══════════════════════════════════════════ */}
      <div className="px-3 py-3 border-b border-pp-border-light flex-shrink-0">
        <p className="text-[10px] font-semibold text-pp-text-placeholder uppercase tracking-[0.06em] px-2 mb-1">
          Today's Insight
        </p>
        <div className="space-y-0.5">
          {insights.map((insight, i) => (
            <InsightCard
              key={i}
              {...insight}
              onClick={insight.tab ? () => onNavigate(insight.tab!) : undefined}
            />
          ))}
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          RECOMMENDATION — Restock suggestions
          ═══════════════════════════════════════════ */}
      {recommendations.length > 0 && (
        <div className="px-3 py-3 border-b border-pp-border-light flex-shrink-0">
          <p className="text-[10px] font-semibold text-pp-text-placeholder uppercase tracking-[0.06em] px-2 mb-2">
            Rekomendasi Restock
          </p>
          <div className="space-y-0.5 px-2">
            {recommendations.map((item) => (
              <div key={item.id} className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-pp-danger flex-shrink-0" />
                  <span className="text-[12px] font-medium text-pp-text-secondary truncate">
                    {item.name}
                  </span>
                </div>
                <span className="text-[11px] text-pp-text-muted tabular-nums flex-shrink-0 ml-2">
                  <span className="text-pp-danger font-semibold">{item.current}</span>
                  <span className="text-pp-text-placeholder">/{item.min}</span>
                </span>
              </div>
            ))}
          </div>
          <motion.button
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate('inventory')}
            className="flex items-center gap-2 w-full justify-center text-[11px] font-semibold text-pp-primary hover:text-pp-primary-hover mt-3 py-1.5 transition-colors duration-150"
          >
            <ShoppingBag size={12} />
            Buat Purchase Order
            <ArrowRight size={12} />
          </motion.button>
        </div>
      )}

      {/* ═══════════════════════════════════════════
          RUNNING ANALYSIS — Recent activity feed
          ═══════════════════════════════════════════ */}
      <div className="px-3 py-3 flex-1 overflow-y-auto">
        <p className="text-[10px] font-semibold text-pp-text-placeholder uppercase tracking-[0.06em] px-2 mb-2">
          Running Analysis
        </p>
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-6">
            <BarChart3 size={18} className="text-pp-text-placeholder" />
            <p className="text-[11px] text-pp-text-muted text-center">
              Menunggu aktivitas terbaru
            </p>
          </div>
        ) : (
          <div className="relative px-2">
            <div className="absolute left-[7px] top-1 bottom-1 w-px bg-pp-border-light" />
            <div className="space-y-3">
              {recentActivity.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.2 }}
                  className="flex items-start gap-2.5 relative"
                >
                  <div className={`relative z-10 w-[16px] h-[16px] rounded-full flex items-center justify-center flex-shrink-0 border-2 border-pp-surface ${
                    event.type === 'IN' ? 'bg-pp-success-soft' :
                    event.type === 'OUT' ? 'bg-pp-primary-soft' :
                    event.type === 'sale' ? 'bg-pp-warning-soft' :
                    'bg-pp-bg'
                  }`}>
                    <div className={`w-1 h-1 rounded-full ${
                      event.type === 'IN' ? 'bg-pp-success' :
                      event.type === 'OUT' ? 'bg-pp-primary' :
                      event.type === 'sale' ? 'bg-pp-warning' :
                      'bg-pp-text-muted'
                    }`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] text-pp-text-secondary leading-snug truncate">
                      {event.text}
                    </p>
                    <p className="text-[10px] text-pp-text-placeholder mt-0.5 tabular-nums">
                      {event.time}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          FOOTER — AI CTA
          ═══════════════════════════════════════════ */}
      <div className="px-4 py-3 border-t border-pp-border-light flex-shrink-0">
        <motion.button
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.97 }}
          onClick={() => onNavigate('ai')}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-pp-sm bg-pp-primary text-white text-[12px] font-semibold hover:bg-pp-primary-hover transition-colors duration-150 shadow-pp-brand"
        >
          <Brain size={14} />
          Tanya AI Assistant
        </motion.button>
      </div>
    </div>
  );
}
