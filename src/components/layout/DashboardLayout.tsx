import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, ChevronRight, Clock, ShieldAlert } from 'lucide-react';
import { UserRole } from '../../types';

export interface WorkspaceBreadcrumb {
  label: string;
  to?: string;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  breadcrumbs?: WorkspaceBreadcrumb[];
  action?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  role?: UserRole;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  eyebrow,
  breadcrumbs,
  action,
  showBack = false,
  onBack,
}) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const hasBreadcrumbs = Boolean(breadcrumbs && breadcrumbs.length > 0);
  const hasHeader = Boolean(title || subtitle || eyebrow || action || showBack || hasBreadcrumbs);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg-app)] pb-16">
      {/* Account status notices */}
      {userProfile?.accountStatus === 'pending' && (
        <div
          role="status"
          className="bg-[var(--color-warning-bg)] border-b border-[var(--color-warning-border)] px-4 py-2.5 text-xs font-medium text-[var(--color-warning-text)] flex items-center justify-center gap-2 text-center"
        >
          <Clock className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Your account is pending review by the Alongby curation team.</span>
        </div>
      )}

      {userProfile?.accountStatus === 'suspended' && (
        <div
          role="alert"
          className="bg-[var(--color-error-bg)] border-b border-[var(--color-error-border)] px-4 py-2.5 text-xs font-medium text-[var(--color-error-text)] flex items-center justify-center gap-2 text-center"
        >
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
          <span>Your account is suspended. Please contact support.</span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {hasHeader && (
          <header className="mb-8">
            {hasBreadcrumbs ? (
              <nav aria-label="Breadcrumb" className="mb-3">
                <ol className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-[var(--color-text-secondary)]">
                  {breadcrumbs!.map((crumb, idx) => {
                    const isLast = idx === breadcrumbs!.length - 1;
                    return (
                      <li key={`${crumb.label}-${idx}`} className="inline-flex items-center gap-1.5 min-w-0">
                        {idx > 0 && (
                          <ChevronRight
                            className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0"
                            aria-hidden="true"
                          />
                        )}
                        {crumb.to && !isLast ? (
                          <Link
                            to={crumb.to}
                            className="hover:text-[var(--color-text-primary)] transition-colors truncate max-w-[220px] rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                          >
                            {crumb.label}
                          </Link>
                        ) : (
                          <span
                            aria-current={isLast ? 'page' : undefined}
                            className={`truncate max-w-[260px] ${
                              isLast ? 'text-[var(--color-text-primary)] font-semibold' : ''
                            }`}
                          >
                            {crumb.label}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
            ) : (
              showBack && (
                <button
                  type="button"
                  onClick={onBack ? onBack : () => navigate(-1)}
                  className="inline-flex items-center gap-1.5 min-h-[36px] px-2 -ml-2 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]/60 mb-2.5 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-[var(--radius-button)]"
                >
                  <ArrowLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Back</span>
                </button>
              )
            )}

            {(title || subtitle || eyebrow || action) && (
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
                <div className="min-w-0">
                  {eyebrow && (
                    <div className="text-xs font-semibold text-[var(--color-text-muted)] mb-1.5">
                      {eyebrow}
                    </div>
                  )}
                  {title && (
                    <h1 className="typo-page-title text-[var(--color-text-primary)]">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="mt-1.5 text-sm sm:text-[15px] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>

                {action && (
                  <div className="w-full sm:w-auto min-w-0 flex flex-wrap items-center gap-2.5">
                    {action}
                  </div>
                )}
              </div>
            )}
          </header>
        )}

        {children}
      </div>
    </div>
  );
};
