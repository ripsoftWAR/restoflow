interface Props {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function BrandMark({ size = 'md', showTagline = true }: Props) {
  const boxSizes = {
    sm: 'w-7 h-7 rounded-[8px]',
    md: 'w-9 h-9 rounded-[10px]',
    lg: 'w-12 h-12 rounded-[14px]',
  };
  const titleSizes = {
    sm: 'text-[17px]',
    md: 'text-2xl',
    lg: 'text-3xl',
  };
  const subtitleSizes = {
    sm: 'text-[10px]',
    md: 'text-[13px]',
    lg: 'text-[14px]',
  };

  return (
    <div className="flex items-center gap-3">
      {/* 🟦 Blue square — pure brand mark */}
      <div
        className={`${boxSizes[size]} bg-pp-primary flex-shrink-0`}
      />

      <div>
        <h1
          className={`${titleSizes[size]} font-semibold tracking-[-0.02em] text-pp-text leading-none`}
        >
          Pilot
          <span className="text-pp-primary">POS</span>
        </h1>
        {showTagline && (
          <p className={`${subtitleSizes[size]} text-pp-text-muted mt-0.5 font-medium leading-tight`}>
            Restaurant Operating System
          </p>
        )}
      </div>
    </div>
  );
}
