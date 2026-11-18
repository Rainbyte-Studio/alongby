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
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xs border-b border-neutral-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-8">
          <Link
            to="/"
            className="flex items-center text-neutral-950 hover:opacity-85 transition-opacity cursor-pointer py-1"
            aria-label="alongby home"
          >
            <AlongbyWordmark size="md" />
          </Link>

          {/* Public links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-neutral-600">
            <Link
              to="/#how-it-works"
              className="hover:text-neutral-900 transition-colors"
            >
              How It Works
            </Link>
            <Link
              to="/#principles"
              className="hover:text-neutral-900 transition-colors"
            >
              Our Philosophy
            </Link>
          </nav>
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {currentUser && userProfile ? (
            <div className="flex items-center gap-3">
              {/* Dev Role Switcher for Phase 1 verification & testing */}
              <div className="relative">
                <button
                  onClick={() => setDevMenuOpen(!devMenuOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors cursor-pointer"
                  title="Dev Tool: Switch user role for testing"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-neutral-500" />
                  <span className="capitalize">{userProfile.role}</span>
                  <ChevronDown className="w-3 h-3 text-neutral-400" />
                </button>

                {devMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-200 py-1.5 z-50">
                    <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider border-b border-neutral-100 mb-1">
                      Dev Role Switcher
                    </div>
                    {(['client', 'professional', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        onClick={async () => {
                          await setRoleForDev(r);
                          setDevMenuOpen(false);
                          if (r === 'client') navigate('/client');
                          else if (r === 'professional') navigate('/professional');
                          else if (r === 'admin') navigate('/admin');
                        }}
                        className="w-full text-left px-3 py-1.5 text-xs text-neutral-700 hover:bg-neutral-100 flex items-center justify-between capitalize"
                      >
                        <span>{r}</span>
                        {userProfile.role === r && (
                          <Check className="w-3.5 h-3.5 text-neutral-900" />
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
                >
                  Dashboard
                </Button>
              </Link>

              {userProfile.role === 'professional' && (
                <Link to="/professional/opportunities">
                  <Button
                    variant={location.pathname.startsWith('/professional/opportunities') ? 'secondary' : 'ghost'}
                    size="sm"
                  >
                    Opportunities
                  </Button>
                </Link>
              )}

              {userProfile.role === 'client' && (
                <Link to="/client/projects">
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
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-xs font-semibold text-neutral-900 leading-tight">
                  {userProfile.displayName || currentUser.email?.split('@')[0]}
                </span>
                <Badge variant={roleBadgeVariants[userProfile.role]} size="sm">
                  {userProfile.role}
                </Badge>
              </div>

              {/* Sign Out */}
              <Button
                variant="ghost"
                size="sm"
                onClick={signOut}
                title="Sign out"
                className="text-neutral-500 hover:text-neutral-900"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth?.('signin')}
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
