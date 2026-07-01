import { useState, useEffect } from 'react';
import { MapPin, Mail, Lock, KeyRound, ChevronDown, LogIn } from 'lucide-react';
import { resolveApiUrl } from '../../utils/api';

interface Shift {
  id: number;
  nama: string;
  jam_mulai: string;
  jam_akhir: string;
}

interface Props {
  authMode: 'landing' | 'login' | 'register';
  authError: string | null;
  setAuthMode: React.Dispatch<React.SetStateAction<'landing' | 'login' | 'register'>>;
  onLogin: (username: string, credential: string, shift_id: number, mode: 'owner' | 'staf') => Promise<void>;
  onRegister: (username: string, password: string, role: string, restaurant_name: string) => Promise<void>;
}

/* ─── PilotPOS Logo Mark ─────────────────────── */
function PilotLogo({ size }: { size?: 'sm' | 'md' }) {
  const isSm = size === 'sm';
  return (
    <div className="flex flex-col items-center gap-3">
      {/* Mark: map-pin dalam rounded-square bg gradient */}
      <div
        className={`${isSm ? 'w-12 h-12 rounded-2xl' : 'w-16 h-16 rounded-2xl'} bg-gradient-to-br from-blue-600 to-blue-500 shadow-lg shadow-blue-200 flex items-center justify-center`}
      >
        <MapPin
          size={isSm ? 24 : 32}
          fill="white"
          className="text-white"
          strokeWidth={1.5}
        />
      </div>

      {/* Wordmark */}
      <div className="text-center">
        <h1 className={`${isSm ? 'text-2xl' : 'text-3xl'} font-extrabold tracking-[-0.02em]`}>
          <span className="text-slate-900">Pilot</span>
          <span className="text-blue-600">POS</span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">Restaurant POS System</p>
      </div>
    </div>
  );
}

/* ─── Divider "atau masuk dengan" ────────────── */
function Divider({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-px bg-slate-200" />
      <span className="text-xs text-slate-400 font-medium shrink-0">{text}</span>
      <div className="flex-1 h-px bg-slate-200" />
    </div>
  );
}

/* ─── Main Component ─────────────────────────── */
export default function AuthPanel({ authMode, authError, setAuthMode, onLogin, onRegister }: Props) {
  const [form, setForm] = useState({ username: '', password: '', pin: '', shiftId: 0 });
  const [loginMode, setLoginMode] = useState<'Owner' | 'Staf'>('Owner');
  const [submitting, setSubmitting] = useState(false);
  const [shifts, setShifts] = useState<Shift[]>([]);

  // Fetch shifts ketika username berubah
  useEffect(() => {
    if (!form.username) {
      setShifts([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(resolveApiUrl(`/api/auth/shifts-by-username/${form.username}`));
        if (res.ok) {
          const data = await res.json();
          setShifts(data);
          if (data.length > 0) setForm(f => ({ ...f, shiftId: data[0].id }));
        }
      } catch {
        // silent
      }
    }, 600);
    return () => clearTimeout(timer);
  }, [form.username]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const mode = loginMode === 'Owner' ? 'owner' : 'staf';
    const credential = mode === 'owner' ? form.password : form.pin;
    await onLogin(form.username, credential, form.shiftId, mode);
    setSubmitting(false);
  };

  // ─── REGISTER VIEW ──────────────────────────
  if (authMode === 'register') {
    return (
      <RegisterView
        authError={authError}
        setAuthMode={setAuthMode}
        onRegister={onRegister}
      />
    );
  }

  // ─── LOGIN VIEW ─────────────────────────────
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      {/* ── Kolom Kiri: Form Login ────────────── */}
      <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[440px] space-y-8 rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          {/* Logo centered */}
          <PilotLogo />

          {/* Heading */}
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">
              Selamat Datang!
            </h2>
            <p className="text-base leading-6 text-slate-500">
              Masuk ke akun Anda untuk mengakses sistem PilotPOS dengan cepat dan aman.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Role toggle */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Masuk sebagai
              </label>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                {['Owner', 'Staf'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLoginMode(mode as 'Owner' | 'Staf')}
                    className={`rounded-2xl px-5 py-3.5 text-sm font-semibold tracking-tight transition-all ${
                      loginMode === mode
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  id="username"
                  type="text"
                  placeholder="Masukkan username"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pl-11 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>

            {/* Password / PIN */}
            <div>
              <label htmlFor="credential" className="block text-sm font-semibold text-slate-700 mb-1.5">
                {loginMode === 'Owner' ? 'Password' : 'PIN'}
              </label>
              <div className="relative">
                {loginMode === 'Owner' ? (
                  <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                ) : (
                  <KeyRound size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                )}
                <input
                  id="credential"
                  type="password"
                  inputMode={loginMode === 'Staf' ? 'numeric' : undefined}
                  maxLength={loginMode === 'Staf' ? 6 : undefined}
                  placeholder={loginMode === 'Owner' ? 'Masukkan password' : 'Masukkan PIN 6 digit'}
                  value={loginMode === 'Owner' ? form.password : form.pin}
                  onChange={e => {
                    const val = loginMode === 'Staf' ? e.target.value.replace(/\D/g, '').slice(0, 6) : e.target.value;
                    setForm({ ...form, [loginMode === 'Owner' ? 'password' : 'pin']: val });
                  }}
                  required
                  className={`w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pl-11 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors ${
                    loginMode === 'Staf' ? 'tracking-[0.3em] font-semibold' : ''
                  }`}
                />
              </div>
            </div>

            {/* Shift selector */}
            <div>
              <label htmlFor="shift" className="block text-sm font-semibold text-slate-700 mb-1.5">
                Shift
              </label>
              <div className="relative">
                <ChevronDown size={17} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                <select
                  id="shift"
                  value={form.shiftId}
                  onChange={e => setForm({ ...form, shiftId: Number(e.target.value) })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 pr-10 text-base text-slate-900 appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors cursor-pointer"
                >
                  {shifts.length > 0 ? (
                    shifts.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nama} ({s.jam_mulai} – {s.jam_akhir})
                      </option>
                    ))
                  ) : (
                    <option value={0}>— Ketik username terlebih dahulu —</option>
                  )}
                </select>
              </div>
            </div>

            {/* Lupa password */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors"
              >
                Lupa password?
              </button>
            </div>

            {/* Error */}
            {authError && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {authError}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-4 py-4 text-base font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <LogIn size={17} />
              {submitting ? 'Memproses...' : 'Masuk'}
            </button>
          </form>

          {/* Divider */}
          <Divider text="atau masuk dengan" />

          {/* Google login */}
          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Masuk dengan Google
          </button>

          {/* Footer */}
          <p className="text-center text-sm text-slate-400">
            Belum punya akun?{' '}
            <button
              type="button"
              onClick={() => setAuthMode('register')}
              className="font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              Daftar Sekarang
            </button>
          </p>
        </div>
      </div>

      {/* ── Kolom Kanan: Showcase ─────────────── */}
      <div className="hidden lg:flex w-[55%] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 items-center justify-center p-16 relative overflow-hidden">
        {/* Decorative grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />

        <div className="relative z-10 max-w-lg text-center space-y-6">
          <div className="bg-white/15 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto backdrop-blur-sm border border-white/10">
            <MapPin size={36} fill="white" className="text-white" strokeWidth={1.5} />
          </div>
          <div className="space-y-3">
            <h2 className="text-4xl sm:text-5xl font-semibold tracking-tight text-white">
              Kelola Restoran dengan Lebih Pintar
            </h2>
            <p className="text-blue-100 text-base leading-relaxed">
              Pantau stok, resep, penjualan, dan laporan dalam satu dasbor dengan tampilan yang lebih rapi.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-4 mt-8">
            {[
              { label: 'Manajemen Inventori', desc: 'Stok real-time' },
              { label: 'Resep & Menu', desc: 'Kalkulasi otomatis' },
              { label: 'Laporan Penjualan', desc: 'Analisis mendalam' },
              { label: 'AI Assistant', desc: 'Saran cerdas' },
            ].map(f => (
              <div key={f.label} className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10 text-left">
                <p className="text-sm font-semibold text-white">{f.label}</p>
                <p className="text-xs text-blue-200 mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Register View ──────────────────────────── */
function RegisterView({
  authError,
  setAuthMode,
  onRegister,
}: {
  authError: string | null;
  setAuthMode: React.Dispatch<React.SetStateAction<'landing' | 'login' | 'register'>>;
  onRegister: (username: string, password: string, role: string, restaurant_name: string) => Promise<void>;
}) {
  const [form, setForm] = useState({ username: '', password: '', confirmPassword: '', restaurant: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) return;
    setSubmitting(true);
    await onRegister(form.username, form.password, 'Pemilik', form.restaurant);
    setSubmitting(false);
  };

  const passwordMatch = form.password === form.confirmPassword;
  const canSubmit = form.username && form.password.length >= 6 && passwordMatch && form.restaurant;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-8">
      <div className="w-full lg:w-[45%] flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-[440px] space-y-8 rounded-[32px] border border-slate-200 bg-white/95 p-8 shadow-[0_18px_60px_-28px_rgba(15,23,42,0.18)] backdrop-blur-sm">
          <PilotLogo />
          <div className="text-center space-y-3">
            <h2 className="text-3xl font-semibold tracking-tight text-slate-900">Daftar Akun Baru</h2>
            <p className="text-base leading-6 text-slate-500">Buat akun Pemilik untuk mulai menggunakan PilotPOS dengan tampilan yang lebih nyaman dan profesional.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Nama Restoran</label>
              <input
                type="text"
                placeholder="Nama restoran Anda"
                value={form.restaurant}
                onChange={e => setForm({ ...form, restaurant: e.target.value })}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Username</label>
              <input
                type="text"
                placeholder="Pilih username"
                value={form.username}
                onChange={e => setForm({ ...form, username: e.target.value })}
                required
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Password</label>
              <input
                type="password"
                placeholder="Minimal 6 karakter"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Konfirmasi Password</label>
              <input
                type="password"
                placeholder="Ulangi password"
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                required
                className={`w-full rounded-2xl border bg-white px-4 py-4 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors ${
                  form.confirmPassword
                    ? passwordMatch
                      ? 'border-emerald-300 focus:border-emerald-500'
                      : 'border-red-300 focus:border-red-500'
                    : 'border-slate-200 focus:border-blue-500'
                }`}
              />
              {form.confirmPassword && !passwordMatch && (
                <p className="text-sm text-red-500 mt-2">Password tidak cocok</p>
              )}
            </div>
            {authError && (
              <div className="rounded-2xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                {authError}
              </div>
            )}
            <button
              type="submit"
              disabled={!canSubmit || submitting}
              className="w-full rounded-2xl bg-blue-600 px-4 py-4 text-base font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {submitting ? 'Mendaftarkan...' : 'Daftar'}
            </button>
          </form>
          <p className="text-center text-sm text-slate-400">
            Sudah punya akun?{' '}
            <button
              type="button"
              onClick={() => setAuthMode('login')}
              className="font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
              Masuk
            </button>
          </p>
        </div>
      </div>
      {/* Showcase kanan sama */}
      <div className="hidden lg:flex w-[55%] bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 items-center justify-center p-16 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative z-10 max-w-lg text-center space-y-4">
          <h2 className="text-3xl font-bold text-white tracking-[-0.02em]">
            Mulai Perjalanan Anda
          </h2>
          <p className="text-blue-100 text-base leading-relaxed">
            Bergabung dengan ratusan restoran yang telah menggunakan PilotPOS
            untuk mengoptimalkan operasional mereka.
          </p>
        </div>
      </div>
    </div>
  );
}
