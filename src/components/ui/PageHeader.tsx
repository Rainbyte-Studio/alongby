import React from 'react';
import { ArrowLeft } from 'lucide-react';

export interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  onBack?: () => void;
  backLabel?: string;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  eyebrow,
  badge,
  action,
  onBack,
  backLabel = 'Back',
  className = '',
}) => {
  return (
    <div className={`pb-6 border-b border-[var(--color-border)] mb-8 ${className}`}>
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 min-h-[36px] px-2 -ml-2 mb-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors cursor-pointer rounded-[var(--radius-button)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <ArrowLeft className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>{backLabel}</span>
        </button>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <div className="text-xs font-medium text-[var(--color-text-muted)] mb-1">
              {eyebrow}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="typo-page-title text-[var(--color-text-primary)]">
              {title}
            </h1>
            {badge}
          </div>
          {description && (
            <p className="mt-1.5 text-sm sm:text-[15px] text-[var(--color-text-secondary)] leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {action && (
          <div className="w-full sm:w-auto min-w-0 flex flex-wrap items-center gap-2">
            {action}
          </div>
        )}
      </div>
    </div>
  );
};
