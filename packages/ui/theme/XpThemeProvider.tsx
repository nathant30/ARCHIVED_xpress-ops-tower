import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'auto';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

interface XpThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
  /** Apply theme to document.documentElement instead of a wrapper div */
  enableSystem?: boolean;
}

export function XpThemeProvider({
  children,
  defaultTheme = 'auto',
  storageKey = 'xp-theme',
  enableSystem = true,
}: XpThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme);
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>('light');

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem(storageKey) as Theme;
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      setThemeState(stored);
    }
  }, [storageKey]);

  // Update resolved theme when theme changes or system preference changes
  useEffect(() => {
    const updateResolvedTheme = () => {
      let resolved: ResolvedTheme = 'light';
      
      if (theme === 'auto' && enableSystem) {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      } else if (theme === 'dark') {
        resolved = 'dark';
      }
      
      setResolvedTheme(resolved);
    };

    updateResolvedTheme();

    if (theme === 'auto' && enableSystem) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', updateResolvedTheme);
      return () => mediaQuery.removeEventListener('change', updateResolvedTheme);
    }
  }, [theme, enableSystem]);

  // Apply theme to document element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', resolvedTheme);
    
    // Also set class for compatibility
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem(storageKey, newTheme);
  };

  const value: ThemeContextValue = {
    theme,
    resolvedTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within an XpThemeProvider');
  }
  return context;
}

// Theme toggle component
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  
  const handleToggle = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('auto');
    } else {
      setTheme('light');
    }
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return '☀️';
      case 'dark':
        return '🌙';
      default:
        return '🌓';
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light theme';
      case 'dark':
        return 'Dark theme';
      default:
        return 'Auto theme';
    }
  };

  return (
    <button
      onClick={handleToggle}
      className={className}
      aria-label={getLabel()}
      title={getLabel()}
      style={{
        background: 'var(--xp-bg-card)',
        border: '1px solid var(--xp-border-default)',
        borderRadius: 'var(--xp-radius-sm)',
        padding: 'var(--xp-spacing-2)',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 'var(--xp-min-touch-target)',
        minHeight: 'var(--xp-min-touch-target)',
      }}
    >
      {getIcon()}
    </button>
  );
}