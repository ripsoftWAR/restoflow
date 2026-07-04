import { motion } from 'framer-motion';

/**
 * DashboardMockup — Pure CSS/SVG mockup of PilotPOS dashboard
 * Used in hero section to show product value in 3 seconds
 */
export function DashboardMockup() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
      className="relative w-full max-w-[600px] mx-auto"
    >
      {/* Glow behind */}
      <div className="absolute -inset-4 bg-gradient-to-br from-[#2563EB]/5 via-[#2563EB]/3 to-transparent rounded-[32px] blur-3xl" />

      {/* Main card */}
      <div className="relative rounded-[24px] bg-white border border-[#E8EDF3] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1),0_0_0_1px_rgba(0,0,0,0.03)] overflow-hidden">

        {/* ── Header bar ─────────────────────── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9] bg-[#FAFBFC]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-[#2563EB] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-[#0F172A] leading-none">Dashboard</p>
              <p className="text-[9px] text-[#94A3B8] leading-none mt-0.5">Hari ini • 14 Mar 2025</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#E2E8F0]" />
            <div className="w-2 h-2 rounded-full bg-[#E2E8F0]" />
            <div className="w-2 h-2 rounded-full bg-[#E2E8F0]" />
          </div>
        </div>

        {/* ── Content ────────────────────────── */}
        <div className="p-4 space-y-4 bg-white">
          {/* Stat cards row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Pendapatan', value: 'Rp 4.2M', change: '+12%', up: true },
              { label: 'Pesanan', value: '187', change: '+8%', up: true },
              { label: 'Rata² Order', value: 'Rp 22K', change: '-3%', up: false },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.3 + i * 0.1 }}
                className="rounded-[14px] bg-[#F8FAFC] border border-[#F1F5F9] p-3"
              >
                <p className="text-[9px] font-medium text-[#94A3B8] uppercase tracking-wider leading-none">{stat.label}</p>
                <p className="text-[15px] font-bold text-[#0F172A] mt-1.5 leading-none">{stat.value}</p>
                <span className={`inline-flex items-center gap-0.5 text-[10px] font-semibold mt-1 ${stat.up ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                  {stat.up ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                  )}
                  {stat.change}
                </span>
              </motion.div>
            ))}
          </div>

          {/* Mini chart */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 }}
            className="rounded-[14px] bg-[#F8FAFC] border border-[#F1F5F9] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider">Penjualan Minggu Ini</p>
              <span className="text-[9px] font-medium text-[#94A3B8]">7 hari</span>
            </div>

            {/* Bar chart */}
            <div className="flex items-end justify-between gap-1.5 h-[70px]">
              {[35, 55, 40, 70, 50, 80, 65].map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${h}%` }}
                    transition={{ duration: 0.6, delay: 0.6 + i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                    className="w-full rounded-[6px] bg-gradient-to-t from-[#2563EB]/20 to-[#2563EB]"
                    style={{ maxHeight: `${h}%` }}
                  />
                  <span className="text-[8px] text-[#94A3B8]">{['Sn','Sl','Rb','Km','Jm','Sb','Mg'][i]}</span>
                </div>
              ))}
            </div>

            {/* Trend line overlay hint */}
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[#E2E8F0]/50">
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                <span className="text-[9px] text-[#64748B]">Revenue</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2.5 h-2.5 rounded-full bg-[#CBD5E1]" />
                <span className="text-[9px] text-[#64748B]">Target</span>
              </div>
            </div>
          </motion.div>

          {/* Recent orders */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.7 }}
            className="rounded-[14px] bg-[#F8FAFC] border border-[#F1F5F9] p-4"
          >
            <p className="text-[10px] font-semibold text-[#64748B] uppercase tracking-wider mb-3">Pesanan Terakhir</p>
            <div className="space-y-2">
              {[
                { name: 'Nasi Goreng', qty: '2x', total: 'Rp 50K', status: 'Selesai' },
                { name: 'Ayam Bakar', qty: '1x', total: 'Rp 35K', status: 'Diproses' },
                { name: 'Es Teh Manis', qty: '4x', total: 'Rp 32K', status: 'Selesai' },
              ].map((order, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-[8px] bg-white border border-[#E2E8F0] flex items-center justify-center text-[9px] font-bold text-[#94A3B8]">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-[11px] font-medium text-[#0F172A] leading-none">{order.name}</p>
                      <p className="text-[9px] text-[#94A3B8] mt-0.5">{order.qty}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-semibold text-[#0F172A] leading-none">{order.total}</p>
                    <span className={`text-[9px] font-medium ${order.status === 'Selesai' ? 'text-[#059669]' : 'text-[#F59E0B]'}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ── Bottom nav ────────────────────── */}
        <div className="flex items-center justify-around px-4 py-2.5 border-t border-[#F1F5F9] bg-white">
          {[
            { icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z', active: true },
            { icon: 'M21 10.5h-1.5M21 13.5h-1.5M21 16.5h-1.5M4.5 10.5H3M4.5 13.5H3M4.5 16.5H3M6 21h12a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z' },
            { icon: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2', active: true },
            { icon: 'M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-2a2 2 0 0 1-2-2z' },
          ].map((item, i) => (
            <div key={i} className={`p-1.5 rounded-[10px] ${item.active ? 'text-[#2563EB]' : 'text-[#CBD5E1]'}`}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
            </div>
          ))}
        </div>
      </div>

      {/* Floating POS terminal */}
      <motion.div
        initial={{ opacity: 0, x: 20, y: 10 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        transition={{ duration: 0.5, delay: 0.9, ease: [0.25, 0.1, 0.25, 1] }}
        className="absolute -right-4 -bottom-3 w-[140px] rounded-[16px] bg-white border border-[#E8EDF3] shadow-[0_12px_30px_-8px_rgba(0,0,0,0.12)] overflow-hidden"
      >
        <div className="bg-[#2563EB] px-3 py-2">
          <p className="text-[9px] font-semibold text-white">🧑‍🍳 Kasir</p>
        </div>
        <div className="p-2.5 space-y-2">
          <div className="flex justify-between text-[9px]">
            <span className="text-[#94A3B8]">Meja 5</span>
            <span className="font-semibold text-[#0F172A]">Rp 85K</span>
          </div>
          <div className="space-y-1">
            {['Nasi Goreng', 'Ayam Bakar', 'Es Teh x2'].map((item, i) => (
              <div key={i} className="flex justify-between text-[8px]">
                <span className="text-[#64748B]">{item}</span>
                <span className="text-[#0F172A] font-medium">{['Rp 25K','Rp 35K','Rp 25K'][i]}</span>
              </div>
            ))}
          </div>
          <motion.div
            animate={{ scale: [1, 1.03, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-full py-1.5 rounded-[8px] bg-[#059669] text-center"
          >
            <span className="text-[9px] font-bold text-white">💳 Bayar</span>
          </motion.div>
        </div>
      </motion.div>

      {/* Floating AI bubble */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 1.1, type: 'spring', stiffness: 200 }}
        className="absolute -left-3 top-1/3 w-[150px] rounded-[14px] bg-white border border-[#E8EDF3] shadow-[0_10px_25px_-8px_rgba(37,99,235,0.15)] p-3"
      >
        <div className="flex items-center gap-1.5 mb-1.5">
          <div className="w-4 h-4 rounded-[5px] bg-[#2563EB] flex items-center justify-center">
            <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z"/>
            </svg>
          </div>
          <span className="text-[9px] font-semibold text-[#0F172A]">AI Operator</span>
        </div>
        <p className="text-[9px] text-[#64748B] leading-relaxed">
          Nasi Goreng profit <span className="text-[#DC2626] font-semibold">-8%</span>.
          Naikkan harga Rp 2.000?
        </p>
        <div className="flex gap-1.5 mt-2">
          <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#EFF6FF] text-[#2563EB] font-medium">✅ Ya</span>
          <span className="text-[8px] px-2 py-0.5 rounded-full bg-[#F1F5F9] text-[#64748B] font-medium">❌ Nanti</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
