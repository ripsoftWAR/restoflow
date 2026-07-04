import { motion } from 'framer-motion';
import { Heart, Monitor, Printer, Database, RefreshCw } from 'lucide-react';

interface HealthStatus {
  label: string;
  icon: typeof Heart;
  status: 'online' | 'warning' | 'offline';
  detail: string;
}

const HEALTH_ITEMS: HealthStatus[] = [
  { label: 'POS Online',     icon: Monitor,    status: 'online',  detail: 'Sistem berjalan' },
  { label: 'Printer Ready',  icon: Printer,    status: 'online',  detail: 'Thermal printer OK' },
  { label: 'Sinkronisasi',   icon: RefreshCw,  status: 'online',  detail: '2 menit lalu' },
  { label: 'Database Aman',  icon: Database,   status: 'online',  detail: 'Backup tersimpan' },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.15 },
  },
};

const statusItem = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] } },
};

const barItem = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.25, 0.1, 0.25, 1] } },
};

const statusColor = {
  online:  { dot: 'bg-pp-success', pulse: 'bg-pp-success/25', text: 'text-pp-success' },
  warning: { dot: 'bg-pp-warning', pulse: 'bg-pp-warning/25', text: 'text-pp-warning' },
  offline: { dot: 'bg-pp-danger',  pulse: 'bg-pp-danger/25',  text: 'text-pp-danger' },
};

interface Props {
  /** "bar" = compact horizontal strip, "vertical" = sidebar list */
  variant?: 'bar' | 'vertical';
}

export default function HealthMonitor({ variant = 'vertical' }: Props) {
  /* ── Horizontal bar variant ─── */
  if (variant === 'bar') {
    return (
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="bg-pp-surface border border-pp-border rounded-pp-md overflow-hidden shadow-pp-xs"
      >
        <div className="flex items-center gap-1.5 px-4 py-3">
          {/* Label */}
          <Heart size={13} className="text-pp-success flex-shrink-0" />
          <p className="text-[10px] font-semibold text-pp-text-muted uppercase tracking-[0.05em] mr-3">
            Health
          </p>

          {/* Status dots — horizontal */}
          <div className="flex items-center gap-4 flex-1">
            {HEALTH_ITEMS.map((item) => {
              const colors = statusColor[item.status];
              return (
                <motion.div
                  key={item.label}
                  variants={barItem}
                  className="flex items-center gap-1.5"
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-1.5 h-1.5 rounded-full ${colors.dot}`} />
                  </div>
                  <item.icon size={12} className="text-pp-text-placeholder flex-shrink-0" strokeWidth={1.5} />
                  <span className="text-[11px] font-medium text-pp-text-secondary whitespace-nowrap">
                    {item.label}
                  </span>
                  <span className="text-[10px] text-pp-text-muted tabular-nums hidden sm:inline">
                    {item.detail}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>
    );
  }

  /* ── Vertical sidebar variant ─── */
  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <div className="flex items-center gap-2 mb-3">
        <Heart size={13} className="text-pp-success" />
        <p className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-[0.06em]">
          Restaurant Health
        </p>
      </div>

      <div className="bg-pp-surface border border-pp-border rounded-pp-md overflow-hidden divide-y divide-pp-border-light">
        {HEALTH_ITEMS.map((item) => {
          const colors = statusColor[item.status];
          return (
            <motion.div
              key={item.label}
              variants={statusItem}
              className="flex items-center gap-3 px-4 py-3 hover:bg-pp-bg transition-colors duration-150"
            >
              <div className="relative flex-shrink-0">
                <div className={`w-2 h-2 rounded-full ${colors.dot}`} />
                <div className={`absolute inset-0 w-2 h-2 rounded-full ${colors.pulse} animate-ping`} />
              </div>
              <item.icon size={16} className="text-pp-text-muted flex-shrink-0" strokeWidth={1.5} />
              <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                <p className="text-[13px] font-medium text-pp-text truncate">
                  {item.label}
                </p>
                <p className="text-[11px] text-pp-text-muted tabular-nums flex-shrink-0">
                  {item.detail}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
