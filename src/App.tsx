import { useState, useEffect } from 'react';
import {
  LayoutDashboard, Layers, Utensils, ShoppingCart,
  Wallet, Clock, Zap, Scan, ListOrdered, Settings, MessageSquareMore
} from 'lucide-react';

import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import RecipeSystem from './components/RecipeSystem';
import SalesSimulator from './components/SalesSimulator';
import ReceiptScanner from './components/ReceiptScanner';
import MovementLogs from './components/MovementLogs';
import AIChatAssistant from './components/AIChatAssistant';

import { Ingredient, DashboardStats, RecipeWithDetails, Sale, MovementLog, AuthSession } from './types';
// Ambil URL Railway dari Environment Variable Vercel
const API_URL = (import.meta as any).env.VITE_API_URL || '';
const formatIDR = (num: number) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR',
    minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(num);

const NAV_ITEMS = [
  { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'inventory', icon: Layers, label: 'Inventori' },
  { id: 'recipes', icon: Utensils, label: 'Resep' },
  { id: 'sales', icon: ShoppingCart, label: 'Penjualan' },
];

const NAV_SECONDARY = [
  { id: 'ocr', icon: Scan, label: 'Scan OCR' },
  { id: 'logs', icon: ListOrdered, label: 'Log' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [recipes, setRecipes] = useState<RecipeWithDetails[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [movements, setMovements] = useState<MovementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [authChecked, setAuthChecked] = useState(false);
  const [authSession, setAuthSession] = useState<AuthSession | null>(null);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  // State untuk mengatur tampilan sebelum login
  const [authMode, setAuthMode] = useState<'landing' | 'login' | 'register'>('landing');

  const authHeaders = (): HeadersInit => {
    return sessionId ? { 'Authorization': `Bearer ${sessionId}` } : {};
  };

  const apiFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...(options.headers || {}),
        ...authHeaders(),
      },
    });
  };

  const fetchAllData = async () => {
    if (!authSession) return;

    try {
      setLoading(true);

      // Siapkan semua request
      const reqIngredients = apiFetch('/api/ingredients').then(r => r.json());
      const reqRecipes = apiFetch('/api/recipes').then(r => r.json());
      const reqSales = apiFetch('/api/sales').then(r => r.json());
      const reqMovements = apiFetch('/api/movements').then(r => r.json());

      // Jalankan secara paralel
      if (authSession.user.role === 'Pemilik') {
        const [st, ing, rec, sal, mov] = await Promise.all([
          apiFetch('/api/dashboard/stats').then(r => r.json()),
          reqIngredients, reqRecipes, reqSales, reqMovements
        ]);
        setStats(st);
        setIngredients(ing);
        setRecipes(rec);
        setSales(sal);
        setMovements(mov);
      } else {
        const [ing, rec, sal, mov] = await Promise.all([
          reqIngredients, reqRecipes, reqSales, reqMovements
        ]);
        setStats(null); // Memang null untuk staff
        setIngredients(ing);
        setRecipes(rec);
        setSales(sal);
        setMovements(mov);
      }
    } catch (err) {
      console.error('Sync Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const restoreSession = async () => {
      const storedId = localStorage.getItem('restoflow_session_id');
      if (!storedId) {
        setAuthChecked(true);
        setLoading(false);
        return;
      }

      setSessionId(Number(storedId));
      try {
        const res = await apiFetch('/api/auth/me');
        if (!res.ok) {
          localStorage.removeItem('restoflow_session_id');
          setAuthSession(null);
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
    if (authSession) {
      fetchAllData();
    }
  }, [authSession]);

  const handleLogin = async (username: string, password: string, shift_id: number) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, shift_id }),
      });

      // AMBIL JSON CUKUP SATU KALI DI SINI
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Login gagal');
      }

      // Gunakan 'data' yang sudah diambil tadi
      const session = data;

      setAuthSession(session);
      setSessionId(session.session_id);
      localStorage.setItem('restoflow_session_id', String(session.session_id));

      // Opsional: Paksa pindah ke dashboard setelah login sukses
      setActiveTab('home');

    } catch (err: any) {
      console.error("Login Error:", err.message);
      setAuthError(err.message || 'Login gagal');
    }
  };
  // Baris 171 (Sekitar sini di kode Anda)
  const handleRegister = async (username: string, password: string, role: string) => {
    setAuthError(null);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });

      // Ambil data respon satu kali saja
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || 'Gagal mendaftar');
      }

      alert('Pendaftaran berhasil! Silakan masuk.');
      setAuthMode('login'); // Pastikan Anda sudah punya state [authMode, setAuthMode]
    } catch (err: any) {
      console.error("Register Error:", err);
      setAuthError(err.message || 'Gagal mendaftar');
    }
  };
  const rolePrimaryTabs = authSession?.user.role === 'Pemilik'
    ? NAV_ITEMS
    : authSession?.user.role === 'Kasir'
      ? NAV_ITEMS.filter(item => item.id === 'sales')
      : NAV_ITEMS.filter(item => item.id === 'inventory');

  const roleSecondaryTabs = authSession?.user.role === 'Pemilik'
    ? NAV_SECONDARY
    : authSession?.user.role === 'Kasir'
      ? NAV_SECONDARY.filter(item => item.id === 'ocr')
      : [];

  useEffect(() => {
    const allowed = [...rolePrimaryTabs, ...roleSecondaryTabs].map(item => item.id);
    if (authSession && !allowed.includes(activeTab)) {
      setActiveTab(allowed[0] || 'home');
    }
  }, [authSession, rolePrimaryTabs.length, roleSecondaryTabs.length]);

  const AuthPanel = () => {
    const [form, setForm] = useState({ username: '', password: '', role: 'Staff', shiftId: 1 });
    const [submitting, setSubmitting] = useState(false);

    if (authMode === 'landing') {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
          <div className="w-full max-w-md text-center bg-white p-10 rounded-[2.5rem] shadow-xl">
            <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"><Zap size={32} fill="white" className="text-white" /></div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">RestFlow</h1>
            <p className="text-slate-500 mb-8">Manajemen Restoran Pintar</p>
            <div className="space-y-3">
              <button onClick={() => setAuthMode('login')} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">Masuk</button>
              <button onClick={() => setAuthMode('register')} className="w-full py-4 bg-white text-slate-700 border rounded-2xl font-bold">Daftar Akun Baru</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl">
          <button onClick={() => setAuthMode('landing')} className="text-slate-400 text-sm mb-6">← Kembali</button>
          <h1 className="text-2xl font-bold mb-6">{authMode === 'login' ? 'Masuk' : 'Daftar Akun'}</h1>
          <form className="space-y-4" onSubmit={async (e) => {
            e.preventDefault();
            setSubmitting(true);

            // TAMBAHKAN LOG INI
            console.log("Mengirim data:", form);
            console.log("Mode:", authMode);

            if (authMode === 'login') {
              await handleLogin(form.username, form.password, form.shiftId);
            } else {
              await handleRegister(form.username, form.password, form.role);
            }

            setSubmitting(false);
          }}>
            <input placeholder="Username" className="w-full rounded-2xl border p-4" onChange={e => setForm({ ...form, username: e.target.value })} required />
            <input type="password" placeholder="Password" className="w-full rounded-2xl border p-4" onChange={e => setForm({ ...form, password: e.target.value })} required />
            {authMode === 'login' ? (
              <select className="w-full rounded-2xl border p-4 bg-white" onChange={e => setForm({ ...form, shiftId: Number(e.target.value) })}>
                <option value={1}>Shift 1 (08:00 - 16:00)</option>
                <option value={2}>Shift 2 (16:00 - 24:00)</option>
              </select>
            ) : (
              <select className="w-full rounded-2xl border p-4 bg-white" onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="Staff">Staff</option>
                <option value="Kasir">Kasir</option>
                <option value="Pemilik">Pemilik</option>
              </select>
            )}
            {authError && <div className="text-rose-600 text-sm">{authError}</div>}
            <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-blue-600 p-4 text-white font-bold">
              {submitting ? 'Memproses...' : (authMode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
            </button>
          </form>
        </div>
      </div>
    );
  };
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="bg-blue-600 p-2 rounded-xl animate-pulse"><Zap size={18} className="text-white" /></div>
          <span className="text-sm font-medium">Memuat sesi...</span>
        </div>
      </div>
    );
  }

  if (!authSession) {
    return <AuthPanel />;
  }
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="bg-blue-600 p-2 rounded-xl animate-pulse"><Zap size={18} className="text-white" /></div>
          <span className="text-sm font-medium">Initializing RestFlow…</span>
        </div>
      </div>
    );
  }

  const availablePrimaryTabs = rolePrimaryTabs;
  const availableSecondaryTabs = roleSecondaryTabs;

  // TAMBAHKAN BARIS DI BAWAH INI (Yang sebelumnya hilang)
  const handleAddIngredient = async (payload: any) => {
    try {
      const response = await apiFetch('/api/ingredients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Gagal menambahkan bahan.');
      await fetchAllData();
    } catch (error) {
      console.error('Add ingredient error:', error);
    }
  };

  const handleEditIngredient = async (id: number, payload: any) => {
    try {
      const response = await apiFetch(`/api/ingredients/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Gagal memperbarui bahan.');
      await fetchAllData();
    } catch (error) {
      console.error('Edit ingredient error:', error);
    }
  };

  const handleDeleteIngredient = async (id: number) => {
    try {
      const response = await apiFetch(`/api/ingredients/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || 'Gagal menghapus bahan.');
      }
      await fetchAllData();
    } catch (error) {
      console.error('Delete ingredient error:', error);
      throw error;
    }
  };

  const handleAdjustStock = async (id: number, finalStock: number, notes: string) => {
    try {
      const response = await apiFetch(`/api/ingredients/${id}/adjust`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adjustStockInBaseUnit: finalStock, notes }),
      });
      if (!response.ok) throw new Error('Gagal mengubah stok.');
      await fetchAllData();
    } catch (error) {
      console.error('Adjust stock error:', error);
    }
  };

  const handleAddOrUpdateRecipe = async (
    menuName: string,
    items: any[],
    category = 'Makanan',
    spice_level_option = false,
    sugar_level_option = false,
    custom_options = ''
  ) => {
    try {
      const response = await apiFetch('/api/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          menu_name: menuName,
          category,
          spice_level_option,
          sugar_level_option,
          custom_options,
          items,
        }),
      });
      if (!response.ok) throw new Error('Gagal menyimpan resep.');
      await fetchAllData();
    } catch (error) {
      console.error('Recipe save error:', error);
    }
  };

  const handleTriggerSale = async (
    saleData: {
      menu_name: string;
      quantity: number;
      total_price: number;
      selected_options?: string;
      payment_method?: 'CASH' | 'QRIS';
      cash_paid?: number | null;
      cash_change?: number | null;
    }
  ) => {
    try {
      const body = {
        menu_name: saleData.menu_name,
        quantity: saleData.quantity,
        total_price: saleData.total_price,
        selected_options: saleData.selected_options ?? '',
        payment_method: saleData.payment_method ?? 'CASH',
        cash_paid: typeof saleData.cash_paid !== 'undefined' ? saleData.cash_paid : null,
        cash_change: typeof saleData.cash_change !== 'undefined' ? saleData.cash_change : null,
      };

      const response = await apiFetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Gagal mencatat penjualan.');
      await fetchAllData();
    } catch (error) {
      console.error('Trigger sale error:', error);
    }
  };

  const handleScanReceipt = async (base64: string, mimeType: string) => {
    const response = await apiFetch('/api/ocr/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64, mimeType }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Gagal memindai struk.');
    }
    return response.json();
  };

  const handleConfirmReceiptItems = async (confirmedItems: any[]) => {
    const response = await apiFetch('/api/ocr/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmedItems }),
    });
    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Gagal mengkonfirmasi item struk.');
    }
    await fetchAllData();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
        <div className="flex items-center gap-3 text-slate-400">
          <div className="bg-blue-600 p-2 rounded-xl animate-pulse">
            <Zap size={18} className="text-white" />
          </div>
          <span className="text-sm font-medium">Memuat Data RestFlow...</span>
        </div>
      </div>
    );
  }

  // ─── Shared stat chips ───────────────────────────────────────────────────
  const StatChips = () => (
    <>
      <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2">
        <div className="bg-blue-50 w-[26px] h-[26px] rounded-lg flex items-center justify-center flex-shrink-0">
          <Wallet size={13} className="text-blue-600" />
        </div>
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide leading-none mb-0.5">Balance hari ini</p>
          <div className="flex items-center gap-1.5">
            <span className="text-[12px] font-semibold text-blue-600 leading-none">
              {formatIDR(stats?.dailySales ?? 0)}
            </span>
            <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">+10%</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl px-3 py-2">
        <div className="bg-blue-50 w-[26px] h-[26px] rounded-lg flex items-center justify-center flex-shrink-0">
          <Clock size={13} className="text-blue-600" />
        </div>
        <div>
          <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide leading-none mb-0.5">Shift aktif</p>
          <span className="text-[12px] font-semibold text-blue-600 leading-none">Shift 1</span>
        </div>
      </div>
    </>
  );

  // ─── Sidebar button ───────────────────────────────────────────────────────
  const SideBtn = ({ id, icon: Icon, label }: { id: string; icon: any; label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      aria-label={label}
      className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all
        ${activeTab === id
          ? 'bg-blue-50 text-blue-600'
          : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
    >
      <Icon size={20} />
    </button>
  );

  // ─── Content ──────────────────────────────────────────────────────────────
  const Content = () => (
    <main className="flex-1 overflow-y-auto p-3 md:p-4">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'home' && (
          stats ? (
            <Dashboard
              stats={stats}
              movements={movements}
              ingredients={ingredients}
              onNavigate={setActiveTab}
            />
          ) : (
            <div className="flex items-center justify-center min-h-[400px] rounded-3xl bg-white border border-dashed border-slate-200">
              <div className="text-center">
                <p className="text-sm text-slate-500">
                  {authSession?.user.role === 'Pemilik'
                    ? "Sedang memuat data statistik..."
                    : "Dashboard hanya dapat diakses oleh Pemilik."}
                </p>
              </div>
            </div>
          )
        )}
        {activeTab === 'inventory' && (
          <Inventory ingredients={ingredients} onAddIngredient={handleAddIngredient} onEditIngredient={handleEditIngredient} onAdjustStock={handleAdjustStock} onDeleteIngredient={handleDeleteIngredient} />
        )}
        {activeTab === 'recipes' && (
          <RecipeSystem ingredients={ingredients} recipes={recipes} onAddOrUpdateRecipe={handleAddOrUpdateRecipe} />
        )}
        {activeTab === 'sales' && (
          <SalesSimulator recipes={recipes} ingredients={ingredients} sales={sales} onTriggerSale={handleTriggerSale} onRefreshStats={fetchAllData} />
        )}
        {activeTab === 'ocr' && (
          <ReceiptScanner
            ingredients={ingredients}
            onScanReceipt={handleScanReceipt}
            onConfirmReceiptItems={handleConfirmReceiptItems}
            onRefreshStats={fetchAllData}
          />
        )}
        {activeTab === 'ai' && (
          <AIChatAssistant
            ingredients={ingredients}
            recipes={recipes}
            onRefreshData={fetchAllData}
            embedded
            onClose={() => setActiveTab('home')}
          />
        )}
        {activeTab === 'settings' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Pengaturan</h2>
              <p className="text-sm text-slate-500 mt-2">Halaman pengaturan sedang dalam pembangunan. Untuk sementara, gunakan menu utama untuk mengelola inventori, resep, penjualan, dan scan struk.</p>
            </div>
          </div>
        )}
        {activeTab === 'logs' && (
          <MovementLogs movements={movements} />
        )}
      </div>
    </main>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // MOBILE  (< md)  — top header + bottom tab bar
  // ══════════════════════════════════════════════════════════════════════════
  const MobileLayout = () => (
    <div className="flex flex-col h-screen bg-[#F8FAFC] md:hidden">
      {/* Top header */}
      <header className="bg-white border-b border-slate-100 px-4 pt-3 pb-2.5 flex-shrink-0">
        <div className="flex items-center justify-between gap-3 mb-2.5">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 w-7 h-7 rounded-lg flex items-center justify-center">
              <Zap size={13} fill="white" className="text-white" />
            </div>
            <div>
              <h1 className="text-[14px] font-semibold text-slate-900 leading-none">RestFlow</h1>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-medium mt-0.5">Powered by Finework</p>
            </div>
          </div>
          <button
            onClick={() => setActiveTab('ai')}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-600 to-purple-600 text-white text-[11px] font-semibold shadow-lg shadow-blue-500/20 transition-all hover:brightness-110"
          >
            <span className="w-6 h-6 rounded-full bg-white/15 flex items-center justify-center">
              <MessageSquareMore size={14} className="text-white" />
            </span>
            AI Asisten
          </button>
        </div>
      </header>

      <Content />

      {/* Bottom nav */}
      <nav className="bg-white border-t border-slate-100 flex-shrink-0 grid grid-cols-4 px-2 py-1.5 safe-area-bottom">
        {rolePrimaryTabs.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
      ${activeTab === id ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Icon size={17} /> {label}
          </button>
        ))}
      </nav>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // TABLET  (md → lg)  — icon sidebar + top bar (no labels in sidebar)
  // ══════════════════════════════════════════════════════════════════════════
  const TabletLayout = () => (
    <div className="hidden md:flex lg:hidden h-screen bg-[#F8FAFC]">
      {/* Icon sidebar */}
      <aside className="w-16 bg-white border-r border-slate-100 flex flex-col items-center py-3 gap-1 flex-shrink-0">
        <div className="bg-blue-600 w-8 h-8 rounded-xl flex items-center justify-center mb-3">
          <Zap size={14} fill="white" className="text-white" />
        </div>
        {NAV_ITEMS.map(item => <SideBtn key={item.id} {...item} />)}
        <div className="w-7 h-px bg-slate-100 my-1" />
        {NAV_SECONDARY.map(item => <SideBtn key={item.id} {...item} />)}
        <div className="flex-1" />
        <SideBtn id="ai" icon={MessageSquareMore} label="AI Asisten" />
        <SideBtn id="settings" icon={Settings} label="Pengaturan" />
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-4 py-2.5 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[13px] font-semibold text-slate-800 leading-none capitalize">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label ?? activeTab}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatChips />
          </div>
        </header>

        <Content />
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════
  // DESKTOP  (≥ lg)  — wide sidebar with labels
  // ══════════════════════════════════════════════════════════════════════════
  const DesktopLayout = () => (
    <div className="hidden lg:flex h-screen bg-[#F8FAFC]">
      {/* Wide sidebar */}
      <aside className="w-52 bg-white border-r border-slate-100 flex flex-col py-4 flex-shrink-0">
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-4 mb-6">
          <div className="bg-blue-600 w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap size={14} fill="white" className="text-white" />
          </div>
          <div>
            <h1 className="text-[14px] font-semibold text-slate-900 leading-none">RestFlow</h1>
            <p className="text-[9px] text-slate-400 uppercase tracking-widest mt-0.5">Finework</p>
          </div>
        </div>

        {/* Primary nav */}
        <nav className="px-3 space-y-0.5 flex-1">
          <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest px-2 mb-2">Menu Utama</p>
          {roleSecondaryTabs.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
                ${activeTab === id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}

          <p className="text-[9px] font-semibold text-slate-300 uppercase tracking-widest px-2 mt-4 mb-2">Tools</p>
          {NAV_SECONDARY.map(({ id, icon: Icon, label }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all
                ${activeTab === id
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'}`}
            >
              <Icon size={17} />
              {label}
            </button>
          ))}
        </nav>

        {/* Stat pills */}
        <div className="px-3 mt-4 space-y-2">
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Balance hari ini</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[13px] font-semibold text-blue-600">{formatIDR(stats?.dailySales ?? 0)}</span>
              <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">+10%</span>
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl px-3 py-2.5">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wide mb-1">Shift aktif</p>
            <span className="text-[13px] font-semibold text-blue-600">Shift 1</span>
          </div>
        </div>

        {/* Bottom actions */}
        <div className="px-3 mt-3 space-y-0.5">
          <button
            onClick={() => setActiveTab('settings')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-slate-500 hover:bg-slate-50 hover:text-slate-700 transition-all"
          >
            <Settings size={17} /> Pengaturan
          </button>
        </div>
      </aside>

      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-100 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="text-[15px] font-semibold text-slate-800 leading-none capitalize">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label
                ?? NAV_SECONDARY.find(n => n.id === activeTab)?.label
                ?? activeTab}
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button
            onClick={() => setActiveTab('ai')}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-[12px] font-semibold px-4 py-2 rounded-xl transition-all"
          >
            <MessageSquareMore size={15} /> AI Asisten
          </button>
        </header>

        <Content />
      </div>
    </div>
  );

  return (
    <>
      <MobileLayout />
      <TabletLayout />
      <DesktopLayout />
    </>
  );
}
