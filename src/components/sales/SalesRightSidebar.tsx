import { memo } from 'react';
import { motion } from 'framer-motion';
import { Zap, TrendingUp, Clock, ShoppingBag, ArrowUpRight } from 'lucide-react';
import { formatIDRCompact } from '../dashboard/shared/utils';
import type { Sale } from '../../types';

/* ═══════════════════════════════════════════════════════════════
   SalesRightSidebar — Panel kanan statis halaman Penjualan
   Tidak berubah saat pindah tab (Overview / Log / Voucher)
   ═══════════════════════════════════════════════════════════════ */

interface Props {
  sales: Sale[];
  totalOmset: number;
  totalTx: number;
}

const SalesRightSidebar = memo(function SalesRightSidebar({ sales, totalOmset, totalTx }: Props) {
  const avgPerTx = totalTx > 0 ? Math.round(totalOmset / totalTx) : 0;
  const recentSales = sales.slice(0, 5);

  const quickStats = [
    {
      icon: <ShoppingBag size={15} strokeWidth={1.8} />,
      label: 'Transaksi Hari Ini',
      value: `${totalTx} tx`,
      color: '#6366F1',
    },
    {
      icon: <TrendingUp size={15} strokeWidth={1.8} />,
      label: 'Rata-rata / Tx',
      value: `Rp ${formatIDRCompact(avgPerTx)}`,
      color: '#10B981',
    },
    {
      icon: <Clock size={15} strokeWidth={1.8} />,
      label: 'Transaksi Terakhir',
      value: recentSales[0]?.created_at
        ? new Date(recentSales[0].created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : '—',
      color: '#F59E0B',
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* ── Quick Stats ────────────────────────── */}
      <div className="bg-white border border-[#E9ECF5] rounded-[14px] p-5">
        <h3 className="text-[13px] font-semibold text-[#1B2436] mb-4 flex items-center gap-2">
          <Zap size={15} strokeWidth={2} color="#2E4FE0" />
          Ringkasan Cepat
        </h3>
        <div className="space-y-3">
          {quickStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-3 p-3 rounded-[10px] bg-[#FAFBFD] border border-[#F0F2F8] hover:border-[#D6DCEC] transition-colors"
            >
              <div
                className="w-[32px] h-[32px] rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${stat.color}14` }}
              >
                <span style={{ color: stat.color }}>{stat.icon}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#9CA3AF] leading-tight">{stat.label}</p>
                <p className="text-[14px] font-semibold text-[#1B2436]">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── Recent Transactions ─────────────────── */}
      <div className="bg-white border border-[#E9ECF5] rounded-[14px] p-5">
        <h3 className="text-[13px] font-semibold text-[#1B2436] mb-4 flex items-center gap-2">
          <Clock size={15} strokeWidth={2} color="#2E4FE0" />
          Transaksi Terbaru
        </h3>
        {recentSales.length === 0 ? (
          <p className="text-[12px] text-[#9CA3AF] text-center py-4">Belum ada transaksi</p>
        ) : (
          <div className="space-y-2">
            {recentSales.map((sale, i) => (
              <div
                key={sale.id}
                className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-[#FAFBFD] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-[#1B2436] truncate">
                    {sale.menu_name || 'Menu'}
                  </p>
                  <p className="text-[11px] text-[#9CA3AF]">
                    {sale.payment_method} • {sale.quantity || 1}x
                  </p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-[13px] font-semibold text-[#1B2436]">
                    Rp {formatIDRCompact(Number(sale.total_price) || 0)}
                  </p>
                  {sale.invoice_id && (
                    <p className="text-[10px] text-[#9CA3AF] flex items-center justify-end gap-0.5">
                      <ArrowUpRight size={10} />
                      {sale.invoice_id}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── PILOT AI (placeholder) ──────────────── */}
      <div className="bg-white border border-[#E9ECF5] rounded-[14px] p-5">
        <h3 className="text-[13px] font-semibold text-[#1B2436] mb-3 flex items-center gap-2">
          <SparkleIcon />
          Pilot AI
        </h3>
        <p className="text-[12px] text-[#6B7280] leading-relaxed">
          AI siap membantu analisis penjualan. Tanyakan tren, rekomendasi menu, atau insight bisnis.
        </p>
        <button className="mt-3 w-full py-2 rounded-[10px] bg-[#EFF3FF] text-[#2E4FE0] text-[12px] font-semibold hover:bg-[#DFE6FD] transition-colors cursor-pointer">
          Tanya AI
        </button>
      </div>
    </div>
  );
});

function SparkleIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2E4FE0" strokeWidth="2">
      <path d="M12 2l2.4 7.2h7.6l-6 4.8 2.4 7.2-6.4-4.8-6.4 4.8 2.4-7.2-6-4.8h7.6z" />
    </svg>
  );
}

export default SalesRightSidebar;
