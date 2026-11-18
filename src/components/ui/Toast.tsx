import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export type ToastVariant = 'neutral' | 'success' | 'warning' | 'error' | 'info';

export interface ToastItem {
  id: string;
  variant?: ToastVariant;
  title?: string;
  message: string;
  durationMs?: number;
}

export interface ToastProps extends Omit<ToastItem, 'id' | 'durationMs'> {
  onClose?: () => void;
  className?: string;
}

export const Toast: React.FC<ToastProps> = ({
  variant = 'neutral',
  title,
  message,
  onClose,
  className = '',
}) => {
  const icons: Record<ToastVariant, React.ReactNode> = {
    neutral: <Info className="w-4 h-4 text-[var(--color-text-secondary)] shrink-0 mt-0.5" aria-hidden="true" />,
    info: <Info className="w-4 h-4 text-[var(--color-info)] shrink-0 mt-0.5" aria-hidden="true" />,
    success: <CheckCircle2 className="w-4 h-4 text-[var(--color-success)] shrink-0 mt-0.5" aria-hidden="true" />,
    warning: <AlertTriangle className="w-4 h-4 text-[var(--color-warning)] shrink-0 mt-0.5" aria-hidden="true" />,
    error: <AlertCircle className="w-4 h-4 text-[var(--color-error)] shrink-0 mt-0.5" aria-hidden="true" />,
  };

  const role = variant === 'error' || variant === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      aria-live={role === 'alert' ? 'assertive' : 'polite'}
      className={`pointer-events-auto w-full max-w-sm rounded-[var(--radius-card)] bg-[var(--color-surface)] border border-[var(--color-border-strong)] shadow-[var(--shadow-overlay)] p-3.5 flex items-start justify-between gap-3 font-sans ${className}`}
    >
      <div className="flex items-start gap-2.5 min-w-0">
        {icons[variant]}
        <div className="min-w-0">
          {title && (
            <div className="text-[13px] font-semibold text-[var(--color-text-primary)] leading-snug">
              {title}
            </div>
          )}
          <div className="text-xs text-[var(--color-text-secondary)] leading-relaxed break-words">
            {message}
          </div>
        </div>
      </div>

      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close notification"
          className="p-1 -mr-1 -mt-0.5 rounded-[6px] text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
        >
          <X className="w-3.5 h-3.5" aria-hidden="true" />
        </button>
      )}
    </div>
  );
};

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, 'id'>) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (toast: Omit<ToastItem, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = toast.durationMs ?? 4500;
      setToasts((prev) => [...prev, { ...toast, id }]);
      if (duration > 0) {
        window.setTimeout(() => dismissToast(id), duration);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, dismissToast }}>
      {children}
      {toasts.length > 0 && (
        <div
          aria-label="Notifications"
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 flex flex-col items-end gap-2.5 pointer-events-none"
        >
          {toasts.map((t) => (
            <Toast
              key={t.id}
              variant={t.variant}
              title={t.title}
              message={t.message}
              onClose={() => dismissToast(t.id)}
            />
          ))}
        </div>
      )}
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
      dismissToast: () => {},
    };
  }
  return ctx;
};
