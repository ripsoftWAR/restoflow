import { Printer } from 'lucide-react';
import { Ingredient } from '../../types';

/* ═══════════════════════════════════════════════════════════════
   Perlu Stock — critical items list with bar indicators + print
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  items: Ingredient[];
  totalCount: number;
  onNavigate: (tab: string) => void;
}

function getFoodEmoji(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('ayam') || lower.includes('fillet') || lower.includes('dada')) return '🍗';
  if (lower.includes('keju') || lower.includes('cheese') || lower.includes('mozzarella')) return '🧀';
  if (lower.includes('paprika') || lower.includes('cabai') || lower.includes('cabe')) return '🫑';
  if (lower.includes('bawang') || lower.includes('onion')) return '🧅';
  if (lower.includes('telur') || lower.includes('egg')) return '🥚';
  if (lower.includes('tepung') || lower.includes('flour')) return '🌾';
  if (lower.includes('gula') || lower.includes('sugar')) return '🍬';
  if (lower.includes('minyak') || lower.includes('oil')) return '🫒';
  if (lower.includes('saus') || lower.includes('sauce') || lower.includes('kecap')) return '🫙';
  if (lower.includes('beras') || lower.includes('nasi')) return '🍚';
  if (lower.includes('daging') || lower.includes('sapi') || lower.includes('meat')) return '🥩';
  if (lower.includes('ikan') || lower.includes('fish')) return '🐟';
  if (lower.includes('udang') || lower.includes('shrimp')) return '🦐';
  if (lower.includes('tahu') || lower.includes('tofu')) return '🫘';
  if (lower.includes('tempe')) return '🫘';
  if (lower.includes('susu') || lower.includes('milk')) return '🥛';
  if (lower.includes('mentega') || lower.includes('butter')) return '🧈';
  if (lower.includes('roti') || lower.includes('bread')) return '🍞';
  return '📦';
}

function getBarColor(ratio: number): string {
  if (ratio <= 0.3) return '#EF4444';
  if (ratio <= 0.5) return '#F0801E';
  return '#E8720C';
}

function getBgColor(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('ayam') || lower.includes('paprika')) return '#FDECEA';
  if (lower.includes('keju') || lower.includes('cheese')) return '#FDF4E3';
  return '#F3F4F6';
}

export default function ShoppingList({ items, totalCount, onNavigate }: Props) {
  const displayItems = items.slice(0, 3);
  const remaining = items.length - 3;

  const handlePrint = () => {
    const now = new Date();
    const dateStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`;

    const rows = items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td style="text-align:right">${Number(item.min_stock) - Number(item.stock)}</td>
        <td style="text-align:right">${item.base_unit}</td>
      </tr>
    `).join('');

    const win = window.open('', '_blank', 'width=380,height=600');
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>Struk Belanja — Perlu Stock</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Courier New', monospace; padding: 16px; max-width: 340px; margin: 0 auto; }
            h2 { font-size: 14px; text-align: center; margin-bottom: 2px; }
            .sub { font-size: 10px; color: #666; text-align: center; margin-bottom: 12px; }
            hr { border: none; border-top: 1px dashed #ccc; margin: 10px 0; }
            table { width: 100%; border-collapse: collapse; }
            th { font-size: 11px; padding: 6px 4px; text-align: left; border-bottom: 1px solid #333; }
            td { font-size: 11px; padding: 6px 4px; border-bottom: 1px dotted #ddd; }
            .total-row td { font-weight: bold; border-top: 1px solid #333; }
            .footer { margin-top: 16px; font-size: 9px; color: #999; text-align: center; }
            @media print { body { padding: 0 8px; } }
          </style>
        </head>
        <body>
          <h2>🛒 STRUK BELANJA</h2>
          <div class="sub">Perlu Stock — ${dateStr}</div>
          <hr>
          <table>
            <thead><tr><th>Bahan</th><th style="text-align:right">Qty</th><th style="text-align:right">Unit</th></tr></thead>
            <tbody>
              ${rows}
              <tr class="total-row"><td colspan="3" style="text-align:right">Total: ${totalCount} item</td></tr>
            </tbody>
          </table>
          <hr>
          <div class="footer">Dicetak dari Pilot AI • RestoFlow</div>
        </body>
      </html>
    `);
    win.document.close();
    setTimeout(() => win.print(), 400);
  };

  return (
    <div className="bg-white border border-[#E9ECF5] rounded-2xl p-5">
      {/* HEADER */}
      <div className="flex items-center justify-between mb-1">
        <div>
          <div className="text-[15.5px] font-bold text-[#1B2436]">Perlu Stock</div>
          <div className="text-[12px] text-[#9CA3AF] mt-0.5">Di bawah stok minimum</div>
        </div>
        <div className="flex items-center gap-2">
          {/* Print button */}
          {items.length > 0 && (
            <button
              onClick={handlePrint}
              className="w-[30px] h-[30px] rounded-lg border border-[#E9ECF5] flex items-center justify-center hover:bg-[#F3F5FA] transition-colors cursor-pointer"
              title="Cetak struk belanja"
            >
              <Printer size={14} className="text-[#6B7280]" />
            </button>
          )}
          <button
            onClick={() => onNavigate('inventory')}
            className="text-[12.5px] font-semibold text-[#2E4FE0] flex items-center gap-1 cursor-pointer hover:underline"
          >
            Lihat Semua
          </button>
        </div>
      </div>

      {/* RESTOCK LIST */}
      <div className="flex flex-col gap-[14px] mt-[14px]">
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 gap-2">
            <span className="text-[32px]">✅</span>
            <p className="text-[13px] font-medium text-[#1B2436]">Semua stok aman!</p>
            <p className="text-[11px] text-[#9CA3AF]">Tidak ada bahan yang perlu restock</p>
          </div>
        ) : (
          displayItems.map((item) => {
            const minStock = Number(item.min_stock) || 1;
            const currentStock = Number(item.stock) || 0;
            const ratio = minStock > 0 ? currentStock / minStock : 0;
            const barWidth = Math.max(4, Math.round(ratio * 100));
            const barColor = getBarColor(ratio);

            return (
              <div key={item.id || item.name} className="flex items-center gap-3">
                <div
                  className="w-[36px] h-[36px] rounded-[9px] flex items-center justify-center text-[16px] flex-shrink-0"
                  style={{ backgroundColor: getBgColor(item.name) }}
                >
                  {getFoodEmoji(item.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-[#1B2436] mb-[6px]">
                    {item.name}
                  </div>
                  <div className="h-[6px] rounded bg-[#EFF1F7] overflow-hidden">
                    <div
                      className="h-full rounded"
                      style={{ width: `${barWidth}%`, backgroundColor: barColor }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-[#9CA3AF] mt-1">
                    <span>Stok: {currentStock} {item.base_unit}</span>
                  </div>
                </div>
                <div className="text-[11.5px] text-[#9CA3AF] whitespace-nowrap ml-[6px]">
                  Min: {minStock} {item.base_unit}
                </div>
              </div>
            );
          })
        )}
        {/* "+X lagi" indicator */}
        {remaining > 0 && (
          <div className="text-center text-[12px] font-medium text-[#2E4FE0] bg-[#F2F5FF] rounded-[9px] py-[7px] mt-1 cursor-pointer hover:bg-[#E7EDFF] transition-colors"
            onClick={() => onNavigate('inventory')}
          >
            +{remaining} item lainnya
          </div>
        )}
      </div>
    </div>
  );
}
