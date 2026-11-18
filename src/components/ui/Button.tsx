import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'white';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const isBusy = isLoading || loading;
  const baseClasses =
    'inline-flex items-center justify-center font-sans font-semibold transition-colors duration-150 rounded-[var(--radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer';

  const variantClasses = {
    primary:
      'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)] active:bg-black',
    secondary:
      'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] hover:bg-[#E7E3DD] active:bg-[#DDD8D0] border border-[var(--color-border)]',
    outline:
      'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] active:bg-[#EAE6DF]',
    ghost:
      'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] active:bg-[#EAE6DF]',
    destructive:
      'bg-[var(--color-error)] text-white hover:bg-[var(--color-error-hover)] active:bg-[#8A3232] focus-visible:ring-[var(--color-error)]',
    white:
      'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] active:bg-[#EAE6DF] border border-[var(--color-border)]',
  };

  // Standardized button scale (13–14px Noto Sans 600) with consistent heights and 2:1 horizontal-to-vertical padding balance
  const sizeClasses = {
    sm: 'text-[13px] leading-5 py-1.5 px-3.5 gap-1.5 min-h-[36px]',
    md: 'text-sm leading-5 py-2.5 px-5 gap-2 min-h-[40px]',
    lg: 'text-sm leading-5 py-3 px-6 gap-2.5 min-h-[44px]',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      disabled={disabled || isBusy}
      aria-busy={isBusy}
      {...props}
    >
      {isBusy ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          {children && <span>{children}</span>}
        </>
      ) : (
        <>
          {leftIcon && <span className="inline-flex shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="inline-flex shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
