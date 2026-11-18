import React from 'react';

export type CardVariant =
  | 'default'
  | 'standard'
  | 'interactive'
  | 'summary'
  | 'action'
  | 'comparison'
  | 'document'
  | 'muted'
  | 'outline';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: CardVariant;
  padding?: CardPadding;
  selected?: boolean;
}

const CUSTOM_PADDING_REGEX = /\b([a-z]+:)?p[xytrbl]?-\d/;

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding,
      selected = false,
      className = '',
      onClick,
      onKeyDown,
      tabIndex,
      role,
      ...props
    },
    ref
  ) => {
    const isInteractive = variant === 'interactive' || Boolean(onClick);

    const variantStyles: Record<CardVariant, string> = {
      default:
        'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)]',
      standard:
        'bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)]',
      interactive: selected
        ? 'bg-[var(--color-surface-secondary)] border border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] cursor-pointer'
        : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-secondary)]/35 cursor-pointer',
      summary:
        'bg-[var(--color-surface)] border border-[var(--color-border)] tabular-nums',
      action:
        'bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-[var(--shadow-card)]',
      comparison: selected
        ? 'bg-[var(--color-surface)] border border-[var(--color-primary)] ring-1 ring-[var(--color-primary)] flex flex-col'
        : 'bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] flex flex-col',
      document:
        'bg-[var(--color-surface)] border border-[var(--color-border-strong)]',
      muted:
        'bg-[var(--color-surface-secondary)] border border-[var(--color-border)]',
      outline:
        'bg-transparent border border-[var(--color-border)]',
    };

    const paddingStyles: Record<CardPadding, string> = {
      none: 'p-0',
      sm: 'p-4',
      md: 'p-5 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    const hasCallerPadding = CUSTOM_PADDING_REGEX.test(className);
    const resolvedPaddingClass = padding
      ? paddingStyles[padding]
      : hasCallerPadding
      ? ''
      : variant === 'summary'
      ? 'p-4 sm:p-5'
      : paddingStyles.md;

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (onKeyDown) {
        onKeyDown(e);
      }
      if (!e.defaultPrevented && onClick && e.target === e.currentTarget) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
      }
    };

    return (
      <div
        ref={ref}
        role={role || (onClick ? 'button' : undefined)}
        tabIndex={tabIndex !== undefined ? tabIndex : onClick ? 0 : undefined}
        onClick={onClick}
        onKeyDown={onClick || onKeyDown ? handleKeyDown : undefined}
        className={`rounded-[var(--radius-card)] transition-colors duration-150 ${
          isInteractive
            ? 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-app)]'
            : ''
        } ${variantStyles[variant]} ${resolvedPaddingClass} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
