import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, ChevronDown, ChevronUp, Download, Printer,
  ArrowUpDown, Filter, X,
} from 'lucide-react';
import type { SaleHeader } from '../../types';
import { formatIDR } from './utils/salesHelpers';
import { makeApiFetch } from '../../utils/api';

/* ═══════════════════════════════════════════════════════════════
   TabLog — Tab 2: Log Transaksi (Invoice Table)
   
   • 1 baris = 1 invoice (bukan 1 item)
   • Klik expand → accordion tampilkan daftar item
   • Filter: date range, metode pembayaran
   • Search: by Invoice ID atau nama menu
   • Sortable: klik header kolom
   • Pagination: 20 invoice / page
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sessionId?: string;
  startDate: Date;
  endDate: Date;
  paymentFilter: string;
  dateLabel: string;
  user?: any;
}

type SortField = 'invoice_id' | 'created_at' | 'item_count' | 'total_price' | 'payment_method';
type SortDir = 'asc' | 'desc';

const pmBadge: Record<string, string> = {
  CASH: 'bg-emerald-100 text-emerald-700',
  QRIS: 'bg-blue-100 text-blue-700',
  TRANSFER: 'bg-violet-100 text-violet-700',
  EDC: 'bg-amber-100 text-amber-700',
};

const ITEMS_PER_PAGE = 20;

export default function TabLog({ sessionId, startDate, endDate, paymentFilter, dateLabel, user }: Props) {
  const [invoices, setInvoices] = useState<SaleHeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [page, setPage] = useState(0);

  // ── Fetch invoices ──────────────────────────
  useEffect(() => {
    if (!sessionId) return;
    const apiFetch = makeApiFetch(sessionId);
    setLoading(true);
    apiFetch('/api/sales/invoices')
      .then(r => r.json())
      .then((res: any) => {
        const data: SaleHeader[] = Array.isArray(res.data) ? res.data : [];
        setInvoices(data);
      })
      .catch(err => console.error('[TabLog] Fetch invoices error:', err))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // ── Filter by date + payment ────────────────
  const filtered = useMemo(() => {
    return invoices.filter(inv => {
      // Date filter
      if (inv.created_at) {
        const d = new Date(inv.created_at);
        if (d < startDate || d > endDate) return false;
      }
      // Payment filter
      if (paymentFilter !== 'SEMUA' && inv.payment_method !== paymentFilter) return false;
      // Search
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchInvoice = (inv.invoice_id || '').toLowerCase().includes(q);
        const matchItem = inv.items?.some(item =>
          (item.menu_name || '').toLowerCase().includes(q)
        );
        if (!matchInvoice && !matchItem) return false;
      }
      return true;
    });
  }, [invoices, startDate, endDate, paymentFilter, searchTerm]);

  // ── Sort ────────────────────────────────────
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'invoice_id':
          cmp = (a.invoice_id || '').localeCompare(b.invoice_id || '');
          break;
        case 'created_at':
          cmp = new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime();
          break;
        case 'item_count':
          cmp = (a.items?.length || 0) - (b.items?.length || 0);
          break;
        case 'total_price':
          cmp = (a.total_price || 0) - (b.total_price || 0);
          break;
        case 'payment_method':
          cmp = (a.payment_method || '').localeCompare(b.payment_method || '');
          break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filtered, sortField, sortDir]);

  // ── Pagination ──────────────────────────────
  const totalPages = Math.max(1, Math.ceil(sorted.length / ITEMS_PER_PAGE));
  const safePage = Math.min(page, totalPages - 1);
  const paginated = sorted.slice(safePage * ITEMS_PER_PAGE, (safePage + 1) * ITEMS_PER_PAGE);

  // Reset page saat filter/search berubah
  useEffect(() => { setPage(0); }, [searchTerm, paymentFilter]);

  const handleSort = useCallback((field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  }, [sortField]);

  const toggleExpand = useCallback((id: number) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  const handleExportCSV = useCallback(() => {
    const rows = [
      ['Invoice ID', 'Waktu', 'Jumlah Item', 'Total Harga', 'Metode Bayar'],
      ...filtered.map(inv => [
        inv.invoice_id,
        inv.created_at ? new Date(inv.created_at).toLocaleString('id-ID') : '-',
        inv.items?.length || 0,
        inv.total_price || 0,
        inv.payment_method || '-',
      ]),
    ];
    const csv = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered]);

  const SortHeader = ({ field, label, className = '' }: { field: SortField; label: string; className?: string }) => (
    <th
      onClick={() => handleSort(field)}
      className={`pb-3 font-semibold text-pp-text-muted uppercase tracking-wider text-[10px] cursor-pointer hover:text-pp-text transition-colors select-none ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortField === field ? (
          sortDir === 'asc' ? <ChevronUp size={12} strokeWidth={2.5} /> : <ChevronDown size={12} strokeWidth={2.5} />
        ) : (
          <ArrowUpDown size={11} strokeWidth={1.5} className="opacity-40" />
        )}
      </span>
    </th>
  );

  return (
    <motion.div
      key="log"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* ── Top Bar: Search + Info + Export ──────── */}
      <div className="flex items-center gap-3 flex-wrap justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Search */}
          <div className="relative flex-1 max-w-[320px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-pp-text-muted" />
            <input
              type="text"
              placeholder="Cari Invoice ID atau nama menu..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-8 py-[7px] bg-pp-surface border border-pp-border rounded-pp-xs text-[12px] text-pp-text placeholder:text-pp-text-placeholder focus:outline-none focus:border-pp-border-focus transition-colors"
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-pp-text-muted hover:text-pp-text">
                <X size={13} strokeWidth={2} />
              </button>
            )}
          </div>
          {/* Info badge */}
          <span className="text-[11px] font-medium text-pp-text-muted whitespace-nowrap">
            {filtered.length} invoice · {dateLabel}
          </span>
        </div>

        {/* Export buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-[7px] bg-pp-surface border border-pp-border rounded-pp-xs text-[11px] font-medium text-pp-text-secondary hover:bg-pp-surface-alt hover:border-pp-border-strong transition-colors cursor-pointer"
          >
            <Download size={13} strokeWidth={1.8} /> CSV
          </button>
        </div>
      </div>

      {/* ── Table ────────────────────────────────── */}
      {loading ? (
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-10 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-pp-primary border-t-transparent rounded-full pp-spin" />
            <span className="text-[13px] text-pp-text-muted">Memuat data invoice...</span>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-16 flex flex-col items-center justify-center gap-3">
          <span className="text-[40px]">📋</span>
          <p className="text-[14px] font-semibold text-pp-text">Tidak ada invoice</p>
          <p className="text-[12px] text-pp-text-muted">
            {searchTerm ? 'Coba ubah kata kunci pencarian' : 'Belum ada transaksi di periode ini'}
          </p>
        </div>
      ) : (
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-pp-surface-alt border-b border-pp-border">
                  <th className="w-8 pb-3" />
                  <SortHeader field="invoice_id" label="Invoice ID" className="text-left px-4" />
                  <SortHeader field="created_at" label="Waktu" className="text-left px-4" />
                  <SortHeader field="item_count" label="Item" className="text-center px-4" />
                  <SortHeader field="total_price" label="Total" className="text-right px-4" />
                  <SortHeader field="payment_method" label="Bayar" className="text-center px-4" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((inv, i) => {
                  const isExpanded = expandedId === inv.id;
                  const itemCount = inv.items?.length || 0;

                  return (
                    <motion.tr
                      key={inv.id || i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.01 }}
                      className={`border-b border-pp-border-light hover:bg-pp-surface-alt transition-colors cursor-pointer ${i % 2 === 0 ? '' : 'bg-[#FAFBFC]'}`}
                      onClick={() => toggleExpand(inv.id)}
                    >
                      {/* Expand icon */}
                      <td className="py-2.5 pl-4">
                        <motion.div
                          animate={{ rotate: isExpanded ? 180 : 0 }}
                          transition={{ duration: 0.15 }}
                        >
                          <ChevronDown size={14} strokeWidth={2} className="text-pp-text-muted" />
                        </motion.div>
                      </td>
                      {/* Invoice ID */}
                      <td className="px-4 py-2.5 font-mono text-[11px] font-semibold text-pp-primary">
                        {inv.invoice_id || `#${String(inv.id).padStart(4, '0')}`}
                      </td>
                      {/* Waktu */}
                      <td className="px-4 py-2.5 text-pp-text-muted font-mono text-[11px] whitespace-nowrap">
                        {inv.created_at
                          ? new Date(inv.created_at).toLocaleString('id-ID', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                            })
                          : '—'}
                      </td>
                      {/* Jumlah Item */}
                      <td className="px-4 py-2.5 text-center">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-pp-info-soft text-pp-info text-[11px] font-semibold">
                          {itemCount} item
                        </span>
                      </td>
                      {/* Total */}
                      <td className="px-4 py-2.5 text-right font-bold text-pp-text tabular-nums">
                        {formatIDR(inv.total_price || 0)}
                      </td>
                      {/* Metode Bayar */}
                      <td className="px-4 py-2.5 text-center">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${pmBadge[inv.payment_method] || 'bg-slate-100 text-slate-600'}`}>
                          {inv.payment_method || '—'}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}

                {/* ── ACCORDION: Expanded Row ──────── */}
                {paginated.map(inv => {
                  if (expandedId !== inv.id) return null;
                  return (
                    <tr key={`exp-${inv.id}`} className="bg-pp-bg border-b border-pp-border">
                      <td colSpan={6} className="p-0">
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-8 py-4">
                            {/* Item header */}
                            <div className="flex items-center text-[10px] font-semibold text-pp-text-muted uppercase tracking-wider mb-2 pb-2 border-b border-pp-border-light">
                              <span className="flex-1">Menu</span>
                              <span className="w-[60px] text-center">Qty</span>
                              <span className="w-[100px] text-right">Harga</span>
                              <span className="w-[110px] text-right">Subtotal</span>
                            </div>
                            {inv.items?.map((item, j) => (
                              <div key={j} className="flex items-center py-1.5 text-[12px]">
                                <span className="flex-1 font-medium text-pp-text truncate pr-2">
                                  {item.menu_name || 'Menu'}
                                  {item.selected_options ? (
                                    <span className="text-pp-text-muted ml-1 text-[10px]">({item.selected_options})</span>
                                  ) : null}
                                </span>
                                <span className="w-[60px] text-center text-pp-text-muted font-mono">
                                  {item.quantity || 1}×
                                </span>
                                <span className="w-[100px] text-right text-pp-text-muted font-mono">
                                  {formatIDR(item.price || 0)}
                                </span>
                                <span className="w-[110px] text-right font-semibold text-pp-text font-mono">
                                  {formatIDR(item.subtotal || 0)}
                                </span>
                              </div>
                            ))}
                            {/* Discount + Total row */}
                            {(inv.discount || 0) > 0 && (
                              <div className="flex items-center py-1.5 text-[12px] border-t border-pp-border-light mt-1 pt-2">
                                <span className="flex-1 text-pp-danger font-medium">Diskon</span>
                                <span className="w-[270px] text-right text-pp-danger font-semibold font-mono">
                                  -{formatIDR(inv.discount || 0)}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center py-1.5 text-[13px] border-t border-pp-border mt-1 pt-2">
                              <span className="flex-1 font-bold text-pp-text">Total</span>
                              <span className="w-[270px] text-right font-bold text-pp-primary font-mono">
                                {formatIDR(inv.total_price || 0)}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-pp-border bg-pp-surface-alt">
                  <td colSpan={6} className="px-4 py-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-pp-text">
                        Total {filtered.length} invoice
                      </span>
                      {/* Pagination */}
                      {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setPage(p => Math.max(0, p - 1))}
                            disabled={safePage === 0}
                            className="px-2 py-1 text-[11px] font-medium text-pp-text-muted hover:text-pp-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            Prev
                          </button>
                          {Array.from({ length: totalPages }, (_, i) => (
                            <button
                              key={i}
                              onClick={() => setPage(i)}
                              className={`w-7 h-7 rounded-pp-xs text-[11px] font-semibold transition-colors cursor-pointer ${
                                i === safePage
                                  ? 'bg-pp-primary text-white'
                                  : 'text-pp-text-muted hover:bg-pp-surface-alt'
                              }`}
                            >
                              {i + 1}
                            </button>
                          ))}
                          <button
                            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                            disabled={safePage >= totalPages - 1}
                            className="px-2 py-1 text-[11px] font-medium text-pp-text-muted hover:text-pp-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
                          >
                            Next
                          </button>
                        </div>
                      )}
                      <span className="text-[11px] text-pp-text-muted">
                        {safePage * ITEMS_PER_PAGE + 1}–{Math.min((safePage + 1) * ITEMS_PER_PAGE, filtered.length)} dari {filtered.length}
                      </span>
                    </div>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </motion.div>
  );
}
