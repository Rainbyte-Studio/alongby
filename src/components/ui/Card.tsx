import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'muted' | 'outline';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    default: 'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)]',
    muted: 'bg-[var(--color-surface-secondary)] border border-[var(--color-border)]',
    outline: 'bg-transparent border border-[var(--color-border)]',
  };

  return (
    <div
      className={`rounded-[var(--radius-card)] p-5 sm:p-6 transition-colors duration-200 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
