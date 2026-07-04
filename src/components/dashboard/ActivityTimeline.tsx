import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Clock, ShoppingCart, Scan, TicketPercent,
  Package, LogIn, Receipt, Utensils,
} from 'lucide-react';
import type { MovementLog, Sale } from '../../types';

interface TimelineEvent {
  time: string;
  icon: typeof Clock;
  text: string;
  color: string;
  bg: string;
}

interface Props {
  movements: MovementLog[];
  sales: Sale[];
}

const EVENT_ICONS: Record<string, { icon: typeof Clock; color: string; bg: string }> = {
  IN:       { icon: Package,        color: 'text-pp-success',        bg: 'bg-pp-success-soft' },
  OUT:      { icon: Receipt,        color: 'text-pp-chart-blue',     bg: 'bg-pp-primary-soft' },
  ADJUST:   { icon: Utensils,       color: 'text-pp-warning',        bg: 'bg-pp-warning-soft' },
  sale:     { icon: ShoppingCart,   color: 'text-pp-primary',        bg: 'bg-pp-primary-soft' },
  login:    { icon: LogIn,          color: 'text-pp-chart-purple',   bg: 'bg-pp-info-soft' },
  ocr:      { icon: Scan,           color: 'text-pp-chart-green',    bg: 'bg-pp-success-soft' },
  voucher:  { icon: TicketPercent,  color: 'text-pp-chart-orange',   bg: 'bg-pp-warning-soft' },
};

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

export default function ActivityTimeline({ movements, sales }: Props) {
  const events = useMemo((): TimelineEvent[] => {
    const result: TimelineEvent[] = [];

    const recentMovements = movements.slice(-6).reverse();
    recentMovements.forEach(m => {
      const meta = EVENT_ICONS[m.type] || EVENT_ICONS['ADJUST'];
      const name = m.ingredient_name || `Bahan #${m.ingredient_id}`;
      const typeLabel = m.type === 'IN' ? 'Stok masuk' : m.type === 'OUT' ? 'Stok keluar' : 'Penyesuaian';
      result.push({
        time: m.created_at,
        icon: meta.icon,
        text: `${typeLabel}: ${name} (${m.amount} ${m.base_unit || ''})`,
        color: meta.color,
        bg: meta.bg,
      });
    });

    const recentSales = sales.slice(-4).reverse();
    recentSales.forEach(s => {
      result.push({
        time: s.created_at || '',
        icon: ShoppingCart,
        text: `Penjualan: ${s.menu_name} x${s.quantity}`,
        color: 'text-pp-primary',
        bg: 'bg-pp-primary-soft',
      });
    });

    result.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
    return result.slice(0, 8);
  }, [movements, sales]);

  if (events.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.25 }}
    >
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <Clock size={13} className="text-pp-text-muted" />
        <p className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-[0.06em]">
          Aktivitas Hari Ini
        </p>
      </div>

      <div className="bg-pp-surface border border-pp-border rounded-pp-md overflow-hidden">
        <div className="p-4">
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[10px] top-1 bottom-1 w-px bg-pp-border-light" />

            <div className="space-y-3.5">
              {events.map((event, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.04 * i, duration: 0.2 }}
                  className="flex items-start gap-3 relative"
                >
                  {/* Dot on the line */}
                  <div className={`relative z-10 w-[22px] h-[22px] rounded-full ${event.bg} flex items-center justify-center flex-shrink-0 border-2 border-pp-surface`}>
                    <event.icon size={10} className={event.color} strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className="text-[12px] text-pp-text-secondary leading-snug">
                      {event.text}
                    </p>
                    <p className="text-[10px] text-pp-text-placeholder mt-0.5 tabular-nums">
                      {formatTime(event.time)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
