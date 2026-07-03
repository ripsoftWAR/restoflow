import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className = '',
  disabled,
  ...rest
}: Props) {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-semibold rounded-[14px] transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/20';

  const variants = {
    primary:
      'bg-[#2563EB] text-white hover:bg-[#1D4ED8] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2563EB] disabled:active:scale-100',
    secondary:
      'bg-[#E7F0FF] text-[#2563EB] hover:bg-[#DBEAFE] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
    ghost:
      'text-[#475569] hover:bg-[#F1F5F9] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
    outline:
      'border border-[#E2E8F0] text-[#0F172A] hover:bg-[#F8FAFC] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed',
  };

  const sizes = {
    md: 'px-5 py-3 text-[14px]',
    lg: 'px-6 py-4 text-[15px]',
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : icon ? (
        icon
      ) : null}
      {loading ? 'Memproses...' : children}
    </button>
  );
}
