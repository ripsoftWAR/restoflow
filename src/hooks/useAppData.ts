import { useState, useEffect } from 'react';
import { makeApiFetch, resolveApiUrl } from '../utils/api';
import { Ingredient, DashboardStats, RecipeWithDetails, Sale, MovementLog, AuthSession } from '../types';

export function useAppData() {
  const [stats,       setStats]       = useState<DashboardStats | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes,     setRecipes]     = useState<RecipeWithDetails[]>([]);
  const [sales,       setSales]       = useState<Sale[]>([]);
  const [movements,   setMovements]   = useState<MovementLog[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [sessionId,   setSessionId]   = useState<number | null>(null);
  const [authError,   setAuthError]   = useState<string | null>(null);
  const [authMode,    setAuthMode]    = useState<'landing' | 'login' | 'register'>('landing');

  const apiFetch = makeApiFetch(sessionId);

  // ─── Fetch all data ────────────────────────────────────────────────────────
  const fetchAllData = async (session = authSession) => {
    if (!session) return;
    try {
      setLoading(true);
      const api = makeApiFetch(sessionId);

      const reqIngredients = api('/api/ingredients').then(r => r.json());
      const reqRecipes     = api('/api/recipes').then(r => r.json());
      const reqSales       = api('/api/sales').then(r => r.json());
      const reqMovements   = api('/api/movements').then(r => r.json());

      if (session.user.role === 'Pemilik') {
        const [st, ing, rec, sal, mov] = await Promise.all([
          api('/api/dashboard/stats').then(r => r.json()),
          reqIngredients, reqRecipes, reqSales, reqMovements,
        ]);
        setStats(st);
        setIngredients(Array.isArray(ing) ? ing : []);
        setRecipes(Array.isArray(rec)     ? rec : []);
        setSales(Array.isArray(sal)       ? sal : []);
        setMovements(Array.isArray(mov)   ? mov : []);
      } else {
        const [ing, rec, sal, mov] = await Promise.all([
          reqIngredients, reqRecipes, reqSales, reqMovements,
        ]);
        setStats(null);
        setIngredients(Array.isArray(ing) ? ing : []);
        setRecipes(Array.isArray(rec)     ? rec : []);
        setSales(Array.isArray(sal)       ? sal : []);
        setMovements(Array.isArray(mov)   ? mov : []);
      }
    } catch (err) {
      console.error('Sync Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // ─── Restore session on mount ──────────────────────────────────────────────
  useEffect(() => {
    const restoreSession = async () => {
      const storedId = localStorage.getItem('restoflow_session_id');
      if (!storedId) { setAuthChecked(true); setLoading(false); return; }

      const numericId = Number(storedId);
      setSessionId(numericId);

      try {
        // FIX: pakai fetch langsung, bukan apiFetch (sessionId state belum terupdate)
        const res = await fetch(resolveApiUrl('/api/auth/me'), {
          headers: { 'Authorization': `Bearer ${numericId}` },
        });
        if (!res.ok) {
          localStorage.removeItem('restoflow_session_id');
          setSessionId(null);
          setAuthChecked(true);
          setLoading(false);
          return;
        }
        const session = await res.json();
        setAuthSession(session);
        setAuthChecked(true);
      } catch (err) {
        console.error('Session restore failed:', err);
        localStorage.removeItem('restoflow_session_id');
        setAuthChecked(true);
      } finally {
        setLoading(false);
      }
    };
    restoreSession();
  }, []);

  useEffect(() => {
    if (authSession) fetchAllData(authSession);
  }, [authSession]);

  // ─── Auth handlers ─────────────────────────────────────────────────────────
  const handleLogin = async (username: string, password: string, shift_id: number) => {
    setAuthError(null);
    try {
      const res  = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, shift_id }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Login gagal');
      setAuthSession(data);
      setSessionId(data.session_id);
      localStorage.setItem('restoflow_session_id', String(data.session_id));
    } catch (err: any) {
      setAuthError(err.message || 'Login gagal');
    }
  };

  const handleRegister = async (username: string, password: string, role: string, restaurant_name: string) => {
    setAuthError(null);
    try {
      const res  = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurant_name, username, password, role }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal mendaftar');
      alert('Pendaftaran berhasil! Silakan masuk.');
      setAuthMode('login');
    } catch (err: any) {
      setAuthError(err.message || 'Gagal mendaftar');
    }
  };

  // ─── Ingredient handlers ───────────────────────────────────────────────────
  const handleAddIngredient = async (payload: any) => {
    const res = await apiFetch('/api/ingredients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Gagal menambahkan bahan.');
    await fetchAllData();
  };

  const handleEditIngredient = async (id: number, payload: any) => {
    const res = await apiFetch(`/api/ingredients/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error('Gagal memperbarui bahan.');
    await fetchAllData();
  };

  const handleDeleteIngredient = async (id: number) => {
    const res = await apiFetch(`/api/ingredients/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Gagal menghapus bahan.');
    }
    await fetchAllData();
  };

  const handleAdjustStock = async (id: number, finalStock: number, notes: string) => {
    const res = await apiFetch(`/api/ingredients/${id}/adjust`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ adjustStockInBaseUnit: finalStock, notes }),
    });
    if (!res.ok) throw new Error('Gagal mengubah stok.');
    await fetchAllData();
  };

  // ─── Recipe handler ────────────────────────────────────────────────────────
  const handleAddOrUpdateRecipe = async (
    menuName: string, items: any[], category = 'Makanan',
    spice_level_option = false, sugar_level_option = false, custom_options = ''
  ) => {
    const res = await apiFetch('/api/recipes', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu_name: menuName, category, spice_level_option, sugar_level_option, custom_options, items }),
    });
    if (!res.ok) throw new Error('Gagal menyimpan resep.');
    await fetchAllData();
  };

  // ─── Sales handler ─────────────────────────────────────────────────────────
  const handleTriggerSale = async (saleData: {
    menu_name: string; quantity: number; total_price: number;
    selected_options?: string; payment_method?: 'CASH' | 'QRIS';
    cash_paid?: number | null; cash_change?: number | null;
  }) => {
    const res = await apiFetch('/api/sales', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menu_name:        saleData.menu_name,
        quantity:         saleData.quantity,
        total_price:      saleData.total_price,
        selected_options: saleData.selected_options ?? '',
        payment_method:   saleData.payment_method   ?? 'CASH',
        cash_paid:        saleData.cash_paid         ?? null,
        cash_change:      saleData.cash_change       ?? null,
      }),
    });
    if (!res.ok) throw new Error('Gagal mencatat penjualan.');
    await fetchAllData();
  };

  // ─── OCR handlers ──────────────────────────────────────────────────────────
  const handleScanReceipt = async (base64: string, mimeType: string) => {
    const res = await apiFetch('/api/ocr/scan', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, mimeType }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Gagal memindai struk.');
    }
    return res.json();
  };

  const handleConfirmReceiptItems = async (confirmedItems: any[]) => {
    const res = await apiFetch('/api/ocr/confirm', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedItems }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => null);
      throw new Error(err?.error || 'Gagal mengkonfirmasi item struk.');
    }
    await fetchAllData();
  };

  return {
    // state
    stats, ingredients, recipes, sales, movements,
    loading, authChecked, authSession, sessionId, authError, authMode,
    // setters
    setAuthMode, setAuthError,
    // handlers
    fetchAllData,
    handleLogin, handleRegister,
    handleAddIngredient, handleEditIngredient, handleDeleteIngredient, handleAdjustStock,
    handleAddOrUpdateRecipe,
    handleTriggerSale,
    handleScanReceipt, handleConfirmReceiptItems,
  };
}