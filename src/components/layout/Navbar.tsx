import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import {
  LogOut,
  ShieldCheck,
  ChevronDown,
  Check,
  Menu,
  X,
  LayoutDashboard,
  FolderKanban,
  Briefcase,
  User,
} from 'lucide-react';
import { UserRole } from '../../types';
import { AlongbyWordmark } from '../brand/AlongbyWordmark';
import { ThemeSelector } from '../ui/ThemeSelector';
import { NotificationBell } from '../notifications/NotificationBell';

interface NavbarProps {
  onOpenAuth?: (
    initialMode?: 'signin' | 'signup',
    initialRole?: 'client' | 'professional'
  ) => void;
}

const PUBLIC_NAV_ITEMS = [
  { id: 'how-it-works', label: 'How It Works', to: '/#how-it-works' },
  { id: 'for-clients', label: 'For Clients', to: '/#for-clients' },
  { id: 'for-professionals', label: 'For Professionals', to: '/#for-professionals' },
  { id: 'principles', label: 'Our Philosophy', to: '/#principles' },
] as const;

export const scrollToLandingSection = (sectionId: string) => {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;
  el.scrollIntoView({
    behavior: prefersReducedMotion ? 'auto' : 'smooth',
    block: 'start',
  });
};

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth }) => {
  const { currentUser, userProfile, signOut, setRoleForDev } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const devMenuRef = useRef<HTMLDivElement>(null);
  const devTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileToggleRef = useRef<HTMLButtonElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);

  const getDashboardPath = () => {
    if (!userProfile) return '/';
    if (userProfile.onboardingStatus === 'pending') {
      return userProfile.role === 'client'
        ? '/onboarding/client'
        : '/onboarding/professional';
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

  // Close menus on route or hash change, and scroll to hash target on landing page
  useEffect(() => {
    setMobileMenuOpen(false);
    setDevMenuOpen(false);

    if (location.pathname === '/' && location.hash) {
      const targetId = location.hash.replace('#', '');
      const timer = window.setTimeout(() => {
        scrollToLandingSection(targetId);
      }, 60);
      return () => window.clearTimeout(timer);
    }
  }, [location.pathname, location.hash]);

  // Body scroll lock while mobile navigation drawer is open + auto-close on desktop resize
  useEffect(() => {
    if (!mobileMenuOpen) return;

    const scrollY = window.scrollY;
    const previous = { position: document.body.style.position, top: document.body.style.top, width: document.body.style.width, overflow: document.body.style.overflow };
    document.documentElement.dataset.mobileNavOpen = 'true';
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';
    document.body.style.overflow = 'hidden';

    const mediaQuery = window.matchMedia('(min-width: 1280px)');
    const initialFocus = window.requestAnimationFrame(() => mobilePanelRef.current?.focus());
    const handleMediaChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        setMobileMenuOpen(false);
      }
    };
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      window.cancelAnimationFrame(initialFocus);
      delete document.documentElement.dataset.mobileNavOpen;
      document.body.style.position = previous.position;
      document.body.style.top = previous.top;
      document.body.style.width = previous.width;
      document.body.style.overflow = previous.overflow;
      window.scrollTo({ top: scrollY, behavior: 'auto' });
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, [mobileMenuOpen]);

  // Outside click and Escape key handling for Dev Role Switcher and Mobile Menu
  useEffect(() => {
    if (!devMenuOpen && !mobileMenuOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (devMenuOpen && devMenuRef.current && !devMenuRef.current.contains(target)) {
        setDevMenuOpen(false);
      }
      if (mobileMenuOpen && headerRef.current && !headerRef.current.contains(target)) {
        setMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (devMenuOpen) {
          setDevMenuOpen(false);
          devTriggerRef.current?.focus();
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false);
          mobileToggleRef.current?.focus();
        }
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [devMenuOpen, mobileMenuOpen]);

  const handlePublicSectionClick = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (location.pathname === '/' && location.hash === `#${sectionId}`) {
      scrollToLandingSection(sectionId);
    }
  };

  const handleRoleSwitch = async (nextRole: UserRole) => {
    await setRoleForDev(nextRole);
    setDevMenuOpen(false);
    setMobileMenuOpen(false);
    if (nextRole === 'client') navigate('/client');
    else if (nextRole === 'professional') navigate('/professional');
    else if (nextRole === 'admin') navigate('/admin');
  };

  const roleBadgeVariants = {
    client: 'info' as const,
    professional: 'success' as const,
    admin: 'warning' as const,
  };

  const dashboardPath = getDashboardPath();
  const isOnboardingPending = userProfile?.onboardingStatus === 'pending';

  const workspaceLinks: {
    to: string;
    label: string;
    active: boolean;
    icon: React.ReactNode;
  }[] = userProfile
    ? [
        {
          to: dashboardPath,
          label: isOnboardingPending ? 'Onboarding' : 'Dashboard',
          active: location.pathname === dashboardPath,
          icon: <LayoutDashboard className="w-4 h-4 shrink-0" aria-hidden="true" />,
        },
        ...(!isOnboardingPending && userProfile.role === 'client'
          ? [
              {
                to: '/client/projects',
                label: 'Projects',
                active: location.pathname.startsWith('/client/projects'),
                icon: <FolderKanban className="w-4 h-4 shrink-0" aria-hidden="true" />,
              },
              {
                to: '/client/profile',
                label: 'Profile',
                active: location.pathname.startsWith('/client/profile'),
                icon: <User className="w-4 h-4 shrink-0" aria-hidden="true" />,
              },
            ]
          : []),
        ...(!isOnboardingPending && userProfile.role === 'professional'
          ? [
              {
                to: '/professional/opportunities',
                label: 'Opportunities',
                active: location.pathname.startsWith('/professional/opportunities'),
                icon: <Briefcase className="w-4 h-4 shrink-0" aria-hidden="true" />,
              },
              {
                to: '/professional/profile',
                label: 'Profile',
                active: location.pathname.startsWith('/professional/profile'),
                icon: <User className="w-4 h-4 shrink-0" aria-hidden="true" />,
              },
            ]
          : []),
      ]
    : [];

  return (
    <header
      ref={headerRef}
      className="sticky top-0 z-40 bg-[var(--color-surface)] border-b border-[var(--color-border)] font-sans"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 xl:px-8 h-16 flex items-center justify-between gap-2 sm:gap-6">
        {/* Zone 1: Brand Wordmark + Desktop Navigation */}
        <div className="flex items-center gap-6 xl:gap-10 min-w-0 shrink-0">
          <Link
            to="/"
            className="flex items-center text-[var(--color-text-primary)] hover:opacity-85 transition-opacity cursor-pointer py-1 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] rounded-sm"
            aria-label="alongby home"
          >
            <AlongbyWordmark size="md" />
          </Link>

          {currentUser && userProfile ? (
            <nav
              aria-label="Workspace navigation"
              className="hidden xl:flex items-center gap-1 whitespace-nowrap"
            >
              {workspaceLinks.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  aria-current={item.active ? 'page' : undefined}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 min-h-[36px] rounded-[var(--radius-button)] text-[13px] transition-colors whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                    item.active
                      ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-semibold'
                      : 'text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]/60'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          ) : (
            <nav
              aria-label="Primary navigation"
              className="hidden xl:flex items-center gap-6 xl:gap-7 text-[13px] font-medium text-[var(--color-text-secondary)] whitespace-nowrap"
            >
              {PUBLIC_NAV_ITEMS.map((item) => {
                const isActive =
                  location.pathname === '/' && location.hash === `#${item.id}`;
                return (
                  <Link
                    key={item.id}
                    to={item.to}
                    onClick={() => handlePublicSectionClick(item.id)}
                    className={`relative py-1 transition-colors whitespace-nowrap shrink-0 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                      isActive
                        ? 'text-[var(--color-text-primary)] font-semibold underline underline-offset-[6px] decoration-[var(--color-primary)]'
                        : 'hover:text-[var(--color-text-primary)] hover:underline hover:underline-offset-[6px] hover:decoration-[var(--color-border-strong)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          )}
        </div>

        {/* Zone 3: Right Side Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
          {currentUser && userProfile ? (
            <>
              {/* Desktop Role Switcher (Dev / Evaluation) */}
              <div className="relative hidden xl:block" ref={devMenuRef}>
                <button
                  ref={devTriggerRef}
                  type="button"
                  onClick={() => setDevMenuOpen((prev) => !prev)}
                  aria-expanded={devMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-1.5 px-2.5 min-h-[36px] rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  title="Switch user role for evaluation"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                  <span className="capitalize">{userProfile.role}</span>
                  <ChevronDown className="w-3 h-3 text-[var(--color-text-muted)] shrink-0" aria-hidden="true" />
                </button>

                {devMenuOpen && (
                  <div
                    role="menu"
                    aria-label="Switch evaluation role"
                    className="absolute right-0 mt-2 w-48 bg-[var(--color-surface)] rounded-[var(--radius-card)] shadow-[var(--shadow-overlay)] border border-[var(--color-border)] py-1.5 z-50"
                  >
                    <div className="px-3 py-1.5 text-xs font-medium text-[var(--color-text-muted)] border-b border-[var(--color-border)] mb-1">
                      Switch Role
                    </div>
                    {(['client', 'professional', 'admin'] as UserRole[]).map((r) => (
                      <button
                        key={r}
                        type="button"
                        role="menuitemradio"
                        aria-checked={userProfile.role === r}
                        onClick={() => handleRoleSwitch(r)}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] focus-visible:bg-[var(--color-surface-secondary)] focus-visible:outline-none flex items-center justify-between capitalize cursor-pointer"
                      >
                        <span>{r}</span>
                        {userProfile.role === r && (
                          <Check className="w-3.5 h-3.5 text-[var(--color-primary)]" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Compact Dashboard Link on Small/Medium Screens (768–1279px) */}
              <Link to={dashboardPath} className="hidden md:inline-flex xl:hidden">
                <Button
                  variant={location.pathname === dashboardPath ? 'secondary' : 'outline'}
                  size="sm"
                >
                  {isOnboardingPending ? 'Onboarding' : 'Dashboard'}
                </Button>
              </Link>

              {/* Notifications (all viewports) */}
              <NotificationBell />

              {/* Desktop User Display */}
              <div className="hidden 2xl:flex flex-col items-end text-right pl-1">
                <span className="text-xs font-semibold text-[var(--color-text-primary)] leading-tight max-w-[140px] truncate">
                  {userProfile.displayName || currentUser.email?.split('@')[0]}
                </span>
                <Badge
                  variant={roleBadgeVariants[userProfile.role]}
                  size="sm"
                  className="mt-0.5 capitalize"
                >
                  {userProfile.role}
                </Badge>
              </div>

              {/* Desktop Sign Out */}
              <Button
                variant="icon"
                size="sm"
                onClick={signOut}
                title="Sign out"
                aria-label="Sign out"
                className="hidden xl:inline-flex min-h-[40px] min-w-[40px]"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onOpenAuth?.('signin')}
                className="hidden xl:inline-flex"
              >
                Sign In
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onOpenAuth?.('signup', 'professional')}
                className="hidden xl:inline-flex"
              >
                Join as Professional
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onOpenAuth?.('signup', 'client')}
                className="hidden xl:inline-flex px-3 sm:px-4 text-xs sm:text-[13px]"
              >
                Start a Project
              </Button>
            </>
          )}

          <div className="hidden xl:block"><ThemeSelector compact /></div>
          {/* Responsive Navigation Toggle (<1280px) */}
          <button
            ref={mobileToggleRef}
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-expanded={mobileMenuOpen}
            aria-controls="alongby-mobile-nav"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            className="xl:hidden inline-flex items-center justify-center min-h-[40px] min-w-[40px] p-2 rounded-[var(--radius-button)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
          >
            {mobileMenuOpen ? (
              <X className="w-5 h-5" aria-hidden="true" />
            ) : (
              <Menu className="w-5 h-5" aria-hidden="true" />
            )}
          </button>
        </div>
      </div>

      {/* Responsive Mobile & Tablet Navigation Drawer (<1280px) */}
      {mobileMenuOpen && (
        <>
          <div
            className="xl:hidden fixed inset-x-0 top-16 bottom-0 bg-[var(--color-backdrop)] z-30"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
          <div
            id="alongby-mobile-nav"
            ref={mobilePanelRef}
            tabIndex={-1}
            aria-label="Mobile navigation"
            className="xl:hidden relative z-40 border-t border-[var(--color-border)] bg-[var(--color-surface)] shadow-[var(--shadow-overlay)] max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 space-y-5">
              {currentUser && userProfile ? (
                <>
                  {/* Signed-in Identity Summary */}
                  <div className="flex items-center justify-between gap-3 pb-4 border-b border-[var(--color-border)]">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                        {userProfile.displayName || currentUser.email?.split('@')[0]}
                      </div>
                      {currentUser.email && (
                        <div className="text-xs text-[var(--color-text-secondary)] truncate mt-0.5">
                          {currentUser.email}
                        </div>
                      )}
                    </div>
                    <Badge
                      variant={roleBadgeVariants[userProfile.role]}
                      size="sm"
                      className="capitalize shrink-0"
                    >
                      {userProfile.role}
                    </Badge>
                  </div>

                  {/* Workspace Navigation */}
                  <nav aria-label="Mobile workspace navigation" className="space-y-1">
                    {workspaceLinks.map((item) => (
                      <Link
                        key={item.to}
                        to={item.to}
                        aria-current={item.active ? 'page' : undefined}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 min-h-[44px] rounded-[var(--radius-button)] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                          item.active
                            ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-semibold'
                            : 'text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]/60'
                        }`}
                      >
                        {item.icon}
                        <span>{item.label}</span>
                      </Link>
                    ))}
                  </nav>

                  {/* Public Editorial Links */}
                  <div className="pt-4 border-t border-[var(--color-border)] space-y-1">
                    <div className="px-3 pb-1 text-xs font-semibold text-[var(--color-text-muted)]">
                      Public Overview
                    </div>
                    {PUBLIC_NAV_ITEMS.map((item) => (
                      <Link
                        key={item.id}
                        to={item.to}
                        onClick={() => handlePublicSectionClick(item.id)}
                        className="flex items-center px-3 py-2 min-h-[42px] rounded-[var(--radius-button)] text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-secondary)]/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>

                  {/* Role Switcher for Mobile Evaluation */}
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <div className="px-1 pb-2 flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-muted)]">
                      <ShieldCheck className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Switch Evaluation Role</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['client', 'professional', 'admin'] as UserRole[]).map((r) => (
                        <button
                          key={r}
                          type="button"
                          aria-pressed={userProfile.role === r}
                          onClick={() => handleRoleSwitch(r)}
                          className={`px-2.5 py-2 min-h-[40px] rounded-[var(--radius-button)] border text-xs font-medium capitalize text-center transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                            userProfile.role === r
                              ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)] border-[var(--color-primary)] font-semibold'
                              : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mobile Sign Out */}
                  <div className="pt-4 border-t border-[var(--color-border)]">
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        signOut();
                      }}
                      leftIcon={<LogOut className="w-4 h-4" />}
                      className="w-full"
                    >
                      Sign Out
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  {/* Signed-out Public Links */}
                  <nav aria-label="Mobile navigation" className="space-y-1">
                    {PUBLIC_NAV_ITEMS.map((item) => {
                      const isActive =
                        location.pathname === '/' && location.hash === `#${item.id}`;
                      return (
                        <Link
                          key={item.id}
                          to={item.to}
                          onClick={() => handlePublicSectionClick(item.id)}
                          className={`flex items-center px-3 py-2.5 min-h-[44px] rounded-[var(--radius-button)] text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] ${
                            isActive
                              ? 'bg-[var(--color-surface-secondary)] text-[var(--color-text-primary)] font-semibold'
                              : 'text-[var(--color-text-primary)] font-medium hover:bg-[var(--color-surface-secondary)]'
                          }`}
                        >
                          {item.label}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="pt-4 border-t border-[var(--color-border)] grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <Button
                      variant="primary"
                      size="md"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth?.('signup', 'client');
                      }}
                      className="w-full"
                    >
                      Start a Project
                    </Button>
                    <Button
                      variant="outline"
                      size="md"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth?.('signup', 'professional');
                      }}
                      className="w-full"
                    >
                      Join as Professional
                    </Button>
                    <Button
                      variant="secondary"
                      size="md"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth?.('signin');
                      }}
                      className="w-full"
                    >
                      Sign In
                    </Button>
                  </div>
                </>
              )}
              <div className="pt-4 border-t border-[var(--color-border)]"><div className="text-xs font-semibold text-[var(--color-text-muted)] mb-2">Appearance</div><ThemeSelector /></div>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
