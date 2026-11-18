import React from 'react';

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '', ...props }) => {
  return (
    <div
      aria-hidden="true"
      className={`rounded-[var(--radius-input)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)]/60 opacity-85 ${className}`}
      {...props}
    />
  );
};

export const SkeletonCard: React.FC<{ lines?: number; className?: string }> = ({
  lines = 3,
  className = '',
}) => (
  <div
    role="status"
    aria-label="Loading content"
    className={`rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5 sm:p-6 space-y-3.5 ${className}`}
  >
    <Skeleton className="h-5 w-2/5" />
    <div className="space-y-2">
      {Array.from({ length: lines }).map((_, idx) => (
        <Skeleton
          key={idx}
          className={`h-3.5 ${idx === lines - 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
    </div>
    <span className="sr-only">Loading…</span>
  </div>
);

export const SkeletonTableRows: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 4,
  columns = 4,
}) => (
  <>
    {Array.from({ length: rows }).map((_, rowIdx) => (
      <tr key={rowIdx} aria-hidden="true">
        {Array.from({ length: columns }).map((__, colIdx) => (
          <td key={colIdx} className="px-4 py-3.5">
            <Skeleton className={`h-4 ${colIdx === 0 ? 'w-32' : 'w-20'}`} />
          </td>
        ))}
      </tr>
    ))}
  </>
);
