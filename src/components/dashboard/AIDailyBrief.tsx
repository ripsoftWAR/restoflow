import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Package, ChevronRight, Clock, Zap } from 'lucide-react';
import type { Sale, Ingredient } from '../../types';
import { formatIDRCompact } from './shared/utils';

interface Props {
  sales: Sale[];
  ingredients: Ingredient[];
  onNavigate: (tab: string) => void;
}

export default function AIDailyBrief({ sales, ingredients, onNavigate }: Props) {
  // ── AI-computed insights ──────────────────
  const insights = useMemo(() => {
    const result: { icon: typeof TrendingUp; text: string; color: string }[] = [];

    // 1. Sales prediction
    const todaySales = sales.filter(s => {
      const d = new Date(s.created_at || '');
      const today = new Date();
      return d.toDateString() === today.toDateString();
    });
    const todayTotal = todaySales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);

    // Yesterday sales
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdaySales = sales.filter(s => {
      const d = new Date(s.created_at || '');
      return d.toDateString() === yesterday.toDateString();
    });
    const yesterdayTotal = yesterdaySales.reduce((sum, s) => sum + (Number(s.total_price) || 0), 0);

    if (yesterdayTotal > 0 && todayTotal > 0) {
      const pctChange = Math.round(((todayTotal - yesterdayTotal) / yesterdayTotal) * 100);
      if (pctChange > 0) {
        result.push({
          icon: TrendingUp,
          text: `Penjualan diprediksi naik ${pctChange}% hari ini`,
          color: 'text-pp-success',
        });
      } else if (pctChange < -5) {
        result.push({
          icon: TrendingUp,
          text: `Penjualan ${Math.abs(pctChange)}% di bawah kemarin — evaluasi strategi`,
          color: 'text-pp-warning',
        });
      }
    } else if (todayTotal > 0) {
      result.push({
        icon: TrendingUp,
        text: `Penjualan hari ini: ${formatIDRCompact(todayTotal)}`,
        color: 'text-pp-primary',
      });
    }

    // 2. Stock status
    const critical = ingredients.filter(i => i.stock <= (i.min_stock || 0));
    if (critical.length === 0) {
      result.push({
        icon: Package,
        text: 'Tidak ada stok kritis — semua aman',
        color: 'text-pp-success',
      });
    } else if (critical.length <= 2) {
      result.push({
        icon: Package,
        text: `${critical.length} bahan mendekati stok minimum`,
        color: 'text-pp-warning',
      });
    } else {
      result.push({
        icon: Package,
        text: `${critical.length} bahan perlu restock segera`,
        color: 'text-pp-danger',
      });
    }

    // 3. Top trending menu
    const menuMap: Record<string, number> = {};
    sales.forEach(s => {
      menuMap[s.menu_name] = (menuMap[s.menu_name] || 0) + (Number(s.quantity) || 0);
    });
    const topMenu = Object.entries(menuMap).sort(([, a], [, b]) => b - a)[0];
    if (topMenu && topMenu[1] > 0) {
      result.push({
        icon: Zap,
        text: `Menu "${topMenu[0]}" sedang trending — ${topMenu[1]} porsi terjual`,
        color: 'text-pp-primary',
      });
    }

    // 4. Peak hours
    const hourMap: Record<number, number> = {};
    sales.forEach(s => {
      const d = new Date(s.created_at || '');
      if (!isNaN(d.getTime())) {
        const h = d.getHours();
        hourMap[h] = (hourMap[h] || 0) + 1;
      }
    });
    const sortedHours = Object.entries(hourMap).sort(([, a], [, b]) => b - a);
    if (sortedHours.length >= 2) {
      const peak1 = parseInt(sortedHours[0][0]);
      const peak2 = parseInt(sortedHours[1][0]);
      const [h1, h2] = [peak1, peak2].sort((a, b) => a - b);
      result.push({
        icon: Clock,
        text: `Jam ramai: ${String(h1).padStart(2, '0')}:00–${String(h2 + 1).padStart(2, '0')}:30`,
        color: 'text-pp-chart-purple',
      });
    }

    return result;
  }, [sales, ingredients]);

  if (insights.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="relative overflow-hidden rounded-pp-lg border border-pp-border bg-pp-surface p-5"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-pp-xs bg-pp-primary-soft flex items-center justify-center">
            <Sparkles size={18} className="text-pp-primary" />
          </div>
          <div>
            <h3 className="text-[15px] font-semibold text-pp-text">AI Daily Brief</h3>
            <p className="text-[12px] text-pp-text-muted mt-0.5">
              AI akan memberikan insight setelah ada data transaksi
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="relative overflow-hidden rounded-pp-lg border border-pp-primary/10 bg-pp-surface"
    >
      {/* Subtle gradient background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, rgba(37,99,235,0.03) 0%, rgba(37,99,235,0.01) 50%, transparent 100%)',
        }}
      />

      <div className="relative p-5 sm:p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-pp-xs bg-pp-primary-soft flex items-center justify-center">
              <Sparkles size={18} className="text-pp-primary" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-pp-text tracking-[-0.01em]">
                AI Daily Brief
              </h3>
              <p className="text-[11px] text-pp-text-muted mt-0.5">
                Hari ini AI menemukan:
              </p>
            </div>
          </div>

          {/* CTA */}
          <motion.button
            whileHover={{ x: 2 }}
            onClick={() => onNavigate('ai')}
            className="hidden sm:flex items-center gap-1.5 text-[12px] font-medium text-pp-primary hover:text-pp-primary-hover transition-colors"
          >
            Lihat Insight
            <ChevronRight size={13} />
          </motion.button>
        </div>

        {/* Insight list */}
        <div className="space-y-2.5">
          {insights.map((insight, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.08, duration: 0.3 }}
              className="flex items-start gap-3"
            >
              <insight.icon size={15} className={`${insight.color} flex-shrink-0 mt-0.5`} strokeWidth={1.5} />
              <span className="text-[13px] text-pp-text-secondary leading-relaxed">
                {insight.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Mobile CTA */}
        <motion.button
          whileHover={{ x: 2 }}
          onClick={() => onNavigate('ai')}
          className="sm:hidden flex items-center gap-1.5 text-[12px] font-medium text-pp-primary mt-4"
        >
          Lihat Insight
          <ChevronRight size={13} />
        </motion.button>
      </div>
    </motion.div>
  );
}
