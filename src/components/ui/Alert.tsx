import React from 'react';
import {
  Info,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  X,
} from 'lucide-react';

export type AlertVariant = 'neutral' | 'info' | 'success' | 'warning' | 'error';

export interface AlertProps {
  variant?: AlertVariant;
  title?: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  onDismiss?: () => void;
  onRetry?: () => void;
  retryLabel?: string;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({
  variant = 'neutral',
  title,
  children,
  icon,
  onDismiss,
  onRetry,
  retryLabel = 'Try again',
  className = '',
}) => {
  const variantStyles: Record<AlertVariant, string> = {
    neutral:
      'bg-[var(--color-surface-secondary)] border-[var(--color-border)] text-[var(--color-text-primary)]',
    info:
      'bg-[var(--color-info-bg)] border-[var(--color-info-border)] text-[var(--color-info-text)]',
    success:
      'bg-[var(--color-success-bg)] border-[var(--color-success-border)] text-[var(--color-success-text)]',
    warning:
      'bg-[var(--color-warning-bg)] border-[var(--color-warning-border)] text-[var(--color-warning-text)]',
    error:
      'bg-[var(--color-error-bg)] border-[var(--color-error-border)] text-[var(--color-error-text)]',
  };

  const defaultIcons: Record<AlertVariant, React.ReactNode> = {
    neutral: <Info className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0 mt-0.5" aria-hidden="true" />,
    info: <Info className="w-4 h-4 text-[var(--color-info)] shrink-0 mt-0.5" aria-hidden="true" />,
    success: <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" aria-hidden="true" />,
    warning: <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" aria-hidden="true" />,
    error: <AlertCircle className="w-4 h-4 text-[var(--color-error)] shrink-0 mt-0.5" aria-hidden="true" />,
  };

  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={`p-3.5 rounded-[var(--radius-input)] border font-sans text-xs leading-relaxed flex items-start justify-between gap-3 ${variantStyles[variant]} ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0 flex-1">
        {icon !== undefined ? icon : defaultIcons[variant]}
        <div className="min-w-0 flex-1">
          {title && (
            <div className="font-semibold text-[13px] mb-0.5">{title}</div>
          )}
          <div className="break-words">{children}</div>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 inline-flex items-center font-semibold underline underline-offset-2 hover:opacity-80 cursor-pointer rounded-[4px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
            >
              {retryLabel}
            </button>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="p-1 -mr-1 -mt-0.5 rounded-[6px] opacity-75 hover:opacity-100 hover:bg-black/5 transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};
