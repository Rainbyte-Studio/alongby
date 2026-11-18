import React, { useId } from 'react';

export interface RadioOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name?: string;
  label?: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'list' | 'cards';
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  label,
  options,
  value,
  onChange,
  variant = 'list',
  error,
  helperText,
  required,
  disabled,
  className = '',
}) => {
  const generatedId = useId();
  const groupName = name || generatedId;
  const errorId = `${groupName}-error`;
  const helperId = `${groupName}-helper`;

  return (
    <fieldset
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : helperText ? helperId : undefined}
      className={`w-full border-0 p-0 m-0 ${className}`}
    >
      {label && (
        <legend className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-2">
          {label}
          {required && (
            <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">
              *
            </span>
          )}
        </legend>
      )}

      <div
        className={
          variant === 'cards'
            ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
            : 'space-y-2'
        }
      >
        {options.map((opt) => {
          const isChecked = value === opt.value;
          const isDisabled = Boolean(disabled || opt.disabled);
          const optionId = `${groupName}-${opt.value}`;

          return (
            <label
              key={opt.value}
              htmlFor={optionId}
              className={
                variant === 'cards'
                  ? `flex items-start gap-3 p-4 rounded-[var(--radius-card)] border transition-colors select-none ${
                      isDisabled
                        ? 'opacity-60 cursor-not-allowed bg-[var(--color-disabled-bg)] border-[var(--color-border)]'
                        : isChecked
                        ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)] cursor-pointer'
                        : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50 cursor-pointer'
                    }`
                  : `flex items-start gap-2.5 py-1.5 select-none ${
                      isDisabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                    }`
              }
            >
              <input
                id={optionId}
                type="radio"
                name={groupName}
                value={opt.value}
                checked={isChecked}
                disabled={isDisabled}
                onChange={() => onChange(opt.value)}
                className="mt-0.5 w-4 h-4 border border-[var(--color-border-strong)] text-[var(--color-primary)] accent-[var(--color-primary)] shrink-0 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2"
              />
              <span className="min-w-0">
                <span className="block font-sans text-[13px] font-semibold text-[var(--color-text-primary)] leading-snug">
                  {opt.label}
                </span>
                {opt.description && (
                  <span className="block mt-0.5 font-sans text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {opt.description}
                  </span>
                )}
              </span>
            </label>
          );
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="mt-1.5 text-xs text-[var(--color-error-text)] font-medium">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="mt-1.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
          {helperText}
        </p>
      ) : null}
    </fieldset>
  );
};
