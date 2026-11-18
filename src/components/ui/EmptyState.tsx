import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  action,
  className = '',
}) => {
  const resolvedLabel = action?.label || actionLabel;
  const resolvedHandler = action?.onClick || onAction;

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 sm:p-12 rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] ${className}`}
    >
      {Icon && (
        <div className="w-11 h-11 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-text-secondary)] mb-4 border border-[var(--color-border)]">
          <Icon className="w-5 h-5" />
        </div>
      )}
      <h3 className="typo-card-title text-[var(--color-text-primary)] mb-1.5">
        {title}
      </h3>
      <p className="text-sm text-[var(--color-text-secondary)] max-w-md leading-relaxed mb-6">
        {description}
      </p>
      {resolvedLabel && resolvedHandler && (
        <Button variant="outline" size="sm" onClick={resolvedHandler}>
          {resolvedLabel}
        </Button>
      )}
    </div>
  );
};
