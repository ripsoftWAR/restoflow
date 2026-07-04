import { useRef, useState, useEffect } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  ArrowRight,
  TrendingUp,
  Megaphone,
  Search,
  Target,
  ShoppingCart,
  LayoutDashboard,
  Layers,
  Monitor,
  BarChart3,
  Brain,
  Sparkles,
  Star,
  Shield,
  Zap,
  Clock,
  MapPin,
  Scan,
  MessageCircle,
} from 'lucide-react';
import { Button } from '../ui/Button';
import { DashboardMockup } from '../ui/DashboardMockup';
import { FeatureShowcase } from '../ui/FeatureShowcase';
import { TestimonialCard } from '../ui/TestimonialCard';
import { LandingNavbar } from '../ui/LandingNavbar';
import { LandingFooter } from '../ui/LandingFooter';

interface Props {
  onMasuk: () => void;
  onDaftar: () => void;
}

/* ─── Trust bar — Premium value cards ───── */
const trustItems = [
  {
    icon: Brain,
    title: 'AI Business Operator',
    subtitle: 'AI khusus restoran, bukan chatbot umum. Paham konteks bisnis F&B Anda.',
  },
  {
    icon: Scan,
    title: 'OCR Struk Belanja',
    subtitle: 'Scan struk supplier langsung jadi stok otomatis. Hemat jam input manual.',
  },
  {
    icon: Zap,
    title: 'Setup 5 Menit',
    subtitle: 'Daftar, login, langsung pakai. Tanpa training khusus atau setup rumit.',
  },
  {
    icon: Shield,
    title: 'Data Aman',
    subtitle: 'Cloud backup otomatis, enkripsi penuh. Data Anda hanya milik Anda.',
  },
  {
    icon: MessageCircle,
    title: 'Support 24/7',
    subtitle: 'Tim support siap bantu kapan pun. Chat, telepon, atau remote session.',
  },
];

/* ─── Feature modules ────────────────────── */
const featureModules = [
  {
    icon: LayoutDashboard,
    title: 'POS Dashboard',
    description: 'Pantau penjualan real-time, stok bahan, dan performa menu dalam satu layar. Ambil keputusan cepat tanpa ribet.',
    accent: 'blue',
  },
  {
    icon: ShoppingCart,
    title: 'Kasir Cepat',
    description: 'Transaksi 3 detik. Split bill, voucher, thermal print. Didesain untuk peak hour restoran sibuk.',
    accent: 'emerald',
  },
  {
    icon: Layers,
    title: 'Inventory Cerdas',
    description: 'Auto-track stok per transaksi. Alert stok menipis. Rekomendasi pembelian dari AI berdasarkan tren pemakaian.',
    accent: 'violet',
  },
  {
    icon: Monitor,
    title: 'Kitchen Display',
    description: 'Pesanan langsung tampil di dapur. Kurangi kertas, percepat serving time, minimalkan salah order.',
    accent: 'orange',
  },
  {
    icon: Brain,
    title: 'AI Business Operator',
    description: 'Tanya profit menu, minta saran promo, rekomendasi menu baru — dalam bahasa sehari-hari. AI khusus F&B.',
    accent: 'teal',
  },
  {
    icon: BarChart3,
    title: 'Analytics & Laporan',
    description: 'Revenue trend, menu terlaris, peak hour analysis. Export PDF/CSV. Insight yang bikin untung.',
    accent: 'rose',
  },
];

/* ─── AI Capabilities ────────────────────── */
const aiCapabilities = [
  {
    icon: TrendingUp,
    title: 'Analisis Profit',
    desc: 'Tanya langsung menu mana yang profit turun atau naik. AI analisa data penjualan real-time.',
    highlight: '"Menu mana yang profit turun minggu ini?"',
  },
  {
    icon: Megaphone,
    title: 'Saran Promo',
    desc: 'Minta ide strategi promo, rencana diskon, atau teks banner — AI paham konteks bisnis Anda.',
    highlight: '"Buatkan rencana promo Ramadhan"',
  },
  {
    icon: Search,
    title: 'Rekomendasi Menu',
    desc: 'Cari menu dengan bahasa alami, minta saran menu baru berbasis tren, stok, dan histori.',
    highlight: '"Saran menu baru dari bahan yang ada"',
  },
  {
    icon: Target,
    title: 'Khusus F&B',
    desc: 'AI ini dirancang khusus restoran. Tidak ngelantur ke topik di luar operasional bisnis kuliner Anda.',
  },
];

/* ─── Testimonials ───────────────────────── */
const testimonials = [
  {
    quote: 'Awalnya saya kira aplikasi POS biasa. Ternyata bisa tanya langsung soal profit menu, minta ide promo, dan cari menu dengan bahasa sehari-hari. Seperti punya konsultan sendiri.',
    name: 'Bu Rina',
    role: 'Pemilik',
    restaurant: 'RM Sederhana',
    rating: 5,
    avatarColor: '#2563EB',
  },
  {
    quote: 'Inventory tracking-nya sangat membantu. Dulu sering kehabisan bahan pas peak hour, sekarang ada alert otomatis. Transaksi juga jadi jauh lebih cepat.',
    name: 'Pak Budi',
    role: 'Owner',
    restaurant: 'Warung Kita',
    rating: 5,
    avatarColor: '#059669',
  },
  {
    quote: 'Fitur AI-nya beda dari chatbot biasa. Bisa tanya "menu apa yang paling laris bulan ini" dan langsung dapat insight. Tim saya jadi lebih produktif.',
    name: 'Chef Adi',
    role: 'Head Chef',
    restaurant: 'The Galley',
    rating: 5,
    avatarColor: '#7C3AED',
  },
];

/* ─── Section wrapper ────────────────────── */
function Section({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <section className={`px-4 py-16 sm:py-24 max-w-7xl mx-auto w-full ${className}`}>
      {children}
    </section>
  );
}

/* ─── Section heading ────────────────────── */
function SectionHeading({
  label,
  title,
  description,
}: {
  label?: string;
  title: string;
  description?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
      className="text-center max-w-2xl mx-auto space-y-4 mb-14"
    >
      {label && (
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 text-[12px] font-medium text-[#475569]">
          <Sparkles size={13} className="text-[#2563EB]" strokeWidth={1.5} />
          {label}
        </div>
      )}
      <h2 className="text-[32px] sm:text-[40px] font-bold leading-[1.12] tracking-[-0.03em] text-[#0F172A]">
        {title}
      </h2>
      {description && (
        <p className="text-[15px] text-[#64748B] leading-relaxed">{description}</p>
      )}
    </motion.div>
  );
}

/* ─── Animated Counter (integer) ─────────── */
function CounterInteger({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    let frame: number;
    const duration = 1.8;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target]);

  return <span ref={ref}>{count.toLocaleString()}</span>;
}

/* ─── Animated Counter (decimal) ─────────── */
function CounterDecimal({ target }: { target: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  useEffect(() => {
    if (!isInView) return;
    let startTime: number | null = null;
    let frame: number;
    const duration = 1.5;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / (duration * 1000), 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(eased * target);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [isInView, target]);

  return <span ref={ref}>{count.toFixed(1)}</span>;
}

/* ═══════════════════════════════════════════
   LANDING VIEW — Main Component
   ═══════════════════════════════════════════ */
export function LandingView({ onMasuk, onDaftar }: Props) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">
      {/* ══════════════════════════════════════
          NAVIGATION — Premium SaaS Header
          ══════════════════════════════════════ */}
      <LandingNavbar onMasuk={onMasuk} onDaftar={onDaftar} />

      {/* ══════════════════════════════════════
          HERO SECTION — 50/50 layout
          ══════════════════════════════════════ */}
      <Section className="pt-28 sm:pt-32 pb-8 sm:pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* ── Left: Content ───────────── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center lg:text-left space-y-6"
          >
            {/* Pill badge */}
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-4 py-1.5 text-[12px] font-semibold text-[#2563EB]">
              <Sparkles size={13} strokeWidth={1.5} />
              AI-Powered Restaurant OS
            </div>

            <h1 className="text-[40px] sm:text-[48px] lg:text-[56px] font-bold leading-[1.06] tracking-[-0.03em] text-[#0F172A]">
              Operasional restoran
              <br />
              <span className="text-[#2563EB]">lebih cerdas,</span> lebih untung
            </h1>

            <p className="text-[16px] sm:text-[17px] text-[#64748B] max-w-lg lg:max-w-none leading-relaxed">
              PilotPOS adalah Restaurant Operating System dengan AI bawaan.
              Pantau penjualan real-time, kelola stok otomatis, dan dapatkan
              insight bisnis — semua dalam satu tempat.
            </p>

            {/* CTA buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Button
                size="lg"
                onClick={onDaftar}
                icon={<ArrowRight size={17} />}
              >
                Mulai Gratis — 5 Menit Setup
              </Button>
              <Button variant="outline" size="lg" onClick={onMasuk}>
                Masuk ke Akun
              </Button>
            </div>

            {/* Trust badges */}
            <div className="flex items-center justify-center lg:justify-start gap-5 pt-3 text-[12px] text-[#94A3B8]">
              <div className="flex items-center gap-1.5">
                <Shield size={14} className="text-[#059669]" strokeWidth={1.5} />
                <span>Data terenkripsi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#F59E0B]" strokeWidth={1.5} />
                <span>Setup 5 menit</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock size={14} className="text-[#2563EB]" strokeWidth={1.5} />
                <span>Support 24/7</span>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Dashboard Mockup ─── */}
          <DashboardMockup />
        </div>
      </Section>

      {/* ══════════════════════════════════════
          STATS COUNTER — Social proof angka
          ══════════════════════════════════════ */}
      <div className="relative bg-white border-y border-[#F1F5F9]">
        {/* Top glow line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-px bg-gradient-to-r from-transparent via-[#2563EB]/15 to-transparent" />

        <div className="max-w-5xl mx-auto px-4 py-12 sm:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[
              { target: 500, suffix: '+', label: 'Restoran aktif', sub: 'di seluruh Indonesia' },
              { target: 50, suffix: 'rb+', label: 'Transaksi / hari', sub: 'diproses real-time' },
              { target: 99, suffix: '%', label: 'Uptime server', sub: 'cloud infrastructure', isStatic: true, staticVal: '99.9' },
              { target: 4.9, suffix: '', label: 'Rating rata-rata', sub: 'dari 200+ reviews', isDecimal: true },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                className="text-center space-y-1.5"
              >
                <p className="text-[36px] sm:text-[44px] font-bold tracking-[-0.03em] text-[#0F172A] tabular-nums leading-none">
                  {stat.isStatic ? (
                    <span>{stat.staticVal}</span>
                  ) : stat.isDecimal ? (
                    <CounterDecimal target={stat.target} />
                  ) : (
                    <CounterInteger target={stat.target} />
                  )}
                  {stat.suffix}
                </p>
                <p className="text-[14px] sm:text-[15px] font-semibold text-[#0F172A]">
                  {stat.label}
                </p>
                <p className="text-[12px] text-[#94A3B8]">{stat.sub}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          TRUST BAR — Premium value cards
          Transition dari Stats → Features
          ══════════════════════════════════════ */}
      <div className="relative border-y border-slate-100 bg-gradient-to-b from-white via-white to-blue-50/40">
        {/* ── Decorative top glow line ── */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent" />

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          {/* ── Cards grid ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
            {trustItems.map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-80px' }}
                transition={{
                  duration: 0.5,
                  delay: i * 0.07,
                  ease: [0.25, 0.1, 0.25, 1],
                }}
                whileHover={{ y: -6 }}
                className="group relative bg-white border border-slate-100 rounded-2xl p-5 sm:p-6 transition-all duration-300 hover:border-blue-100 hover:bg-white hover:shadow-[0_16px_48px_-16px_rgba(37,99,235,0.10)]"
              >
                {/* ── Icon container ── */}
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center mb-4 group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-300">
                  <item.icon
                    size={20}
                    className="text-blue-600"
                    strokeWidth={1.5}
                  />
                </div>

                {/* ── Title ── */}
                <h3 className="text-[14px] sm:text-[15px] font-semibold text-slate-900 mb-1.5 tracking-[-0.01em]">
                  {item.title}
                </h3>

                {/* ── Subtitle ── */}
                <p className="text-[12px] sm:text-[13px] text-slate-500 leading-relaxed">
                  {item.subtitle}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════
          FEATURE MODULES — Grid showcase
          ══════════════════════════════════════ */}
      <Section>
        <SectionHeading
          label="Fitur Lengkap"
          title="Semua yang dibutuhkan restoran modern"
          description="Dari kasir hingga analisis AI, semua terintegrasi dalam satu sistem yang mudah digunakan."
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {featureModules.map((feature, i) => (
            <FeatureShowcase
              key={feature.title}
              {...feature}
              delay={i * 0.07}
            />
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════
          AI CAPABILITIES — Deeper dive
          ══════════════════════════════════════ */}
      <div className="bg-white border-y border-[#F1F5F9]">
        <Section>
          <SectionHeading
            label="AI Business Operator"
            title="Partner AI yang ngerti bisnis Anda"
            description="Bukan chatbot biasa. AI khusus F&B yang paham data restoran dan bisa bantu ambil keputusan."
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {aiCapabilities.map((cap, i) => (
              <motion.div
                key={cap.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: i * 0.08, ease: [0.25, 0.1, 0.25, 1] }}
                whileHover={{ y: -4 }}
                className="group relative bg-[#F8FAFC] border border-[#F1F5F9] rounded-[20px] p-6 transition-all duration-300 hover:border-[#DBEAFE] hover:bg-white hover:shadow-[0_12px_40px_-12px_rgba(37,99,235,0.12)]"
              >
                {/* Icon */}
                <div className="w-11 h-11 rounded-[13px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] flex items-center justify-center mb-4 group-hover:from-[#DBEAFE] group-hover:to-[#BFDBFE] transition-all duration-300">
                  <cap.icon size={20} className="text-[#2563EB]" strokeWidth={1.5} />
                </div>

                <h3 className="text-[15px] font-semibold text-[#0F172A] mb-2">
                  {cap.title}
                </h3>
                <p className="text-[13px] text-[#64748B] leading-relaxed">
                  {cap.desc}
                </p>

                {cap.highlight && (
                  <div className="mt-3 pt-3 border-t border-[#E2E8F0]/50">
                    <p className="text-[12px] text-[#94A3B8] italic leading-relaxed flex items-start gap-1.5">
                      <span className="text-[#2563EB] shrink-0 mt-0.5">💬</span>
                      {cap.highlight}
                    </p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {/* AI Demo chat preview */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-50px' }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="mt-12 max-w-[680px] mx-auto"
          >
            <AIChatPreview />
          </motion.div>
        </Section>
      </div>

      {/* ══════════════════════════════════════
          TESTIMONIALS — Premium cards
          ══════════════════════════════════════ */}
      <Section>
        <SectionHeading
          title="Dipercaya pemilik restoran"
          description="Bukan kata kami. Dengarkan langsung dari mereka yang pakai PilotPOS setiap hari."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <TestimonialCard key={t.name} {...t} delay={i * 0.1} />
          ))}
        </div>
      </Section>

      {/* ══════════════════════════════════════
          FINAL CTA — Bold, convincing
          ══════════════════════════════════════ */}
      <div className="relative bg-[#0F172A] overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-gradient-to-b from-[#2563EB]/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-[#2563EB]/10 to-transparent rounded-full blur-3xl" />

        <Section className="relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }}
            className="text-center max-w-xl mx-auto space-y-6"
          >
            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#334155] bg-[#1E293B] px-4 py-1.5 text-[12px] font-medium text-[#94A3B8]">
              <MapPin size={13} className="text-[#2563EB]" strokeWidth={1.5} />
              Siap pakai — setup 5 menit
            </div>

            <h2 className="text-[32px] sm:text-[40px] font-bold leading-[1.12] tracking-[-0.03em] text-white">
              Siap operasikan restoran
              <br />
              dengan lebih cerdas?
            </h2>

            <p className="text-[15px] text-[#94A3B8] leading-relaxed">
              Mulai dari 1 outlet. Gratis selamanya — tanpa kartu kredit, tanpa
              biaya tersembunyi.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                onClick={onDaftar}
                icon={<ArrowRight size={17} />}
              >
                Mulai Gratis Sekarang
              </Button>
            </div>

            {/* Stars + text */}
            <div className="flex items-center justify-center gap-2 pt-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={13} fill="#F59E0B" stroke="none" />
                ))}
              </div>
              <span className="text-[12px] text-[#64748B]">
                AI siap bantu operasional restoran Anda
              </span>
            </div>
          </motion.div>
        </Section>
      </div>

      {/* ══════════════════════════════════════
          FOOTER — Premium SaaS Footer
          ══════════════════════════════════════ */}
      <LandingFooter />
    </div>
  );
}

/* ─── AI Chat Preview (inline component) ─── */
function AIChatPreview() {
  return (
    <div className="rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.06)] overflow-hidden">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#F1F5F9] bg-[#FAFBFC]">
        <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] flex items-center justify-center">
          <Sparkles size={14} className="text-white" strokeWidth={1.5} />
        </div>
        <div>
          <p className="text-[13px] font-semibold text-[#0F172A]">AI Business Operator</p>
          <p className="text-[10px] text-[#94A3B8]">Khusus F&B — selalu on-topic</p>
        </div>
      </div>

      {/* Chat messages */}
      <div className="p-5 space-y-4 bg-[#FAFBFC]">
        {/* User */}
        <div className="flex justify-end">
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="max-w-[75%] rounded-[16px_16px_4px_16px] bg-[#2563EB] px-4 py-2.5"
          >
            <p className="text-[13px] text-white leading-relaxed">
              Menu mana yang profit-nya turun minggu ini?
            </p>
          </motion.div>
        </div>

        {/* AI response */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="flex gap-2.5"
        >
          <div className="w-7 h-7 rounded-[8px] bg-[#EFF6FF] flex items-center justify-center shrink-0 mt-0.5">
            <TrendingUp size={12} className="text-[#2563EB]" />
          </div>
          <div className="max-w-[80%] space-y-2">
            <div className="rounded-[16px_16px_16px_4px] bg-white border border-[#F1F5F9] px-4 py-3 shadow-sm">
              <p className="text-[13px] text-[#0F172A] leading-relaxed font-medium">
                Berdasarkan data minggu ini:
              </p>
              <div className="mt-2.5 space-y-2">
                {[
                  { name: 'Nasi Goreng', margin: '-8%', down: true },
                  { name: 'Ayam Bakar', margin: '+12%', down: false },
                  { name: 'Es Teh', margin: '-3%', down: true },
                ].map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-[12px] bg-[#F8FAFC] rounded-[8px] px-2.5 py-1.5">
                    <span className="text-[#475569] font-medium">{item.name}</span>
                    <span className={`font-bold ${item.down ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                      {item.margin}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-[12px] text-[#64748B] px-1 leading-relaxed">
              <span className="font-semibold text-[#2563EB]">Rekomendasi:</span> Nasi Goreng stok bahan naik 5%. Coba sesuaikan porsi atau naikkan harga Rp 2.000.
            </p>
          </div>
        </motion.div>

        {/* Typing indicator */}
        <div className="flex items-center gap-1.5 pl-2">
          {[0, 150, 300].map((delay) => (
            <motion.div
              key={delay}
              animate={{ y: [0, -6, 0] }}
              transition={{
                duration: 0.6,
                delay: delay / 1000,
                repeat: Infinity,
                repeatDelay: 0.6,
              }}
              className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
