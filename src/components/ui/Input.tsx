import { useState, forwardRef, type InputHTMLAttributes, type ReactNode } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string | null;
  icon?: ReactNode;
  showPasswordToggle?: boolean;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, icon, showPasswordToggle, hint, id, className = '', type = 'text', ...rest },
  ref
) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && visible ? 'text' : type;
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="space-y-1.5">
      {/* Label + hint */}
      {(label || hint) && (
        <div className="flex items-center justify-between">
          {label && (
            <label
              htmlFor={inputId}
              className="text-[13px] font-semibold text-pp-text"
            >
              {label}
            </label>
          )}
          {hint && (
            <span className="text-[11px] text-pp-text-placeholder">{hint}</span>
          )}
        </div>
      )}

      {/* Input wrapper */}
      <div className="relative">
        {/* Leading icon */}
        {icon && (
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pp-text-placeholder">
            {icon}
          </span>
        )}

        <input
          ref={ref}
          id={inputId}
          type={inputType}
          className={`
            w-full rounded-pp-md border bg-pp-surface px-4 py-3.5
            text-[15px] text-pp-text placeholder:text-pp-text-placeholder
            transition-all duration-150 outline-none
            ${icon ? 'pl-11' : ''}
            ${showPasswordToggle || isPassword ? 'pr-11' : ''}
            ${
              error
                ? 'border-pp-danger ring-2 ring-pp-danger/10'
                : 'border-pp-border focus:border-pp-border-focus focus:ring-2 focus:ring-pp-primary/10'
            }
            disabled:bg-pp-bg disabled:text-pp-text-placeholder disabled:cursor-not-allowed
            ${className}
          `}
          {...rest}
        />

        {/* Show/Hide password toggle */}
        {(showPasswordToggle || isPassword) && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setVisible(!visible)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-pp-text-placeholder hover:text-pp-text-muted transition-colors outline-none"
            aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
          >
            {visible ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>

      {/* Error text */}
      {error && (
        <p className="text-[12px] text-pp-danger font-medium" role="alert">
          {error}
        </p>
      )}
    </div>
  );
});
