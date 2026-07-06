import type { ComponentType } from 'react';

export type BaseUnit = 'gram' | 'ml' | 'pcs';

export interface Ingredient {
  id: number;
  restaurant_id?: number;
  name: string;
  category?: string;
  supplier?: string;
  stock: number; // selalu disimpan dalam base_unit (gram, ml, pcs)
  base_unit: BaseUnit;
  min_stock: number; // dalam base_unit
  unit_price: number; // harga per buy_unit (cth: Rp 120.000/kg, Rp 66.667/kaleng)
  buy_unit?: string; // unit pembelian (cth: kaleng, dus, karung)
  conversion_factor: number; // 1 buy_unit = X base_unit
  sku?: string;
  reorder_point?: number; // titik pemesanan ulang dalam base_unit
  storage_capacity?: number; // kapasitas penyimpanan maksimum
  storage_capacity_unit?: string; // satuan kapasitas (cth: kaleng, liter, kg)
  created_at?: string;
  updated_at?: string;
}

// ─── Helper Functions ───────────────────────────
/** Stok ditampilkan dalam buy_unit (cth: 593 kaleng) */
export function stockInBuyUnit(ing: Ingredient): number {
  if (!ing.conversion_factor || ing.conversion_factor === 0) return ing.stock;
  return ing.stock / ing.conversion_factor;
}

/** Harga per 1 buy_unit — unit_price SUDAH dalam per buy_unit */
export function pricePerBuyUnit(ing: Ingredient): number {
  return ing.unit_price;
}

/** Total nilai stok = (stock / conversion_factor) × unit_price */
export function totalStockValue(ing: Ingredient): number {
  const cf = ing.conversion_factor || 1;
  return (ing.stock / cf) * ing.unit_price;
}

/** Format stok: "593 kaleng ≈ 88.950 gram" */
export function formatStockWithBase(ing: Ingredient): { display: string; baseEquivalent: string } {
  const buyQty = stockInBuyUnit(ing);
  const buyLabel = ing.buy_unit || ing.base_unit;

  let display: string;
  if (ing.buy_unit && ing.conversion_factor && ing.conversion_factor !== 1) {
    const formatted = Number.isInteger(buyQty) ? buyQty.toString() : buyQty.toFixed(1);
    display = `${formatted} ${buyLabel}`;
  } else {
    // format raw stock in base unit
    display = `${ing.stock} ${ing.base_unit}`;
  }

  const baseEquivalent = ing.buy_unit && ing.conversion_factor && ing.conversion_factor !== 1
    ? `≈ ${ing.stock.toLocaleString('id-ID')} ${ing.base_unit}`
    : '';

  return { display, baseEquivalent };
}

export interface MovementLog {
  id: number;
  ingredient_id: number;
  ingredient_name?: string;
  type: 'IN' | 'OUT' | 'ADJUST';
  amount: number;
  balance: number;
  notes: string;
  created_at: string;
  base_unit?: BaseUnit;
  unit_price?: number;
  total_price?: number;
}

export interface RecipeItem {
  id: number;
  menu_name: string;
  ingredient_id: number;
  amount: number;
  ingredient_name?: string;
  base_unit?: BaseUnit;
}

export interface RecipeWithDetails {
  menu_name: string;
  category?: string;
  price?: number;
  spice_level_option?: number;
  sugar_level_option?: number;
  custom_options?: string; 
  items: RecipeItem[];
}

export interface Sale {
  id: number;
  restaurant_id: number;
  menu_name: string;
  quantity: number;
  total_price: number;
  selected_options?: string;
  payment_method: string;
  cash_paid: number;
  cash_change: number;
  invoice_id?: string;
  discount?: number;
  user_id?: number;
  shift_session_id?: number;
  notes?: string;
  sale_date?: string;
  created_at?: string;
}

/** Satu baris item dalam invoice */
export interface SaleItem {
  id?: number;
  sale_id?: number;
  recipe_id?: number;
  menu_name: string;
  quantity: number;
  price: number;
  subtotal: number;
  selected_options?: string;
  created_at?: string;
}

/** 1 invoice = 1 header + array items */
export interface SaleHeader {
  id: number;
  invoice_id: string;
  restaurant_id: number;
  user_id?: number;
  shift_session_id?: number;
  total_price: number;
  discount: number;
  payment_method: string;
  cash_paid: number;
  cash_change: number;
  notes?: string;
  sale_date: string;
  created_at: string;
  items: SaleItem[];
}

/** Voucher lengkap sesuai DB */
export interface Voucher {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  min_purchase: number;
  max_discount: number | null;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
  max_usage: number | null;
  usage_count: number;
  created_at: string;
}

export interface OCRItemReview {
  rawName: string;
  quantity: number;
  unit: string;
  pricePerUnit: number;
  totalPrice: number;
  mappedIngredientId?: number | 'new';
  convertedQuantity?: number;
  newIngName?: string;
  newIngCategory?: string;
  newIngBaseUnit?: BaseUnit;
  newIngSupplier?: string;
  isCustomCategory?: boolean;
  customCategoryName?: string;
}

// UPDATE BAGIAN INI UNTUK MENGHILANGKAN ERROR DI DASHBOARD.TSX
export interface DashboardStats {
  totalValue: number;
  totalItems: number;
  totalSalesByDay: number;      // Metric baru
  qrisSalesByDay: number;       // Metric baru
  cashSalesByDay: number;       // Metric baru
  totalItemsSoldByDay: number;  // Metric baru
  totalTransactionsByDay: number; // Metric baru
  dailySales: number;
  dailyExpense: number;
  criticalStockItems: {         // Struktur baru (menggantikan lowStockCount/Items)
    count: number;
    items: Ingredient[];
  };
  categoryDistribution: { category: string; count: number }[];
  salesTrend: { date: string; amount: number }[];
  usageTrend: { date: string; menu: string; quantity: number }[];
}

export type UserRole = 'Pemilik' | 'Kasir' | 'Dapur';

export interface User {
  id: number;
  username: string;
  password?: string;
  role: UserRole;
  nama: string;
  created_at?: string;
}

export interface Shift {
  id: number;
  nama: 'Shift 1' | 'Shift 2';
  jam_mulai: string;
  jam_akhir: string;
}

export interface ShiftSession {
  id: number;
  user_id: number;
  shift_id: number;
  login_at: string;
  logout_at?: string;
  date: string;
}

export interface NavItem {
  id: string;
  icon: ComponentType<{ size?: number | string; className?: string }>;
  label: string;
}

export interface AuthSession {
  token: string;
  session_id: number;
  user: User;
  shift: Shift;
  features?: UserFeature[];
  login_at: string;
}

export interface UserFeature {
  feature_key: string;
  enabled: boolean;
}