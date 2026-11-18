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
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap cursor-pointer';

  const variantClasses = {
    primary:
      'bg-neutral-900 text-white hover:bg-neutral-800 active:bg-black focus:ring-neutral-900 shadow-xs',
    secondary:
      'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 active:bg-neutral-300 focus:ring-neutral-400',
    outline:
      'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 active:bg-neutral-100 focus:ring-neutral-400 shadow-xs',
    ghost:
      'text-neutral-700 hover:bg-neutral-100 active:bg-neutral-200 focus:ring-neutral-400',
    destructive:
      'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus:ring-red-600 shadow-xs',
    white:
      'bg-white text-stone-900 hover:bg-stone-100 active:bg-stone-200 focus:ring-white shadow-xs font-semibold',
  };

  // Button horizontal padding must be exactly 2x vertical padding as per guidelines:
  // sm: py-1.5 px-3 (12px px, 6px py)
  // md: py-2.5 px-5 (20px px, 10px py)
  // lg: py-3.5 px-7 (28px px, 14px py)
  const sizeClasses = {
    sm: 'text-xs py-1.5 px-3 gap-1.5',
    md: 'text-sm py-2.5 px-5 gap-2',
    lg: 'text-base py-3.5 px-7 gap-2.5',
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
