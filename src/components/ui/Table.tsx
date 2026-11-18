import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from './Button';

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  containerClassName?: string;
}

export const Table: React.FC<TableProps> = ({
  children,
  className = '',
  containerClassName = '',
  ...props
}) => {
  return (
    <div
      className={`w-full overflow-x-auto rounded-[var(--radius-card)] border border-[var(--color-border)] bg-[var(--color-surface)] ${containerClassName}`}
    >
      <table
        className={`w-full border-collapse font-sans text-sm text-left text-[var(--color-text-primary)] ${className}`}
        {...props}
      >
        {children}
      </table>
    </div>
  );
};

export const TableHeader: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <thead
    className={`bg-[var(--color-surface-secondary)]/75 border-b border-[var(--color-border)] ${className}`}
    {...props}
  >
    {children}
  </thead>
);

export const TableBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({
  children,
  className = '',
  ...props
}) => (
  <tbody
    className={`divide-y divide-[var(--color-border)] bg-[var(--color-surface)] ${className}`}
    {...props}
  >
    {children}
  </tbody>
);

export interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  hoverable?: boolean;
  selected?: boolean;
}

export const TableRow: React.FC<TableRowProps> = ({
  children,
  hoverable = true,
  selected = false,
  className = '',
  ...props
}) => (
  <tr
    className={`transition-colors ${
      selected
        ? 'bg-[var(--color-surface-secondary)]'
        : hoverable
        ? 'hover:bg-[var(--color-surface-secondary)]/45'
        : ''
    } ${className}`}
    {...props}
  >
    {children}
  </tr>
);

export interface TableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
}

export const TableHead: React.FC<TableHeadProps> = ({
  children,
  align,
  numeric = false,
  className = '',
  scope = 'col',
  ...props
}) => {
  const resolvedAlign = align || (numeric ? 'right' : 'left');
  const alignClass =
    resolvedAlign === 'right'
      ? 'text-right'
      : resolvedAlign === 'center'
      ? 'text-center'
      : 'text-left';

  return (
    <th
      scope={scope}
      className={`px-4 py-3 font-sans text-xs font-semibold text-[var(--color-text-secondary)] whitespace-nowrap ${alignClass} ${
        numeric ? 'tabular-nums' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </th>
  );
};

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  align?: 'left' | 'center' | 'right';
  numeric?: boolean;
}

export const TableCell: React.FC<TableCellProps> = ({
  children,
  align,
  numeric = false,
  className = '',
  ...props
}) => {
  const resolvedAlign = align || (numeric ? 'right' : 'left');
  const alignClass =
    resolvedAlign === 'right'
      ? 'text-right'
      : resolvedAlign === 'center'
      ? 'text-center'
      : 'text-left';

  return (
    <td
      className={`px-4 py-3.5 font-sans text-[13px] sm:text-sm text-[var(--color-text-primary)] align-middle ${alignClass} ${
        numeric ? 'tabular-nums font-medium' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </td>
  );
};

export interface TableEmptyStateProps {
  colSpan: number;
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const TableEmptyState: React.FC<TableEmptyStateProps> = ({
  colSpan,
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) => (
  <tr>
    <td colSpan={colSpan} className="px-6 py-12 text-center">
      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
        {Icon && (
          <div className="w-10 h-10 rounded-[var(--radius-button)] bg-[var(--color-surface-secondary)] border border-[var(--color-border)] flex items-center justify-center text-[var(--color-text-secondary)] mb-3">
            <Icon className="w-4 h-4" aria-hidden="true" />
          </div>
        )}
        <div className="font-sans text-sm font-semibold text-[var(--color-text-primary)]">
          {title}
        </div>
        {description && (
          <p className="mt-1 text-xs text-[var(--color-text-secondary)] leading-relaxed">
            {description}
          </p>
        )}
        {actionLabel && onAction && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onAction}
            className="mt-4"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </td>
  </tr>
);
