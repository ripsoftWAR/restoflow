import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Store,
  User,
  Lock,
  Copy,
  Check,
  Brain,
  Sparkles,
} from 'lucide-react';
import { BrandMark } from '../ui/BrandMark';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

/* ─── Main Component ───────────────────────── */
export function RegisterView({ onSuccess, onBack }: Props) {
  const [restaurant, setRestaurant] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successPin, setSuccessPin] = useState<string | null>(null);
  const [pinCopied, setPinCopied] = useState(false);

  const passwordMatch = password === confirmPassword;
  const passwordValid = password.length >= 6;
  const canSubmit =
    restaurant.trim() &&
    username.trim() &&
    passwordValid &&
    passwordMatch &&
    !loading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurant_name: restaurant.trim(),
          username: username.trim(),
          password,
          role: 'Pemilik',
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Gagal mendaftar');

      if (data.pin) {
        setSuccessPin(data.pin);
      } else {
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* ── Background decoration ─────────────── */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-[#EFF6FF]/40 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-[#2563EB]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-[460px] space-y-8"
      >
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>

        {/* Card body */}
        <div className="rounded-[24px] bg-white/70 backdrop-blur-xl border border-[#E2E8F0]/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] p-8 space-y-6">
          {/* Brand */}
          <BrandMark />

          {/* Heading */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-[#0F172A] tracking-[-0.02em]">
              Daftar restoran baru
            </h2>
            <p className="text-[14px] text-[#64748B] leading-relaxed">
              Setup 5 menit. AI Business Operator langsung aktif — siap analisa
              profit, saran promo, dan rekomendasi menu.
            </p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nama Restoran"
                placeholder="Nama restoran Anda"
                icon={<Store size={16} />}
                value={restaurant}
                onChange={(e) => setRestaurant(e.target.value)}
                autoFocus
                required
              />

              <Input
                label="Username"
                placeholder="Pilih username"
                icon={<User size={16} />}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />

              <Input
                label="Password"
                type="password"
                placeholder="Minimal 6 karakter"
                icon={<Lock size={16} />}
                showPasswordToggle
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                minLength={6}
                required
                hint={password && !passwordValid ? 'Terlalu pendek' : undefined}
              />

              <Input
                label="Konfirmasi Password"
                type="password"
                placeholder="Ulangi password"
                icon={<Lock size={16} />}
                showPasswordToggle
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                error={
                  confirmPassword && !passwordMatch
                    ? 'Password tidak cocok'
                    : null
                }
                required
              />

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  role="alert"
                  className="rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-[13px] text-[#DC2626] font-medium flex items-start gap-2"
                >
                  <svg className="w-4 h-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                size="lg"
                loading={loading}
                disabled={!canSubmit}
                className="w-full"
              >
                Daftar & Aktifkan AI Partner
              </Button>
            </form>

            {/* Feature reminder */}
            {!successPin && (
              <div className="rounded-[16px] bg-gradient-to-br from-[#EFF6FF]/50 to-[#F8FAFC] border border-[#DBEAFE]/60 p-4 space-y-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-[6px] bg-[#2563EB] flex items-center justify-center">
                    <Sparkles size={11} className="text-white" strokeWidth={1.5} />
                  </div>
                  <p className="text-[12px] font-semibold text-[#475569]">
                    Setelah daftar, Anda bisa langsung:
                  </p>
                </div>
                <div className="space-y-1.5">
                  {[
                    'Tanya profit & analisis penjualan',
                    'Minta saran promo & ide banner',
                    'Rekomendasi menu dari data restoran',
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-2">
                      <span className="text-[11px] text-[#2563EB] mt-px">•</span>
                      <p className="text-[12px] text-[#64748B]">{item}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ─── SUCCESS: PIN Card ────────── */}
          {successPin && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
              className="rounded-[20px] bg-white border border-[#E2E8F0] shadow-[0_8px_30px_-8px_rgba(37,99,235,0.12)] p-6 space-y-5 text-center"
            >
              {/* Success header */}
              <div className="inline-flex items-center gap-2 rounded-full bg-[#ECFDF5] border border-[#A7F3D0] px-4 py-1.5">
                <Brain size={15} className="text-[#059669]" strokeWidth={1.5} />
                <span className="text-[12px] font-semibold text-[#059669]">
                  AI Business Operator siap!
                </span>
              </div>

              {/* Success icon */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-16 h-16 rounded-full bg-[#ECFDF5] flex items-center justify-center mx-auto ring-4 ring-[#ECFDF5]/50"
              >
                <motion.svg
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  className="w-8 h-8 text-[#059669]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <motion.path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </motion.svg>
              </motion.div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-[#0F172A]">
                  Akun restoran siap!
                </h3>
                <p className="text-[14px] text-[#64748B] leading-relaxed">
                  Ini adalah{' '}
                  <span className="font-semibold text-[#0F172A]">PIN rahasia</span> Anda
                  — kunci untuk masuk ke sistem dan mengakses AI Business Operator.
                </p>
                <p className="text-[12px] text-[#94A3B8]">
                  Hanya Anda yang punya akses. Simpan baik-baik.
                </p>
              </div>

              {/* PIN display + copy */}
              <div className="flex items-center justify-center gap-3">
                <div className="rounded-[14px] bg-[#F8FAFC] border border-[#E2E8F0] px-6 py-3.5 ring-2 ring-[#2563EB]/10">
                  <span className="text-[32px] font-bold tracking-[0.3em] text-[#0F172A] font-mono select-all">
                    {successPin}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await navigator.clipboard.writeText(successPin);
                    setPinCopied(true);
                    setTimeout(() => setPinCopied(false), 2000);
                  }}
                  className="shrink-0 w-11 h-11 rounded-[13px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center hover:bg-[#DBEAFE] active:scale-95 transition-all duration-200"
                  title="Salin PIN"
                >
                  {pinCopied ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Check size={18} strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <Copy size={17} strokeWidth={1.5} />
                  )}
                </button>
              </div>

              {pinCopied && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-[12px] font-medium text-[#059669]"
                >
                  PIN disalin ke clipboard!
                </motion.p>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={() => {
                  setSuccessPin(null);
                  onSuccess();
                }}
              >
                Saya Sudah Simpan PIN — Ke Login
              </Button>
            </motion.div>
          )}
        </div>

        {/* Login link */}
        {!successPin && (
          <p className="text-center text-[13px] text-[#94A3B8]">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={onBack}
              className="font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
            >
              Masuk di sini
            </button>
          </p>
        )}
      </motion.div>
    </div>
  );
}
