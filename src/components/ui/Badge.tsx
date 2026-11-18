import React from 'react';

export type BadgeVariant =
  | 'neutral'
  | 'success'
  | 'warning'
  | 'info'
  | 'error'
  | 'danger'
  | 'outline';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  icon?: React.ReactNode;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  icon,
  className = '',
  ...props
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    neutral:
      'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border-[var(--color-border)]',
    success:
      'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]',
    warning:
      'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]',
    info:
      'bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[var(--color-info-border)]',
    error:
      'bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-[var(--color-error-border)]',
    danger:
      'bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-[var(--color-error-border)]',
    outline:
      'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-strong)]',
  };

  const sizeStyles: Record<BadgeSize, string> = {
    sm: 'text-xs font-medium px-2 py-0.5 rounded-md gap-1',
    md: 'text-[13px] font-medium px-2.5 py-1 rounded-[var(--radius-button)] gap-1.5',
  };

  return (
    <span
      className={`inline-flex items-center font-sans border leading-snug tracking-normal whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {icon && (
        <span className="inline-flex items-center shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      {children}
    </span>
  );
};
