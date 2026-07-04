import { motion } from 'framer-motion';
import {
  ArrowLeft,
  ChevronRight,
  Shield,
  Store,
  Clock,
  Users as UsersIcon,
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
function roleColor(role: string): { bg: string; text: string; border: string } {
  switch (role.toLowerCase()) {
    case 'pemilik':
    case 'owner':
      return { bg: '#FFF7ED', text: '#EA580C', border: '#FED7AA' };
    case 'manajer':
    case 'manager':
      return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
    case 'supervisor':
      return { bg: '#FEF3C7', text: '#D97706', border: '#FDE68A' };
    case 'dapur':
    case 'kitchen':
      return { bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
    default:
      return { bg: '#EFF6FF', text: '#2563EB', border: '#BFDBFE' };
  }
}

function roleLabel(role: string): string {
  switch (role.toLowerCase()) {
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
      return role;
  }
}

/* ─── Main Component ───────────────────────── */
export function UserPickerView({ users, onSelect, onBack }: Props) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
        className="w-full max-w-[440px] space-y-8"
      >
        {/* Back */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ArrowLeft size={14} />
          Ganti akun
        </button>

        {/* Brand */}
        <BrandMark size="sm" />

        {/* Heading */}
        <div className="space-y-2 text-center">
          <div className="w-12 h-12 rounded-[16px] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] flex items-center justify-center mx-auto mb-1">
            <UsersIcon size={22} className="text-[#2563EB]" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-semibold text-[#0F172A] tracking-[-0.02em]">
            Pilih Akun
          </h2>
          <p className="text-[14px] text-[#64748B] leading-relaxed">
            Pilih akun Anda untuk melanjutkan ke dasbor.
          </p>
        </div>

        {/* User list */}
        <div className="space-y-2.5">
          {users.map((user, i) => {
            const colors = roleColor(user.role);
            return (
              <motion.button
                key={user.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.3 }}
                onClick={() => onSelect(user)}
                className="w-full flex items-center gap-4 rounded-[18px] bg-white border border-[#E2E8F0] p-4 text-left hover:border-[#2563EB] hover:shadow-[0_4px_16px_rgba(37,99,235,0.08)] transition-all duration-200 group"
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-[14px] flex items-center justify-center shrink-0 text-sm font-bold"
                  style={{ backgroundColor: colors.bg, color: colors.text }}
                >
                  {user.nama?.charAt(0)?.toUpperCase() ||
                    user.username.charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-semibold text-[#0F172A] truncate">
                    {user.nama || user.username}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className="text-[11px] font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: colors.bg, color: colors.text }}
                    >
                      {roleLabel(user.role)}
                    </span>
                    {user.last_login && (
                      <span className="text-[11px] text-[#94A3B8] flex items-center gap-1">
                        <Clock size={10} />
                        {new Date(user.last_login).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight
                  size={18}
                  className="text-[#CBD5E1] group-hover:text-[#2563EB] transition-colors shrink-0"
                />
              </motion.button>
            );
          })}
        </div>

        {/* Empty state */}
        {users.length === 0 && (
          <div className="rounded-[18px] bg-white border border-dashed border-[#E2E8F0] p-8 text-center">
            <UsersIcon size={32} className="text-[#CBD5E1] mx-auto mb-3" />
            <p className="text-[14px] font-medium text-[#94A3B8]">
              Tidak ada pengguna tersedia
            </p>
            <p className="text-[12px] text-[#CBD5E1] mt-1">
              Hubungi pemilik restoran untuk menambahkan pengguna
            </p>
          </div>
        )}

        {/* Security note */}
        <div className="rounded-[14px] bg-[#EFF6FF] border border-[#DBEAFE] p-4 flex items-start gap-3">
          <Shield size={16} className="text-[#2563EB] shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-semibold text-[#1D4ED8]">
              Akses sesuai peran
            </p>
            <p className="text-[12px] text-[#60A5FA] mt-0.5">
              Setiap pengguna hanya melihat data sesuai hak aksesnya. AI Business
              Operator menyesuaikan insight tanpa melanggar privasi.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
