import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, Tag, Percent, DollarSign, Calendar, Clock,
  Copy, Check, AlertCircle, Edit, Power, PowerOff, Gift,
  Ticket, TrendingUp,
} from 'lucide-react';
import type { Voucher } from '../../types';
import { formatIDRCompact } from '../dashboard/shared/utils';
import { makeApiFetch } from '../../utils/api';

/* ═══════════════════════════════════════════════════════════════
   TabVoucher — Tab 3: Voucher & Promo
   
   • Statistik ringkas: Total Voucher Aktif, Total Diskon Terpakai
   • List card voucher: kode, jenis, nilai, min, berlaku, status
   • Tombol "+ Buat Voucher Baru" → modal form
   • Edit / nonaktifkan per voucher
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  voucherList: Voucher[];
  sessionId?: string;
  restaurantId?: number;
  onRefreshVouchers: () => void;
}

interface VoucherFormState {
  code: string;
  type: 'percentage' | 'fixed';
  value: string;
  min_purchase: string;
  max_discount: string;
  valid_from: string;
  valid_until: string;
  max_usage: string;
}

const initialFormState: VoucherFormState = {
  code: '',
  type: 'percentage',
  value: '10',
  min_purchase: '50000',
  max_discount: '',
  valid_from: new Date().toISOString().split('T')[0],
  valid_until: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
  max_usage: '100',
};

function getVoucherStatus(v: Voucher): { label: string; color: string; bg: string } {
  if (!v.is_active) {
    return { label: 'Nonaktif', color: '#DC2626', bg: '#FEF2F2' };
  }
  const now = new Date();
  if (v.valid_until && new Date(v.valid_until) < now) {
    return { label: 'Kadaluarsa', color: '#64748B', bg: '#F1F5F9' };
  }
  if (v.valid_from && new Date(v.valid_from) > now) {
    return { label: 'Terjadwal', color: '#D97706', bg: '#FFFBEB' };
  }
  if (v.max_usage && v.usage_count >= v.max_usage) {
    return { label: 'Habis', color: '#64748B', bg: '#F1F5F9' };
  }
  return { label: 'Aktif', color: '#059669', bg: '#ECFDF5' };
}

export default function TabVoucher({ voucherList, sessionId, restaurantId, onRefreshVouchers }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<Voucher | null>(null);
  const [form, setForm] = useState<VoucherFormState>(initialFormState);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  // ── Stats ────────────────────────────────────
  const stats = useMemo(() => {
    const now = new Date();
    const active = voucherList.filter(v => {
      if (!v.is_active) return false;
      if (v.valid_until && new Date(v.valid_until) < now) return false;
      if (v.valid_from && new Date(v.valid_from) > now) return false;
      if (v.max_usage && v.usage_count >= v.max_usage) return false;
      return true;
    });
    const totalUsed = voucherList.reduce((s, v) => s + v.usage_count, 0);
    const estimatedDiscount = voucherList.reduce((s, v) => {
      if (v.type === 'fixed') return s + v.value * v.usage_count;
      return s + 0; // percentage: tidak bisa estimasi tanpa tahu total transaksi
    }, 0);
    return {
      activeCount: active.length,
      totalVoucher: voucherList.length,
      totalUsed,
      estimatedDiscount,
    };
  }, [voucherList]);

  // ── Open modal for create ────────────────────
  const openCreate = useCallback(() => {
    setEditingVoucher(null);
    setForm({
      ...initialFormState,
      valid_from: new Date().toISOString().split('T')[0],
      valid_until: (() => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().split('T')[0]; })(),
    });
    setError('');
    setModalOpen(true);
  }, []);

  // ── Open modal for edit ──────────────────────
  const openEdit = useCallback((v: Voucher) => {
    setEditingVoucher(v);
    setForm({
      code: v.code,
      type: v.type,
      value: String(v.value),
      min_purchase: String(v.min_purchase || 0),
      max_discount: v.max_discount ? String(v.max_discount) : '',
      valid_from: v.valid_from || '',
      valid_until: v.valid_until || '',
      max_usage: v.max_usage ? String(v.max_usage) : '',
    });
    setError('');
    setModalOpen(true);
  }, []);

  // ── Submit form ──────────────────────────────
  const handleSubmit = useCallback(async () => {
    setError('');
    if (!form.code.trim()) { setError('Kode voucher wajib diisi'); return; }
    if (!form.value || Number(form.value) <= 0) { setError('Nilai diskon harus > 0'); return; }

    const apiFetch = makeApiFetch(sessionId || null);
    setSaving(true);

    try {
      const body = {
        restaurant_id: restaurantId,
        code: form.code.trim().toUpperCase(),
        type: form.type === 'percentage' ? 'PERCENTAGE' : 'FIXED',
        value: Number(form.value),
        min_purchase: Number(form.min_purchase) || 0,
        max_discount: form.max_discount ? Number(form.max_discount) : null,
        is_active: true,
        valid_from: form.valid_from || null,
        valid_until: form.valid_until || null,
        max_usage: form.max_usage ? Number(form.max_usage) : null,
      };

      const url = editingVoucher
        ? `/api/vouchers/${editingVoucher.id}`
        : '/api/vouchers';

      const method = editingVoucher ? 'PATCH' : 'POST';

      const res = await apiFetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Gagal menyimpan voucher');
      }

      setModalOpen(false);
      onRefreshVouchers();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan voucher');
    } finally {
      setSaving(false);
    }
  }, [form, sessionId, restaurantId, editingVoucher, onRefreshVouchers]);

  // ── Toggle active ────────────────────────────
  const handleToggleActive = useCallback(async (v: Voucher) => {
    const apiFetch = makeApiFetch(sessionId || null);
    try {
      await apiFetch(`/api/vouchers/${v.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !v.is_active }),
      });
      onRefreshVouchers();
    } catch (err) {
      console.error('[TabVoucher] Toggle failed:', err);
    }
  }, [sessionId, onRefreshVouchers]);

  // ── Copy code ────────────────────────────────
  const handleCopy = useCallback((code: string) => {
    navigator.clipboard?.writeText(code).catch(() => {});
    setCopied(code);
    setTimeout(() => setCopied(null), 1500);
  }, []);

  const isUpdate = !!editingVoucher;

  return (
    <motion.div
      key="voucher"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="space-y-5"
    >
      {/* ═══════════════════════════════════════════
          STATS CARDS
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-3 gap-4 max-[860px]:grid-cols-2 max-[600px]:grid-cols-1">
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-4 hover:border-pp-border-strong transition-colors duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pp-success-soft flex items-center justify-center flex-shrink-0">
              <Ticket size={18} strokeWidth={2} color="#059669" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider">Voucher Aktif</p>
              <p className="text-[22px] font-bold text-pp-text tabular-nums">{stats.activeCount}</p>
              <p className="text-[11px] text-pp-text-muted">dari {stats.totalVoucher} total voucher</p>
            </div>
          </div>
        </div>

        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-4 hover:border-pp-border-strong transition-colors duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pp-primary-soft flex items-center justify-center flex-shrink-0">
              <TrendingUp size={18} strokeWidth={2} color="#2563EB" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider">Total Digunakan</p>
              <p className="text-[22px] font-bold text-pp-text tabular-nums">{stats.totalUsed}</p>
              <p className="text-[11px] text-pp-text-muted">kali pemakaian</p>
            </div>
          </div>
        </div>

        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-4 hover:border-pp-border-strong transition-colors duration-150">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-pp-warning-soft flex items-center justify-center flex-shrink-0">
              <DollarSign size={18} strokeWidth={2} color="#D97706" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider">Est. Total Diskon</p>
              <p className="text-[22px] font-bold text-pp-text tabular-nums">
                Rp {formatIDRCompact(stats.estimatedDiscount)}
              </p>
              <p className="text-[11px] text-pp-text-muted">hanya nominal (fixed)</p>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          HEADER: Create Button
          ═══════════════════════════════════════════ */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-[15.5px] font-bold text-pp-text">Daftar Voucher</h3>
          <p className="text-[12px] text-pp-text-muted mt-0.5">Kelola kode promo & diskon restoran</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-[9px] bg-pp-primary hover:bg-pp-primary-hover text-white rounded-pp-xs text-[12px] font-semibold transition-colors shadow-pp-brand cursor-pointer"
        >
          <Plus size={15} strokeWidth={2.5} />
          Buat Voucher Baru
        </button>
      </div>

      {/* ═══════════════════════════════════════════
          VOUCHER LIST
          ═══════════════════════════════════════════ */}
      {voucherList.length === 0 ? (
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-16 flex flex-col items-center justify-center gap-3">
          <span className="text-[48px]">🎫</span>
          <p className="text-[14px] font-semibold text-pp-text">Belum ada voucher</p>
          <p className="text-[12px] text-pp-text-muted">Buat voucher pertama untuk menarik pelanggan</p>
          <button
            onClick={openCreate}
            className="mt-2 px-4 py-2 bg-pp-primary hover:bg-pp-primary-hover text-white rounded-pp-xs text-[12px] font-semibold transition-colors cursor-pointer"
          >
            + Buat Voucher
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {voucherList.map(v => {
            const status = getVoucherStatus(v);
            const usagePct = v.max_usage ? Math.min(100, Math.round((v.usage_count / v.max_usage) * 100)) : 0;
            const isExpiring = v.valid_until && new Date(v.valid_until).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

            return (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-pp-surface border border-pp-border rounded-pp-lg p-4 hover:border-pp-border-strong transition-colors duration-150 flex flex-col gap-3"
              >
                {/* Header: kode + status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-pp-primary-soft flex items-center justify-center flex-shrink-0">
                      <Tag size={14} strokeWidth={2} color="#2563EB" />
                    </div>
                    <div>
                      <button
                        onClick={() => handleCopy(v.code)}
                        className="text-[14px] font-bold text-pp-text font-mono tracking-wider hover:text-pp-primary transition-colors cursor-pointer flex items-center gap-1"
                      >
                        {v.code}
                        {copied === v.code ? (
                          <Check size={12} className="text-pp-success" />
                        ) : (
                          <Copy size={11} className="text-pp-text-muted opacity-0 group-hover:opacity-100" />
                        )}
                      </button>
                    </div>
                  </div>
                  <span
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ backgroundColor: status.bg, color: status.color }}
                  >
                    {status.label}
                    {isExpiring && status.label === 'Aktif' && ' ⏰'}
                  </span>
                </div>

                {/* Detail: jenis + nilai */}
                <div className="flex items-center gap-4 text-[12px]">
                  <div className="flex items-center gap-1.5">
                    {v.type === 'percentage' ? (
                      <Percent size={13} strokeWidth={2} className="text-pp-primary" />
                    ) : (
                      <DollarSign size={13} strokeWidth={2} className="text-pp-primary" />
                    )}
                    <span className="font-semibold text-pp-text">
                      {v.type === 'percentage' ? `${v.value}%` : `Rp ${v.value.toLocaleString('id-ID')}`}
                    </span>
                  </div>
                  {v.min_purchase > 0 && (
                    <span className="text-pp-text-muted">
                      Min. belanja Rp {v.min_purchase.toLocaleString('id-ID')}
                    </span>
                  )}
                  {v.max_discount && (
                    <span className="text-pp-text-muted">
                      Maks. Rp {v.max_discount.toLocaleString('id-ID')}
                    </span>
                  )}
                </div>

                {/* Berlaku */}
                <div className="flex items-center gap-2 text-[11px] text-pp-text-muted">
                  <Calendar size={12} strokeWidth={1.5} />
                  <span>
                    {v.valid_from ? new Date(v.valid_from).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    {' — '}
                    {v.valid_until ? new Date(v.valid_until).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Selamanya'}
                  </span>
                </div>

                {/* Progress penggunaan */}
                {v.max_usage && (
                  <div>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="text-pp-text-muted">Penggunaan</span>
                      <span className="font-semibold text-pp-text">{v.usage_count} / {v.max_usage}</span>
                    </div>
                    <div className="h-1.5 bg-pp-border-light rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${usagePct}%`,
                          backgroundColor: usagePct >= 90 ? '#DC2626' : usagePct >= 60 ? '#D97706' : '#059669',
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto pt-2 border-t border-pp-border-light">
                  <button
                    onClick={() => openEdit(v)}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-pp-text-secondary hover:text-pp-text hover:bg-pp-surface-alt rounded-pp-xs transition-colors cursor-pointer"
                  >
                    <Edit size={12} strokeWidth={1.8} />
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleActive(v)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-pp-xs transition-colors cursor-pointer ${
                      v.is_active
                        ? 'text-pp-danger hover:bg-pp-danger-soft'
                        : 'text-pp-success hover:bg-pp-success-soft'
                    }`}
                  >
                    {v.is_active ? (
                      <><PowerOff size={12} strokeWidth={1.8} /> Nonaktifkan</>
                    ) : (
                      <><Power size={12} strokeWidth={1.8} /> Aktifkan</>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════
          CREATE/EDIT MODAL
          ═══════════════════════════════════════════ */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-pp-surface border border-pp-border rounded-pp-lg shadow-pp-xl w-full max-w-[520px] max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-pp-border">
                <div>
                  <h3 className="text-[16px] font-bold text-pp-text">
                    {isUpdate ? 'Edit Voucher' : 'Buat Voucher Baru'}
                  </h3>
                  <p className="text-[12px] text-pp-text-muted mt-0.5">
                    {isUpdate ? 'Ubah detail voucher yang sudah ada' : 'Tambahkan kode promo baru untuk pelanggan'}
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="w-8 h-8 rounded-pp-xs bg-pp-surface-alt hover:bg-pp-border-light flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={15} strokeWidth={2} className="text-pp-text-muted" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="px-6 py-5 space-y-4">
                {/* Kode Voucher */}
                <div>
                  <label className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider mb-1.5 block">
                    Kode Voucher
                  </label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="Contoh: DISKON10"
                    disabled={isUpdate}
                    className={`w-full px-3 py-2.5 border rounded-pp-xs text-[13px] text-pp-text placeholder:text-pp-text-placeholder focus:outline-none focus:ring-2 focus:ring-pp-primary/20 focus:border-pp-border-focus transition ${
                      isUpdate ? 'bg-pp-surface-alt cursor-not-allowed' : 'bg-white border-pp-border'
                    }`}
                  />
                </div>

                {/* Jenis Diskon + Nilai */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider mb-1.5 block">
                      Jenis Diskon
                    </label>
                    <div className="flex rounded-pp-xs border border-pp-border overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, type: 'percentage' }))}
                        className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors cursor-pointer ${
                          form.type === 'percentage'
                            ? 'bg-pp-primary text-white'
                            : 'bg-white text-pp-text-secondary hover:bg-pp-surface-alt'
                        }`}
                      >
                        Persen (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm(p => ({ ...p, type: 'fixed' }))}
                        className={`flex-1 py-2.5 text-[12px] font-semibold transition-colors cursor-pointer ${
                          form.type === 'fixed'
                            ? 'bg-pp-primary text-white'
                            : 'bg-white text-pp-text-secondary hover:bg-pp-surface-alt'
                        }`}
                      >
                        Nominal (Rp)
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider mb-1.5 block">
                      Nilai Diskon
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={0}
                        value={form.value}
                        onChange={e => setForm(p => ({ ...p, value: e.target.value }))}
                        className="w-full px-3 py-2.5 pr-10 border border-pp-border rounded-pp-xs text-[13px] text-pp-text focus:outline-none focus:ring-2 focus:ring-pp-primary/20 focus:border-pp-border-focus transition bg-white"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[12px] font-semibold text-pp-text-muted">
                        {form.type === 'percentage' ? '%' : 'Rp'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Min Pembelian + Maks Diskon */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider mb-1.5 block">
                      Min. Pembelian (Rp)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.min_purchase}
                      onChange={e => setForm(p => ({ ...p, min_purchase: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-pp-border rounded-pp-xs text-[13px] text-pp-text focus:outline-none focus:ring-2 focus:ring-pp-primary/20 focus:border-pp-border-focus transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider mb-1.5 block">
                      Maks. Diskon (Rp) <span className="font-normal">opsional</span>
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.max_discount}
                      onChange={e => setForm(p => ({ ...p, max_discount: e.target.value }))}
                      placeholder="Tidak terbatas"
                      className="w-full px-3 py-2.5 border border-pp-border rounded-pp-xs text-[13px] text-pp-text placeholder:text-pp-text-placeholder focus:outline-none focus:ring-2 focus:ring-pp-primary/20 focus:border-pp-border-focus transition bg-white"
                    />
                  </div>
                </div>

                {/* Tanggal Berlaku */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider mb-1.5 block">
                      Berlaku Dari
                    </label>
                    <input
                      type="date"
                      value={form.valid_from}
                      onChange={e => setForm(p => ({ ...p, valid_from: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-pp-border rounded-pp-xs text-[13px] text-pp-text focus:outline-none focus:ring-2 focus:ring-pp-primary/20 focus:border-pp-border-focus transition bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider mb-1.5 block">
                      Berlaku Sampai
                    </label>
                    <input
                      type="date"
                      value={form.valid_until}
                      onChange={e => setForm(p => ({ ...p, valid_until: e.target.value }))}
                      className="w-full px-3 py-2.5 border border-pp-border rounded-pp-xs text-[13px] text-pp-text focus:outline-none focus:ring-2 focus:ring-pp-primary/20 focus:border-pp-border-focus transition bg-white"
                    />
                  </div>
                </div>

                {/* Maks. Pemakaian */}
                <div>
                  <label className="text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider mb-1.5 block">
                    Maks. Pemakaian <span className="font-normal">opsional</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={form.max_usage}
                    onChange={e => setForm(p => ({ ...p, max_usage: e.target.value }))}
                    placeholder="Tidak terbatas"
                    className="w-full px-3 py-2.5 border border-pp-border rounded-pp-xs text-[13px] text-pp-text placeholder:text-pp-text-placeholder focus:outline-none focus:ring-2 focus:ring-pp-primary/20 focus:border-pp-border-focus transition bg-white"
                  />
                </div>

                {/* Error */}
                {error && (
                  <div className="flex items-center gap-2 p-3 bg-pp-danger-soft border border-pp-danger-border rounded-pp-xs text-[12px] font-medium text-pp-danger">
                    <AlertCircle size={14} strokeWidth={2} />
                    {error}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-pp-border bg-pp-surface-alt">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 border border-pp-border rounded-pp-xs text-[12px] font-semibold text-pp-text-secondary hover:bg-pp-surface transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-5 py-2.5 bg-pp-primary hover:bg-pp-primary-hover text-white rounded-pp-xs text-[12px] font-semibold transition-colors shadow-pp-brand disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full pp-spin" />}
                  {isUpdate ? 'Simpan Perubahan' : 'Buat Voucher'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
