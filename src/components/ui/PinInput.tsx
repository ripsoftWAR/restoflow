import { useRef, useEffect, useState, useCallback, type ClipboardEvent } from 'react';

interface Props {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
}

export function PinInput({
  length = 6,
  value,
  onChange,
  disabled = false,
  error = false,
  autoFocus = true,
}: Props) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Normalize value: only digits, max `length` chars
  const digits = value.replace(/\D/g, '').slice(0, length).split('');

  // Auto-focus first empty box on mount
  useEffect(() => {
    if (!autoFocus) return;
    const firstEmpty = digits.length;
    const target = Math.min(firstEmpty, length - 1);
    inputRefs.current[target]?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Focus the correct box when value changes
  useEffect(() => {
    const nextIndex = Math.min(digits.length, length - 1);
    if (document.activeElement !== inputRefs.current[nextIndex]) {
      inputRefs.current[nextIndex]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleKeyDown = useCallback(
    (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        e.preventDefault();
        if (digits[idx]) {
          const newDigits = [...digits];
          newDigits[idx] = '';
          onChange(newDigits.join(''));
        } else if (idx > 0) {
          const newDigits = [...digits];
          newDigits[idx - 1] = '';
          onChange(newDigits.join(''));
          inputRefs.current[idx - 1]?.focus();
        }
        return;
      }

      if (e.key === 'ArrowLeft' && idx > 0) {
        e.preventDefault();
        inputRefs.current[idx - 1]?.focus();
        return;
      }

      if (e.key === 'ArrowRight' && idx < length - 1) {
        e.preventDefault();
        inputRefs.current[idx + 1]?.focus();
        return;
      }

      // Only allow digits
      if (/^\d$/.test(e.key)) {
        e.preventDefault();
        const newDigits = [...digits];
        newDigits[idx] = e.key;
        const newValue = newDigits.join('');
        onChange(newValue);

        // Auto-advance
        if (idx < length - 1) {
          inputRefs.current[idx + 1]?.focus();
        }
      }
    },
    [digits, length, onChange]
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
      if (!pasted) return;
      onChange(pasted);
    },
    [length, onChange]
  );

  const handleFocus = (idx: number) => setFocusedIndex(idx);

  return (
    <div
      className="flex items-center justify-center gap-2.5 sm:gap-3"
      onPaste={handlePaste}
      role="group"
      aria-label={`PIN ${length} digit`}
    >
      {Array.from({ length }, (_, idx) => {
        const digit = digits[idx] || '';
        const isFocused = focusedIndex === idx;
        const isFilled = !!digit;

        return (
          <input
            key={idx}
            ref={(el) => {
              inputRefs.current[idx] = el;
            }}
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={1}
            value={digit}
            disabled={disabled}
            onKeyDown={(e) => handleKeyDown(idx, e)}
            onFocus={() => handleFocus(idx)}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            aria-label={`Digit ${idx + 1}`}
            className={`
              w-[50px] h-[58px] sm:w-[56px] sm:h-[64px]
              text-center text-[22px] font-semibold tracking-[0.02em]
              rounded-[16px] border-2
              transition-all duration-150
              outline-none select-none
              ${
                error
                  ? 'border-[#DC2626] bg-[#FEF2F2] text-[#DC2626]'
                  : isFocused
                    ? 'border-[#2563EB] bg-white ring-[3px] ring-[#2563EB]/10 text-[#0F172A]'
                    : isFilled
                      ? 'border-[#CBD5E1] bg-[#F8FAFC] text-[#0F172A]'
                      : 'border-[#E2E8F0] bg-white text-[#0F172A]'
              }
              disabled:opacity-40 disabled:cursor-not-allowed
            `}
          />
        );
      })}
    </div>
  );
}
