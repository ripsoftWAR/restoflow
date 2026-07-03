import React, { useState, useEffect, useCallback } from 'react';
import {
  Users, Plus, Search, MoreHorizontal, Shield, RefreshCw,
  CheckCircle, XCircle, Clock, Eye, EyeOff, Copy, Check,
  ChevronLeft, ChevronRight, X, Save, AlertTriangle,
  Activity, UserCheck, UserX, UserPlus, ToggleLeft, ToggleRight,
} from 'lucide-react';
import { makeApiFetch } from '../utils/api';
import { FEATURE_KEYS, FEATURE_GROUPS, type FeatureKey } from '../hooks/useFeatures';

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  id: number;
  username: string;
  nama: string;
  role: string;
  phone?: string;
  is_active: boolean;
  last_login?: string;
  created_at: string;
  invited_by_name?: string;
}

interface FeatureRow {
  feature_key: string;
  enabled: boolean;
}

interface UsersPageProps {
  user?: any;
}

const ROLES = ['Kasir', 'Dapur', 'Manajer'];

const ROLE_COLORS: Record<string, string> = {
  Pemilik: 'bg-purple-100 text-purple-700',
  Kasir:   'bg-blue-100 text-blue-700',
  Dapur:   'bg-orange-100 text-orange-700',
  Manajer: 'bg-green-100 text-green-700',
};

// ── Main Component ────────────────────────────────────────────────────────────
export default function UsersPage({ user }: UsersPageProps) {
  const [users, setUsers]               = useState<User[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('Semua Role');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [features, setFeatures]         = useState<FeatureRow[]>([]);
  const [featLoading, setFeatLoading]   = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPinModal, setShowPinModal] = useState<{ pin: string; nama: string } | null>(null);
  const [page, setPage]                 = useState(1);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const PER_PAGE = 8;
  const apiFetch = React.useMemo(() => makeApiFetch(user?.sessionId), [user?.sessionId]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Load users
  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/users');
      const data = await res.json();
      if (data.success) setUsers(data.data);
    } catch (e) {
      showToast('Gagal memuat data pengguna', 'error');
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  // Load features when user selected
  useEffect(() => {
    if (!selectedUser) return;
    setFeatLoading(true);
    apiFetch(`/api/users/${selectedUser.id}/features`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Fill missing features with defaults (disabled)
          const map = Object.fromEntries(
            data.data.map((f: FeatureRow) => [f.feature_key, f.enabled])
          );
          const allKeys = Object.keys(FEATURE_KEYS) as FeatureKey[];
          const full = allKeys.map(key => ({
            feature_key: key,
            enabled: map[key] ?? false,
          }));
          setFeatures(full);
        }
      })
      .catch(() => showToast('Gagal memuat izin fitur', 'error'))
      .finally(() => setFeatLoading(false));
  }, [selectedUser, apiFetch]);

  // Filter & paginate
  const filtered = users.filter(u => {
    const matchSearch = u.nama.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone || '').includes(search);
    const matchRole = roleFilter === 'Semua Role' || u.role === roleFilter;
    return matchSearch && matchRole;
  });
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Stats
  const stats = {
    total:    users.length,
    active:   users.filter(u => u.is_active).length,
    inactive: users.filter(u => !u.is_active).length,
  };

  // Save features
  const saveFeatures = async () => {
    if (!selectedUser) return;
    setSaving(true);
    try {
      const res = await apiFetch(`/api/users/${selectedUser.id}/features`, {
        method: 'PATCH',
        body: JSON.stringify({ features }),
      });
      const data = await res.json();
      if (data.success) showToast('Izin fitur berhasil disimpan');
      else showToast(data.error || 'Gagal menyimpan', 'error');
    } catch {
      showToast('Gagal menyimpan izin fitur', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Reset PIN
  const resetPin = async (userId: number) => {
    try {
      const res = await apiFetch(`/api/users/${userId}/reset-pin`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        const u = users.find(u => u.id === userId);
        setShowPinModal({ pin: data.pin, nama: u?.nama || '' });
        showToast('PIN berhasil direset');
      } else {
        showToast(data.error || 'Gagal reset PIN', 'error');
      }
    } catch {
      showToast('Gagal reset PIN', 'error');
    }
  };

  // Toggle aktif/nonaktif
  const toggleActive = async (u: User) => {
    try {
      const res = await apiFetch(`/api/users/${u.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active: !u.is_active }),
      });
      const data = await res.json();
      if (data.success) {
        setUsers(prev => prev.map(x => x.id === u.id ? { ...x, is_active: !u.is_active } : x));
        if (selectedUser?.id === u.id) setSelectedUser(prev => prev ? { ...prev, is_active: !u.is_active } : null);
        showToast(`${u.nama} ${!u.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      }
    } catch {
      showToast('Gagal mengubah status', 'error');
    }
  };

  const toggleFeature = (key: string) => {
    setFeatures(prev => prev.map(f =>
      f.feature_key === key ? { ...f, enabled: !f.enabled } : f
    ));
  };

  const resetToDefault = () => {
    if (!selectedUser) return;
    const roleDefaults: Record<string, string[]> = {
      Pemilik: Object.keys(FEATURE_KEYS),
      Manajer: [
        'pos.view', 'pos.create_transaction', 'pos.view_history', 'pos.export_csv', 'pos.export_pdf',
        'pos.thermal_print', 'pos.generate_voucher', 'pos.apply_voucher',
        'sales.view_log', 'sales.view_stats', 'sales.export_csv', 'sales.export_pdf', 'sales.filter_date',
        'inventory.view', 'inventory.add', 'inventory.edit', 'inventory.delete', 'inventory.adjust_stock', 'inventory.view_logs',
        'recipes.view', 'recipes.add', 'recipes.edit', 'recipes.delete',
        'dashboard.view', 'dashboard.view_stats', 'dashboard.view_insights',
        'ai.chat', 'ocr.scan', 'ocr.confirm',
        'users.view',
        'settings.view',
      ],
      Kasir: [
        'pos.view', 'pos.create_transaction', 'pos.view_history',
        'pos.apply_voucher',
        'sales.view_log',
        'ocr.scan', 'ocr.confirm',
      ],
      Dapur: [
        'recipes.view',
        'inventory.view',
      ],
    };
    const allowed = roleDefaults[selectedUser.role] || [];
    setFeatures(prev => prev.map(f => ({
      ...f,
      enabled: allowed.includes(f.feature_key),
    })));
  };

  return (
    <div className="min-h-full w-full bg-transparent p-4 space-y-4">

      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-xl text-[12px] font-bold flex items-center gap-2 transition-all ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-500 text-white'
        }`}>
          {toast.type === 'success' ? <CheckCircle size={14} /> : <XCircle size={14} />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[16px] font-bold text-slate-800">Pengguna</h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Kelola pengguna, peran, dan hak akses dalam sistem.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold transition"
        >
          <Plus size={13} /> Tambah Pengguna
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total Pengguna',  value: stats.total,    icon: Users,     color: 'bg-purple-50 text-purple-600' },
          { label: 'Pengguna Aktif',  value: stats.active,   icon: UserCheck, color: 'bg-green-50 text-green-600'  },
          { label: 'Nonaktif',        value: stats.inactive, icon: UserX,     color: 'bg-red-50 text-red-500'      },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
              <Icon size={18} />
            </div>
            <div>
              <p className="text-[20px] font-black text-slate-800 leading-none">{value}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Main Layout */}
      <div className="flex gap-4">

        {/* Left — User List */}
        <div className="flex-1 min-w-0 bg-white rounded-3xl border border-slate-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[13px] font-bold text-slate-800">Daftar Pengguna</h2>
            <button onClick={loadUsers} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400">
              <RefreshCw size={13} />
            </button>
          </div>

          {/* Search & Filter */}
          <div className="flex gap-2 mb-4">
            <div className="relative flex-1">
              <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama, role, atau nomor..."
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-xl text-[11px] focus:outline-none focus:border-purple-400"
              />
            </div>
            <select
              value={roleFilter}
              onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
              className="border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold outline-none bg-white text-slate-600"
            >
              <option>Semua Role</option>
              <option>Pemilik</option>
              {ROLES.map(r => <option key={r}>{r}</option>)}
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex items-center justify-center h-40 text-slate-300">
              <RefreshCw size={20} className="animate-spin" />
            </div>
          ) : (
            <>
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100">
                    {['Pengguna', 'Role', 'Status', 'Terakhir Aktif', 'Aksi'].map(h => (
                      <th key={h} className="text-left text-[10px] font-black text-slate-400 uppercase tracking-wider pb-2 pr-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginated.map(u => (
                    <tr
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`cursor-pointer transition group ${selectedUser?.id === u.id ? 'bg-purple-50' : 'hover:bg-slate-50'}`}
                    >
                      <td className="py-3 pr-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[11px] font-black flex-shrink-0">
                            {u.nama.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-[11px] font-bold text-slate-800">{u.nama}</p>
                            <p className="text-[10px] text-slate-400">{u.phone || u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${ROLE_COLORS[u.role] || 'bg-slate-100 text-slate-600'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className={`flex items-center gap-1 text-[10px] font-semibold ${u.is_active ? 'text-green-600' : 'text-red-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-red-400'}`} />
                          {u.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="py-3 pr-3">
                        <span className="text-[10px] text-slate-400">
                          {u.last_login
                            ? new Date(u.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                            : 'Belum pernah'}
                        </span>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                          {/* Toggle aktif/nonaktif — sembunyikan untuk Pemilik */}
                          {u.role !== 'Pemilik' && (
                            <button
                              onClick={e => { e.stopPropagation(); toggleActive(u); }}
                              className={`p-1.5 rounded-lg transition text-[10px] font-bold ${u.is_active ? 'hover:bg-red-50 text-red-400' : 'hover:bg-green-50 text-green-500'}`}
                              title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                            >
                              {u.is_active ? <UserX size={13} /> : <UserCheck size={13} />}
                            </button>
                          )}
                          {/* Reset PIN — tampil untuk semua role termasuk Pemilik */}
                          <button
                            onClick={e => { e.stopPropagation(); resetPin(u.id); }}
                            className="p-1.5 rounded-lg hover:bg-purple-50 text-purple-500 transition"
                            title="Reset PIN"
                          >
                            <Shield size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {paginated.length === 0 && (
                <div className="text-center py-10 text-slate-300">
                  <Users size={28} className="mx-auto mb-2" />
                  <p className="text-[11px]">Tidak ada pengguna ditemukan</p>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                  <span className="text-[10px] text-slate-400">
                    {filtered.length} pengguna · halaman {page} dari {totalPages}
                  </span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                    >
                      <ChevronLeft size={12} />
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
                      <button
                        key={n}
                        onClick={() => setPage(n)}
                        className={`w-6 h-6 rounded-lg text-[10px] font-bold transition ${
                          page === n ? 'bg-purple-600 text-white' : 'border border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {n}
                      </button>
                    ))}
                    <button
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-50 transition"
                    >
                      <ChevronRight size={12} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right — Detail & Permissions */}
        <div className="w-80 flex-shrink-0 space-y-3">
          {selectedUser ? (
            <>
              {/* User Detail Card */}
              <div className="bg-white rounded-3xl border border-slate-100 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wide">Detail Pengguna</h3>
                  <button
                    onClick={() => setSelectedUser(null)}
                    className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition"
                  >
                    <X size={12} />
                  </button>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white text-[14px] font-black">
                    {selectedUser.nama.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-black text-slate-800">{selectedUser.nama}</p>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${ROLE_COLORS[selectedUser.role] || 'bg-slate-100 text-slate-600'}`}>
                        {selectedUser.role}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400">{selectedUser.phone || '-'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[10px]">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-slate-400 mb-0.5">Username</p>
                    <p className="font-bold text-slate-700">{selectedUser.username}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-slate-400 mb-0.5">Bergabung</p>
                    <p className="font-bold text-slate-700">
                      {new Date(selectedUser.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                {/* Action buttons — Reset PIN untuk semua, toggle hanya non-Pemilik */}
                <div className="flex gap-2 mt-3">
                  {selectedUser.role !== 'Pemilik' && (
                    <button
                      onClick={() => toggleActive(selectedUser)}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-bold transition ${
                        selectedUser.is_active
                          ? 'bg-red-50 text-red-500 hover:bg-red-100'
                          : 'bg-green-50 text-green-600 hover:bg-green-100'
                      }`}
                    >
                      {selectedUser.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                    </button>
                  )}
                  <button
                    onClick={() => resetPin(selectedUser.id)}
                    className={`${selectedUser.role === 'Pemilik' ? 'w-full' : 'flex-1'} py-2 rounded-xl text-[10px] font-bold bg-purple-50 text-purple-600 hover:bg-purple-100 transition flex items-center justify-center gap-1`}
                  >
                    <Shield size={11} /> Reset PIN
                  </button>
                </div>
              </div>

              {/* Features Card */}
              {selectedUser.role !== 'Pemilik' && (
                <div className="bg-white rounded-3xl border border-slate-100 p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[12px] font-black text-slate-700 uppercase tracking-wide">Izin Fitur</h3>
                    <button
                      onClick={resetToDefault}
                      className="text-[9px] font-bold text-purple-500 hover:text-purple-700 px-2 py-1 rounded-lg hover:bg-purple-50 transition"
                    >
                      Reset Default
                    </button>
                  </div>

                  {featLoading ? (
                    <div className="flex justify-center py-6 text-slate-300">
                      <RefreshCw size={16} className="animate-spin" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                        {FEATURE_GROUPS.map(group => {
                          const groupFeatures = features.filter(f => group.keys.includes(f.feature_key as FeatureKey));
                          const enabledCount = groupFeatures.filter(f => f.enabled).length;
                          const totalCount = groupFeatures.length;
                          const isAllEnabled = enabledCount === totalCount && totalCount > 0;
                          const isPartial = enabledCount > 0 && !isAllEnabled;

                          return (
                            <div key={group.label} className="bg-slate-50/70 rounded-2xl p-3 border border-slate-100">
                              {/* Group header with toggle all */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[13px]">{group.icon}</span>
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                                    {group.label}
                                  </span>
                                  <span className={`text-[9px] font-bold ml-1 px-1.5 py-0.5 rounded-full ${
                                    isAllEnabled ? 'bg-green-100 text-green-600'
                                    : isPartial ? 'bg-amber-100 text-amber-600'
                                    : 'bg-slate-200 text-slate-400'
                                  }`}>
                                    {enabledCount}/{totalCount}
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setFeatures(prev => prev.map(f =>
                                      group.keys.includes(f.feature_key as FeatureKey)
                                        ? { ...f, enabled: !isAllEnabled }
                                        : f
                                    ));
                                  }}
                                  className={`p-1 rounded-lg transition ${
                                    isAllEnabled
                                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                                      : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                                  }`}
                                  title={isAllEnabled ? 'Nonaktifkan semua' : 'Aktifkan semua'}
                                >
                                  {isAllEnabled ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                                </button>
                              </div>

                              {/* Individual toggles */}
                              <div className="space-y-0.5">
                                {group.keys.map(key => {
                                  const feat = features.find(f => f.feature_key === key);
                                  const enabled = feat?.enabled ?? false;
                                  const label = FEATURE_KEYS[key as FeatureKey] || key;

                                  return (
                                    <button
                                      key={key}
                                      onClick={() => toggleFeature(key)}
                                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[10px] transition ${
                                        enabled
                                          ? 'bg-white border border-green-200 text-slate-700'
                                          : 'bg-transparent border border-transparent hover:bg-white text-slate-400 hover:text-slate-600'
                                      }`}
                                    >
                                      <span className={`font-medium text-left ${enabled ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {label}
                                      </span>
                                      <span className={`flex-shrink-0 transition ${enabled ? 'text-green-500' : 'text-slate-300'}`}>
                                        {enabled ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <button
                        onClick={saveFeatures}
                        disabled={saving}
                        className="w-full mt-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white rounded-xl text-[11px] font-black transition flex items-center justify-center gap-2"
                      >
                        {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
                        {saving ? 'Menyimpan...' : 'Simpan Izin Fitur'}
                      </button>
                    </>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-100 p-8 flex flex-col items-center justify-center text-center h-64">
              <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center mb-3">
                <Users size={20} className="text-purple-400" />
              </div>
              <p className="text-[12px] font-bold text-slate-600">Pilih Pengguna</p>
              <p className="text-[10px] text-slate-400 mt-1">Klik nama pengguna untuk lihat detail dan atur hak akses</p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          apiFetch={apiFetch}
          onClose={() => setShowAddModal(false)}
          onSuccess={(pin, nama) => {
            setShowAddModal(false);
            setShowPinModal({ pin, nama });
            loadUsers();
          }}
        />
      )}

      {/* PIN Display Modal */}
      {showPinModal && (
        <PinDisplayModal
          pin={showPinModal.pin}
          nama={showPinModal.nama}
          onClose={() => setShowPinModal(null)}
        />
      )}
    </div>
  );
}

// ── Add User Modal ────────────────────────────────────────────────────────────
function AddUserModal({
  apiFetch, onClose, onSuccess,
}: {
  apiFetch: any;
  onClose: () => void;
  onSuccess: (pin: string, nama: string) => void;
}) {
  const [form, setForm] = useState({ nama: '', username: '', role: 'Kasir', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!form.nama || !form.username || !form.role) {
      setError('Nama, username, dan role wajib diisi');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        onSuccess(data.pin, form.nama);
      } else {
        setError(data.error || 'Gagal menambah pengguna');
      }
    } catch {
      setError('Gagal menghubungi server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100">
          <div>
            <p className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-0.5">Tambah Anggota Tim</p>
            <h3 className="text-[15px] font-black text-slate-800">Pengguna Baru</h3>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition">
            <X size={14} className="text-slate-500" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 text-red-600 px-3 py-2.5 rounded-xl text-[11px] font-semibold">
              <AlertTriangle size={13} /> {error}
            </div>
          )}

          {[
            { label: 'Nama Lengkap', key: 'nama', placeholder: 'cth. Budi Santoso', type: 'text' },
            { label: 'Username',     key: 'username', placeholder: 'cth. budi.kasir', type: 'text' },
            { label: 'No. HP',       key: 'phone', placeholder: '0812-xxxx-xxxx (opsional)', type: 'tel' },
          ].map(f => (
            <div key={f.key}>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">{f.label}</label>
              <input
                type={f.type}
                placeholder={f.placeholder}
                value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-[12px] font-semibold outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-100"
              />
            </div>
          ))}

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-1.5">Role</label>
            <div className="grid grid-cols-3 gap-2">
              {ROLES.map(r => (
                <button
                  key={r}
                  onClick={() => setForm(prev => ({ ...prev, role: r }))}
                  className={`py-2.5 rounded-xl text-[11px] font-bold border-2 transition ${
                    form.role === r
                      ? 'border-purple-600 bg-purple-50 text-purple-700'
                      : 'border-slate-200 text-slate-500 hover:border-purple-200'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-700">
            <p className="font-bold mb-0.5">⚠️ Setelah dibuat:</p>
            <p>PIN 6 digit akan di-generate otomatis. Catat dan bagikan ke pengguna secara langsung.</p>
          </div>
        </div>

        <div className="px-6 pb-6 flex gap-3">
          <button onClick={onClose} className="flex-1 py-3 rounded-2xl border border-slate-200 text-[12px] font-bold text-slate-600 hover:bg-slate-50 transition">
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-[2] py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 text-white text-[12px] font-black transition flex items-center justify-center gap-2"
          >
            {loading ? <RefreshCw size={13} className="animate-spin" /> : <UserPlus size={13} />}
            {loading ? 'Membuat...' : 'Buat Pengguna'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── PIN Display Modal ─────────────────────────────────────────────────────────
function PinDisplayModal({ pin, nama, onClose }: { pin: string; nama: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  const copyPin = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 px-6 py-8 text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Shield size={24} className="text-white" />
          </div>
          <p className="text-white/80 text-[11px] font-semibold mb-1">PIN untuk {nama}</p>
          <p className="text-white text-[11px]">Bagikan PIN ini secara langsung</p>
        </div>

        <div className="px-6 py-6">
          <div className="bg-slate-50 rounded-2xl p-5 text-center mb-4">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">PIN Akses</p>
            <p className="text-[36px] font-black text-purple-700 tracking-[0.3em] font-mono">{pin}</p>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[10px] text-amber-700 mb-4">
            <p className="font-bold">⚠️ PIN hanya ditampilkan sekali ini.</p>
            <p>Catat atau salin sebelum menutup jendela ini.</p>
          </div>

          <div className="flex gap-2">
            <button
              onClick={copyPin}
              className={`flex-1 py-2.5 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-2 ${
                copied ? 'bg-green-50 text-green-600' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              {copied ? <><Check size={12} /> Tersalin!</> : <><Copy size={12} /> Salin PIN</>}
            </button>
            <button
              onClick={onClose}
              className="flex-[2] py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-black transition"
            >
              Selesai, sudah dicatat
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}