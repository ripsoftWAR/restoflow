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
    'inline-flex items-center justify-center gap-2 font-semibold rounded-[14px] transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white';

  const variants = {
    primary:
      'bg-[#2563EB] text-white shadow-[0_2px_8px_rgba(37,99,235,0.25)] hover:bg-[#1D4ED8] hover:shadow-[0_8px_25px_-6px_rgba(37,99,235,0.4)] hover:-translate-y-[1px] active:scale-[0.97] active:shadow-[0_1px_4px_rgba(37,99,235,0.2)] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#2563EB] disabled:hover:shadow-[0_2px_8px_rgba(37,99,235,0.25)] disabled:hover:translate-y-0 disabled:active:scale-100',
    secondary:
      'bg-[#E7F0FF] text-[#2563EB] hover:bg-[#DBEAFE] hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
    ghost:
      'text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
    outline:
      'border border-[#E2E8F0] text-[#0F172A] bg-white hover:bg-[#F8FAFC] hover:border-[#CBD5E1] hover:-translate-y-[1px] hover:shadow-[0_4px_15px_-6px_rgba(0,0,0,0.08)] active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
  };

  const sizes = {
    md: 'px-5 py-2.5 text-[14px]',
    lg: 'px-6 py-3.5 text-[15px]',
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
        <span className="transition-transform duration-200 group-hover:translate-x-0.5">
          {icon}
        </span>
      ) : null}
      {loading ? 'Memproses...' : children}
    </button>
  );
}
