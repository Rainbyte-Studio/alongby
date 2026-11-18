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
    default: 'bg-white border border-neutral-200/80 shadow-xs',
    muted: 'bg-neutral-50/70 border border-neutral-200/60',
    outline: 'bg-transparent border border-neutral-200',
  };

  return (
    <div
      className={`rounded-xl p-6 transition-all ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
