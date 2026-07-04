import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowLeft } from 'lucide-react';
import { BrandMark } from '../ui/BrandMark';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface Props {
  error: string | null;
  loading: boolean;
  onSubmit: (username: string, password: string, remember: boolean) => Promise<void>;
  onBack: () => void;
  onRegister?: () => void;
}

/* ─── Main Component ───────────────────────── */
export function LoginView({ error, loading, onSubmit, onBack, onRegister }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    usernameRef.current?.focus();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    await onSubmit(username.trim(), password, remember);
  };

  const canSubmit = username.trim() && password && !loading;

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* ── Background decoration ─────────────── */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#EFF6FF]/60 to-transparent pointer-events-none" />
      <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-gradient-to-bl from-[#EFF6FF]/30 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-[#2563EB]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ── Card ───────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-[420px] space-y-8"
      >
        {/* Back link */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali
        </button>

        {/* Card body with glass effect */}
        <div className="rounded-[24px] bg-white/70 backdrop-blur-xl border border-[#E2E8F0]/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] p-8 space-y-6">
          {/* Brand */}
          <BrandMark />

          {/* Heading */}
          <div className="space-y-2 text-center">
            <h2 className="text-2xl font-semibold text-[#0F172A] tracking-[-0.02em]">
              Masuk ke akun
            </h2>
            <p className="text-[14px] text-[#64748B] leading-relaxed">
              AI Business Operator siap membantu setelah login.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              ref={usernameRef}
              label="Username"
              placeholder="nama restoran atau username"
              icon={<Mail size={16} />}
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
              placeholder="Masukkan password"
              icon={<Lock size={16} />}
              showPasswordToggle
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />

            {/* Remember + Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-4 h-4 rounded-[5px] border-2 transition-all duration-200 flex items-center justify-center ${remember ? 'bg-[#2563EB] border-[#2563EB]' : 'border-[#CBD5E1] group-hover:border-[#94A3B8]'}`}>
                    {remember && (
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-[13px] text-[#64748B] group-hover:text-[#475569] transition-colors">
                  Ingat sesi ini
                </span>
              </label>
              <button
                type="button"
                className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
                onClick={() => setShowForgotHint(!showForgotHint)}
              >
                Lupa password?
              </button>
            </div>

            {/* Forgot hint */}
            {showForgotHint && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="rounded-[14px] bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-3 text-[13px] text-[#1E40AF] leading-relaxed"
              >
                Hubungi <span className="font-semibold">administrator</span> atau{' '}
                <span className="font-semibold">pemilik restoran</span> untuk mereset
                password Anda.
              </motion.div>
            )}

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

            {/* Submit */}
            <Button type="submit" size="lg" loading={loading} disabled={!canSubmit} className="w-full">
              Lanjutkan
            </Button>
          </form>
        </div>

        {/* Register link */}
        <div className="text-center space-y-3">
          <p className="text-[13px] text-[#94A3B8]">
            Restoran baru?{' '}
            <button
              type="button"
              onClick={onRegister || onBack}
              className="font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
            >
              Daftar di sini
            </button>
          </p>
          <p className="text-[11px] text-[#CBD5E1] text-center">
            🔒 Login aman — end-to-end encrypted
          </p>
        </div>
      </motion.div>
    </div>
  );
}
