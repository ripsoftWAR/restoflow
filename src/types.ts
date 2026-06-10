import type { ComponentType } from 'react';

export type BaseUnit = 'gram' | 'ml' | 'pcs';

export interface Ingredient {
  id: number;
  name: string;
  category: string;
  supplier: string;
  stock: number; // selalu disimpan dalam base_unit (gram, ml, pcs)
  base_unit: BaseUnit;
  min_stock: number;
  unit_price: number; // harga beli per base unit
  created_at?: string;
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
  invoice_id?: string; // TAMBAHKAN INI (opsional karena data lama mungkin tidak punya)
  created_at?: string;
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
  user: User;
  shift: Shift;
  session_id: number;
  login_at: string;
}