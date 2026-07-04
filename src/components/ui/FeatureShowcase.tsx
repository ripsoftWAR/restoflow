import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';

interface FeatureShowcaseProps {
  icon: LucideIcon;
  title: string;
  description: string;
  accent: string; // tailwind color class for gradient
  delay?: number;
}

/**
 * FeatureShowcase — Premium feature card with hover animation,
 * large icon, gradient accent, and subtle shadow lift
 */
export function FeatureShowcase({
  icon: Icon,
  title,
  description,
  accent,
  delay = 0,
}: FeatureShowcaseProps) {
  // Map accent to gradient classes
  const gradientMap: Record<string, { bg: string; border: string; shadow: string; iconBg: string }> = {
    blue: {
      bg: 'from-[#EFF6FF] to-white',
      border: 'hover:border-[#BFDBFE]',
      shadow: 'hover:shadow-[0_12px_40px_-12px_rgba(37,99,235,0.18)]',
      iconBg: 'bg-gradient-to-br from-[#2563EB] to-[#1D4ED8]',
    },
    emerald: {
      bg: 'from-[#ECFDF5] to-white',
      border: 'hover:border-[#A7F3D0]',
      shadow: 'hover:shadow-[0_12px_40px_-12px_rgba(5,150,105,0.18)]',
      iconBg: 'bg-gradient-to-br from-[#059669] to-[#047857]',
    },
    violet: {
      bg: 'from-[#F5F3FF] to-white',
      border: 'hover:border-[#DDD6FE]',
      shadow: 'hover:shadow-[0_12px_40px_-12px_rgba(124,58,237,0.18)]',
      iconBg: 'bg-gradient-to-br from-[#7C3AED] to-[#6D28D9]',
    },
    orange: {
      bg: 'from-[#FFF7ED] to-white',
      border: 'hover:border-[#FED7AA]',
      shadow: 'hover:shadow-[0_12px_40px_-12px_rgba(234,88,12,0.18)]',
      iconBg: 'bg-gradient-to-br from-[#EA580C] to-[#C2410C]',
    },
    teal: {
      bg: 'from-[#F0FDFA] to-white',
      border: 'hover:border-[#99F6E4]',
      shadow: 'hover:shadow-[0_12px_40px_-12px_rgba(13,148,136,0.18)]',
      iconBg: 'bg-gradient-to-br from-[#0D9488] to-[#0F766E]',
    },
    rose: {
      bg: 'from-[#FFF1F2] to-white',
      border: 'hover:border-[#FECDD3]',
      shadow: 'hover:shadow-[0_12px_40px_-12px_rgba(225,29,72,0.18)]',
      iconBg: 'bg-gradient-to-br from-[#E11D48] to-[#BE123C]',
    },
    amber: {
      bg: 'from-[#FFFBEB] to-white',
      border: 'hover:border-[#FDE68A]',
      shadow: 'hover:shadow-[0_12px_40px_-12px_rgba(217,119,6,0.18)]',
      iconBg: 'bg-gradient-to-br from-[#D97706] to-[#B45309]',
    },
  };

  const g = gradientMap[accent] || gradientMap.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.1, 0.25, 1] }}
      whileHover={{ y: -4 }}
      className={`
        group relative bg-white border border-[#F1F5F9] rounded-[20px] p-6
        transition-all duration-300 cursor-default
        ${g.border} ${g.shadow}
      `}
    >
      {/* Subtle gradient background on hover */}
      <div className={`absolute inset-0 rounded-[20px] bg-gradient-to-br ${g.bg} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

      <div className="relative space-y-4">
        {/* Icon — large */}
        <div className={`w-12 h-12 rounded-[14px] ${g.iconBg} flex items-center justify-center shadow-lg shadow-current/20 transition-transform duration-300 group-hover:scale-110`}>
          <Icon size={22} className="text-white" strokeWidth={1.5} />
        </div>

        {/* Content */}
        <div className="space-y-1.5">
          <h3 className="text-[15px] font-semibold text-[#0F172A] tracking-[-0.01em]">
            {title}
          </h3>
          <p className="text-[13px] text-[#64748B] leading-relaxed">
            {description}
          </p>
        </div>

        {/* Subtle "Learn more" indicator */}
        <div className="flex items-center gap-1 text-[12px] font-medium text-[#94A3B8] group-hover:text-[#2563EB] transition-colors">
          <span>Selengkapnya</span>
          <svg className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
