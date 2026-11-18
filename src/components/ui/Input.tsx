import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  leftIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, required, leftIcon, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            {label}
            {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="pointer-events-none absolute inset-y-0 left-0 pl-3.5 flex items-center text-[var(--color-text-muted)]">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={`w-full min-h-[42px] ${leftIcon ? 'pl-10 pr-3.5' : 'px-3.5'} py-2.5 font-sans text-sm font-normal text-[var(--color-text-primary)] bg-[var(--color-surface)] border rounded-[var(--radius-input)] transition-colors duration-150 placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-offset-0 ${
              error
                ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15'
            } ${className}`}
            {...props}
          />
        </div>
        {error ? (
          <p className="mt-1.5 text-xs text-[var(--color-error-text)] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = 'Input';
