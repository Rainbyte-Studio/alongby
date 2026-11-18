import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowLeft, Clock, ShieldAlert } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
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

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-neutral-50/30 pb-16">
      {/* Role Notice banner if account is pending or status requires attention */}
      {userProfile?.accountStatus === 'pending' && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 text-xs text-amber-800 flex items-center justify-center gap-2">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>Your account is pending review by the Alongby curation team.</span>
        </div>
      )}

      {userProfile?.accountStatus === 'suspended' && (
        <div className="bg-rose-50 border-b border-rose-200 px-4 py-2.5 text-xs text-rose-800 flex items-center justify-center gap-2">
          <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
          <span>Your account is suspended. Please contact support.</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* Header section */}
        <div className="mb-8">
          {showBack && (
            <button
              onClick={onBack ? onBack : () => navigate(-1)}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-900 mb-4 transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-200/80">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl sm:text-3xl font-bold font-serif tracking-tight text-neutral-900">
                  {title}
                </h1>
                {userProfile && (
                  <Badge variant="neutral" size="sm">
                    {userProfile.role}
                  </Badge>
                )}
              </div>
              {subtitle && (
                <p className="mt-1.5 text-sm text-neutral-500 max-w-2xl leading-relaxed">
                  {subtitle}
                </p>
              )}
            </div>

            {action && <div className="shrink-0 flex items-center gap-2">{action}</div>}
          </div>
        </div>

        {/* Content */}
        {children}
      </main>
    </div>
  );
};
