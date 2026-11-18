import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      options,
      placeholder,
      error,
      helperText,
      required,
      id,
      disabled,
      className = '',
      'aria-describedby': ariaDescribedByProp,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const errorId = `${selectId}-error`;
    const helperId = `${selectId}-helper`;

    const describedBy = [
      ariaDescribedByProp,
      error ? errorId : helperText ? helperId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            {label}
            {required && (
              <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <select
            id={selectId}
            ref={ref}
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={`w-full min-h-[42px] pl-3.5 pr-10 py-2.5 appearance-none font-sans text-sm font-normal text-[var(--color-text-primary)] bg-[var(--color-surface)] border rounded-[var(--radius-input)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 cursor-pointer disabled:bg-[var(--color-disabled-bg)] disabled:text-[var(--color-disabled-text)] disabled:border-[var(--color-border)] disabled:cursor-not-allowed ${
              error
                ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
                : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15'
            } ${className}`}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <span
            className="pointer-events-none absolute inset-y-0 right-0 pr-3 flex items-center text-[var(--color-text-muted)]"
            aria-hidden="true"
          >
            <ChevronDown className="w-4 h-4" />
          </span>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="mt-1.5 text-xs text-[var(--color-error-text)] font-medium leading-relaxed">
            {error}
          </p>
        ) : helperText ? (
          <p id={helperId} className="mt-1.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {helperText}
          </p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
