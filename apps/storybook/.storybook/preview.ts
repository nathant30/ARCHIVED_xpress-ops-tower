import type { Preview } from '@storybook/react';
import '../../../packages/ui-tokens/css/xp-tokens.css';
import '../../../packages/ui-tokens/css/xp-tokens.dark.css';

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    docs: {
      toc: true,
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: 'var(--xp-bg-page)',
        },
        {
          name: 'dark',
          value: 'var(--xp-bg-page)',
        },
      ],
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '720px',
          },
        },
      },
    },
  },
  globalTypes: {
    theme: {
      description: 'Theme',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', left: '☀️' },
          { value: 'dark', title: 'Dark', left: '🌙' },
          { value: 'auto', title: 'Auto', left: '🌓' },
        ],
        dynamicTitle: true,
      },
    },
    density: {
      description: 'Component density',
      defaultValue: 'comfortable',
      toolbar: {
        title: 'Density',
        icon: 'component',
        items: [
          { value: 'compact', title: 'Compact' },
          { value: 'comfortable', title: 'Comfortable' },
        ],
        dynamicTitle: true,
      },
    },
    reducedMotion: {
      description: 'Reduced motion',
      defaultValue: false,
      toolbar: {
        title: 'Reduced Motion',
        icon: 'timer',
        items: [
          { value: false, title: 'Normal Motion' },
          { value: true, title: 'Reduced Motion' },
        ],
        dynamicTitle: true,
      },
    },
    rtl: {
      description: 'Right-to-left text direction',
      defaultValue: false,
      toolbar: {
        title: 'RTL',
        icon: 'transfer',
        items: [
          { value: false, title: 'LTR' },
          { value: true, title: 'RTL' },
        ],
        dynamicTitle: true,
      },
    },
  },
};

export default preview;