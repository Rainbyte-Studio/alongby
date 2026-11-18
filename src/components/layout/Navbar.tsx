import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { LogOut, ShieldCheck, ChevronDown, Check } from 'lucide-react';
import { UserRole } from '../../types';
import { AlongbyWordmark } from '../brand/AlongbyWordmark';
import { NotificationBell } from '../notifications/NotificationBell';

interface NavbarProps {
  onOpenAuth?: (initialMode?: 'signin' | 'signup', initialRole?: 'client' | 'professional') => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { currentUser, userProfile, signOut, setRoleForDev } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [devMenuOpen, setDevMenuOpen] = useState(false);

  const getDashboardPath = () => {
    if (!userProfile) return '/';
    if (userProfile.onboardingStatus === 'pending') {
      return userProfile.role === 'client' ? '/onboarding/client' : '/onboarding/professional';
    }
    switch (userProfile.role) {
      case 'client':
        return '/client';
      case 'professional':
        return '/professional';
      case 'admin':
        return '/admin';
      default:
        return '/';
    }
  };

  const roleBadgeVariants = {
    client: 'info' as const,
    professional: 'success' as const,
    admin: 'warning' as const,
  };

  return (
    <header className="sticky top-0 z-40 bg-[var(--color-surface)]/95 backdrop-blur-xs border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-3.5 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
        {/* Brand Logo + Public Links */}
        <div className="flex items-center gap-6 lg:gap-8 min-w-0 shrink-0">
          <Link
            to="/"
            className="flex items-center text-[var(--color-text-primary)] hover:opacity-85 transition-opacity cursor-pointer py-1 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
            aria-label="alongby home"
          >
            <AlongbyWordmark size="md" />
          </Link>

          {/* Public links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[var(--color-text-secondary)] whitespace-nowrap">
            <Link
              to="/#how-it-works"
              className="hover:text-[var(--color-text-primary)] transition-colors whitespace-nowrap shrink-0"
            >
              How It Works
            </Link>
            <Link
              to="/#principles"
              className="hover:text-[var(--color-text-primary)] transition-colors whitespace-nowrap shrink-0"
            >
              Our Philosophy
            </Link>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
          {currentUser && userProfile ? (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Dev Role Switcher for testing */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setDevMenuOpen(!devMenuOpen)}
                  className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 min-h-[36px] rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  title="Dev Tool: Switch user role for testing"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" />
                  <span className="capitalize hidden xs:inline sm:inline">{userProfile.role}</span>
                  <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" />
                </button>

                {devMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-overlay)] border border-[var(--color-border)] py-1.5 z-50">
                    <div className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] border-b border-[var(--color-border)] mb-1">
                      Switch Role
                    </div>
                    {(['client', 'professional', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={async () => {
                          await setRoleForDev(r);
                          setDevMenuOpen(false);
                          if (r === 'client') navigate('/client');
                          else if (r === 'professional') navigate('/professional');
                          else if (r === 'admin') navigate('/admin');
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] flex items-center justify-between capitalize cursor-pointer"
                      >
                        <span>{r}</span>
                        {userProfile.role === r && (
                          <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dashboard Link */}
              <Link to={getDashboardPath()}>
                <Button
                  variant={location.pathname === getDashboardPath() ? 'secondary' : 'outline'}
                  size="sm"
                  className="px-2.5 sm:px-3.5"
                >
                  Dashboard
                </Button>
              </Link>

              {userProfile.role === 'professional' && (
                <Link to="/professional/opportunities" className="hidden sm:inline-flex">
                  <Button
                    variant={location.pathname.startsWith('/professional/opportunities') ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    Opportunities
                  </Button>
                </Link>
              )}

              {userProfile.role === 'client' && (
                <Link to="/client/projects" className="hidden sm:inline-flex">
                  <Button
                    variant={location.pathname.startsWith('/client/projects') ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    Projects
                  </Button>
                </Link>
              )}

              {/* Notifications */}
              <NotificationBell />

              {/* User display */}
              <div className="hidden md:flex flex-col items-end text-right pl-1">
                <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight max-w-[140px] truncate">
                  {userProfile.displayName || currentUser.email?.split('@')[0]}
                </span>
                <Badge variant={roleBadgeVariants[userProfile.role]} size="sm" className="mt-0.5 capitalize">
                  {userProfile.role}
                </Badge>
              </div>

              {/* Sign Out */}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                className="px-2 sm:px-2.5"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth?.('signin')}
                className="px-2.5 sm:px-3.5"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenAuth?.('signup', 'professional')}
                className="hidden sm:inline-flex"
              >
                Join as Professional
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenAuth?.('signup', 'client')}
                className="px-3 sm:px-4"
              >
                Start a Project
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
