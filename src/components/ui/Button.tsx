import React from 'react';
import { Loader2 } from 'lucide-react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'outline'
  | 'ghost'
  | 'icon'
  | 'destructive'
  | 'white';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
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
    },
    ref
  ) => {
    const isBusy = isLoading || loading;

    const baseClasses =
      'inline-flex items-center justify-center font-sans font-semibold transition-colors duration-150 rounded-[var(--radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface)] disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap shrink-0 cursor-pointer select-none';

    const variantClasses: Record<ButtonVariant, string> = {
      primary:
        'bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)] active:bg-[var(--color-primary-hover)] border border-transparent',
      secondary:
        'bg-[var(--color-surface)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-hover)]',
      outline:
        'border border-[var(--color-border-strong)] bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-hover)]',
      tertiary:
        'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline underline-offset-4 active:text-[var(--color-text-primary)] border border-transparent',
      ghost:
        'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-hover)] border border-transparent',
      icon:
        'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-hover)] border border-transparent',
      destructive:
        'bg-[var(--color-error)] text-white hover:bg-[var(--color-error-hover)] active:opacity-95 border border-transparent focus-visible:ring-[var(--color-error)]',
      white:
        'bg-[var(--color-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] active:bg-[var(--color-surface-hover)] border border-[var(--color-border)]',
    };

    const standardSizes: Record<ButtonSize, string> = {
      sm: 'text-[13px] leading-5 py-1.5 px-3.5 gap-1.5 min-h-[36px]',
      md: 'text-sm leading-5 py-2.5 px-5 gap-2 min-h-[40px]',
      lg: 'text-sm leading-5 py-3 px-6 gap-2.5 min-h-[44px]',
    };

    const iconOnlySizes: Record<ButtonSize, string> = {
      sm: 'p-1.5 min-h-[36px] min-w-[36px]',
      md: 'p-2 min-h-[40px] min-w-[40px]',
      lg: 'p-2.5 min-h-[44px] min-w-[44px]',
    };

    const tertiarySizes: Record<ButtonSize, string> = {
      sm: 'text-[13px] leading-5 py-1.5 px-2 gap-1.5 min-h-[36px]',
      md: 'text-sm leading-5 py-2 px-2.5 gap-1.5 min-h-[40px]',
      lg: 'text-sm leading-5 py-2.5 px-3 gap-2 min-h-[44px]',
    };

    const resolvedSizeClass =
      variant === 'icon'
        ? iconOnlySizes[size]
        : variant === 'tertiary'
        ? tertiarySizes[size]
        : standardSizes[size];

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${resolvedSizeClass} ${className}`}
        disabled={disabled || isBusy}
        aria-busy={isBusy || undefined}
        {...props}
      >
        {isBusy ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden="true" />
            {variant !== 'icon' && children && <span>{children}</span>}
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="inline-flex items-center justify-center shrink-0" aria-hidden="true">
                {leftIcon}
              </span>
            )}
            {children && (variant === 'icon' ? children : <span>{children}</span>)}
            {rightIcon && (
              <span className="inline-flex items-center justify-center shrink-0" aria-hidden="true">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';
