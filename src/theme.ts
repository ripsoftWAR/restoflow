// src/theme.ts
export const theme = {
  // 🎨 Warna Utama (dari palette yang sudah dipakai di seluruh project)
  colors: {
    primary: '#378ADD',       // Biru utama (digunakan di semua chart & buttons)
    secondary: '#1D9E75',     // Hijau sekunder (untuk highlight)
    accent: '#7C3AED',        // Ungu (untuk icon & accent)
    success: '#10B981',       // Hijau success
    warning: '#F59E0B',       // Kuning warning
    danger: '#EF4444',        // Merah danger
    neutral: {
      100: '#F3F4F6',
      200: '#E5E7EB',
      300: '#D1D5DB',
      400: '#9CA3AF',
      500: '#6B7280',
      600: '#4B5563',
      700: '#374151',
      800: '#1F2937',
      900: '#111827',
    },
  },

  // 📏 Ukuran Font (standarisasi untuk semua komponen)
  fontSizes: {
    xs: '0.75rem',   // 12px
    sm: '0.875rem',  // 14px
    base: '1rem',    // 16px
    lg: '1.125rem',  // 18px
    xl: '1.25rem',   // 20px
    '2xl': '1.5rem', // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem', // 36px
    '5xl': '3rem',   // 48px
    '6xl': '3.75rem', // 60px
  },

  // 📐 Spacing (untuk margin/padding konsisten)
  spacing: {
    0.5: '2px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '24px',
    6: '32px',
    8: '48px',
    10: '64px',
    12: '80px',
    16: '96px',
    20: '128px',
    24: '160px',
    32: '224px',
  },
};