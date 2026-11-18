import React from 'react';

export interface TabItem {
  id: string;
  label: string;
  badge?: string | number;
}

export interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  onChange,
  className = '',
}) => {
  return (
    <div className={`border-b border-[var(--color-border)] mb-6 ${className}`}>
      <nav className="flex space-x-6 overflow-x-auto no-scrollbar" aria-label="Tabs">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={`pb-3 px-1 min-h-[40px] font-sans text-sm border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset rounded-t-sm ${
                isActive
                  ? 'border-[var(--color-primary)] text-[var(--color-text-primary)] font-semibold'
                  : 'border-transparent text-[var(--color-text-secondary)] font-medium hover:text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={`text-xs font-medium tabular-nums px-1.5 py-0.5 rounded-md leading-none ${
                    isActive
                      ? 'bg-[var(--color-primary)] text-[var(--color-primary-text)]'
                      : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border)]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
