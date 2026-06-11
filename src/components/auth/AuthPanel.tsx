import { useState } from 'react';
import { Zap } from 'lucide-react';

interface Props {
  authMode:       'landing' | 'login' | 'register';
  authError:      string | null;
  setAuthMode:    (mode: 'landing' | 'login' | 'register') => void;
  onLogin:        (username: string, credential: string, shift_id: number, mode: 'owner' | 'staf') => Promise<void>;
  onRegister:     (username: string, password: string, role: string, restaurant_name: string) => Promise<void>;
}

export default function AuthPanel({ authMode, authError, setAuthMode, onLogin, onRegister }: Props) {
  const [form, setForm] = useState({
    username: '', password: '', pin: '', role: 'Staff', shiftId: 1, restaurant_name: '',
  });
  const [loginMode, setLoginMode] = useState<'Owner' | 'Staf'>('Owner');
  const [submitting, setSubmitting] = useState(false);

  if (authMode === 'landing') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[e3e5e6]">
        <div className="w-full max-w-md text-center bg-white p-10 rounded-[2.5rem] shadow-xl">
          <div className="bg-blue-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Zap size={32} fill="white" className="text-white" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">RestFlow</h1>
          <p className="text-slate-500 mb-8">Manajemen Restoran Pintar</p>
          <div className="space-y-3">
            <button onClick={() => setAuthMode('login')}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg">
              Masuk
            </button>
            <button onClick={() => setAuthMode('register')}
              className="w-full py-4 bg-white text-slate-700 border rounded-2xl font-bold">
              Daftar Akun Baru
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    if (authMode === 'login') {
      const mode = loginMode === 'Owner' ? 'owner' : 'staf';
      const credential = mode === 'owner' ? form.password : form.pin;
      await onLogin(form.username, credential, form.shiftId, mode);
    } else {
      await onRegister(form.username, form.password, form.role, form.restaurant_name);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[e3e5e6] px-4">
      <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-xl">
        <button onClick={() => setAuthMode('landing')} className="text-slate-400 text-sm mb-6">
          ← Kembali
        </button>
        <h1 className="text-2xl font-bold mb-6">
          {authMode === 'login' ? 'Masuk' : 'Daftar Akun'}
        </h1>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <input placeholder="Username" className="w-full rounded-2xl border p-4"
            onChange={e => setForm({ ...form, username: e.target.value })} required />

          {authMode === 'login' ? (
            <>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
                {['Owner', 'Staf'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLoginMode(mode as 'Owner' | 'Staf')}
                    className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${loginMode === mode ? 'bg-blue-600 text-white shadow' : 'text-slate-600'}`}>
                    {mode}
                  </button>
                ))}
              </div>
              {loginMode === 'Owner' ? (
                <input type="password" placeholder="Password" className="w-full rounded-2xl border p-4"
                  onChange={e => setForm({ ...form, password: e.target.value })} required />
              ) : (
                <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN 6 digit" className="w-full rounded-2xl border p-4 tracking-[0.35em] font-semibold"
                  onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })} required />
              )}
              <select className="w-full rounded-2xl border p-4 bg-white"
                onChange={e => setForm({ ...form, shiftId: Number(e.target.value) })}>
                <option value={1}>Shift 1 (08:00 - 16:00)</option>
                <option value={2}>Shift 2 (16:00 - 24:00)</option>
              </select>
            </>
          ) : (
            <>
              <input type="password" placeholder="Password" className="w-full rounded-2xl border p-4"
                onChange={e => setForm({ ...form, password: e.target.value })} required />
              <input placeholder="Nama Restoran" className="w-full rounded-2xl border p-4"
                value={form.restaurant_name}
                onChange={e => setForm({ ...form, restaurant_name: e.target.value })} required />
              <select className="w-full rounded-2xl border p-4 bg-white"
                onChange={e => setForm({ ...form, role: e.target.value })}>
                <option value="Staff">Staff</option>
                <option value="Kasir">Kasir</option>
                <option value="Pemilik">Pemilik</option>
              </select>
            </>
          )}

          {authError && <div className="text-rose-600 text-sm">{authError}</div>}
          <button type="submit" disabled={submitting}
            className="w-full rounded-2xl bg-blue-600 p-4 text-white font-bold">
            {submitting ? 'Memproses...' : (authMode === 'login' ? 'Masuk' : 'Daftar Sekarang')}
          </button>
        </form>
      </div>
    </div>
  );
}