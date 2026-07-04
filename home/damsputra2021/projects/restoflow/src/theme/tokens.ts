/**
 * ═══════════════════════════════════════════════════
 * PILOTPOS DESIGN TOKENS — Single Source of Truth
 * ═══════════════════════════════════════════════════
 *
 * Semua komponen WAJIB menggunakan token dari file ini.
 * JANGAN hardcode warna, radius, shadow, spacing, dll.
 *
 * Cara pakai:
 *   import { tokens } from '@/theme/tokens';
 *   <div style={{ color: tokens.color.primary }}>...</div>
 *
 * Untuk Tailwind (className), gunakan prefix `pp-`:
 *   bg-pp-primary, text-pp-primary, rounded-pp-md, dll.
 */

// ── TYPE DEFINITIONS ──────────────────────────────────────────────

export interface TokenColorScale {
  DEFAULT: string;
  hover: string;
  soft: string;
  muted: string;
  dark: string;
}

export interface TokenStatusColor {
  DEFAULT: string;
  soft: string;
  border: string;
}

export interface PilotPOSTokens {
  color: {
    /** #2563EB — Brand blue */
    primary: TokenColorScale;
    /** Success green */
    success: TokenStatusColor;
    /** Warning amber */
    warning: TokenStatusColor;
    /** Danger red */
    danger: TokenStatusColor;
    /** Info blue */
    info: TokenStatusColor;

    /** Text hierarchy */
    text: {
      heading: string;
      body: string;
      muted: string;
      placeholder: string;
      inverse: string;
    };

    /** Surfaces & backgrounds */
    surface: {
      bg: string;
      card: string;
      alt: string;
      overlay: string;
    };

    /** Borders */
    border: {
      DEFAULT: string;
      light: string;
      focus: string;
    };

    /** Chart accent (dashboard sparklines, donut) */
    chart: {
      blue: string;
      green: string;
      purple: string;
      orange: string;
    };
  };

  /** Border radius scale */
  radius: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };

  /** Shadow scale */
  shadow: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    /** Brand-colored shadow (glow) */
    brand: string;
    brandLg: string;
  };

  /** Z-index layer system */
  z: {
    base: number;
    dropdown: number;
    sticky: number;
    sidebar: number;
    overlay: number;
    modal: number;
    toast: number;
    tooltip: number;
  };

  /** Motion / animation durations */
  motion: {
    instant: number;
    fast: number;
    normal: number;
    slow: number;
    loading: number;
  };

  /** Typography scale */
  typography: {
    fontFamily: {
      sans: string;
      mono: string;
    };
    size: {
      caption: string;
      label: string;
      body: string;
      subtitle: string;
      heading6: string;
      heading5: string;
      heading4: string;
      heading3: string;
      heading2: string;
      heading1: string;
      display: string;
    };
    weight: {
      normal: number;
      medium: number;
      semibold: number;
      bold: number;
      extrabold: number;
    };
    lineHeight: {
      tight: number;
      normal: number;
      relaxed: number;
    };
    tracking: {
      tight: string;
      normal: string;
      wide: string;
    };
  };

  /** Spacing scale */
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
}

// ── TOKEN VALUES ──────────────────────────────────────────────────

/** Single source of truth for ALL design values */
export const tokens: PilotPOSTokens = {
  color: {
    primary: {
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
      DEFAULT: '#2563EB',
      soft: '#EFF6FF',
      border: '#BFDBFE',
    },

    text: {
      heading: '#0F172A',
      body: '#475569',
      muted: '#64748B',
      placeholder: '#94A3B8',
      inverse: '#FFFFFF',
    },

    surface: {
      bg: '#F8FAFC',
      card: '#FFFFFF',
      alt: '#FAFBFC',
      overlay: 'rgba(15, 23, 42, 0.50)',
    },

    border: {
      DEFAULT: '#E2E8F0',
      light: '#F1F5F9',
      focus: '#2563EB',
    },

    chart: {
      blue: '#378ADD',
      green: '#1D9E75',
      purple: '#7C3AED',
      orange: '#EF9F27',
    },
  },

  radius: {
    xs: '6px',
    sm: '10px',
    md: '14px',
    lg: '20px',
    xl: '24px',
    full: '9999px',
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

  z: {
    base: 0,
    dropdown: 20,
    sticky: 40,
    sidebar: 50,
    overlay: 60,
    modal: 70,
    toast: 100,
    tooltip: 110,
  },

  motion: {
    instant: 100,
    fast: 150,
    normal: 200,
    slow: 350,
    loading: 800,
  },

  typography: {
    fontFamily: {
      sans: '"Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
      mono: '"JetBrains Mono", "Fira Code", ui-monospace, monospace',
    },
    size: {
      caption: '11px',
      label: '12px',
      body: '14px',
      subtitle: '16px',
      heading6: '18px',
      heading5: '20px',
      heading4: '22px',
      heading3: '26px',
      heading2: '32px',
      heading1: '40px',
      display: '56px',
    },
    weight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.7,
    },
    tracking: {
      tight: '-0.02em',
      normal: '-0.01em',
      wide: '0.02em',
    },
  },

  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    '2xl': '48px',
    '3xl': '64px',
  },
};

// ── CONVENIENCE EXPORTS ───────────────────────────────────────────

/** Warna brand utama — shortcut */
export const pp = {
  primary: tokens.color.primary.DEFAULT,
  primaryHover: tokens.color.primary.hover,
  primarySoft: tokens.color.primary.soft,
  bg: tokens.color.surface.bg,
  surface: tokens.color.surface.card,
  border: tokens.color.border.DEFAULT,
  borderLight: tokens.color.border.light,
  textHeading: tokens.color.text.heading,
  textBody: tokens.color.text.body,
  textMuted: tokens.color.text.muted,
  success: tokens.color.success.DEFAULT,
  danger: tokens.color.danger.DEFAULT,
  warning: tokens.color.warning.DEFAULT,
} as const;

/** Chart accent colors — untuk sparkline, donut, bar chart */
export const chartColors = [
  tokens.color.chart.blue,
  tokens.color.chart.green,
  tokens.color.chart.purple,
  tokens.color.chart.orange,
] as const;

/** Motion presets untuk Framer Motion */
export const motionPresets = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: tokens.motion.normal / 1000 },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: tokens.motion.slow / 1000, ease: 'easeOut' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.95 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: tokens.motion.normal / 1000, ease: 'easeOut' },
  },
  slideRight: {
    initial: { opacity: 0, x: -16 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: tokens.motion.slow / 1000, ease: 'easeOut' },
  },
  stagger: {
    container: {
      animate: { transition: { staggerChildren: 0.06 } },
    },
    item: {
      initial: { opacity: 0, y: 12 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: tokens.motion.slow / 1000, ease: 'easeOut' },
    },
  },
} as const;
