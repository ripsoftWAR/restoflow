import { motion } from 'framer-motion';
import { ArrowRight, TrendingUp, Package, Users, Shield, CheckCircle2 } from 'lucide-react';
import { BrandMark } from '../ui/BrandMark';
import { Button } from '../ui/Button';

interface Props {
  onMasuk: () => void;
  onDaftar: () => void;
}

/* ─── Trust Indicators ─────────────────────── */
const trust = [
  { label: 'Restoran Aktif', value: '500+' },
  { label: 'Transaksi / bulan', value: '100rb+' },
  { label: 'Kota di Indonesia', value: '30+' },
];

/* ─── Features ─────────────────────────────── */
const features = [
  {
    icon: TrendingUp,
    title: 'Pantau bisnis real-time',
    desc: 'Lihat penjualan, stok bahan, dan performa restoran langsung dari satu dasbor.',
  },
  {
    icon: Package,
    title: 'Inventori otomatis',
    desc: 'Stok bahan selalu tercatat. Dapatkan notifikasi saat bahan mulai menipis.',
  },
  {
    icon: Users,
    title: 'Satu sistem untuk semua',
    desc: 'Owner, manajer, kasir, dan dapur bekerja bersama dalam satu tempat.',
  },
  {
    icon: Shield,
    title: 'Akses aman per pengguna',
    desc: 'Setiap staf punya PIN masing-masing. Semua aktivitas tercatat dengan rapi.',
  },
];

/* ─── Dashboard Preview Mockup ─────────────── */
function DashboardPreview() {
  return (
    <div className="w-full max-w-[720px] mx-auto">
      <div className="rounded-[24px] border border-[#E2E8F0] bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Mock browser chrome */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-[#F1F5F9] bg-[#F8FAFC]">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#EF4444]/20" />
            <div className="w-3 h-3 rounded-full bg-[#F59E0B]/20" />
            <div className="w-3 h-3 rounded-full bg-[#10B981]/20" />
          </div>
          <div className="mx-auto h-2 w-32 rounded-full bg-[#E2E8F0]" />
        </div>

        {/* Mock dashboard content */}
        <div className="p-5 space-y-4">
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Penjualan Hari Ini', value: 'Rp 4.250.000', trend: '+12%', up: true },
              { label: 'Pesanan', value: '47', trend: '+8%', up: true },
              { label: 'Stok Menipis', value: '3 bahan', trend: 'Perlu restock', up: false },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-[16px] border border-[#F1F5F9] bg-[#F8FAFC] p-3.5"
              >
                <p className="text-[10px] font-medium text-[#94A3B8] uppercase tracking-wider">
                  {stat.label}
                </p>
                <p className="text-base font-semibold text-[#0F172A] mt-1">{stat.value}</p>
                <p
                  className={`text-[11px] font-medium mt-0.5 ${
                    stat.up ? 'text-[#059669]' : 'text-[#F59E0B]'
                  }`}
                >
                  {stat.trend}
                </p>
              </div>
            ))}
          </div>

          {/* Chart placeholder + sidebar mock */}
          <div className="flex gap-3">
            {/* Mini sidebar */}
            <div className="w-[120px] shrink-0 space-y-1.5">
              {['Dashboard', 'Inventori', 'Resep', 'Penjualan'].map((item, i) => (
                <div
                  key={item}
                  className={`rounded-[10px] px-3 py-2 text-[11px] font-medium ${
                    i === 0
                      ? 'bg-[#E7F0FF] text-[#2563EB]'
                      : 'text-[#94A3B8]'
                  }`}
                >
                  {item}
                </div>
              ))}
            </div>

            {/* Main area */}
            <div className="flex-1 rounded-[16px] border border-[#F1F5F9] bg-[#F8FAFC] p-4 space-y-3">
              {/* Chart bars */}
              <div className="flex items-end gap-2 h-[60px]">
                {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 rounded-t-[6px] bg-[#2563EB] opacity-80"
                    style={{ height: `${h}%` }}
                  />
                ))}
              </div>
              {/* Table rows */}
              <div className="space-y-1.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 rounded-[8px] bg-white px-3 py-2 border border-[#F1F5F9]"
                  >
                    <div className="w-5 h-5 rounded-full bg-[#E7F0FF]" />
                    <div className="flex-1 h-1.5 rounded-full bg-[#F1F5F9]" />
                    <div className="h-1.5 w-10 rounded-full bg-[#E7F0FF]" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ────────────────────────── */
export function LandingView({ onMasuk, onDaftar }: Props) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col">
      {/* ── Nav ─────────────────────────── */}
      <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-sm border-b border-transparent">
        <div className="flex items-center justify-between px-5 py-4 max-w-6xl mx-auto w-full">
          <BrandMark size="sm" showTagline={false} />
          <div className="flex items-center gap-2.5">
            <Button variant="ghost" size="md" onClick={onMasuk}>
              Masuk
            </Button>
            <Button variant="primary" size="md" onClick={onDaftar}>
              Coba Gratis
            </Button>
          </div>
        </div>
      </header>

      {/* ── Hero ────────────────────────── */}
      <section className="flex-1 flex flex-col items-center px-4 pt-20 pb-8 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center space-y-6 max-w-2xl"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 text-[13px] font-medium text-[#64748B]">
            <CheckCircle2 size={14} className="text-[#059669]" />
            Sistem operasional restoran terpercaya
          </div>

          <h1 className="text-[44px] sm:text-[52px] font-semibold leading-[1.08] tracking-[-0.03em] text-[#0F172A]">
            Kelola restoran
            <br />
            jadi lebih ringkas
          </h1>

          <p className="text-[17px] text-[#64748B] max-w-lg mx-auto leading-relaxed">
            Pantau penjualan, kelola stok bahan, atur resep, dan koordinasi tim
            — semua dalam satu sistem yang mudah digunakan.
          </p>

          {/* CTA */}
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button size="lg" onClick={onDaftar} icon={<ArrowRight size={17} />}>
              Mulai Gratis
            </Button>
            <Button variant="outline" size="lg" onClick={onMasuk}>
              Masuk ke Akun
            </Button>
          </div>
        </motion.div>

        {/* ── Dashboard Preview ─────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-14 w-full"
        >
          <DashboardPreview />
        </motion.div>

        {/* ── Trust Bar ─────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-10 pt-14"
        >
          {trust.map((t) => (
            <div key={t.label} className="text-center">
              <p className="text-2xl font-semibold text-[#0F172A] tracking-[-0.02em]">
                {t.value}
              </p>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">{t.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── Features ──────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-3xl mt-14"
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="group bg-white border border-[#F1F5F9] rounded-[20px] p-5 transition-all duration-200 hover:border-[#E2E8F0] hover:shadow-[0_4px_20px_rgba(0,0,0,0.04)]"
            >
              <div className="w-9 h-9 rounded-[12px] bg-[#E7F0FF] flex items-center justify-center mb-3 group-hover:bg-[#DBEAFE] transition-colors">
                <f.icon size={17} className="text-[#2563EB]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[14px] font-semibold text-[#0F172A] mb-1">
                {f.title}
              </h3>
              <p className="text-[13px] text-[#64748B] leading-relaxed">
                {f.desc}
              </p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────── */}
      <footer className="py-8 text-center border-t border-[#F1F5F9]">
        <p className="text-[12px] text-[#94A3B8]">
          © 2025 PilotPOS. Sistem manajemen restoran.
        </p>
      </footer>
    </div>
  );
}
