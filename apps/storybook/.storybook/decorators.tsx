import React from 'react';
import type { Decorator } from '@storybook/react';
import { XpThemeProvider } from '@xpress-ops/ui';

export const withTheme: Decorator = (Story, context) => {
  const { theme, density, reducedMotion, rtl } = context.globals;

  React.useEffect(() => {
    const root = document.documentElement;
    
    // Apply theme
    root.setAttribute('data-theme', theme === 'auto' ? 
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
      theme
    );
    
    // Apply density
    root.setAttribute('data-density', density);
    
    // Apply reduced motion
    if (reducedMotion) {
      root.style.setProperty('--xp-duration-fast', '0.01ms');
      root.style.setProperty('--xp-duration-base', '0.01ms');
      root.style.setProperty('--xp-duration-slow', '0.01ms');
    } else {
      root.style.removeProperty('--xp-duration-fast');
      root.style.removeProperty('--xp-duration-base');
      root.style.removeProperty('--xp-duration-slow');
    }
    
    // Apply RTL
    root.setAttribute('dir', rtl ? 'rtl' : 'ltr');
  }, [theme, density, reducedMotion, rtl]);

  return (
    <XpThemeProvider defaultTheme={theme}>
      <div className="xp-bg-page xp-text-primary" style={{ 
        minHeight: '100vh',
        padding: '20px',
        fontFamily: 'var(--xp-font-family-base)',
      }}>
        <Story />
      </div>
    </XpThemeProvider>
  );
};

export const withPadding: Decorator = (Story) => (
  <div style={{ padding: '20px' }}>
    <Story />
  </div>
);