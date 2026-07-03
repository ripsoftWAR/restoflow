import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Store, User, Lock } from 'lucide-react';
import { BrandMark } from '../ui/BrandMark';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';

interface Props {
  onSuccess: () => void;
  onBack: () => void;
}

export function RegisterView({ onSuccess, onBack }: Props) {
  const [restaurant, setRestaurant] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

      // Tampilkan PIN ke owner
      if (data.pin) {
        alert(
          `Akun berhasil dibuat!\n\nPIN Anda: ${data.pin}\n\nSimpan PIN ini — digunakan untuk verifikasi saat login.`
        );
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Gagal mendaftar. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[400px] space-y-8"
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

        {/* Brand */}
        <BrandMark />

        {/* Heading */}
        <div className="space-y-1.5 text-center">
          <h2 className="text-2xl font-semibold text-[#0F172A] tracking-[-0.02em]">
            Daftar akun baru
          </h2>
          <p className="text-[14px] text-[#64748B]">
            Mulai kelola restoran Anda dengan PilotPOS
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
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
            <div
              role="alert"
              className="rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-[13px] text-[#DC2626] font-medium"
            >
              {error}
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            loading={loading}
            disabled={!canSubmit}
            className="w-full"
          >
            Daftar Sekarang
          </Button>
        </form>

        {/* Login link */}
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
      </motion.div>
    </div>
  );
}
