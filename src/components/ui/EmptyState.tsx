import type { ReactNode } from 'react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

/**
 * EmptyState — tampilan saat tidak ada data.
 *
 * @example
 * <EmptyState icon={<Package size={40} />} title="Belum ada bahan" description="Tambahkan bahan baku pertama Anda." actionLabel="Tambah Bahan" onAction={() => openModal()} />
 */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`
        flex flex-col items-center justify-center text-center
        py-16 px-6 rounded-pp-lg border border-dashed border-pp-border
        bg-pp-bg/50
        ${className}
      `}
    >
      {icon && (
        <div className="w-16 h-16 rounded-pp-md bg-pp-border-light flex items-center justify-center mb-5 text-pp-text-muted">
          {icon}
        </div>
      )}

      <h3 className="text-[15px] font-semibold text-pp-text mb-1.5 tracking-[-0.01em]">
        {title}
      </h3>

      {description && (
        <p className="text-[13px] text-pp-text-muted max-w-xs leading-relaxed mb-6">
          {description}
        </p>
      )}

      {actionLabel && onAction && (
        <Button variant="primary" size="md" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
