import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, required, id, className = '', rows = 4, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block font-sans text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5"
          >
            {label}
            {required && <span className="text-[var(--color-error)] ml-0.5">*</span>}
          </label>
        )}
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className={`w-full px-3.5 py-2.5 font-sans text-sm font-normal text-[var(--color-text-primary)] leading-relaxed bg-[var(--color-surface)] border rounded-[var(--radius-input)] transition-colors duration-150 placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-offset-0 resize-y ${
            error
              ? 'border-[var(--color-error)] focus:border-[var(--color-error)] focus:ring-[var(--color-error)]/20'
              : 'border-[var(--color-border-strong)] hover:border-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-[var(--color-primary)]/15'
          } ${className}`}
          {...props}
        />
        {error ? (
          <p className="mt-1.5 text-xs text-[var(--color-error-text)] font-medium">{error}</p>
        ) : helperText ? (
          <p className="mt-1.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
