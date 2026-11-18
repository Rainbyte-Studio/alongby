import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../ui/LoadingSpinner';

export interface ProtectedRouteProps {
  children: React.ReactNode;
  requireCompletedOnboarding?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireCompletedOnboarding = true,
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner label="Restoring Alongby session..." />;
  }

  if (!currentUser) {
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  // If user profile is not found or has pending onboarding
  if (requireCompletedOnboarding && userProfile?.onboardingStatus === 'pending') {
    const onboardingTarget =
      userProfile.role === 'client'
        ? '/onboarding/client'
        : '/onboarding/professional';

    if (location.pathname !== onboardingTarget) {
      return <Navigate to={onboardingTarget} replace />;
    }
  }

  return <>{children}</>;
};
