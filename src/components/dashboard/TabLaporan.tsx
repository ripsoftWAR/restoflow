import { useState, useMemo, useCallback, useRef } from 'react';
import {
  FileText, Download, Search, ChevronLeft, ChevronRight,
  ArrowUpDown, ArrowUp, ArrowDown, FileSpreadsheet,
} from 'lucide-react';
import type { Sale, RecipeWithDetails, Ingredient } from '../../types';
import { formatIDRCompact, parseDashboardDate } from './shared/utils';

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */

const formatIDRFull = (num: number) =>
  `Rp${Math.round(num).toLocaleString('id-ID')}`;

const ROWS_PER_PAGE = 20;

/* ═══════════════════════════════════════════════════════════════
   PROPS
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sales: Sale[];
  recipes: RecipeWithDetails[];
  ingredients: Ingredient[];
  dateRangeLabel: string;
  startDate: Date;
  endDate: Date;
}

/* ═══════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════ */

function buildCategoryMap(recipes: RecipeWithDetails[]): Map<string, string> {
  const map = new Map<string, string>();
  recipes.forEach(r => {
    const name = (r.menu_name || '').trim();
    const cat = (r.category || '').trim();
    if (name && cat) map.set(name.toLowerCase(), cat);
  });
  return map;
}

function buildHPPMap(
  recipes: RecipeWithDetails[],
  ingredients: Ingredient[],
): Map<string, number> {
  const ingPriceMap = new Map<number, number>();
  ingredients.forEach(ing => {
    // Konversi: unit_price per BUY unit → harga per BASE unit
    const cf = (ing.conversion_factor && ing.conversion_factor > 0)
      ? Number(ing.conversion_factor)
      : 1;
    ingPriceMap.set(ing.id, (Number(ing.unit_price) || 0) / cf);
  });
  const hppMap = new Map<string, number>();
  recipes.forEach(r => {
    const name = (r.menu_name || '').trim().toLowerCase();
    if (!name) return;
    let totalCost = 0;
    (r.items || []).forEach(item => {
      const price = ingPriceMap.get(item.ingredient_id) || 0;
      totalCost += price * (Number(item.amount) || 0);
    });
    hppMap.set(name, totalCost);
  });
  return hppMap;
}

function normalizePaymentMethod(method?: string): string {
  if (!method) return 'CASH';
  return method.toUpperCase().trim();
}

type SortField = 'created_at' | 'menu_name' | 'quantity' | 'total_price' | 'payment_method';
type SortDir = 'asc' | 'desc';

interface TransactionRow {
  id: number;
  tanggal: string;
  rawDate: string;
  menu: string;
  qty: number;
  total: number;
  metode: string;
}

function formatDateShort(d: Date): string {
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */

export default function TabLaporan({ sales, recipes, ingredients, dateRangeLabel, startDate, endDate }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);

  /* ── Maps ───────────────────────────────── */
  const catMap = useMemo(() => buildCategoryMap(recipes), [recipes]);
  const hppMap = useMemo(() => buildHPPMap(recipes, ingredients), [recipes, ingredients]);

  /* ── Ringkasan Periode ──────────────────── */
  const summary = useMemo(() => {
    let totalOmset = 0;
    let totalTx = 0;
    let totalHpp = 0;
    sales.forEach(s => {
      const revenue = Number(s.total_price) || 0;
      totalOmset += revenue;
      totalTx += 1;
      const menuKey = (s.menu_name || '').trim().toLowerCase();
      const unitHpp = hppMap.get(menuKey) || 0;
      totalHpp += unitHpp * (Number(s.quantity) || 1);
    });
    const profit = totalOmset - totalHpp;
    const avgPerTx = totalTx > 0 ? Math.round(totalOmset / totalTx) : 0;
    return { totalOmset, totalTx, totalHpp, profit, avgPerTx };
  }, [sales, hppMap]);

  /* ── Transaction rows ───────────────────── */
  const allRows: TransactionRow[] = useMemo(() => {
    return sales.map(s => {
      const d = parseDashboardDate(s.created_at);
      return {
        id: s.id,
        tanggal: d ? formatDateShort(d) : '—',
        rawDate: s.created_at || '',
        menu: (s.menu_name || 'Tanpa Nama').trim(),
        qty: Number(s.quantity) || 1,
        total: Number(s.total_price) || 0,
        metode: normalizePaymentMethod(s.payment_method),
      };
    });
  }, [sales]);

  /* ── Filtered & sorted rows ─────────────── */
  const filteredRows = useMemo(() => {
    let rows = allRows;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      rows = rows.filter(r => r.menu.toLowerCase().includes(q));
    }
    rows = [...rows].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'created_at') cmp = a.rawDate.localeCompare(b.rawDate);
      else if (sortField === 'menu_name') cmp = a.menu.localeCompare(b.menu, 'id');
      else if (sortField === 'quantity') cmp = a.qty - b.qty;
      else if (sortField === 'total_price') cmp = a.total - b.total;
      else if (sortField === 'payment_method') cmp = a.metode.localeCompare(b.metode, 'id');
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return rows;
  }, [allRows, searchQuery, sortField, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const safePage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);

  /* ── Kategori ───────────────────────────── */
  const categoryData = useMemo(() => {
    const agg: Record<string, number> = {};
    sales.forEach(s => {
      const key = (s.menu_name || '').trim().toLowerCase();
      const cat = catMap.get(key) || 'Lainnya';
      agg[cat] = (agg[cat] || 0) + (Number(s.total_price) || 0);
    });
    const total = Object.values(agg).reduce((s, v) => s + v, 0);
    return Object.entries(agg)
      .map(([name, value]) => ({ name, value, pct: total > 0 ? Math.round((value / total) * 100) : 0 }))
      .sort((a, b) => b.value - a.value);
  }, [sales, catMap]);

  /* ── Metode Pembayaran ──────────────────── */
  const paymentData = useMemo(() => {
    const agg: Record<string, { revenue: number; tx: number }> = {};
    sales.forEach(s => {
      const method = normalizePaymentMethod(s.payment_method);
      if (!agg[method]) agg[method] = { revenue: 0, tx: 0 };
      agg[method].revenue += Number(s.total_price) || 0;
      agg[method].tx += 1;
    });
    const total = Object.values(agg).reduce((s, v) => s + v.revenue, 0);
    return Object.entries(agg)
      .map(([method, data]) => ({
        method,
        tx: data.tx,
        revenue: data.revenue,
        pct: total > 0 ? Math.round((data.revenue / total) * 100) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [sales]);

  /* ── Sort handler ───────────────────────── */
  const handleSort = useCallback((field: SortField) => {
    setSortField(prev => {
      if (prev === field) { setSortDir(d => d === 'asc' ? 'desc' : 'asc'); return prev; }
      setSortDir('asc');
      return field;
    });
    setPage(1);
  }, []);

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown size={12} className="text-pp-text-muted opacity-50" />;
    return sortDir === 'asc' ? <ArrowUp size={12} className="text-pp-primary" /> : <ArrowDown size={12} className="text-pp-primary" />;
  };

  /* ── File name helper ───────────────────── */
  const toDateStr = (d: Date) => d.toISOString().split('T')[0];
  const fileNameBase = `laporan-pilotpos-${toDateStr(startDate)}-${toDateStr(endDate)}`;

  /* ═══════════════════════════════════════════
     EXPORT: CSV
     ═══════════════════════════════════════════ */
  const exportCSV = useCallback(() => {
    const header = ['Tanggal', 'Menu', 'Qty', 'Total Harga', 'Metode Pembayaran'];
    const rows = allRows.map(r => [r.tanggal, r.menu, String(r.qty), String(r.total), r.metode]);
    const csv = [header, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `${fileNameBase}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [allRows, fileNameBase]);

  /* ═══════════════════════════════════════════
     EXPORT: Excel (.xlsx) via SheetJS
     ═══════════════════════════════════════════ */
  const exportExcel = useCallback(async () => {
    try {
      const XLSX = await import('xlsx');
      const wb = XLSX.utils.book_new();

      // Sheet 1: Rincian Transaksi
      const txData = allRows.map(r => ({
        Tanggal: r.tanggal,
        Menu: r.menu,
        Qty: r.qty,
        'Total Harga': r.total,
        'Metode Pembayaran': r.metode,
      }));
      const ws1 = XLSX.utils.json_to_sheet(txData);
      XLSX.utils.book_append_sheet(wb, ws1, 'Rincian Transaksi');

      // Sheet 2: Ringkasan
      const summaryRows = [
        { Metrik: 'Total Omset', Nilai: formatIDRFull(summary.totalOmset) },
        { Metrik: 'Total Transaksi', Nilai: String(summary.totalTx) },
        { Metrik: 'Estimasi HPP', Nilai: formatIDRFull(summary.totalHpp) },
        { Metrik: 'Estimasi Profit', Nilai: formatIDRFull(summary.profit) },
        { Metrik: 'Rata-rata per Transaksi', Nilai: formatIDRFull(summary.avgPerTx) },
        { Metrik: '', Nilai: '' },
        ...categoryData.map(c => ({ Metrik: `Kategori: ${c.name}`, Nilai: `${formatIDRFull(c.value)} (${c.pct}%)` })),
        { Metrik: '', Nilai: '' },
        ...paymentData.map(p => ({ Metrik: `Pembayaran: ${p.method}`, Nilai: `${p.tx} tx · ${formatIDRFull(p.revenue)} (${p.pct}%)` })),
      ];
      const ws2 = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, ws2, 'Ringkasan');

      XLSX.writeFile(wb, `${fileNameBase}.xlsx`);
    } catch (err) {
      console.error('Export Excel gagal:', err);
      alert('Gagal export Excel. Pastikan library xlsx terinstall.');
    }
  }, [allRows, fileNameBase, summary, categoryData, paymentData]);

  /* ═══════════════════════════════════════════
     EXPORT: PDF via jsPDF + autotable
     ═══════════════════════════════════════════ */
  const exportPDF = useCallback(async () => {
    try {
      const { jsPDF } = await import('jspdf');
      const autoTable = (await import('jspdf-autotable')).default;

      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(18);
      doc.text('Laporan Penjualan PilotPOS', 14, 20);
      doc.setFontSize(11);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(100, 116, 139);
      doc.text(`Periode: ${dateRangeLabel}`, 14, 28);

      // Ringkasan
      doc.setFontSize(13);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Ringkasan Periode', 14, 38);
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      const summaryLines = [
        `Total Omset: ${formatIDRFull(summary.totalOmset)}`,
        `Total Transaksi: ${summary.totalTx}`,
        `Estimasi HPP: ${formatIDRFull(summary.totalHpp)}`,
        `Estimasi Profit Bersih: ${formatIDRFull(summary.profit)}`,
        `Rata-rata per Transaksi: ${formatIDRFull(summary.avgPerTx)}`,
      ];
      summaryLines.forEach((line, i) => doc.text(line, 14, 46 + i * 6));

      // Tabel Kategori
      let yPos = 80;
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Rekap per Kategori', 14, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Kategori', 'Omset', '%']],
        body: categoryData.map(c => [c.name, formatIDRFull(c.value), `${c.pct}%`]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        margin: { left: 14, right: 14 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 8;

      // Tabel Metode Pembayaran
      doc.setFontSize(12);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text('Rekap per Metode Pembayaran', 14, yPos);
      yPos += 5;
      autoTable(doc, {
        startY: yPos,
        head: [['Metode', 'Transaksi', 'Omset', '%']],
        body: paymentData.map(p => [p.method, String(p.tx), formatIDRFull(p.revenue), `${p.pct}%`]),
        styles: { fontSize: 9, cellPadding: 2 },
        headStyles: { fillColor: [37, 99, 235], textColor: 255 },
        margin: { left: 14, right: 14 },
      });

      // Disclaimer
      const finalY = (doc as any).lastAutoTable.finalY + 8;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Estimasi dari biaya bahan baku saja, belum termasuk biaya operasional lain (sewa, gaji, listrik, dll).', 14, finalY);

      doc.save(`${fileNameBase}.pdf`);
    } catch (err) {
      console.error('Export PDF gagal:', err);
      alert('Gagal export PDF. Pastikan library jspdf dan jspdf-autotable terinstall.');
    }
  }, [fileNameBase, summary, categoryData, paymentData, dateRangeLabel]);

  /* ── Empty state ────────────────────────── */
  const isEmpty = sales.length === 0;

  /* ═══════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════ */
  return (
    <div className="space-y-5">

      {/* ═══════════════════════════════════════════
          HEADER + EXPORT BUTTONS
          ═══════════════════════════════════════════ */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-[15.5px] font-bold text-pp-text">Laporan</div>
          <div className="text-[12px] text-pp-text-muted mt-0.5">{dateRangeLabel}</div>
        </div>
        {!isEmpty && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={exportCSV}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 border border-pp-border rounded-pp-xs bg-pp-surface text-pp-text-secondary hover:bg-pp-bg hover:border-pp-border-strong transition-all duration-150 cursor-pointer"
            >
              <Download size={12} />
              CSV
            </button>
            <button
              type="button"
              onClick={exportExcel}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 border border-pp-border rounded-pp-xs bg-pp-surface text-pp-text-secondary hover:bg-pp-bg hover:border-pp-border-strong transition-all duration-150 cursor-pointer"
            >
              <FileSpreadsheet size={12} />
              Excel
            </button>
            <button
              type="button"
              onClick={exportPDF}
              className="flex items-center gap-1.5 text-[12px] font-medium px-3 py-2 border border-pp-border rounded-pp-xs bg-pp-surface text-pp-text-secondary hover:bg-pp-bg hover:border-pp-border-strong transition-all duration-150 cursor-pointer"
            >
              <FileText size={12} />
              PDF
            </button>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 1: RINGKASAN PERIODE (4 KPI cards)
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-4 gap-4 max-[900px]:grid-cols-2 max-[560px]:grid-cols-1">
        {/* Card: Total Omset */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-pp-xs flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EFF3FF' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#2563EB" strokeWidth="2"><path d="M6 2l1.5 4h9L18 2"/><path d="M3 7h18l-1.5 12a2 2 0 01-2 1.8H6.5a2 2 0 01-2-1.8L3 7z"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider">Total Omset</p>
            </div>
          </div>
          <p className="text-[20px] font-bold text-pp-text tabular-nums tracking-[-0.02em]">
            {formatIDRCompact(summary.totalOmset)}
          </p>
        </div>

        {/* Card: Total Transaksi */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-pp-xs flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#EEF2FF' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18M8 4v5"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider">Total Transaksi</p>
            </div>
          </div>
          <p className="text-[20px] font-bold text-pp-text tabular-nums tracking-[-0.02em]">
            {summary.totalTx.toLocaleString('id-ID')} tx
          </p>
        </div>

        {/* Card: Estimasi Profit */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-pp-xs flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#ECFDF5' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6 6v0M18 18v0"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider">Estimasi Profit</p>
            </div>
          </div>
          <p className="text-[20px] font-bold text-pp-text tabular-nums tracking-[-0.02em]">
            {formatIDRCompact(summary.profit)}
          </p>
        </div>

        {/* Card: Rata-rata per Transaksi */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-pp-xs flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FFF7ED' }}>
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#F97316" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>
            </div>
            <div>
              <p className="text-[11px] font-medium text-pp-text-muted uppercase tracking-wider">Rata-rata / Transaksi</p>
            </div>
          </div>
          <p className="text-[20px] font-bold text-pp-text tabular-nums tracking-[-0.02em]">
            {formatIDRCompact(summary.avgPerTx)}
          </p>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 2: ESTIMASI LABA RUGI SEDERHANA
          ═══════════════════════════════════════════ */}
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
        <div className="mb-4">
          <div className="text-[15.5px] font-bold text-pp-text">Estimasi Laba Rugi</div>
          <p className="text-[10.5px] text-pp-text-muted mt-1 italic leading-relaxed">
            Estimasi dari biaya bahan baku saja, belum termasuk biaya operasional lain (sewa, gaji, listrik, dll).
          </p>
        </div>

        {isEmpty ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <span className="text-[32px]">📊</span>
            <p className="text-[13px] text-pp-text-muted">Belum ada data penjualan</p>
          </div>
        ) : (
          <div className="space-y-2 max-w-lg">
            <div className="flex items-center justify-between py-2.5 border-b border-pp-border-light">
              <span className="text-[13px] text-pp-text-secondary">Total Omset</span>
              <span className="text-[14px] font-semibold text-pp-text tabular-nums">{formatIDRFull(summary.totalOmset)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5 border-b border-pp-border-light">
              <span className="text-[13px] text-pp-text-secondary">Estimasi HPP (Bahan Baku)</span>
              <span className="text-[14px] font-semibold text-pp-danger tabular-nums">− {formatIDRFull(summary.totalHpp)}</span>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <span className="text-[14px] font-semibold text-pp-text">Estimasi Profit Bersih</span>
              <span className={`text-[16px] font-bold tabular-nums ${summary.profit >= 0 ? 'text-pp-success' : 'text-pp-danger'}`}>
                {formatIDRFull(summary.profit)}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 3: TABEL RINCIAN TRANSAKSI
          ═══════════════════════════════════════════ */}
      <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <div className="text-[15.5px] font-bold text-pp-text">Rincian Transaksi</div>
            <div className="text-[12px] text-pp-text-muted mt-0.5">
              {filteredRows.length} transaksi{filteredRows.length !== allRows.length ? ` (difilter dari ${allRows.length})` : ''}
            </div>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-pp-text-muted pointer-events-none" />
            <input
              type="text"
              placeholder="Cari menu..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="text-[12px] pl-8 pr-3 py-2 border border-pp-border rounded-pp-xs bg-pp-surface text-pp-text placeholder:text-pp-text-placeholder outline-none focus:border-pp-border-focus focus:ring-1 focus:ring-pp-border-focus transition-all duration-150 w-[200px]"
            />
          </div>
        </div>

        {filteredRows.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <span className="text-[32px]">📋</span>
            <p className="text-[13px] text-pp-text-muted">
              {searchQuery ? 'Tidak ada transaksi yang cocok' : 'Belum ada data transaksi'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-pp-bg/50 border-b border-pp-border-light">
                    {([
                      { field: 'created_at' as SortField, label: 'Tanggal', cls: 'pl-5 pr-2 text-left w-[130px]' },
                      { field: 'menu_name' as SortField, label: 'Menu', cls: 'px-2 text-left' },
                      { field: 'quantity' as SortField, label: 'Qty', cls: 'px-2 text-center w-[60px]' },
                      { field: 'total_price' as SortField, label: 'Total Harga', cls: 'px-2 text-right w-[110px]' },
                      { field: 'payment_method' as SortField, label: 'Metode Bayar', cls: 'pl-2 pr-5 text-center w-[100px]' },
                    ]).map(col => (
                      <th
                        key={col.field}
                        onClick={() => handleSort(col.field)}
                        className={`py-2.5 text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider cursor-pointer select-none hover:text-pp-text transition-colors ${col.cls}`}
                      >
                        <div className={`flex items-center gap-1 ${col.field === 'total_price' ? 'justify-end' : col.field === 'quantity' || col.field === 'payment_method' ? 'justify-center' : 'justify-start'}`}>
                          {col.label}
                          {getSortIcon(col.field)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.map(row => (
                    <tr key={row.id} className="border-b border-pp-border-light hover:bg-pp-bg/40 transition-colors">
                      <td className="py-3 pl-5 pr-2 text-pp-text font-medium whitespace-nowrap">{row.tanggal}</td>
                      <td className="py-3 px-2 text-pp-text-secondary truncate max-w-[160px]">{row.menu}</td>
                      <td className="py-3 px-2 text-center text-pp-text-secondary tabular-nums">{row.qty}</td>
                      <td className="py-3 px-2 text-right text-pp-text font-medium tabular-nums">{formatIDRFull(row.total)}</td>
                      <td className="py-3 pl-2 pr-5 text-center">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          row.metode === 'CASH'
                            ? 'bg-pp-success-soft text-pp-success border border-pp-success-border'
                            : 'bg-pp-primary-soft text-pp-primary border border-pp-primary-muted'
                        }`}>
                          {row.metode}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-pp-border-light">
                <span className="text-[11.5px] text-pp-text-muted">
                  Menampilkan {(safePage - 1) * ROWS_PER_PAGE + 1}–{Math.min(safePage * ROWS_PER_PAGE, filteredRows.length)} dari {filteredRows.length}
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={safePage === 1}
                    className="p-1.5 rounded-pp-xs border border-pp-border text-pp-text-muted hover:bg-pp-bg hover:text-pp-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`min-w-[30px] h-[28px] text-[12px] font-medium rounded-pp-xs transition-colors cursor-pointer ${
                        p === safePage
                          ? 'bg-pp-primary text-white'
                          : 'text-pp-text-secondary hover:bg-pp-bg'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={safePage === totalPages}
                    className="p-1.5 rounded-pp-xs border border-pp-border text-pp-text-muted hover:bg-pp-bg hover:text-pp-text disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* ═══════════════════════════════════════════
          SECTION 4: REKAP RINGKAS (2 tabel sejajar)
          ═══════════════════════════════════════════ */}
      <div className="grid grid-cols-[1fr_1fr] gap-5 max-[900px]:grid-cols-1">

        {/* ── Tabel: Rekap per Kategori ──────── */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="mb-4">
            <div className="text-[15.5px] font-bold text-pp-text">Rekap per Kategori</div>
            <div className="text-[12px] text-pp-text-muted mt-0.5">{dateRangeLabel}</div>
          </div>
          {categoryData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-[32px]">📂</span>
              <p className="text-[13px] text-pp-text-muted">Belum ada data kategori</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-pp-bg/50 border-b border-pp-border-light">
                    <th className="py-2 pl-3 pr-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">Kategori</th>
                    <th className="py-2 px-2 text-right text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">Omset</th>
                    <th className="py-2 pl-2 pr-3 text-right text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider w-[50px]">%</th>
                  </tr>
                </thead>
                <tbody>
                  {categoryData.map(c => (
                    <tr key={c.name} className="border-b border-pp-border-light last:border-b-0 hover:bg-pp-bg/40 transition-colors">
                      <td className="py-2.5 pl-3 pr-2 text-pp-text font-medium">{c.name}</td>
                      <td className="py-2.5 px-2 text-right text-pp-text-secondary tabular-nums">{formatIDRCompact(c.value)}</td>
                      <td className="py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums" style={{ color: c.pct >= 30 ? 'var(--pp-primary)' : 'var(--pp-text-muted)' }}>{c.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Tabel: Rekap per Metode Pembayaran ── */}
        <div className="bg-pp-surface border border-pp-border rounded-pp-lg p-5 hover:border-pp-border-strong transition-colors duration-150">
          <div className="mb-4">
            <div className="text-[15.5px] font-bold text-pp-text">Rekap per Metode Bayar</div>
            <div className="text-[12px] text-pp-text-muted mt-0.5">{dateRangeLabel}</div>
          </div>
          {paymentData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <span className="text-[32px]">💳</span>
              <p className="text-[13px] text-pp-text-muted">Belum ada data pembayaran</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr className="bg-pp-bg/50 border-b border-pp-border-light">
                    <th className="py-2 pl-3 pr-2 text-left text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">Metode</th>
                    <th className="py-2 px-2 text-center text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">Tx</th>
                    <th className="py-2 px-2 text-right text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider">Omset</th>
                    <th className="py-2 pl-2 pr-3 text-right text-[11px] font-semibold text-pp-text-muted uppercase tracking-wider w-[50px]">%</th>
                  </tr>
                </thead>
                <tbody>
                  {paymentData.map(p => (
                    <tr key={p.method} className="border-b border-pp-border-light last:border-b-0 hover:bg-pp-bg/40 transition-colors">
                      <td className="py-2.5 pl-3 pr-2">
                        <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          p.method === 'CASH'
                            ? 'bg-pp-success-soft text-pp-success border border-pp-success-border'
                            : 'bg-pp-primary-soft text-pp-primary border border-pp-primary-muted'
                        }`}>
                          {p.method}
                        </span>
                      </td>
                      <td className="py-2.5 px-2 text-center text-pp-text-secondary tabular-nums">{p.tx}</td>
                      <td className="py-2.5 px-2 text-right text-pp-text-secondary tabular-nums">{formatIDRCompact(p.revenue)}</td>
                      <td className="py-2.5 pl-2 pr-3 text-right font-semibold tabular-nums" style={{ color: p.pct >= 30 ? 'var(--pp-primary)' : 'var(--pp-text-muted)' }}>{p.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}