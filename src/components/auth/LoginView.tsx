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
}

export function LoginView({ error, loading, onSubmit, onBack }: Props) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  // Auto-focus username on mount
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[400px] space-y-8"
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

        {/* Brand */}
        <BrandMark />

        {/* Heading */}
        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl font-semibold text-[#0F172A] tracking-[-0.02em]">
            Masuk ke akun Anda
          </h2>
          <p className="text-[14px] text-[#64748B]">
            Masukkan username dan password restoran
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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

          {/* Remember + Forgot password */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded-[5px] border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]/20 cursor-pointer"
              />
              <span className="text-[13px] text-[#64748B]">Ingat sesi ini</span>
            </label>
            <button
              type="button"
              className="text-[13px] font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
              onClick={() =>
                alert('Hubungi administrator atau pemilik restoran untuk mereset password.')
              }
            >
              Lupa password?
            </button>
          </div>

          {/* Error */}
          {error && (
            <div
              role="alert"
              className="rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-[13px] text-[#DC2626] font-medium"
            >
              {error}
            </div>
          )}

          {/* Submit */}
          <Button type="submit" size="lg" loading={loading} disabled={!canSubmit} className="w-full">
            Lanjutkan
          </Button>
        </form>

        {/* Register link */}
        <p className="text-center text-[13px] text-[#94A3B8]">
          Restoran baru?{' '}
          <button
            type="button"
            onClick={onBack}
            className="font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
          >
            Daftar di sini
          </button>
        </p>
      </motion.div>
    </div>
  );
}
