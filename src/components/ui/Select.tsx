import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, required, id, className = '', ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            {label}
            {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
          </label>
        )}
        <select
          id={selectId}
          ref={ref}
          className={`w-full min-h-[42px] px-3.5 py-2.5 font-sans text-sm font-normal text-[var(--color-text-primary)] bg-[var(--color-surface)] border rounded-[var(--radius-input)] transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-offset-0 cursor-pointer ${
            error
              ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
              : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15'
          } ${className}`}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error ? (
          <p className="mt-1.5 text-xs text-[var(--color-error-text)] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
