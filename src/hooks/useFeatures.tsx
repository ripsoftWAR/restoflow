import { createContext, useContext, useMemo, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { UserFeature } from '../types';

// ── Master list 31 feature keys ──────────────────────────────────────────────
export const FEATURE_KEYS = {
  // POS
  'pos.view':               'POS - Lihat Menu',
  'pos.create_transaction': 'POS - Buat Transaksi',
  'pos.view_history':        'POS - Riwayat Transaksi',
  'pos.export_csv':          'POS - Export CSV',
  'pos.export_pdf':          'POS - Export PDF',
  'pos.thermal_print':       'POS - Cetak Thermal',
  'pos.generate_voucher':    'POS - Generate Voucher',
  'pos.apply_voucher':       'POS - Pakai Voucher',
  // Sales
  'sales.view_log':          'Sales - Lihat Log',
  'sales.view_stats':        'Sales - Statistik',
  'sales.export_csv':        'Sales - Export CSV',
  'sales.export_pdf':        'Sales - Export PDF',
  'sales.filter_date':       'Sales - Filter Tanggal',
  // Inventory
  'inventory.view':          'Inventory - Lihat',
  'inventory.add':           'Inventory - Tambah',
  'inventory.edit':          'Inventory - Edit',
  'inventory.delete':        'Inventory - Hapus',
  'inventory.adjust_stock':  'Inventory - Adjust Stok',
  'inventory.view_logs':     'Inventory - Log Movement',
  // Recipes
  'recipes.view':            'Resep - Lihat',
  'recipes.add':             'Resep - Tambah',
  'recipes.edit':            'Resep - Edit',
  'recipes.delete':          'Resep - Hapus',
  // Dashboard
  'dashboard.view':          'Dashboard - Lihat',
  'dashboard.view_stats':    'Dashboard - Statistik',
  'dashboard.view_insights': 'Dashboard - Insights AI',
  // AI
  'ai.chat':                 'AI Chat Assistant',
  // OCR
  'ocr.scan':                'OCR - Scan',
  'ocr.confirm':             'OCR - Konfirmasi',
  // Users
  'users.view':              'Pengguna - Lihat',
  'users.add':               'Pengguna - Tambah',
  'users.edit':              'Pengguna - Edit',
  'users.toggle_active':     'Pengguna - Aktif/Nonaktif',
  'users.reset_pin':         'Pengguna - Reset PIN',
  'users.manage_permissions': 'Pengguna - Kelola Izin',
  // Settings
  'settings.view':           'Pengaturan - Lihat',
} as const;

export type FeatureKey = keyof typeof FEATURE_KEYS;

// ── Grouping untuk UI ────────────────────────────────────────────────────────
export interface FeatureGroup {
  label: string;
  icon: string;
  keys: FeatureKey[];
}

export const FEATURE_GROUPS: FeatureGroup[] = [
  {
    label: 'POS / Kasir',
    icon: '🛒',
    keys: ['pos.view', 'pos.create_transaction', 'pos.view_history', 'pos.export_csv', 'pos.export_pdf', 'pos.thermal_print', 'pos.generate_voucher', 'pos.apply_voucher'],
  },
  {
    label: 'Penjualan / Sales',
    icon: '📊',
    keys: ['sales.view_log', 'sales.view_stats', 'sales.export_csv', 'sales.export_pdf', 'sales.filter_date'],
  },
  {
    label: 'Inventori',
    icon: '📦',
    keys: ['inventory.view', 'inventory.add', 'inventory.edit', 'inventory.delete', 'inventory.adjust_stock', 'inventory.view_logs'],
  },
  {
    label: 'Resep',
    icon: '🍳',
    keys: ['recipes.view', 'recipes.add', 'recipes.edit', 'recipes.delete'],
  },
  {
    label: 'Dashboard',
    icon: '📈',
    keys: ['dashboard.view', 'dashboard.view_stats', 'dashboard.view_insights'],
  },
  {
    label: 'AI & OCR',
    icon: '🤖',
    keys: ['ai.chat', 'ocr.scan', 'ocr.confirm'],
  },
  {
    label: 'Manajemen Pengguna',
    icon: '👥',
    keys: ['users.view', 'users.add', 'users.edit', 'users.toggle_active', 'users.reset_pin', 'users.manage_permissions'],
  },
  {
    label: 'Pengaturan',
    icon: '⚙️',
    keys: ['settings.view'],
  },
];

// ── Context ──────────────────────────────────────────────────────────────────
interface FeaturesContextValue {
  features: UserFeature[];
  can: (key: FeatureKey | string) => boolean;
  isPemilik: boolean;
}

const FeaturesContext = createContext<FeaturesContextValue>({
  features: [],
  can: () => false,
  isPemilik: false,
});

export function FeaturesProvider({
  features,
  isPemilik,
  children,
}: {
  features: UserFeature[];
  isPemilik: boolean;
  children: ReactNode;
}) {
  const featureMap = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const f of features) {
      map.set(f.feature_key, f.enabled);
    }
    return map;
  }, [features]);

  const can = useCallback(
    (key: FeatureKey | string): boolean => {
      // Pemilik selalu bisa semua
      if (isPemilik) return true;
      return featureMap.get(key) ?? false;
    },
    [isPemilik, featureMap]
  );

  const value = useMemo<FeaturesContextValue>(
    () => ({ features, can, isPemilik }),
    [features, can, isPemilik]
  );

  return (
    <FeaturesContext.Provider value={value}>
      {children}
    </FeaturesContext.Provider>
  );
}

export function useFeatures() {
  return useContext(FeaturesContext);
}
