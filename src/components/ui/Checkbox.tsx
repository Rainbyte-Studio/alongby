import React, { useId } from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: React.ReactNode;
  description?: string;
  error?: string;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      description,
      error,
      id,
      disabled,
      required,
      className = '',
      'aria-describedby': ariaDescribedByProp,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const checkboxId = id || generatedId;
    const descriptionId = `${checkboxId}-desc`;
    const errorId = `${checkboxId}-error`;

    const describedBy = [
      ariaDescribedByProp,
      description ? descriptionId : undefined,
      error ? errorId : undefined,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div className={`w-full ${className}`}>
        <label
          htmlFor={checkboxId}
          className={`inline-flex items-start gap-2.5 min-h-[36px] py-1 select-none ${
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          <input
            id={checkboxId}
            ref={ref}
            type="checkbox"
            disabled={disabled}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className="mt-0.5 w-4 h-4 rounded-[4px] border border-[var(--color-border-strong)] text-[var(--color-primary)] bg-[var(--color-surface)] accent-[var(--color-primary)] shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)]"
            {...props}
          />
          <span className="min-w-0">
            <span className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] leading-snug">
              {label}
              {required && (
                <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">
                  *
                </span>
              )}
            </span>
            {description && (
              <span
                id={descriptionId}
                className="block mt-0.5 font-sans text-xs text-[var(--color-text-secondary)] leading-relaxed"
              >
                {description}
              </span>
            )}
          </span>
        </label>
        {error && (
          <p id={errorId} role="alert" className="mt-1 text-xs text-[var(--color-error-text)] font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Checkbox.displayName = 'Checkbox';
