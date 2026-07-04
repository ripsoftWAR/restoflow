import { motion } from 'framer-motion';
import {
  ShoppingCart, Scan, Package, Brain, TicketPercent, FileText,
  ArrowRight, Sparkles,
} from 'lucide-react';

interface ActionItem {
  label: string;
  subtitle: string;
  tab: string;
  icon: typeof ShoppingCart;
  color: string;
  bg: string;
}

const ACTIONS: ActionItem[] = [
  {
    label: 'Kasir',
    subtitle: 'Input pesanan',
    tab: 'sales',
    icon: ShoppingCart,
    color: 'text-pp-success',
    bg: 'bg-pp-success-soft',
  },
  {
    label: 'Scan OCR',
    subtitle: 'Nota otomatis',
    tab: 'ocr',
    icon: Scan,
    color: 'text-pp-primary',
    bg: 'bg-pp-primary-soft',
  },
  {
    label: 'Inventory',
    subtitle: 'Kelola stok',
    tab: 'inventory',
    icon: Package,
    color: 'text-pp-warning',
    bg: 'bg-pp-warning-soft',
  },
  {
    label: 'Tanya AI',
    subtitle: 'Asisten cerdas',
    tab: 'ai',
    icon: Brain,
    color: 'text-pp-chart-purple',
    bg: 'bg-pp-info-soft',
  },
  {
    label: 'Buat Voucher',
    subtitle: 'Promo & diskon',
    tab: 'sales',
    icon: TicketPercent,
    color: 'text-pp-chart-orange',
    bg: 'bg-pp-warning-soft',
  },
  {
    label: 'Lihat Laporan',
    subtitle: 'Analitik lengkap',
    tab: 'home',
    icon: FileText,
    color: 'text-pp-chart-blue',
    bg: 'bg-pp-primary-soft',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.05 },
  },
};

const cardItem = {
  hidden: { opacity: 0, y: 10, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.25, ease: [0.25, 0.1, 0.25, 1] },
  },
};

interface Props {
  onNavigate: (tab: string) => void;
}

export default function ActionCenter({ onNavigate }: Props) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
    >
      {/* Section label */}
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={13} className="text-pp-primary" />
        <p className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-[0.06em]">
          Action Center
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ACTIONS.map(({ label, subtitle, tab, icon: Icon, color, bg }) => (
          <motion.button
            key={tab + label}
            variants={cardItem}
            whileHover={{ y: -3, boxShadow: 'var(--pp-shadow-sm)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onNavigate(tab)}
            className="group relative flex flex-col items-start gap-2.5 p-4 rounded-pp-md border border-pp-border bg-pp-surface cursor-pointer transition-colors duration-200 hover:border-pp-primary/20"
          >
            {/* Icon */}
            <div className={`w-9 h-9 rounded-pp-xs ${bg} flex items-center justify-center transition-transform duration-200 group-hover:scale-110 group-hover:rotate-[-4deg]`}>
              <Icon size={18} className={color} strokeWidth={1.5} />
            </div>

            {/* Text */}
            <div className="text-left">
              <p className="text-[13px] font-semibold text-pp-text transition-colors">
                {label}
              </p>
              <p className="text-[11px] text-pp-text-muted mt-0.5">{subtitle}</p>
            </div>

            {/* Hover arrow */}
            <ArrowRight
              size={13}
              className="absolute top-3 right-3 text-pp-primary opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-2 group-hover:translate-x-0"
            />
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
