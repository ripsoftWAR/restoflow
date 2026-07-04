import type { ReactNode } from 'react';

interface BadgeProps {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md';
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Badge — untuk status, kategori, role, tag.
 * 
 * @example
 * <Badge variant="success">Aktif</Badge>
 * <Badge variant="warning" icon={<AlertTriangle size={12} />}>Pending</Badge>
 * <Badge variant="danger">Hapus</Badge>
 */
export function Badge({
  variant = 'neutral',
  size = 'md',
  icon,
  children,
  className = '',
}: BadgeProps) {
  const variantStyles: Record<string, string> = {
    primary:
      'bg-pp-primary-soft text-pp-primary-dark border-pp-primary-muted',
    success:
      'bg-pp-success-soft text-pp-success border-pp-success-border',
    warning:
      'bg-pp-warning-soft text-pp-warning border-pp-warning-border',
    danger:
      'bg-pp-danger-soft text-pp-danger border-pp-danger-border',
    info:
      'bg-pp-info-soft text-pp-primary border-pp-info-border',
    neutral:
      'bg-pp-bg text-pp-text-secondary border-pp-border',
  };

  const sizeStyles: Record<string, string> = {
    sm: 'px-2 py-0.5 text-[10px] gap-1 rounded-pp-xs',
    md: 'px-2.5 py-1 text-[11px] gap-1.5 rounded-pp-xs',
  };

  return (
    <span
      className={`
        inline-flex items-center font-semibold border
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${className}
      `}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
