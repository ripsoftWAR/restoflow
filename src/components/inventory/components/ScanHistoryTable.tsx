import { useState, useEffect, useCallback } from 'react';
import { Clock, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { apiFetch } from '../../../utils/api';

/* ═══════════════════════════════════════════════════════════════
   ScanHistoryTable — riwayat scan struk dari GET /api/ocr/history
   ═══════════════════════════════════════════════════════════════ */

interface ScanRecord {
  id: number;
  source: string;
  total_amount: number;
  status: string;
  created_at: string;
  verified_at: string | null;
  item_count: number;
}

interface Pagination {
  limit: number;
  offset: number;
  total: number;
}

const PAGE_SIZE = 10;

function formatIDR(n: number) {
  return 'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n || 0));
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMin = Math.floor((now - then) / 60000);
  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} jam lalu`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay} hari lalu`;
  return new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function ScanHistoryTable() {
  const [records, setRecords] = useState<ScanRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const url = `/api/ocr/history?limit=${PAGE_SIZE}&offset=${offset}`;
      const res = await apiFetch(url);
      if (!res.ok) throw new Error('Gagal memuat riwayat scan');
      const json = await res.json();
      setRecords(json.data || []);
      setTotal(json.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data');
    } finally {
      setLoading(false);
    }
  }, [offset]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  /* ── Render ── */
  if (loading && records.length === 0) {
    return (
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-pp-border">
          <div className="flex items-center gap-2">
            <Clock size={15} strokeWidth={1.8} className="text-pp-text-muted" />
            <span className="text-[13px] font-semibold text-pp-text">Riwayat Scan</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-10 gap-2 text-[12px] text-pp-text-muted">
          <Loader2 size={14} className="animate-spin text-pp-primary" />
          Memuat riwayat...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-pp-border">
          <div className="flex items-center gap-2">
            <Clock size={15} strokeWidth={1.8} className="text-pp-text-muted" />
            <span className="text-[13px] font-semibold text-pp-text">Riwayat Scan</span>
          </div>
        </div>
        <div className="flex items-center justify-center py-10 gap-2 text-[12px] text-pp-danger">
          <AlertCircle size={14} />
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pp-surface border border-pp-border rounded-pp-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-pp-border">
        <div className="flex items-center gap-2">
          <Clock size={15} strokeWidth={1.8} className="text-pp-text-muted" />
          <span className="text-[13px] font-semibold text-pp-text">Riwayat Scan</span>
          {total > 0 && (
            <span className="text-[11px] text-pp-text-muted">({total} scan)</span>
          )}
        </div>
        {total > PAGE_SIZE && (
          <div className="flex items-center gap-1">
            <button
              disabled={offset === 0}
              onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
              className="px-2 py-1 text-[11px] font-medium text-pp-text-muted hover:text-pp-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              ← Sebelumnya
            </button>
            <span className="text-[10px] text-pp-text-muted px-1">
              {currentPage}/{totalPages}
            </span>
            <button
              disabled={offset + PAGE_SIZE >= total}
              onClick={() => setOffset(offset + PAGE_SIZE)}
              className="px-2 py-1 text-[11px] font-medium text-pp-text-muted hover:text-pp-text disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Berikutnya →
            </button>
          </div>
        )}
      </div>

      {/* Empty state */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 gap-2.5 text-center">
          <div className="w-10 h-10 rounded-pp-sm bg-pp-bg flex items-center justify-center">
            <FileText size={18} className="text-pp-text-muted" />
          </div>
          <p className="text-[13px] font-medium text-pp-text-muted">Belum ada riwayat scan</p>
          <p className="text-[11px] text-pp-text-placeholder max-w-[260px]">
            Scan struk pertama Anda akan muncul di sini
          </p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-pp-text-muted uppercase border-b border-pp-border bg-pp-bg/50">
                  <th className="py-2.5 px-4 font-medium">Waktu</th>
                  <th className="py-2.5 px-3 font-medium">Sumber</th>
                  <th className="py-2.5 px-3 font-medium text-right">Total</th>
                  <th className="py-2.5 px-3 font-medium text-center">Item</th>
                  <th className="py-2.5 px-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-pp-border text-[12px]">
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-pp-bg/50 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-pp-text">{timeAgo(r.created_at)}</div>
                      <div className="text-[10px] text-pp-text-muted mt-0.5">
                        {new Date(r.created_at).toLocaleDateString('id-ID', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <span className="inline-flex items-center gap-1.5 text-pp-text-secondary font-medium">
                        <FileText size={12} strokeWidth={1.5} className="text-pp-text-muted" />
                        {r.source === 'camera' ? 'Kamera' : 'Upload'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-pp-text tabular-nums">
                      {formatIDR(r.total_amount)}
                    </td>
                    <td className="py-3 px-3 text-center tabular-nums text-pp-text-secondary">
                      {r.item_count ?? '—'}
                    </td>
                    <td className="py-3 px-4">
                      {r.status === 'verified' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-pp-success bg-pp-success-soft px-2 py-0.5 rounded-pp-xs">
                          <CheckCircle2 size={10} />
                          Terverifikasi
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-pp-warning bg-pp-warning-soft px-2 py-0.5 rounded-pp-xs">
                          <AlertCircle size={10} />
                          {r.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="block md:hidden divide-y divide-pp-border">
            {records.map((r) => (
              <div key={r.id} className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12px] font-semibold text-pp-text">{timeAgo(r.created_at)}</span>
                  {r.status === 'verified' ? (
                    <span className="text-[10px] font-semibold text-pp-success bg-pp-success-soft px-2 py-0.5 rounded-pp-xs">
                      Terverifikasi
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold text-pp-warning bg-pp-warning-soft px-2 py-0.5 rounded-pp-xs">
                      {r.status}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-pp-text-muted">{r.source === 'camera' ? 'Kamera' : 'Upload'}</span>
                  <span className="font-mono font-semibold text-pp-text">{formatIDR(r.total_amount)}</span>
                </div>
                <div className="text-[10px] text-pp-text-muted">
                  {r.item_count ?? 0} item • {new Date(r.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
