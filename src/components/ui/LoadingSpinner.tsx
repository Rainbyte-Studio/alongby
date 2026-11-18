import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  inline?: boolean;
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md',
  inline = false,
  className = '',
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  if (inline) {
    return (
      <span
        role="status"
        aria-live="polite"
        className={`inline-flex items-center gap-2 text-[var(--color-text-secondary)] ${className}`}
      >
        <Loader2
          className={`${iconSizes[size]} animate-spin text-[var(--color-text-primary)] shrink-0`}
          aria-hidden="true"
        />
        {label ? (
          <span className="font-sans text-[13px] font-medium text-[var(--color-text-secondary)]">
            {label}
          </span>
        ) : (
          <span className="sr-only">Loading</span>
        )}
      </span>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center min-h-[40vh] p-8 text-[var(--color-text-secondary)] ${className}`}
    >
      <Loader2
        className={`${iconSizes[size]} animate-spin text-[var(--color-text-primary)] mb-3`}
        aria-hidden="true"
      />
      {label ? (
        <span className="font-sans text-[13px] font-medium text-[var(--color-text-secondary)]">
          {label}
        </span>
      ) : (
        <span className="sr-only">Loading</span>
      )}
    </div>
  );
};
