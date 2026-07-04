/**
 * PilotPOS Design System v5 — TypeScript Token Definitions
 *
 * SINGLE SOURCE OF TRUTH: src/index.css (@theme block + :root)
 * File ini adalah mirror TypeScript untuk runtime usage.
 *
 * Import:
 *   import { tokens, pp, motionPresets, chartColors } from '@/theme';
 */

/* ─── Type Definitions ──────────────────────── */
export interface TokenColorScale {
  DEFAULT: string;
  hover?: string;
  soft: string;
  muted?: string;
  dark?: string;
  border?: string;
}

export interface TokenStatusColor {
  DEFAULT: string;
  soft: string;
  border: string;
}

export interface PilotPOSTokens {
  primary: TokenColorScale;
  success: TokenStatusColor;
  warning: TokenStatusColor;
  danger: TokenStatusColor;
  info: TokenStatusColor;
  text: {
    heading: string;
    body: string;
    muted: string;
    placeholder: string;
  };
  bg: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderLight: string;
  borderFocus: string;
  radius: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl', string>;
  shadow: Record<'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'brand' | 'brandLg', string>;
  duration: Record<'instant' | 'fast' | 'normal' | 'slow', string>;
  zIndex: Record<'dropdown' | 'sticky' | 'sidebar' | 'overlay' | 'modal' | 'toast' | 'tooltip', number>;
}

/* ─── Tokens ────────────────────────────────── */
export const tokens: PilotPOSTokens = {
  primary: {
    /** #2563EB — Brand blue */
    DEFAULT: '#2563EB',
    hover: '#1D4ED8',
    soft: '#EFF6FF',
    muted: '#DBEAFE',
    dark: '#1E40AF',
  },

  success: {
    DEFAULT: '#059669',
    soft: '#ECFDF5',
    border: '#A7F3D0',
  },

  warning: {
    DEFAULT: '#D97706',
    soft: '#FFFBEB',
    border: '#FDE68A',
  },

  danger: {
    DEFAULT: '#DC2626',
    soft: '#FEF2F2',
    border: '#FECACA',
  },

  info: {
    /** Sama dengan primary — #2563EB, bukan ungu */
    DEFAULT: '#2563EB',
    soft: '#EFF6FF',
    border: '#BFDBFE',
  },

  text: {
    heading: '#0F172A',
    body: '#475569',
    muted: '#64748B',
    placeholder: '#94A3B8',
  },

  bg: '#F8FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFBFC',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  borderFocus: '#2563EB',

  radius: {
    xs: '6px',
    sm: '10px',
    md: '14px',
    lg: '20px',
    xl: '24px',
  },

  shadow: {
    xs: '0 1px 2px rgba(0, 0, 0, 0.03)',
    sm: '0 2px 8px rgba(0, 0, 0, 0.04)',
    md: '0 8px 30px rgba(0, 0, 0, 0.05)',
    lg: '0 20px 60px rgba(0, 0, 0, 0.07)',
    xl: '0 30px 80px rgba(0, 0, 0, 0.09)',
    brand: '0 8px 25px rgba(37, 99, 235, 0.25)',
    brandLg: '0 16px 40px rgba(37, 99, 235, 0.30)',
  },

  duration: {
    instant: '100ms',
    fast: '150ms',
    normal: '200ms',
    slow: '350ms',
  },

  zIndex: {
    dropdown: 20,
    sticky: 40,
    sidebar: 50,
    overlay: 60,
    modal: 70,
    toast: 100,
    tooltip: 110,
  },
};

/* ─── Convenience Aliases ───────────────────── */
/** Short alias — `pp.primary` = `tokens.primary.DEFAULT` */
export const pp = {
  primary: tokens.primary.DEFAULT,
  primaryHover: tokens.primary.hover,
  primarySoft: tokens.primary.soft,
  primaryMuted: tokens.primary.muted,
  primaryDark: tokens.primary.dark,

  success: tokens.success.DEFAULT,
  successSoft: tokens.success.soft,
  successBorder: tokens.success.border,

  warning: tokens.warning.DEFAULT,
  warningSoft: tokens.warning.soft,
  warningBorder: tokens.warning.border,

  danger: tokens.danger.DEFAULT,
  dangerSoft: tokens.danger.soft,
  dangerBorder: tokens.danger.border,

  info: tokens.info.DEFAULT,
  infoSoft: tokens.info.soft,
  infoBorder: tokens.info.border,

  text: tokens.text.heading,
  textSecondary: tokens.text.body,
  textMuted: tokens.text.muted,
  textPlaceholder: tokens.text.placeholder,

  bg: tokens.bg,
  surface: tokens.surface,
  surfaceAlt: tokens.surfaceAlt,
  border: tokens.border,
  borderLight: tokens.borderLight,
  borderFocus: tokens.borderFocus,
};

/* ─── Chart Colors ──────────────────────────── */
export const chartColors = {
  blue: '#378ADD',
  green: '#1D9E75',
  purple: '#7C3AED',
  orange: '#EF9F27',
};

/* ─── Motion Presets ────────────────────────── */
export const motionPresets = {
  /** Content entrance — use pp-animate-in class */
  animateIn: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] },
  },

  /** Fade only */
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  /** Scale in — modal, popover */
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.2, ease: 'easeOut' },
  },

  /** Slide from right — drawer, panel */
  slideRight: {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.35, ease: 'easeOut' },
  },

  /** Slide from bottom — toast, notification */
  slideUp: {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.35, ease: 'easeOut' },
  },

  /** Stagger children */
  stagger: (delay = 0.05) => ({
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay, duration: 0.3, ease: 'easeOut' },
  }),

  /** Card hover lift */
  cardLift: {
    whileHover: { y: -4, boxShadow: tokens.shadow.lg },
    transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] },
  },

  /** Button press */
  buttonPress: {
    whileTap: { scale: 0.97 },
    transition: { duration: 0.15, ease: 'easeOut' },
  },
};
