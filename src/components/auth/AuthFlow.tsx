import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { LandingView } from './LandingView';
import { LoginView } from './LoginView';
import { UserPickerView } from './UserPickerView';
import { PinVerificationView } from './PinVerificationView';
import { RegisterView } from './RegisterView';
import { resolveApiUrl, setAuthToken } from '@/utils/api';

// ── Helper: fetch dengan base URL yang benar ──
const apiFetch = (url: string, options: RequestInit = {}) => {
  const headers = new Headers(options.headers || {});
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }
  return fetch(resolveApiUrl(url), { ...options, headers });
};

interface Shift {
  id: number;
  nama: string;
  jam_mulai: string;
  jam_akhir: string;
}

interface UserInfo {
  id: number;
  username: string;
  nama: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
}

export type AuthStep = 'landing' | 'login' | 'register' | 'pickUser' | 'pin';

interface Props {
  initialStep?: AuthStep;
  onAuthSuccess: (session: {
    token: string;
    user: { id: number; username: string; role: string; nama: string; restaurant_id: number };
    shift: { id: number; nama: string };
    features: { feature_key: string; enabled: boolean }[];
    session_id: number;
  }) => void;
}

export default function AuthFlow({ initialStep = 'landing', onAuthSuccess }: Props) {
  const [step, setStep] = useState<AuthStep>(initialStep);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [pinLoading, setPinLoading] = useState(false);

  // Data dari verify-credentials (untuk user picker & PIN)
  const [verifiedUsername, setVerifiedUsername] = useState('');
  const [verifiedShifts, setVerifiedShifts] = useState<Shift[]>([]);
  const [restaurantUsers, setRestaurantUsers] = useState<UserInfo[]>([]);
  const [rememberSession, setRememberSession] = useState(false);

  // User yang dipilih dari UserPickerView
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);

  /* ─── Step 1: Login (username + password) ─── */
  const handleLogin = async (
    username: string,
    password: string,
    remember: boolean
  ) => {
    setLoginError(null);
    setLoginLoading(true);
    try {
      const res = await apiFetch('/api/auth/verify-credentials', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Username atau password salah');

      setVerifiedUsername(data.username);
      setVerifiedShifts(data.shifts || []);
      // Hanya simpan user yang aktif — user nonaktif tidak bisa login
      setRestaurantUsers(
        (data.users || []).filter((u: UserInfo) => u.is_active)
      );
      setRememberSession(remember);
      setSelectedUser(null);
      setStep('pickUser');
    } catch (err: any) {
      setLoginError(err.message || 'Gagal memverifikasi akun');
    } finally {
      setLoginLoading(false);
    }
  };

  /* ─── Step 2: Pilih pengguna ────────────── */
  const handleSelectUser = (user: UserInfo) => {
    setSelectedUser(user);
    setPinError(null);
    setStep('pin');
  };

  /* ─── Step 3: Verify PIN ──────────────────── */
  const handleVerifyPin = async (pin: string) => {
    if (!selectedUser) return;

    setPinError(null);
    setPinLoading(true);
    try {
      // Gunakan shift pertama yang tersedia
      const shiftId = verifiedShifts.length > 0 ? verifiedShifts[0].id : 0;

      const res = await apiFetch('/api/auth/verify-pin', {
        method: 'POST',
        body: JSON.stringify({
          username: selectedUser.username,
          pin,
          shift_id: shiftId,
          remember: rememberSession,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'PIN salah');

      // Save session
      setAuthToken(data.token);

      onAuthSuccess(data);
    } catch (err: any) {
      setPinError(err.message || 'PIN tidak valid');
      setPinLoading(false);
    }
  };

  /* ─── Render ──────────────────────────────── */
  return (
    <AnimatePresence mode="wait">
      {step === 'landing' && (
        <motion.div
          key="landing"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <LandingView
            onMasuk={() => setStep('login')}
            onDaftar={() => setStep('register')}
          />
        </motion.div>
      )}

      {step === 'login' && (
        <motion.div
          key="login"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <LoginView
            error={loginError}
            loading={loginLoading}
            onSubmit={handleLogin}
            onBack={() => setStep('landing')}
            onRegister={() => setStep('register')}
          />
        </motion.div>
      )}

      {step === 'register' && (
        <motion.div
          key="register"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <RegisterView
            onSuccess={() => setStep('login')}
            onBack={() => setStep('landing')}
          />
        </motion.div>
      )}

      {step === 'pickUser' && (
        <motion.div
          key="pickUser"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <UserPickerView
            users={restaurantUsers}
            onSelect={handleSelectUser}
            onBack={() => {
              setLoginError(null);
              setStep('login');
            }}
          />
        </motion.div>
      )}

      {step === 'pin' && (
        <motion.div
          key="pin"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          <PinVerificationView
            username={selectedUser?.nama || selectedUser?.username || verifiedUsername}
            role={selectedUser?.role}
            error={pinError}
            loading={pinLoading}
            onVerify={handleVerifyPin}
            onBack={() => {
              setPinError(null);
              setPinLoading(false);
              setSelectedUser(null);
              setStep('pickUser');
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
