import { useMemo } from 'react';
import { Printer, ShoppingCart, Package, AlertTriangle } from 'lucide-react';
import type { Ingredient } from '../../../types';

const formatIDR = (n: number) =>
  'Rp ' + new Intl.NumberFormat('id-ID').format(Math.round(n));

/* ═══════════════════════════════════════════════════════════════
   RekomendasiBelanja — tab restock recommendation
   Grid card 3 kolom dengan data real dari ingredients
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  ingredients: Ingredient[];
  onNavigate?: (tab: string) => void;
}

interface RestockItem {
  ingredient: Ingredient;
  currentStock: number;
  minStock: number;
  buyQty: number;
  estCost: number;
}

const THRESHOLD_MULTIPLIER = 1.3; // stok < min_stock * 1.3 masuk rekomendasi
const RESTOCK_FACTOR = 1.5; // beli sampai 1.5 × min_stock

function StatusBadge({ current, min }: { current: number; min: number }) {
  if (current <= 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pp-danger bg-pp-danger-soft px-2 py-0.5 rounded-pp-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-pp-danger" />
        Habis
      </span>
    );
  }
  if (current <= min) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pp-warning bg-pp-warning-soft px-2 py-0.5 rounded-pp-xs">
        <span className="w-1.5 h-1.5 rounded-full bg-pp-warning" />
        Kritis
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-pp-info bg-pp-info-soft px-2 py-0.5 rounded-pp-xs">
      <span className="w-1.5 h-1.5 rounded-full bg-pp-info" />
      Akan Habis
    </span>
  );
}

export default function RekomendasiBelanja({ ingredients, onNavigate }: Props) {
  const items: RestockItem[] = useMemo(() => {
    return ingredients
      .filter((ing) => {
        const stock = Number(ing.stock) || 0;
        const min = Number(ing.min_stock) || 0;
        if (min <= 0) return false;
        return stock < min * THRESHOLD_MULTIPLIER;
      })
      .map((ing) => {
        const currentStock = Number(ing.stock) || 0;
        const minStock = Number(ing.min_stock) || 0;
        const targetStock = Math.round(minStock * RESTOCK_FACTOR * 10) / 10;
        const buyQty = Math.max(
          Math.round(minStock * 0.5 * 10) / 10,
          Math.round((targetStock - currentStock) * 10) / 10,
        );
        const unitPrice = Number(ing.unit_price) || 0;
        return {
          ingredient: ing,
          currentStock,
          minStock,
          buyQty: Math.max(0, buyQty),
          estCost: buyQty * unitPrice,
        };
      })
      .sort((a, b) => {
        const aCrit = a.currentStock <= a.minStock ? 0 : 1;
        const bCrit = b.currentStock <= b.minStock ? 0 : 1;
        if (aCrit !== bCrit) return aCrit - bCrit;
        return b.estCost - a.estCost;
      });
  }, [ingredients]);

  const grandTotal = useMemo(() => items.reduce((s, i) => s + i.estCost, 0), [items]);
  const criticalCount = items.filter((i) => i.currentStock <= i.minStock).length;

  /* ── Print struk belanja ── */
  const handlePrint = () => {
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    const rows = items
      .map(
        (item) => `
      <tr>
        <td>${item.ingredient.name}</td>
        <td style="text-align:right">${item.buyQty.toFixed(1)}</td>
        <td style="text-align:right">${item.ingredient.base_unit}</td>
        <td style="text-align:right">${item.ingredient.supplier || '—'}</td>
        <td style="text-align:right">${formatIDR(item.estCost)}</td>
      </tr>`,
      )
      .join('');

    const win = window.open('', '_blank', 'width=400,height=650');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Rekomendasi Belanja — RestoFlow</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 16px; max-width: 380px; margin: 0 auto; }
            h2 { font-size: 15px; text-align: center; margin-bottom: 2px; }
            .sub { font-size: 10px; color: #666; text-align: center; margin-bottom: 12px; }
            hr { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { font-size: 10px; padding: 6px 3px; text-align: left; border-bottom: 1px solid #333; }
            td { font-size: 10px; padding: 6px 3px; border-bottom: 1px dotted #ddd; }
            .total-row td { font-weight: bold; border-top: 1px solid #333; }
            .footer { margin-top: 16px; font-size: 9px; color: #999; text-align: center; }
            @media print { body { padding: 0 8px; } }
          </style>
        </head>
        <body>
          <h2>🛒 DAFTAR BELANJA</h2>
          <div class="sub">RestoFlow — ${dateStr}</div>
          <hr>
          <table>
            <thead><tr><th>Bahan</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th><th>Supplier</th><th style="text-align:right">Estimasi</th></tr></thead>
            <tbody>
              ${rows}
              <tr class="total-row"><td colspan="4">Total Estimasi</td><td style="text-align:right">${formatIDR(grandTotal)}</td></tr>
            </tbody>
          </table>
          <hr>
          <div class="footer">Dicetak dari RestoFlow</div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  /* ── Empty state ── */
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
        <div className="w-14 h-14 rounded-full bg-pp-success-soft flex items-center justify-center mb-3">
          <Package size={24} className="text-pp-success" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-semibold text-pp-text">Semua stok aman!</p>
        <p className="text-xs text-pp-text-muted mt-1 max-w-[280px]">
          Tidak ada bahan yang perlu dibeli saat ini. Stok semua bahan di atas batas minimum.
        </p>
      </div>
    );
  }

  /* ── Render ── */
  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-[15px] font-semibold text-pp-text">Rekomendasi Belanja</h2>
          <p className="text-[12px] text-pp-text-muted mt-0.5">
            Disusun otomatis berdasarkan stok kritis dan pola pemakaian.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-3 py-2 bg-pp-surface border border-pp-border rounded-pp-md text-[12px] font-medium text-pp-text-secondary hover:text-pp-text hover:border-pp-text-muted transition cursor-pointer"
        >
          <Printer size={13} strokeWidth={1.8} />
          Cetak Daftar
        </button>
      </div>

      {/* Alert banner */}
      {criticalCount > 0 && (
        <div className="flex items-center gap-2.5 p-3 bg-pp-danger-soft border border-pp-danger-border/50 rounded-pp-lg text-pp-danger text-[12px] font-medium">
          <AlertTriangle size={15} strokeWidth={2} className="shrink-0" />
          <span>
            <strong>{criticalCount}</strong> bahan di bawah stok minimum — segera restock!
          </span>
        </div>
      )}

      {/* ── Card grid 3 kolom ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => {
          const isCritical = item.currentStock <= item.minStock;
          return (
            <div
              key={item.ingredient.id}
              className="bg-pp-surface border border-pp-border rounded-pp-lg p-4 hover:border-pp-text-muted transition-colors flex flex-col"
            >
              {/* Header: name + status */}
              <div className="flex items-start gap-2.5 mb-3">
                <div className="w-9 h-9 rounded-pp-sm bg-pp-primary-soft flex items-center justify-center flex-shrink-0">
                  <ShoppingCart size={15} strokeWidth={1.8} className="text-pp-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-[13.5px] font-semibold text-pp-text leading-tight truncate">
                    {item.ingredient.name}
                  </h3>
                  <div className="mt-1">
                    <StatusBadge current={item.currentStock} min={item.minStock} />
                  </div>
                </div>
              </div>

              {/* Detail info */}
              <div className="space-y-1.5 mb-4 text-[12px]">
                <div className="flex items-center justify-between">
                  <span className="text-pp-text-muted">Stok Saat Ini</span>
                  <span className={`font-semibold tabular-nums ${isCritical ? 'text-pp-danger' : 'text-pp-text'}`}>
                    {item.currentStock.toLocaleString('id-ID')} {item.ingredient.base_unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pp-text-muted">Min. Stok</span>
                  <span className="text-pp-text tabular-nums">
                    {item.minStock.toLocaleString('id-ID')} {item.ingredient.base_unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pp-text-muted">Rekomendasi Beli</span>
                  <span className="font-bold text-pp-primary tabular-nums">
                    {item.buyQty % 1 === 0 ? item.buyQty.toLocaleString('id-ID') : item.buyQty.toFixed(1)} {item.ingredient.base_unit}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pp-text-muted">Estimasi Biaya</span>
                  <span className="font-bold text-pp-text tabular-nums font-mono text-[13px]">
                    {formatIDR(item.estCost)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-pp-text-muted">Supplier</span>
                  <span className="font-medium text-pp-text-secondary truncate max-w-[130px] text-right">
                    {item.ingredient.supplier || '—'}
                  </span>
                </div>
              </div>

              {/* Action button */}
              <button
                onClick={() => handlePrint()}
                className="mt-auto w-full flex items-center justify-center gap-1.5 py-2 border border-pp-primary/20 bg-pp-primary-soft rounded-pp-md text-[12px] font-semibold text-pp-primary hover:bg-pp-primary hover:text-white transition-colors cursor-pointer"
              >
                <ShoppingCart size={13} />
                Tambah ke Daftar Belanja
              </button>
            </div>
          );
        })}
      </div>

      {/* Footer total */}
      <div className="flex items-center justify-between px-4 py-3 bg-pp-surface border border-pp-border rounded-pp-lg">
        <span className="text-[13px] font-medium text-pp-text-muted">
          Total Estimasi ({items.length} item)
        </span>
        <span className="text-[16px] font-bold font-mono text-pp-text tabular-nums">
          {formatIDR(grandTotal)}
        </span>
      </div>
    </div>
  );
}
