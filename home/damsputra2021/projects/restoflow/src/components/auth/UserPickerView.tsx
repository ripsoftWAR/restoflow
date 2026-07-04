import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  Clock,
  Users as UsersIcon,
  Store,
  Sparkles,
} from 'lucide-react';
import { BrandMark } from '../ui/BrandMark';

interface User {
  id: number;
  username: string;
  nama: string;
  role: string;
  is_active: boolean;
  last_login: string | null;
}

interface Props {
  users: User[];
  onSelect: (user: User) => void;
  onBack: () => void;
}

/* ─── Role Helpers ─────────────────────────── */
function roleColor(role: string): { bg: string; text: string; border: string; icon: string } {
  switch (role.toLowerCase()) {
    case 'pemilik':
    case 'owner':
      return { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA', icon: '👑' };
    case 'manajer':
    case 'manager':
      return { bg: '#F3E8FF', text: '#9333EA', border: '#D8B4FE', icon: '📋' };
    case 'supervisor':
      return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A', icon: '👁️' };
    case 'dapur':
    case 'kitchen':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA', icon: '👨‍🍳' };
    case 'kasir':
      return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0', icon: '💳' };
    default:
      return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE', icon: '👤' };
  }
}

function roleLabel(role: string): string {
  switch (role.toLowerCase()) {
    case 'pemilik': return 'Pemilik';
    case 'manajer': return 'Manajer';
    case 'supervisor': return 'Supervisor';
    case 'kasir': return 'Kasir';
    case 'dapur': return 'Dapur';
    default: return role;
  }
}

/* ─── Relative time formatter ──────────────── */
function formatLastLogin(dateStr: string | null): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Baru saja';
  if (diffMin < 60) return `${diffMin}m lalu`;
  if (diffHour < 24) return `${diffHour}j lalu`;
  if (diffDay < 7) return `${diffDay}h lalu`;
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/* ═══════════════════════════════════════════════
   USER PICKER VIEW — Premium multi-user selector
   ═══════════════════════════════════════════════ */
export function UserPickerView({ users, onSelect, onBack }: Props) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* ── Background decorations ────────────── */}
      <div className="absolute top-0 left-0 w-full h-[280px] bg-gradient-to-b from-[#EFF6FF]/50 to-transparent pointer-events-none" />
      <div className="absolute top-16 right-0 w-[350px] h-[350px] bg-gradient-to-bl from-[#EFF6FF]/25 to-transparent rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[250px] h-[250px] bg-gradient-to-tr from-[#2563EB]/4 to-transparent rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="relative w-full max-w-[460px] space-y-8"
      >
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft size={14} />
          Kembali ke login
        </button>

        {/* Card with glass effect */}
        <div className="rounded-[24px] bg-white/70 backdrop-blur-xl border border-[#E2E8F0]/60 shadow-[0_20px_60px_-20px_rgba(0,0,0,0.08),0_0_0_1px_rgba(0,0,0,0.02)] p-8 space-y-6">
          {/* Brand */}
          <BrandMark />

          {/* Heading */}
          <div className="space-y-2.5 text-center">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#EFF6FF] border border-[#BFDBFE] px-3 py-1 text-[11px] font-semibold text-[#2563EB]">
              <Store size={12} strokeWidth={1.5} />
              Multi-user ready
            </div>
            <h2 className="text-2xl font-semibold text-[#0F172A] tracking-[-0.02em]">
              Pilih akun
            </h2>
            <p className="text-[14px] text-[#64748B] leading-relaxed max-w-[320px] mx-auto">
              Pilih profil Anda untuk melanjutkan. Setiap pengguna punya PIN dan hak akses masing-masing.
            </p>
          </div>

          {/* User list */}
          <div className="space-y-2.5">
            {users.map((user, i) => {
              const c = roleColor(user.role);
              return (
                <motion.button
                  key={user.id}
                  type="button"
                  onClick={() => onSelect(user)}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.06, ease: [0.25, 0.1, 0.25, 1] }}
                  whileHover={{ y: -2, scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full flex items-center gap-4 p-4 rounded-[16px] border border-[#F1F5F9] bg-[#FAFBFC] hover:bg-white hover:border-[#CBD5E1] hover:shadow-[0_8px_30px_-8px_rgba(0,0,0,0.08)] transition-all duration-200 text-left group cursor-pointer"
                >
                  {/* Avatar — gradient based on role */}
                  <div
                    className="w-12 h-12 rounded-[14px] flex items-center justify-center shrink-0 text-lg font-bold transition-all duration-300 group-hover:scale-105 group-hover:shadow-[0_4px_12px_-4px_rgba(37,99,235,0.25)]"
                    style={{
                      background: `linear-gradient(135deg, ${c.text}15, ${c.text}08)`,
                      color: c.text,
                    }}
                  >
                    {user.nama?.charAt(0)?.toUpperCase() || user.username.charAt(0).toUpperCase()}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <p className="text-[15px] font-semibold text-[#0F172A] group-hover:text-[#2563EB] transition-colors truncate">
                        {user.nama || user.username}
                      </p>
                      <span className="text-[13px] shrink-0" role="img" aria-label={roleLabel(user.role)}>
                        {c.icon}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-[6px]"
                        style={{ backgroundColor: c.bg, color: c.text, border: `1px solid ${c.border}` }}
                      >
                        {roleLabel(user.role)}
                      </span>
                      {user.last_login && (
                        <span className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                          <Clock size={10} strokeWidth={1.5} />
                          {formatLastLogin(user.last_login)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Arrow — circular hover target */}
                  <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center shrink-0 group-hover:bg-[#2563EB] transition-all duration-300">
                    <ChevronRight size={15} className="text-[#94A3B8] group-hover:text-white transition-colors" />
                  </div>
                </motion.button>
              );
            })}

            {/* Empty state */}
            {users.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center py-10 space-y-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-[#F1F5F9] flex items-center justify-center mx-auto">
                  <UsersIcon size={28} className="text-[#CBD5E1]" strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-[14px] font-medium text-[#94A3B8]">Tidak ada pengguna aktif</p>
                  <p className="text-[12px] text-[#CBD5E1] mt-1">
                    Hubungi administrator restoran untuk mengaktifkan akun
                  </p>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer hint */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            <Sparkles size={12} className="text-[#94A3B8]" strokeWidth={1.5} />
            <p className="text-[11px] text-[#94A3B8]">
              Pilih akun lalu masukkan PIN rahasia Anda
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
