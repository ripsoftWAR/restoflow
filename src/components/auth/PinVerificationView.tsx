import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, ShieldCheck } from 'lucide-react';
import { BrandMark } from '../ui/BrandMark';
import { PinInput } from '../ui/PinInput';

interface Props {
  username: string;
  role?: string;
  error: string | null;
  loading: boolean;
  onVerify: (pin: string) => Promise<void>;
  onBack: () => void;
}

function roleLabel(role?: string): string {
  switch (role?.toLowerCase()) {
    case 'pemilik':
      return 'Pemilik';
    case 'manajer':
      return 'Manajer';
    case 'supervisor':
      return 'Supervisor';
    case 'kasir':
      return 'Kasir';
    case 'dapur':
      return 'Dapur';
    default:
      return role || '';
  }
}

export function PinVerificationView({
  username,
  role,
  error,
  loading,
  onVerify,
  onBack,
}: Props) {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showForgotHint, setShowForgotHint] = useState(false);

  // Auto-verify when 6 digits are entered
  useEffect(() => {
    if (pin.length === 6 && !verifying && !loading) {
      setVerifying(true);
      onVerify(pin).finally(() => {
        setVerifying(false);
      });
    }
  }, [pin, verifying, loading, onVerify]);

  // Shake on error + reset PIN
  useEffect(() => {
    if (error) {
      setShake(true);
      setPin('');
      setVerifying(false);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handlePinChange = useCallback(
    (value: string) => {
      if (!verifying && !loading) {
        setPin(value);
      }
    },
    [verifying, loading]
  );

  const isVerifying = verifying || loading;

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
          disabled={isVerifying}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors disabled:opacity-40"
        >
          <ArrowLeft size={14} />
          Ganti akun
        </button>

        {/* Brand */}
        <BrandMark size="sm" />

        {/* Heading */}
        <div className="space-y-2 text-center">
          {/* Shield Icon */}
          <div className="w-14 h-14 rounded-[18px] bg-gradient-to-br from-[#E7F0FF] to-[#EDE9FE] flex items-center justify-center mx-auto mb-1">
            <ShieldCheck size={24} className="text-[#2563EB]" strokeWidth={1.5} />
          </div>

          <h2 className="text-2xl font-semibold text-[#0F172A] tracking-[-0.02em]">
            Verifikasi PIN
          </h2>
          <p className="text-[14px] text-[#64748B] leading-relaxed">
            Masukkan 6 digit PIN untuk melanjutkan sebagai{' '}
            <span className="font-semibold text-[#0F172A]">{username}</span>
            {role && (
              <span className="ml-1.5 inline-block text-[11px] font-medium bg-[#EFF6FF] text-[#2563EB] px-2 py-0.5 rounded-full align-middle">
                {roleLabel(role)}
              </span>
            )}
          </p>
        </div>

        {/* PIN Input with shake wrapper */}
        <div className={shake ? 'pp-shake' : ''}>
          <PinInput
            value={pin}
            onChange={handlePinChange}
            disabled={isVerifying}
            error={!!error}
            autoFocus
          />
        </div>

        {/* Loading */}
        {isVerifying && !error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-2 py-2"
          >
            <Loader2 size={15} className="animate-spin text-[#2563EB]" />
            <span className="text-[14px] text-[#64748B]">Memverifikasi...</span>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="rounded-[14px] bg-[#FEF2F2] border border-[#FECACA] px-4 py-3 text-[13px] text-[#DC2626] font-medium text-center"
            role="alert"
          >
            {error}
          </motion.div>
        )}

        {/* Forgot PIN */}
        <div className="text-center space-y-3">
          <button
            type="button"
            disabled={isVerifying}
            className="text-[13px] font-medium text-[#64748B] hover:text-[#2563EB] transition-colors disabled:opacity-40"
            onClick={() => setShowForgotHint(!showForgotHint)}
          >
            Lupa PIN?
          </button>

          {showForgotHint && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="rounded-[14px] bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-3 text-[13px] text-[#1E40AF] leading-relaxed"
            >
              Hubungi <span className="font-semibold">pemilik restoran</span> untuk
              mereset PIN Anda.
            </motion.div>
          )}
        </div>

        {/* Security note */}
        <p className="text-center text-[11px] text-[#CBD5E1]">
          Verifikasi aman — end-to-end encrypted
        </p>
      </motion.div>
    </div>
  );
}
