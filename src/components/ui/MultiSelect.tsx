import React, { useId } from 'react';
import { Check } from 'lucide-react';

export interface MultiSelectOption {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

export interface MultiSelectProps {
  label?: string;
  options: MultiSelectOption[];
  selectedValues: string[];
  onChange: (nextValues: string[]) => void;
  error?: string;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  columns?: 1 | 2 | 3;
  className?: string;
}

export const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  selectedValues,
  onChange,
  error,
  helperText,
  required,
  disabled,
  columns = 2,
  className = '',
}) => {
  const generatedId = useId();
  const errorId = `${generatedId}-error`;
  const helperId = `${generatedId}-helper`;

  const toggleValue = (val: string) => {
    if (disabled) return;
    if (selectedValues.includes(val)) {
      onChange(selectedValues.filter((v) => v !== val));
    } else {
      onChange([...selectedValues, val]);
    }
  };

  const gridCols =
    columns === 1
      ? 'grid-cols-1'
      : columns === 3
      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
      : 'grid-cols-1 sm:grid-cols-2';

  return (
    <fieldset
      disabled={disabled}
      aria-invalid={error ? true : undefined}
      aria-describedby={error ? errorId : helperText ? helperId : undefined}
      className={`w-full border-0 p-0 m-0 ${className}`}
    >
      {label && (
        <div className="flex items-center justify-between gap-2 mb-2">
          <legend className="font-sans text-[13px] font-medium text-[var(--color-text-primary)]">
            {label}
            {required && (
              <span className="text-[var(--color-error)] ml-0.5" aria-hidden="true">
                *
              </span>
            )}
          </legend>
          {selectedValues.length > 0 && (
            <span className="text-xs text-[var(--color-text-muted)] tabular-nums">
              {selectedValues.length} selected
            </span>
          )}
        </div>
      )}

      <div className={`grid ${gridCols} gap-2.5`}>
        {options.map((opt) => {
          const isSelected = selectedValues.includes(opt.value);
          const isDisabled = Boolean(disabled || opt.disabled);

          return (
            <button
              key={opt.value}
              type="button"
              disabled={isDisabled}
              aria-pressed={isSelected}
              onClick={() => toggleValue(opt.value)}
              className={`text-left p-3.5 rounded-[var(--radius-input)] border transition-colors flex items-start justify-between gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                isDisabled
                  ? 'opacity-60 cursor-not-allowed bg-[var(--color-disabled-bg)] border-[var(--color-border)]'
                  : isSelected
                  ? 'border-[var(--color-primary)] bg-[var(--color-surface-secondary)] ring-1 ring-[var(--color-primary)] cursor-pointer'
                  : 'border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/50 cursor-pointer'
              }`}
            >
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

              <span
                aria-hidden="true"
                className={`w-4 h-4 rounded-[4px] mt-0.5 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                    : 'border border-[var(--color-border-strong)] bg-[var(--color-surface)]'
                }`}
              >
                {isSelected && <Check className="w-3 h-3" />}
              </span>
            </button>
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
