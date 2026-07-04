import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, ShieldCheck, Key, Sparkles } from 'lucide-react';
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
    case 'pemilik': return 'Pemilik';
    case 'manajer': return 'Manajer';
    case 'supervisor': return 'Supervisor';
    case 'kasir': return 'Kasir';
    case 'dapur': return 'Dapur';
    default: return role || '';
  }
}

function roleEmoji(role?: string): string {
  switch (role?.toLowerCase()) {
    case 'pemilik': return '👑';
    case 'manajer': return '📋';
    case 'supervisor': return '👁️';
    case 'kasir': return '💳';
    case 'dapur': return '👨‍🍳';
    default: return '👤';
  }
}

/* ═══════════════════════════════════════════════
   PIN VERIFICATION VIEW — Secure 6-digit PIN
   ═══════════════════════════════════════════════ */
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* ── Background decorations ────────────── */}
      <div className="absolute top-0 left-0 w-full h-[300px] bg-gradient-to-b from-[#EFF6FF]/50 to-transparent pointer-events-none" />
      <div className="absolute top-20 right-0 w-[380px] h-[380px] bg-gradient-to-bl from-[#EFF6FF]/25 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[280px] h-[280px] bg-gradient-to-tr from-[#2563EB]/4 to-transparent rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-[440px] space-y-8"
      >
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft size={14} />
          Pilih pengguna lain
        </button>

        {/* Card with glass effect */}
        <motion.div
          animate={shake ? { x: [0, -6, 6, -4, 4, -2, 2, 0] } : {}}
          transition={{ duration: 0.4 }}
          className="rounded-[24px] bg-white/70 backdrop-blur-xl border border-[#E2E8F0]/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] p-8 space-y-6"
        >
          {/* Brand */}
          <BrandMark />

          {/* Heading */}
          <div className="space-y-4 text-center">
            {/* User identity chip */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 }}
              className="inline-flex items-center gap-3 rounded-2xl bg-[#FAFBFC] border border-[#F1F5F9] px-5 py-3"
            >
              {/* Avatar circle */}
              <div className="w-12 h-12 rounded-[14px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] flex items-center justify-center text-xl font-bold text-[#2563EB] shadow-sm">
                {username.charAt(0).toUpperCase()}
              </div>
              <div className="text-left">
                <div className="flex items-center gap-1.5">
                  <p className="text-[15px] font-semibold text-[#0F172A] leading-tight">
                    {username}
                  </p>
                  <span className="text-[15px]" role="img" aria-label={roleLabel(role)}>
                    {roleEmoji(role)}
                  </span>
                </div>
                {role && (
                  <p className="text-[12px] text-[#94A3B8] leading-tight mt-0.5">
                    {roleLabel(role)}
                  </p>
                )}
              </div>
            </motion.div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-semibold text-[#0F172A] tracking-[-0.02em]">
                Masukkan PIN
              </h2>
              <p className="text-[14px] text-[#64748B] leading-relaxed">
                PIN 6 digit rahasia untuk verifikasi identitas Anda
              </p>
            </div>
          </div>

          {/* PIN Input */}
          <div className="flex justify-center py-2">
            <PinInput
              length={6}
              value={pin}
              onChange={handlePinChange}
              disabled={isVerifying}
              error={!!error}
              autoFocus
            />
          </div>

          {/* Loading indicator */}
          {isVerifying && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 text-[13px] text-[#64748B]"
            >
              <Loader2 size={15} className="animate-spin text-[#2563EB]" />
              <span>Memverifikasi...</span>
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

          {/* Forgot PIN hint */}
          <div className="text-center">
            {!showForgotHint ? (
              <button
                type="button"
                onClick={() => setShowForgotHint(true)}
                className="text-[13px] font-medium text-[#64748B] hover:text-[#2563EB] transition-colors flex items-center gap-1.5 mx-auto"
              >
                <Key size={13} strokeWidth={1.5} />
                Lupa PIN?
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-[14px] bg-[#EFF6FF] border border-[#BFDBFE] px-4 py-3 text-[13px] text-[#1E40AF] leading-relaxed"
              >
                Hubungi <span className="font-semibold">pemilik restoran</span> atau{' '}
                <span className="font-semibold">administrator</span> untuk mereset PIN Anda.
                Demi keamanan, PIN hanya bisa direset oleh pemilik akun utama.
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Footer hint */}
        <div className="flex items-center justify-center gap-1.5">
          <ShieldCheck size={13} className="text-[#94A3B8]" strokeWidth={1.5} />
          <p className="text-[11px] text-[#94A3B8]">
            PIN terenkripsi end-to-end • Hanya Anda yang tahu
          </p>
        </div>
      </motion.div>
    </div>
  );
}
