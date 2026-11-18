import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { ArrowLeft, Clock, ShieldAlert } from 'lucide-react';
import { UserRole } from '../../types';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
  role?: UserRole;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  title,
  subtitle,
  action,
  showBack = false,
  onBack,
}) => {
  const { userProfile } = useAuth();
  const navigate = useNavigate();

  const hasHeader = Boolean(title || subtitle || action || showBack);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[var(--color-bg-app)] pb-16">
      {/* Role Notice banner if account is pending or status requires attention */}
      {userProfile?.accountStatus === 'pending' && (
        <div className="bg-[var(--color-warning-bg)] border-b border-[var(--color-warning-border)] px-4 py-2.5 text-xs font-medium text-[var(--color-warning-text)] flex items-center justify-center gap-2 text-center">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Your account is pending review by the Alongby curation team.</span>
        </div>
      )}

      {userProfile?.accountStatus === 'suspended' && (
        <div className="bg-[var(--color-error-bg)] border-b border-[var(--color-error-border)] px-4 py-2.5 text-xs font-medium text-[var(--color-error-text)] flex items-center justify-center gap-2 text-center">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Your account is suspended. Please contact support.</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        {/* Header section */}
        {hasHeader && (
          <div className="mb-8">
            {showBack && (
              <button
                type="button"
                onClick={onBack ? onBack : () => navigate(-1)}
                className="inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] mb-4 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            )}

            {(title || subtitle || action) && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[var(--color-border)]">
                <div className="min-w-0">
                  {title && (
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="typo-page-title text-[var(--color-text-primary)]">
                        {title}
                      </h1>
                      {userProfile && (
                        <Badge variant="neutral" size="sm" className="capitalize">
                          {userProfile.role}
                        </Badge>
                      )}
                    </div>
                  )}
                  {subtitle && (
                    <p className="mt-1.5 text-sm sm:text-[15px] text-[var(--color-text-secondary)] max-w-2xl leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                </div>

                {action && <div className="shrink-0 flex flex-wrap items-center gap-2">{action}</div>}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        {children}
      </main>
    </div>
  );
};
