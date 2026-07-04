// src/theme.ts — PilotPOS Design System v5
// ⚠️  DEPRECATED — prefer import { tokens } from '@/theme/tokens'
// ⚠️  Single Source of Truth: src/index.css
// Hanya untuk backward compatibility / JS runtime tanpa akses CSS.

export const theme = {
  colors: {
    primary:       '#2563EB',
    primarySoft:   '#EFF6FF',
    primaryHover:  '#1D4ED8',
    primaryMuted:  '#DBEAFE',
    primaryDark:   '#1E40AF',

    success:       '#059669',
    successSoft:   '#ECFDF5',
    successBorder: '#A7F3D0',

    warning:       '#D97706',
    warningSoft:   '#FFFBEB',
    warningBorder: '#FDE68A',

    danger:        '#DC2626',
    dangerSoft:    '#FEF2F2',
    dangerBorder:  '#FECACA',

    info:          '#2563EB',   // ⬅️ FIXED: sama dengan primary (bukan ungu)
    infoSoft:      '#EFF6FF',   // ⬅️ FIXED: sama dengan primary-soft
    infoBorder:    '#BFDBFE',

    text:          '#0F172A',
    textSecondary: '#475569',
    textMuted:     '#64748B',
    textPlaceholder: '#94A3B8',

    bg:            '#F8FAFC',
    surface:       '#FFFFFF',
    surfaceAlt:    '#FAFBFC',

    border:        '#E2E8F0',
    borderLight:   '#F1F5F9',
    borderFocus:   '#2563EB',

    chartBlue:     '#378ADD',
    chartGreen:    '#1D9E75',
    chartPurple:   '#7C3AED',
    chartOrange:   '#EF9F27',
  },

  radius: {
    xs:  '6px',
    sm:  '10px',
    md:  '14px',
    lg:  '20px',
    xl:  '24px',
  },

  shadow: {
    xs:       '0 1px 2px rgba(0, 0, 0, 0.03)',
    sm:       '0 2px 8px rgba(0, 0, 0, 0.04)',
    md:       '0 8px 30px rgba(0, 0, 0, 0.05)',
    lg:       '0 20px 60px rgba(0, 0, 0, 0.07)',
    xl:       '0 30px 80px rgba(0, 0, 0, 0.09)',
    brand:    '0 8px 25px rgba(37, 99, 235, 0.25)',
    brandLg:  '0 16px 40px rgba(37, 99, 235, 0.30)',
  },

  fontSizes: {
    micro:  '10px',
    label:  '11px',
    caption:'12px',
    bodySm: '13px',
    body:   '14px',
    h4:     '16px',
    h3:     '18px',
    h2:     '20px',
    h1:     '24px',
  },

  spacing: {
    0.5: '2px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    6: '24px',
    8: '32px',
    12: '48px',
    16: '64px',
  },

  duration: {
    instant: '100ms',
    fast:    '150ms',
    normal:  '200ms',
    slow:    '350ms',
  },
};
