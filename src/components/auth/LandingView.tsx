import { motion } from 'framer-motion';
import {
  ArrowRight,
  TrendingUp,
  Package,
  Brain,
  Sparkles,
  Megaphone,
  Target,
  Search,
} from 'lucide-react';
import { BrandMark } from '../ui/BrandMark';
import { Button } from '../ui/Button';

interface Props {
  onMasuk: () => void;
  onDaftar: () => void;
}

/* ─── Trust ────────────────────────────────── */
const trust = [
  { label: 'Restoran Aktif', value: '500+' },
  { label: 'Kota di Indonesia', value: '30+' },
];

/* ─── Kemampuan Nyata AI Business Operator ─── */
const capabilities = [
  {
    icon: TrendingUp,
    title: 'Analisis Profit',
    desc: 'Tanya langsung menu mana yang profit turun atau naik. AI langsung analisa data penjualan Anda.',
    highlight: '💬 "Menu mana yang profit turun minggu ini?"',
  },
  {
    icon: Megaphone,
    title: 'Saran Promo & Banner',
    desc: 'Minta ide strategi promo, rencana diskon, atau teks banner — AI paham konteks restoran Anda.',
    highlight: '💬 "Buatkan rencana promo Ramadhan"',
  },
  {
    icon: Search,
    title: 'Rekomendasi Menu',
    desc: 'Cari menu dengan bahasa alami, atau minta saran menu baru berbasis tren, stok, dan histori.',
    highlight: '💬 "Saran menu baru dari bahan yang ada"',
  },
  {
    icon: Target,
    title: 'Khusus Bisnis F&B',
    desc: 'AI ini dirancang khusus restoran. Tidak akan ngelantur ke topik di luar operasional F&B Anda.',
  },
];

/* ─── Demo Chat Bubble ─────────────────────── */
function DemoChat() {
  return (
    <div className="w-full max-w-[680px] mx-auto">
      <div className="rounded-[20px] border border-[#E2E8F0] bg-white shadow-[0_8px_40px_-12px_rgba(0,0,0,0.08)] overflow-hidden">
        {/* Chat header */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#F1F5F9] bg-[#F8FAFC]">
          <div className="w-8 h-8 rounded-[10px] bg-[#2563EB] flex items-center justify-center">
            <Sparkles size={14} className="text-white" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0F172A]">AI Business Operator</p>
            <p className="text-[10px] text-[#94A3B8]">Khusus F&B — selalu on-topic</p>
          </div>
        </div>

        {/* Chat messages */}
        <div className="p-5 space-y-4 bg-[#FAFBFC]">
          {/* User message */}
          <div className="flex justify-end">
            <div className="max-w-[75%] rounded-[16px_16px_4px_16px] bg-[#2563EB] px-4 py-2.5">
              <p className="text-[13px] text-white leading-relaxed">
                Menu mana yang profit-nya turun minggu ini?
              </p>
            </div>
          </div>

          {/* AI response */}
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-[8px] bg-[#EFF6FF] flex items-center justify-center shrink-0 mt-0.5">
              <TrendingUp size={12} className="text-[#2563EB]" />
            </div>
            <div className="max-w-[80%] space-y-2">
              <div className="rounded-[16px_16px_16px_4px] bg-white border border-[#F1F5F9] px-4 py-3">
                <p className="text-[13px] text-[#0F172A] leading-relaxed">
                  Berdasarkan data minggu ini:
                </p>
                <div className="mt-2 space-y-1.5">
                  {[
                    { name: 'Nasi Goreng', margin: '-8%', down: true },
                    { name: 'Ayam Bakar', margin: '+12%', down: false },
                    { name: 'Es Teh', margin: '-3%', down: true },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-[12px]">
                      <span className="text-[#475569]">{item.name}</span>
                      <span className={`font-semibold ${item.down ? 'text-[#DC2626]' : 'text-[#059669]'}`}>
                        {item.margin}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <p className="text-[12px] text-[#64748B] px-1 leading-relaxed">
                Rekomendasi: Nasi Goreng stok bahan naik 5%. Coba sesuaikan porsi atau naikkan harga Rp 2.000.
              </p>
            </div>
          </div>

          {/* Typing indicator */}
          <div className="flex items-center gap-1.5 pl-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1] animate-bounce" style={{ animationDelay: '300ms' }} />
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
      <header className="sticky top-0 z-10 bg-[#F8FAFC]/80 backdrop-blur-sm">
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
      <section className="flex-1 flex flex-col items-center px-4 pt-12 pb-8 max-w-6xl mx-auto w-full">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
          className="text-center space-y-5 max-w-2xl"
        >
          {/* Label */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#E2E8F0] bg-white px-4 py-1.5 text-[12px] font-medium text-[#475569]">
            <Brain size={13} className="text-[#2563EB]" strokeWidth={1.5} />
            AI Business Operator
          </div>

          <h1 className="text-[42px] sm:text-[50px] font-bold leading-[1.08] tracking-[-0.03em] text-[#0F172A]">
            Partner cerdas untuk
            <br />
            operasional restoran
          </h1>

          <p className="text-[16px] text-[#64748B] max-w-lg mx-auto leading-relaxed">
            Tanya soal profit, minta saran promo, cari menu — dalam bahasa sehari-hari.
            AI yang ngerti bisnis Anda, bukan chatbot biasa.
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

        {/* ── Demo Chat ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.25, 0.1, 0.25, 1] }}
          className="mt-12 w-full"
        >
          <DemoChat />
        </motion.div>

        {/* ── Trust Bar ─────────────────── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="flex items-center justify-center gap-10 pt-12"
        >
          {trust.map((t) => (
            <div key={t.label} className="text-center">
              <p className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">
                {t.value}
              </p>
              <p className="text-[12px] text-[#94A3B8] mt-0.5">{t.label}</p>
            </div>
          ))}
          <div className="text-center">
            <p className="text-2xl font-semibold tracking-[-0.02em] text-[#0F172A]">
              <Brain size={18} className="inline text-[#2563EB] mr-0.5" strokeWidth={1.5} />
              AI
            </p>
            <p className="text-[12px] text-[#94A3B8] mt-0.5">Khusus F&B</p>
          </div>
        </motion.div>

        {/* ── Capabilities Grid ──────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full max-w-4xl mt-14"
        >
          {capabilities.map((cap) => (
            <div
              key={cap.title}
              className="group relative bg-white border border-[#F1F5F9] rounded-[20px] p-5 transition-all duration-200 hover:border-[#DBEAFE] hover:shadow-[0_8px_30px_-8px_rgba(37,99,235,0.1)]"
            >
              <div className="w-9 h-9 rounded-[12px] bg-[#E7F0FF] flex items-center justify-center mb-3 group-hover:bg-[#DBEAFE] transition-all">
                <cap.icon size={17} className="text-[#2563EB]" strokeWidth={1.5} />
              </div>
              <h3 className="text-[14px] font-semibold text-[#0F172A] mb-1.5">
                {cap.title}
              </h3>
              <p className="text-[13px] text-[#64748B] leading-relaxed">
                {cap.desc}
              </p>
              {cap.highlight && (
                <p className="text-[11px] text-[#94A3B8] mt-2 italic">
                  {cap.highlight}
                </p>
              )}
            </div>
          ))}
        </motion.div>

        {/* ── Quote ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-16 max-w-xl text-center"
        >
          <div className="flex items-center justify-center gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill="#F59E0B">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
            ))}
          </div>
          <blockquote className="text-[15px] text-[#64748B] italic leading-relaxed">
            "Awalnya saya kira aplikasi POS biasa. Ternyata bisa tanya langsung soal
            profit menu, minta ide promo, dan cari menu dengan bahasa sehari-hari.
            Seperti punya konsultan sendiri."
          </blockquote>
          <p className="text-[13px] font-semibold text-[#0F172A] mt-3">
            — Bu Rina, Pemilik RM Sederhana
          </p>
        </motion.div>
      </section>

      {/* ── Footer ──────────────────────── */}
      <footer className="py-8 text-center border-t border-[#F1F5F9] mt-8">
        <p className="text-[12px] text-[#94A3B8]">
          © 2025 RestoFlow — Restaurant OS
        </p>
      </footer>
    </div>
  );
}
