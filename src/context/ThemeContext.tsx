import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: ThemePreference;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const STORAGE_KEY = 'alongby-theme';
const SYSTEM_QUERY = '(prefers-color-scheme: dark)';

function readTheme(): ThemePreference {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
  } catch {
    // Storage can be blocked in private or embedded contexts.
  }
  return 'system';
}

function readSystemTheme(): ResolvedTheme {
  return window.matchMedia?.(SYSTEM_QUERY).matches ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setPreference] = useState<ThemePreference>(readTheme);
  const [systemTheme, setSystemTheme] = useState<ResolvedTheme>(readSystemTheme);
  const resolvedTheme = theme === 'system' ? systemTheme : theme;

  useEffect(() => {
    const media = window.matchMedia?.(SYSTEM_QUERY);
    if (!media) return;

    const onChange = () => setSystemTheme(media.matches ? 'dark' : 'light');
    onChange();

    if (typeof media.addEventListener === 'function') {
      media.addEventListener('change', onChange);
      return () => media.removeEventListener('change', onChange);
    }
    // Older Safari versions use the legacy MediaQueryList listener API.
    media.addListener(onChange);
    return () => media.removeListener(onChange);
  }, []);

  // Keep appearance consistent when the user changes it in another tab.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY || event.key === null) {
        setPreference(readTheme());
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.style.colorScheme = resolvedTheme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute(
      'content',
      resolvedTheme === 'dark' ? '#141414' : '#F8F7F5'
    );
  }, [resolvedTheme]);

  const setTheme = (nextTheme: ThemePreference) => {
    setPreference(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // Keep the in-memory preference when persistence is unavailable.
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useTheme must be used inside ThemeProvider');
  return value;
}
