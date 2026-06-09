import { useState, useEffect } from 'react';
import { LayoutDashboard, Layers, Utensils, ShoppingCart, Scan, ListOrdered, Zap } from 'lucide-react';

import Dashboard       from './components/dashboard/Dashboard';
import Inventory       from './components/inventory';
import RecipeSystem    from './components/recipes';
import SalesSimulator  from './components/sales';
import ReceiptScanner  from './components/ReceiptScanner';
import MovementLogs    from './components/MovementLogs';
import AIChatAssistant from './components/AIChatAssistant';

import AuthPanel      from './components/auth/AuthPanel';
import MobileLayout   from './components/layout/MobileLayout';
import TabletLayout   from './components/layout/TabletLayout';
import DesktopLayout  from './components/layout/DesktopLayout';

import { useAppData } from '../src/hooks/useAppData';
import { NavItem }    from '../src/types';

const NAV_ITEMS: NavItem[] = [
  { id: 'home',      icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'inventory', icon: Layers,          label: 'Inventori' },
  { id: 'recipes',   icon: Utensils,        label: 'Resep'     },
  { id: 'sales',     icon: ShoppingCart,    label: 'Penjualan' },
];

const NAV_SECONDARY: NavItem[] = [
  { id: 'ocr',  icon: Scan,        label: 'Scan OCR' },
  { id: 'logs', icon: ListOrdered, label: 'Log'      },
];

const Spinner = ({ label }: { label: string }) => (
  <div className="min-h-screen flex items-center justify-center bg-[e3e5e6]">
    <div className="flex items-center gap-3 text-slate-400">
      <div className="bg-blue-600 p-2 rounded-xl animate-pulse"><Zap size={18} className="text-white" /></div>
      <span className="text-sm font-medium">{label}</span>
    </div>
  </div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('home');

  const {
    stats, ingredients, recipes, sales, movements,
    loading, authChecked, authSession, authError, authMode,
    setAuthMode, fetchAllData,
    handleLogin, handleRegister, handleLogout,
    handleAddIngredient, handleEditIngredient, handleDeleteIngredient, handleAdjustStock,
    handleAddOrUpdateRecipe,
    handleTriggerSale,
    handleScanReceipt, handleConfirmReceiptItems,
  } = useAppData();

  // ─── Role-based nav ────────────────────────────────────────────────────────
  const rolePrimaryTabs = authSession?.user.role === 'Pemilik'
    ? NAV_ITEMS
    : authSession?.user.role === 'Kasir'
      ? NAV_ITEMS.filter(i => i.id === 'sales')
      : NAV_ITEMS.filter(i => i.id === 'inventory');

  const roleSecondaryTabs = authSession?.user.role === 'Pemilik'
    ? NAV_SECONDARY
    : authSession?.user.role === 'Kasir'
      ? NAV_SECONDARY.filter(i => i.id === 'ocr')
      : [];

  useEffect(() => {
    const allowed = [...rolePrimaryTabs, ...roleSecondaryTabs].map(i => i.id);
    if (authSession && !allowed.includes(activeTab)) setActiveTab(allowed[0] || 'home');
  }, [authSession, rolePrimaryTabs.length, roleSecondaryTabs.length]);

  // ─── Gates ────────────────────────────────────────────────────────────────
  if (!authChecked) return <Spinner label="Memuat sesi..." />;
  if (!authSession) return (
    <AuthPanel
      authMode={authMode}
      authError={authError}
      setAuthMode={setAuthMode}
      onLogin={handleLogin}
      onRegister={handleRegister}
    />
  );
  if (loading) return <Spinner label="Initializing RestFlow…" />;

  // ─── Main content ──────────────────────────────────────────────────────────
  const Content = () => (
    <main className="flex-1 overflow-y-auto p-3 md:p-4">
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {activeTab === 'home' && (
          stats
            ? <Dashboard
                stats={stats}
                movements={movements}
                ingredients={ingredients}
                recipes={recipes}
                onNavigate={setActiveTab}
              />
            : (
              <div className="flex items-center justify-center min-h-[400px] rounded-3xl bg-white border border-dashed border-slate-200">
                <p className="text-sm text-slate-500">
                  {authSession.user.role === 'Pemilik' ? 'Sedang memuat data statistik...' : 'Dashboard hanya dapat diakses oleh Pemilik.'}
                </p>
              </div>
            )
        )}
        {activeTab === 'inventory' && (
          <Inventory
            ingredients={ingredients}
            onAddIngredient={handleAddIngredient}
            onEditIngredient={handleEditIngredient}
            onAdjustStock={handleAdjustStock}
            onDeleteIngredient={handleDeleteIngredient}
          />
        )}
        {activeTab === 'recipes' && (
          <RecipeSystem ingredients={ingredients} recipes={recipes} onAddOrUpdateRecipe={handleAddOrUpdateRecipe} />
        )}
        {activeTab === 'sales' && (
          <SalesSimulator recipes={recipes} ingredients={ingredients} sales={sales} onTriggerSale={handleTriggerSale} onRefreshStats={fetchAllData} />
        )}
        {activeTab === 'ocr' && (
          <ReceiptScanner ingredients={ingredients} onScanReceipt={handleScanReceipt} onConfirmReceiptItems={handleConfirmReceiptItems} onRefreshStats={fetchAllData} />
        )}
        {activeTab === 'ai' && (
          <AIChatAssistant ingredients={ingredients} recipes={recipes} onRefreshData={fetchAllData} embedded onClose={() => setActiveTab('home')} />
        )}
        {activeTab === 'logs' && <MovementLogs movements={movements} />}
        {activeTab === 'settings' && (
          <div className="rounded-3xl bg-white p-6 shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900">Pengaturan</h2>
            <p className="text-sm text-slate-500 mt-2">Halaman pengaturan sedang dalam pembangunan.</p>
          </div>
        )}
      </div>
    </main>
  );

  return (
    <>
      <MobileLayout activeTab={activeTab} setActiveTab={setActiveTab} rolePrimaryTabs={rolePrimaryTabs} onLogout={handleLogout}>
        <Content />
      </MobileLayout>
      <TabletLayout activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} onLogout={handleLogout}>
        <Content />
      </TabletLayout>
      <DesktopLayout activeTab={activeTab} setActiveTab={setActiveTab} stats={stats} rolePrimaryTabs={rolePrimaryTabs} roleSecondaryTabs={roleSecondaryTabs} onLogout={handleLogout}>
        <Content />
      </DesktopLayout>
    </>
  );
}