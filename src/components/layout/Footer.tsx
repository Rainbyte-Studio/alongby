import React from 'react';
import { Link } from 'react-router-dom';
import { AlongbyWordmark } from '../brand/AlongbyWordmark';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)] py-10 sm:py-12 mt-auto text-sm text-[var(--color-text-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center text-[var(--color-text-primary)]">
              <AlongbyWordmark size="sm" />
            </div>
            <p className="mt-2 text-[13px] text-[var(--color-text-secondary)] max-w-sm leading-relaxed">
              Curated managed marketplace connecting clients with vetted digital and creative professionals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] font-medium text-[var(--color-text-secondary)]">
            <Link to="/#how-it-works" className="hover:text-[var(--color-text-primary)] transition-colors whitespace-nowrap">
              How It Works
            </Link>
            <Link to="/#principles" className="hover:text-[var(--color-text-primary)] transition-colors whitespace-nowrap">
              Our Philosophy
            </Link>
            <span className="text-[var(--color-border-strong)] hidden sm:inline" aria-hidden="true">/</span>
            <span className="text-[var(--color-text-muted)]">Curated · Managed · Transparent</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-[var(--color-border)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-[var(--color-text-muted)] tabular-nums">
          <p>© {new Date().getFullYear()} Alongby. All rights reserved.</p>
          <p>Athens &amp; European Digital Practice</p>
        </div>
      </div>
    </footer>
  );
};
