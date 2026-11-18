import React from 'react';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'neutral' | 'success' | 'warning' | 'info' | 'error';
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
    neutral: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    error: 'bg-rose-50 text-rose-800 border-rose-200',
  };

  const sizeStyles = {
    sm: 'text-[11px] font-medium px-2 py-0.5 rounded',
    md: 'text-xs font-medium px-2.5 py-1 rounded-md',
  };

  return (
    <span
      className={`inline-flex items-center border leading-none tracking-normal whitespace-nowrap ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
    >
      {children}
    </span>
  );
};
