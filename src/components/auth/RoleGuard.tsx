import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';
import { Button } from '../ui/Button';
import { ShieldAlert, ArrowRight } from 'lucide-react';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: UserRole[];
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const { userProfile, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return null; // ProtectedRoute will handle spinner
  }

  const userRole = userProfile?.role;
  const isAllowed = userRole && allowedRoles.includes(userRole);

  if (!isAllowed) {
    const getRoleDestination = () => {
      if (userRole === 'client') return '/client';
      if (userRole === 'professional') return '/professional';
      if (userRole === 'admin') return '/admin';
      return '/';
    };

    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12 bg-[var(--color-bg-app)]">
        <div className="max-w-md w-full text-center bg-[var(--color-surface)] p-7 sm:p-8 rounded-[var(--radius-card)] border border-[var(--color-border)] shadow-[var(--shadow-card)]">
          <div className="w-11 h-11 rounded-[var(--radius-button)] bg-[var(--color-error-bg)] text-[var(--color-error)] flex items-center justify-center mx-auto mb-4 border border-[var(--color-error-border)]">
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
          </div>
          <h1 className="typo-section-heading text-[var(--color-text-primary)] mb-2">
            Access Restricted
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
            This area is restricted to {allowedRoles.join(' or ')} accounts.
            {userRole ? (
              <span> You are currently signed in with a <strong className="capitalize font-semibold text-[var(--color-text-primary)]">{userRole}</strong> account.</span>
            ) : (
              <span> Please sign in with an authorized account.</span>
            )}
          </p>

          <div className="flex flex-col gap-2.5">
            <Button
              variant="primary"
              onClick={() => navigate(getRoleDestination())}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Go to {userRole ? `${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Workspace` : 'Home'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
            >
              Return to Homepage
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
