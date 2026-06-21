import { useState, useEffect } from 'react';
import { LayoutDashboard, Layers, Utensils, ShoppingCart, Scan, ListOrdered, Zap, Users } from 'lucide-react';

import Dashboard from './components/dashboard/Dashboard';
import Inventory from './components/inventory';
import RecipeSystem from './components/recipes';
import SalesSimulator from './components/sales';
import ReceiptScanner from './components/ReceiptScanner';
import MovementLogs from './components/MovementLogs';
import AIChatAssistant from './components/AIChatAssistant';
import UsersPage from './components/userspage';

import AuthPanel from './components/auth/AuthPanel';
import MobileLayout from './components/layout/MobileLayout';
import TabletLayout from './components/layout/TabletLayout';
import DesktopLayout from './components/layout/DesktopLayout';
import KasirMode from './components/kasir/KasirMode';

import { useAppData } from '../src/hooks/useAppData';
import { FeaturesProvider, useFeatures } from '../src/hooks/useFeatures';
import { NavItem } from '../src/types';


const NAV_ITEMS: NavItem[] = [
  { id: 'home', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'inventory', icon: Layers, label: 'Inventori' },
  { id: 'recipes', icon: Utensils, label: 'Resep' },
  { id: 'sales', icon: ShoppingCart, label: 'Penjualan' },
  { id: 'users', icon: Users, label: 'Pengguna' },
];

const NAV_SECONDARY: NavItem[] = [
  { id: 'ocr', icon: Scan, label: 'Scan OCR' },
  { id: 'logs', icon: ListOrdered, label: 'Log' },
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
  const {
    stats, ingredients, recipes, sales, movements,
    loading, authChecked, authSession, authError, authMode,
    setAuthMode, fetchAllData,
    handleLogin, handleRegister, handleLogout,
    handleAddIngredient, handleEditIngredient, handleDeleteIngredient, handleAdjustStock,
    handleAddOrUpdateRecipe,
    handleDeleteRecipe,
    handleTriggerSale,
    handleScanReceipt, handleConfirmReceiptItems,
  } = useAppData();

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

  return (
    <FeaturesProvider
      features={authSession.features || []}
      isPemilik={authSession.user.role === 'Pemilik'}
    >
      {authSession.user.role === 'Pemilik' ? (
        <AppContent
          authSession={authSession}
          stats={stats}
          ingredients={ingredients}
          recipes={recipes}
          sales={sales}
          movements={movements}
          handleLogout={handleLogout}
          fetchAllData={fetchAllData}
          handleAddIngredient={handleAddIngredient}
          handleEditIngredient={handleEditIngredient}
          handleDeleteIngredient={handleDeleteIngredient}
          handleAdjustStock={handleAdjustStock}
          handleAddOrUpdateRecipe={handleAddOrUpdateRecipe}
          handleDeleteRecipe={handleDeleteRecipe}
          handleTriggerSale={handleTriggerSale}
          handleScanReceipt={handleScanReceipt}
          handleConfirmReceiptItems={handleConfirmReceiptItems}
        />
      ) : (
        <KasirMode
          recipes={recipes}
          ingredients={ingredients}
          sales={sales}
          onTriggerSale={handleTriggerSale}
          onRefreshStats={() => fetchAllData(authSession, true)}
          onExit={handleLogout}
          onAddIngredient={handleAddIngredient}
          onEditIngredient={handleEditIngredient}
          onAdjustStock={handleAdjustStock}
          onDeleteIngredient={handleDeleteIngredient}
          onScanReceipt={handleScanReceipt}
          onConfirmReceiptItems={handleConfirmReceiptItems}
          onAddOrUpdateRecipe={handleAddOrUpdateRecipe}
          onDeleteRecipe={handleDeleteRecipe}
          user={{ ...authSession.user, sessionId: authSession.session_id }}
        />
      )}
    </FeaturesProvider>
  );
}

function AppContent(props: any) {
  const {
    authSession, stats, ingredients, recipes, sales, movements,
    handleLogout, fetchAllData,
    handleAddIngredient, handleEditIngredient, handleDeleteIngredient, handleAdjustStock,
    handleAddOrUpdateRecipe, handleDeleteRecipe, handleTriggerSale,
    handleScanReceipt, handleConfirmReceiptItems,
  } = props;

  const [activeTab, setActiveTab] = useState('home');
  const { can } = useFeatures();

  // ─── Feature-based nav ────────────────────────────────────────────────────
  const rolePrimaryTabs = NAV_ITEMS.filter(item => {
    if (item.id === 'home') return can('dashboard.view');
    if (item.id === 'inventory') return can('inventory.view');
    if (item.id === 'recipes') return can('recipes.view');
    if (item.id === 'sales') return can('sales.view_log') || can('pos.view');
    if (item.id === 'users') return can('users.view');
    return false;
  });

  const roleSecondaryTabs = NAV_SECONDARY.filter(item => {
    if (item.id === 'ocr') return can('ocr.scan');
    if (item.id === 'logs') return can('inventory.view_logs');
    return false;
  });

  useEffect(() => {
    const allowed = [...rolePrimaryTabs, ...roleSecondaryTabs].map(i => i.id);
    if (!allowed.includes(activeTab)) setActiveTab(allowed[0] || 'home');
  }, [authSession, rolePrimaryTabs.length, roleSecondaryTabs.length]);

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
        {activeTab === 'inventory' && can('inventory.view') && (
          <Inventory
            ingredients={ingredients}
            onAddIngredient={handleAddIngredient}
            onEditIngredient={handleEditIngredient}
            onAdjustStock={handleAdjustStock}
            onDeleteIngredient={handleDeleteIngredient}
          />
        )}
        {activeTab === 'recipes' && can('recipes.view') && (
          <RecipeSystem
            ingredients={ingredients}
            recipes={recipes}
            onAddOrUpdateRecipe={handleAddOrUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
          />
        )}
        {activeTab === 'sales' && (can('sales.view_log') || can('pos.view')) && (
          <SalesSimulator
            recipes={recipes}
            ingredients={ingredients}
            sales={sales}
            onTriggerSale={handleTriggerSale}
            onRefreshStats={() => fetchAllData(authSession, true)} onNavigateToKasir={() => setActiveTab('kasir')}
            user={{
              ...authSession.user,
              sessionId: authSession.user.id
            }}
          />
        )}
        {activeTab === 'kasir' && can('pos.view') && (
          <KasirMode
            recipes={recipes}
            ingredients={ingredients}
            sales={sales}
            onTriggerSale={handleTriggerSale}
            onRefreshStats={() => fetchAllData(authSession, true)}
            onExit={() => setActiveTab('sales')}
            onAddIngredient={handleAddIngredient}
            onEditIngredient={handleEditIngredient}
            onAdjustStock={handleAdjustStock}
            onDeleteIngredient={handleDeleteIngredient}
            onScanReceipt={handleScanReceipt}
            onConfirmReceiptItems={handleConfirmReceiptItems}
            onAddOrUpdateRecipe={handleAddOrUpdateRecipe}
            onDeleteRecipe={handleDeleteRecipe}
            user={{ ...authSession.user, sessionId: authSession.session_id }}
          />
        )}
        {activeTab === 'ocr' && can('ocr.scan') && (
          <ReceiptScanner ingredients={ingredients} onScanReceipt={handleScanReceipt} onConfirmReceiptItems={handleConfirmReceiptItems} onRefreshStats={fetchAllData} />
        )}
        {activeTab === 'ai' && can('ai.chat') && (
          <AIChatAssistant ingredients={ingredients} recipes={recipes} onRefreshData={fetchAllData} embedded onClose={() => setActiveTab('home')} />
        )}
        {activeTab === 'logs' && can('inventory.view_logs') && <MovementLogs movements={movements} />}
        {activeTab === 'users' && can('users.view') && (
          <UsersPage user={{ ...authSession.user, sessionId: authSession.session_id }} />
        )}
        {activeTab === 'settings' && can('settings.view') && (
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