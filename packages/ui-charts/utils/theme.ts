/**
 * Chart theme utilities that read CSS variables at runtime
 * This ensures charts respect the current theme (light/dark) and design tokens
 */

// Cache for CSS variables to avoid repeated DOM queries
const cssVariableCache = new Map<string, string>();

/**
 * Reads a CSS variable value from the document
 */
function getCSSVariable(variableName: string): string {
  if (cssVariableCache.has(variableName)) {
    return cssVariableCache.get(variableName)!;
  }

  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(variableName)
    .trim();

  cssVariableCache.set(variableName, value);
  return value;
}

/**
 * Clears the CSS variable cache - useful when theme changes
 */
export function clearThemeCache(): void {
  cssVariableCache.clear();
}

/**
 * Gets the chart color palette from CSS variables
 */
export function getChartPalette(): string[] {
  return [
    getCSSVariable('--xp-chart-palette-1'),
    getCSSVariable('--xp-chart-palette-2'),
    getCSSVariable('--xp-chart-palette-3'),
    getCSSVariable('--xp-chart-palette-4'),
    getCSSVariable('--xp-chart-palette-5'),
    getCSSVariable('--xp-chart-palette-6'),
    getCSSVariable('--xp-chart-palette-7'),
    getCSSVariable('--xp-chart-palette-8'),
  ].filter(Boolean);
}

/**
 * Gets chart grid configuration from design tokens
 */
export function getGridConfig() {
  return {
    strokeDasharray: '3 3',
    stroke: getCSSVariable('--xp-border-default'),
    strokeOpacity: getCSSVariable('--xp-chart-grid-opacity'),
  };
}

/**
 * Gets chart axis configuration from design tokens
 */
export function getAxisConfig() {
  return {
    tick: {
      fontSize: getCSSVariable('--xp-chart-axis-tick-size'),
      fill: getCSSVariable('--xp-text-muted'),
    },
    axisLine: {
      stroke: getCSSVariable('--xp-border-default'),
      strokeOpacity: getCSSVariable('--xp-chart-axis-line-opacity'),
    },
    tickLine: {
      stroke: getCSSVariable('--xp-border-default'),
      strokeOpacity: getCSSVariable('--xp-chart-axis-line-opacity'),
    },
  };
}

/**
 * Gets chart tooltip configuration from design tokens
 */
export function getTooltipConfig() {
  return {
    contentStyle: {
      backgroundColor: getCSSVariable('--xp-chart-tooltip-bg'),
      color: getCSSVariable('--xp-chart-tooltip-text'),
      border: `1px solid ${getCSSVariable('--xp-border-default')}`,
      borderRadius: getCSSVariable('--xp-chart-tooltip-radius') + 'px',
      fontSize: getCSSVariable('--xp-font-size-caption'),
      boxShadow: getCSSVariable('--xp-elevation-2'),
    },
    labelStyle: {
      color: getCSSVariable('--xp-chart-tooltip-text'),
      marginBottom: '4px',
    },
  };
}

/**
 * Gets a color from the palette by index
 */
export function getColorByIndex(index: number): string {
  const palette = getChartPalette();
  return palette[index % palette.length];
}

/**
 * Gets semantic colors for charts
 */
export function getSemanticColors() {
  return {
    success: getCSSVariable('--xp-status-success'),
    warning: getCSSVariable('--xp-status-warning'),
    error: getCSSVariable('--xp-status-critical'),
    info: getCSSVariable('--xp-status-info'),
    primary: getCSSVariable('--xp-brand-primary'),
  };
}

/**
 * Checks if reduced motion is preferred
 */
export function shouldReduceMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Gets animation duration based on reduced motion preference
 */
export function getAnimationDuration(): number {
  return shouldReduceMotion() ? 0 : 300;
}

/**
 * Formats numbers for chart display using Philippine locale
 */
export function formatChartNumber(
  value: number,
  type: 'number' | 'currency' | 'percentage' = 'number'
): string {
  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(value);
    
    case 'percentage':
      return new Intl.NumberFormat('en-PH', {
        style: 'percent',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1,
      }).format(value / 100);
    
    default:
      if (value >= 1000000) {
        return new Intl.NumberFormat('en-PH', {
          notation: 'compact',
          compactDisplay: 'short',
        }).format(value);
      }
      return new Intl.NumberFormat('en-PH').format(value);
  }
}

/**
 * Formats dates for chart display in Philippine timezone
 */
export function formatChartDate(
  date: Date | string | number,
  format: 'time' | 'date' | 'datetime' | 'month' | 'year' = 'date'
): string {
  const dateObj = new Date(date);
  const options: Intl.DateTimeFormatOptions = {
    timeZone: 'Asia/Manila',
  };

  switch (format) {
    case 'time':
      options.timeStyle = 'short';
      break;
    case 'datetime':
      options.dateStyle = 'short';
      options.timeStyle = 'short';
      break;
    case 'month':
      options.month = 'short';
      break;
    case 'year':
      options.year = 'numeric';
      break;
    default:
      options.dateStyle = 'short';
  }

  return new Intl.DateTimeFormat('en-PH', options).format(dateObj);
}