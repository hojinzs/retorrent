import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: 'dark' | 'light' | 'system';
  storageKey?: string;
};

type Theme = 'dark' | 'light' | 'system';

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

function applyMetaThemeColor() {
  const doc = window.document;
  const root = doc.documentElement;
  // Read current background color from CSS variable which changes with .light/.dark
  const bg = getComputedStyle(root).getPropertyValue('--background').trim();
  if (!bg) return;
  let meta = doc.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = doc.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    doc.head.appendChild(meta);
  }
  meta.setAttribute('content', bg);
}

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;
    const mql = window.matchMedia('(prefers-color-scheme: dark)');

    const setClassAndMeta = (t: Exclude<Theme, 'system'>) => {
      root.classList.remove('light', 'dark');
      root.classList.add(t);
      // Update theme-color based on the applied class and CSS variable
      applyMetaThemeColor();
    };

    if (theme === 'system') {
      const effective: Exclude<Theme, 'system'> = mql.matches ? 'dark' : 'light';
      setClassAndMeta(effective);

      const handleChange = (e: MediaQueryListEvent) => {
        setClassAndMeta(e.matches ? 'dark' : 'light');
      };
      // Listen for system theme changes while in system mode
      mql.addEventListener?.('change', handleChange);
      return () => {
        mql.removeEventListener?.('change', handleChange);
      };
    } else {
      setClassAndMeta(theme);
    }
  }, [theme]);

  const value = useMemo(
    () => ({
      theme,
      setTheme: (next: Theme) => {
        localStorage.setItem(storageKey, next);
        setTheme(next);
      },
    }),
    [theme, storageKey]
  );

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }

  return context;
};