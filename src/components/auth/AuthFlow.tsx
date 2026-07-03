import { useState } from 'react';
import { LandingView } from './LandingView';
import { LoginView } from './LoginView';
import { UserPickerView } from './UserPickerView';
import { PinVerificationView } from './PinVerificationView';
import { RegisterView } from './RegisterView';

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
      const res = await fetch('/api/auth/verify-credentials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error || 'Username atau password salah');

      setVerifiedUsername(data.username);
      setVerifiedShifts(data.shifts || []);
      setRestaurantUsers(data.users || []);
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

      const res = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      localStorage.setItem('restoflow_session_id', data.token);

      onAuthSuccess(data);
    } catch (err: any) {
      setPinError(err.message || 'PIN tidak valid');
      setPinLoading(false);
    }
  };

  /* ─── Render ──────────────────────────────── */
  switch (step) {
    case 'landing':
      return (
        <LandingView
          onMasuk={() => setStep('login')}
          onDaftar={() => setStep('register')}
        />
      );

    case 'login':
      return (
        <LoginView
          error={loginError}
          loading={loginLoading}
          onSubmit={handleLogin}
          onBack={() => setStep('landing')}
        />
      );

    case 'pickUser':
      return (
        <UserPickerView
          users={restaurantUsers}
          onSelect={handleSelectUser}
          onBack={() => {
            setLoginError(null);
            setStep('login');
          }}
        />
      );

    case 'pin':
      return (
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
      );

    case 'register':
      return (
        <RegisterView
          onSuccess={() => setStep('login')}
          onBack={() => setStep('landing')}
        />
      );

    default:
      return null;
  }
}
