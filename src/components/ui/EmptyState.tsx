import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button, ButtonVariant } from './Button';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionVariant?: ButtonVariant;
  action?: {
    label: string;
    onClick: () => void;
    variant?: ButtonVariant;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionVariant,
  action,
  secondaryAction,
  compact = false,
  className = '',
}) => {
  const resolvedLabel = action?.label || actionLabel;
  const resolvedHandler = action?.onClick || onAction;
  const resolvedVariant = action?.variant || actionVariant || 'outline';

  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${
        compact ? 'p-6 sm:p-8' : 'p-8 sm:p-12'
      } rounded-[var(--radius-card)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface)] ${className}`}
    >
      {Icon && (
        <div className="w-11 h-11 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] flex items-center justify-center text-[var(--color-text-secondary)] mb-4 border border-[var(--color-border)]">
          <Icon className="w-5 h-5" aria-hidden="true" />
        </div>
      )}
      <h3 className="typo-card-title text-[var(--color-text-primary)] mb-1.5">
        {title}
      </h3>
      <p
        className={`text-sm text-[var(--color-text-secondary)] max-w-md leading-relaxed ${
          resolvedLabel || secondaryAction ? 'mb-6' : ''
        }`}
      >
        {description}
      </p>
      {(resolvedLabel || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2.5">
          {resolvedLabel && resolvedHandler && (
            <Button
              type="button"
              variant={resolvedVariant}
              size="sm"
              onClick={resolvedHandler}
            >
              {resolvedLabel}
            </Button>
          )}
          {secondaryAction && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
