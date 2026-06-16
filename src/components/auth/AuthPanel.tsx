import { useState } from 'react';
import { Zap } from 'lucide-react';

interface Props {
  authError: string | null;
  onLogin: (username: string, credential: string, shift_id: number, mode: 'owner' | 'staf') => Promise<void>;
}

export default function AuthPanel({ authError, onLogin }: Props) {
  const [form, setForm] = useState({
    username: '', password: '', pin: '', shiftId: 1,
  });
  const [loginMode, setLoginMode] = useState<'Owner' | 'Staf'>('Owner');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const mode = loginMode === 'Owner' ? 'owner' : 'staf';
    const credential = mode === 'owner' ? form.password : form.pin;
    await onLogin(form.username, credential, form.shiftId, mode);
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Branding Area (45%) */}
      <div className="w-full md:w-[45%] bg-gradient-to-br from-blue-600 to-blue-800 p-12 flex flex-col justify-center items-center text-white">
        <div className="max-w-md text-center space-y-6">
          <div className="bg-white/20 w-24 h-24 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Zap size={48} fill="white" className="text-white" />
          </div>
          <h1 className="text-4xl font-bold">Kelola Restoran dengan Lebih Pintar</h1>
          <p className="text-xl opacity-90">Solusi manajemen restoran berbasis AI untuk efisiensi operasional.</p>
        </div>
      </div>

      {/* Login Form (55%) */}
      <div className="w-full md:w-[55%] flex items-center justify-center p-12 bg-slate-50">
        <div className="w-full max-w-md rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="text-3xl font-bold mb-8 text-slate-900">Masuk</h1>
          <form className="space-y-6" onSubmit={handleSubmit}>
            <input placeholder="Username" className="w-full rounded-xl border-2 border-slate-200 p-4 focus:border-blue-500 focus:outline-none transition-colors"
              onChange={e => setForm({ ...form, username: e.target.value })} required />

            <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1">
              {['Owner', 'Staf'].map(mode => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setLoginMode(mode as 'Owner' | 'Staf')}
                  className={`rounded-lg px-4 py-3 text-sm font-semibold transition ${loginMode === mode ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-200'}`}>
                  {mode}
                </button>
              ))}
            </div>
            {loginMode === 'Owner' ? (
              <input type="password" placeholder="Password" className="w-full rounded-xl border-2 border-slate-200 p-4 focus:border-blue-500 focus:outline-none transition-colors"
                onChange={e => setForm({ ...form, password: e.target.value })} required />
            ) : (
              <input type="password" inputMode="numeric" maxLength={6} placeholder="PIN 6 digit" className="w-full rounded-xl border-2 border-slate-200 p-4 tracking-[0.35em] font-semibold focus:border-blue-500 focus:outline-none transition-colors"
                onChange={e => setForm({ ...form, pin: e.target.value.replace(/\D/g, '').slice(0, 6) })} required />
            )}
            <select className="w-full rounded-xl border-2 border-slate-200 p-4 bg-white focus:border-blue-500 focus:outline-none transition-colors"
              onChange={e => setForm({ ...form, shiftId: Number(e.target.value) })}>
              <option value={1}>Shift 1 (08:00 - 16:00)</option>
              <option value={2}>Shift 2 (16:00 - 24:00)</option>
            </select>

            {authError && <div className="text-rose-600 text-sm">{authError}</div>}
            <button type="submit" disabled={submitting}
              className="w-full rounded-xl bg-blue-600 p-4 text-white font-bold hover:bg-blue-700 transition-colors shadow-md">
              {submitting ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}