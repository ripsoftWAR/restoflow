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
    'inline-flex items-center justify-center gap-2 font-semibold rounded-pp-md transition-all duration-200 ease-out outline-none focus-visible:ring-2 focus-visible:ring-pp-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-pp-surface';

  const variants = {
    primary:
      'bg-pp-primary text-white shadow-pp-brand hover:bg-pp-primary-hover hover:shadow-pp-brand-lg hover:-translate-y-[1px] active:scale-[0.97] active:shadow-pp-xs active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-pp-primary disabled:hover:shadow-pp-brand disabled:hover:translate-y-0 disabled:active:scale-100',
    secondary:
      'bg-pp-primary-soft text-pp-primary hover:bg-pp-primary-muted hover:-translate-y-[1px] active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
    ghost:
      'text-pp-text-secondary hover:bg-pp-border-light hover:text-pp-text active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed',
    outline:
      'border border-pp-border text-pp-text bg-pp-surface hover:bg-pp-bg hover:border-pp-border hover:-translate-y-[1px] hover:shadow-pp-sm active:scale-[0.97] active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0',
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
