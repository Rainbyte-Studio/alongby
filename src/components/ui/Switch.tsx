import React, { useId } from 'react';

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
  id,
  className = '',
}) => {
  const generatedId = useId();
  const switchId = id || generatedId;
  const labelId = `${switchId}-label`;
  const descId = `${switchId}-desc`;

  return (
    <div className={`flex items-center justify-between gap-4 py-1 ${className}`}>
      <div className="min-w-0">
        <label
          id={labelId}
          htmlFor={switchId}
          className={`block font-sans text-[13px] font-medium text-[var(--color-text-primary)] leading-snug ${
            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
          }`}
        >
          {label}
        </label>
        {description && (
          <p id={descId} className="mt-0.5 font-sans text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {description}
          </p>
        )}
      </div>

      <button
        id={switchId}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={labelId}
        aria-describedby={description ? descId : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
        } ${
          checked
            ? 'bg-[var(--color-primary)] border-[var(--color-primary)]'
            : 'bg-[var(--color-surface-secondary)] border-[var(--color-border-strong)]'
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 rounded-full bg-[var(--color-surface)] shadow-2xs transition-transform duration-150 ${
            checked ? 'translate-x-5.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </div>
  );
};
