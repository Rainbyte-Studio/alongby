import React from 'react';
import { Loader2 } from 'lucide-react';

export interface LoadingSpinnerProps {
  label?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  label = 'Loading...',
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-7 h-7',
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] p-8 text-[var(--color-text-secondary)]">
      <Loader2 className={`${iconSizes[size]} animate-spin text-[var(--color-text-primary)] mb-3`} />
      <span className="font-sans text-[13px] font-medium text-[var(--color-text-secondary)]">{label}</span>
    </div>
  );
};
