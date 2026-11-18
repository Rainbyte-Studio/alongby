import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'info' | 'error' | 'danger' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'sm',
  className = '',
}) => {
  const variantStyles = {
    neutral: 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border-[var(--color-border)]',
    success: 'bg-[var(--color-success-bg)] text-[var(--color-success-text)] border-[var(--color-success-border)]',
    warning: 'bg-[var(--color-warning-bg)] text-[var(--color-warning-text)] border-[var(--color-warning-border)]',
    info: 'bg-[var(--color-info-bg)] text-[var(--color-info-text)] border-[var(--color-info-border)]',
    error: 'bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-[var(--color-error-border)]',
    danger: 'bg-[var(--color-error-bg)] text-[var(--color-error-text)] border-[var(--color-error-border)]',
    outline: 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] border-[var(--color-border-strong)]',
  };

  const sizeStyles = {
    sm: 'text-xs font-medium px-2 py-0.5 rounded-md',
    md: 'text-[13px] font-medium px-2.5 py-1 rounded-[var(--radius-button)]',
  };

  return (
    <span
      className={`inline-flex items-center font-sans border leading-snug tracking-normal whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
