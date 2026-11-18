import React from 'react';
import { Link } from 'react-router-dom';
import { AlongbyWordmark } from '../brand/AlongbyWordmark';
import { useAuth } from '../../context/AuthContext';
import { scrollToLandingSection } from './Navbar';

interface FooterProps {
  onOpenAuth?: (
    initialMode?: 'signin' | 'signup',
    initialRole?: 'client' | 'professional'
  ) => void;
}

const PLATFORM_LINKS = [
  { id: 'how-it-works', label: 'How It Works', to: '/#how-it-works' },
  { id: 'for-clients', label: 'For Clients', to: '/#for-clients' },
  { id: 'for-professionals', label: 'For Professionals', to: '/#for-professionals' },
  { id: 'principles', label: 'Our Philosophy', to: '/#principles' },
  { id: 'transparency', label: 'Trust & Commercial Clarity', to: '/#transparency' },
] as const;

const PRACTICE_DISCIPLINES = [
  'Websites & Digital Platforms',
  'E-commerce Architecture',
  'Web & Mobile Applications',
  'UI/UX & Design Systems',
  'Brand Identity & Guidelines',
  'Technical SEO & Digital Growth',
] as const;

export const Footer: React.FC<FooterProps> = ({ onOpenAuth }) => {
  const { currentUser, userProfile, signOut } = useAuth();

  const getWorkspacePath = () => {
    if (!userProfile) return '/';
    if (userProfile.onboardingStatus === 'pending') {
      return userProfile.role === 'client'
        ? '/onboarding/client'
        : '/onboarding/professional';
    }
    if (userProfile.role === 'client') return '/client';
    if (userProfile.role === 'professional') return '/professional';
    if (userProfile.role === 'admin') return '/admin';
    return '/';
  };

  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] mt-auto font-sans text-sm text-[var(--color-text-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-10 sm:pt-16 sm:pb-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 lg:gap-12 pb-10 sm:pb-12 border-b border-[var(--color-border)]">
          {/* Brand Presentation */}
          <div className="md:col-span-5 space-y-4">
            <Link
              to="/"
              className="inline-flex items-center text-[var(--color-text-primary)] hover:opacity-85 transition-opacity rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
              aria-label="alongby home"
            >
              <AlongbyWordmark size="md" />
            </Link>
            <p className="text-[14px] text-[var(--color-text-secondary)] max-w-sm leading-relaxed">
              Curated managed marketplace connecting organisations with vetted independent digital and creative specialists—from structured project brief to formal agreement.
            </p>
            <p className="text-xs text-[var(--color-text-muted)] pt-1">
              Curated · Managed · Transparent
            </p>
          </div>

          {/* Navigation Grouping: Platform */}
          <nav
            aria-label="Footer platform navigation"
            className="md:col-span-3 space-y-3"
          >
            <h2 className="font-sans text-xs font-semibold text-[var(--color-text-primary)] tracking-wide">
              Platform
            </h2>
            <ul className="space-y-2.5 text-[13px]">
              {PLATFORM_LINKS.map((link) => (
                <li key={link.id}>
                  <Link
                    to={link.to}
                    onClick={() => scrollToLandingSection(link.id)}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline hover:underline-offset-4 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Practice Disciplines */}
          <div className="md:col-span-2 space-y-3">
            <h2 className="font-sans text-xs font-semibold text-[var(--color-text-primary)] tracking-wide">
              Disciplines
            </h2>
            <ul className="space-y-2 text-[13px] text-[var(--color-text-secondary)]">
              {PRACTICE_DISCIPLINES.map((discipline) => (
                <li key={discipline} className="leading-snug">
                  {discipline}
                </li>
              ))}
            </ul>
          </div>

          {/* Access & Entry Points */}
          <div className="md:col-span-2 space-y-3">
            <h2 className="font-sans text-xs font-semibold text-[var(--color-text-primary)] tracking-wide">
              Access
            </h2>
            {currentUser && userProfile ? (
              <ul className="space-y-2.5 text-[13px]">
                <li>
                  <Link
                    to={getWorkspacePath()}
                    className="font-medium text-[var(--color-text-primary)] hover:underline hover:underline-offset-4 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Open Workspace
                  </Link>
                </li>
                {userProfile.onboardingStatus !== 'pending' &&
                  userProfile.role === 'client' && (
                    <li>
                      <Link
                        to="/client/projects/new"
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline hover:underline-offset-4 transition-colors rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                      >
                        New Project Brief
                      </Link>
                    </li>
                  )}
                <li>
                  <button
                    type="button"
                    onClick={signOut}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline hover:underline-offset-4 transition-colors cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Sign Out
                  </button>
                </li>
              </ul>
            ) : (
              <ul className="space-y-2.5 text-[13px]">
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.('signup', 'client')}
                    className="font-medium text-[var(--color-text-primary)] hover:underline hover:underline-offset-4 transition-colors cursor-pointer text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Start a Project
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.('signup', 'professional')}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline hover:underline-offset-4 transition-colors cursor-pointer text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Join as Professional
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => onOpenAuth?.('signin')}
                    className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:underline hover:underline-offset-4 transition-colors cursor-pointer text-left rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
                  >
                    Sign In
                  </button>
                </li>
              </ul>
            )}
          </div>
        </div>

        {/* Bottom Editorial Colophon */}
        <div className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[var(--color-text-muted)] tabular-nums">
          <p>© {new Date().getFullYear()} Alongby. All rights reserved.</p>
          <p>Athens &amp; European Digital Practice</p>
        </div>
      </div>
    </footer>
  );
};
