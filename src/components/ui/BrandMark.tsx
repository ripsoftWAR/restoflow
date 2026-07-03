import { Store } from 'lucide-react';

interface Props {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
}

export function BrandMark({ size = 'md', showTagline = true }: Props) {
  const iconSizes = { sm: 20, md: 26, lg: 34 } as const;
  const boxSizes = {
    sm: 'w-9 h-9 rounded-[14px]',
    md: 'w-11 h-11 rounded-[16px]',
    lg: 'w-14 h-14 rounded-[20px]',
  };
  const titleSizes = {
    sm: 'text-xl',
    md: 'text-2xl',
    lg: 'text-3xl',
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={`${boxSizes[size]} bg-[#2563EB] flex items-center justify-center`}
      >
        <Store
          size={iconSizes[size]}
          className="text-white"
          strokeWidth={1.5}
        />
      </div>

      <div className="text-center">
        <h1
          className={`${titleSizes[size]} font-semibold tracking-[-0.02em] text-[#0F172A]`}
        >
          Pilot
          <span className="text-[#2563EB]">POS</span>
        </h1>
        {showTagline && (
          <p className="text-[13px] text-[#64748B] mt-0.5 font-medium">
            Restaurant Operating System
          </p>
        )}
      </div>
    </div>
  );
}
