import React from 'react';
import { Link } from 'react-router-dom';
import { AlongbyWordmark } from '../brand/AlongbyWordmark';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-200/80 bg-neutral-50/50 py-12 mt-auto text-sm text-neutral-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="flex items-center text-neutral-900">
              <AlongbyWordmark size="sm" />
            </div>
            <p className="mt-2 text-xs text-neutral-500 max-w-sm">
              Curated managed marketplace connecting clients with vetted digital and creative professionals.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs font-medium text-neutral-600">
            <Link to="/#how-it-works" className="hover:text-neutral-900 transition-colors">
              How It Works
            </Link>
            <Link to="/#principles" className="hover:text-neutral-900 transition-colors">
              Core Principles
            </Link>
            <span className="text-neutral-300">•</span>
            <span>Curated • Managed • Transparent</span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-neutral-200/60 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400">
          <p>© {new Date().getFullYear()} Alongby. All rights reserved.</p>
          <p className="mt-2 sm:mt-0">Phase 1 Foundation</p>
        </div>
      </div>
    </footer>
  );
};
