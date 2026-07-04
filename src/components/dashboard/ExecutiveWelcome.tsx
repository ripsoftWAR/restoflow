import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Clock, Users, CheckCircle2 } from 'lucide-react';
import type { AuthSession } from '../../types';

interface Props {
  authSession: AuthSession;
  criticalCount: number;
}

function getGreeting(): { emoji: string; text: string } {
  const hour = new Date().getHours();
  if (hour < 10) return { emoji: '🌅', text: 'Selamat Pagi' };
  if (hour < 14) return { emoji: '☀️', text: 'Selamat Siang' };
  if (hour < 18) return { emoji: '🌤️', text: 'Selamat Sore' };
  return { emoji: '🌙', text: 'Selamat Malam' };
}

function getStatusText(criticalCount: number): string {
  if (criticalCount === 0) return 'Restoran berjalan normal hari ini.';
  if (criticalCount <= 2) return `Perhatian: ${criticalCount} bahan perlu restock.`;
  return `⚠️ ${criticalCount} bahan kritis — perlu tindakan segera.`;
}

function getFormattedDate(): string {
  const d = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

export default function ExecutiveWelcome({ authSession, criticalCount }: Props) {
  const greeting = useMemo(() => getGreeting(), []);
  const statusText = useMemo(() => getStatusText(criticalCount), [criticalCount]);
  const today = useMemo(() => getFormattedDate(), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
      className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      {/* ── Left: Greeting + Context ─────── */}
      <div className="flex items-start gap-4">
        {/* Avatar circle */}
        <div className="hidden sm:flex w-11 h-11 rounded-pp-md bg-pp-primary-soft items-center justify-center flex-shrink-0">
          <span className="text-lg font-bold text-pp-primary">
            {authSession.user.nama?.charAt(0)?.toUpperCase() || 'B'}
          </span>
        </div>

        <div className="min-w-0">
          <h1 className="text-[22px] font-bold text-pp-text tracking-[-0.03em] leading-tight">
            {greeting.text}, {authSession.user.nama || 'Budi'} <span>{greeting.emoji}</span>
          </h1>
          <p className="text-[13px] text-pp-text-secondary mt-1">
            {statusText}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2">
            {/* Shift info */}
            {authSession.shift && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-pp-text-muted">
                <Clock size={12} className="text-pp-text-placeholder" />
                {authSession.shift.nama}
              </span>
            )}
            {/* Date */}
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-pp-text-muted">
              <Users size={12} className="text-pp-text-placeholder" />
              {today}
            </span>
          </div>
        </div>
      </div>

      {/* ── Right: AI Status Card ─────── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.15, duration: 0.3 }}
        className="flex-shrink-0"
      >
        <div className="flex items-center gap-3 bg-pp-success-soft border border-pp-success-border/60 rounded-pp-md px-4 py-2.5">
          <div className="w-8 h-8 rounded-pp-xs bg-pp-success/10 flex items-center justify-center">
            <CheckCircle2 size={16} className="text-pp-success" strokeWidth={2} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles size={11} className="text-pp-primary" />
              <span className="text-[11px] font-semibold text-pp-text tracking-wide">AI STATUS</span>
            </div>
            <p className="text-[12px] font-medium text-pp-success mt-0.5">
              ✓ Semua sistem normal
            </p>
            <p className="text-[10px] text-pp-text-placeholder mt-0.5">
              Update 2 menit lalu
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
