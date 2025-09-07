#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load design tokens
const tokensPath = path.join(__dirname, '../../../design-tokens.json');
const tokens = JSON.parse(fs.readFileSync(tokensPath, 'utf8'));

// Helper function to resolve token references
function resolveTokenValue(value, tokens) {
  if (typeof value !== 'string') return value;
  
  const referenceRegex = /\{([^}]+)\}/g;
  return value.replace(referenceRegex, (match, path) => {
    const pathParts = path.split('.');
    let resolved = tokens;
    
    for (const part of pathParts) {
      if (resolved && resolved[part] !== undefined) {
        resolved = resolved[part];
      } else {
        console.warn(`Warning: Could not resolve token reference: ${path}`);
        return match;
      }
    }
    
    return resolveTokenValue(resolved, tokens);
  });
}

// Generate CSS custom properties for a theme
function generateThemeVariables(semantic, mode) {
  let css = '';
  
  function processObject(obj, prefix = '') {
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'object' && value !== null) {
        processObject(value, prefix ? `${prefix}-${key}` : key);
      } else {
        const cssVar = `--xp-${prefix ? `${prefix}-${key}` : key}`.replace(/\//g, '-');
        const resolvedValue = resolveTokenValue(value, tokens);
        css += `  ${cssVar}: ${resolvedValue};\n`;
      }
    }
  }
  
  processObject(semantic);
  return css;
}

// Generate base variables (non-theme specific)
function generateBaseVariables() {
  let css = '';
  
  // Typography
  css += `  /* Typography */\n`;
  css += `  --xp-font-family-base: ${tokens.typography.fontFamily.base};\n`;
  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    css += `  --xp-font-weight-${key}: ${value};\n`;
  });
  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    css += `  --xp-line-height-${key}: ${value};\n`;
  });
  Object.entries(tokens.typography.size).forEach(([key, value]) => {
    css += `  --xp-font-size-${key}: ${value};\n`;
  });
  Object.entries(tokens.typography.letterSpacing).forEach(([key, value]) => {
    css += `  --xp-letter-spacing-${key}: ${value};\n`;
  });
  
  // Spacing
  css += `\n  /* Spacing */\n`;
  Object.entries(tokens.spacing.scale).forEach(([key, value]) => {
    css += `  --xp-spacing-${key}: ${value}px;\n`;
  });
  
  // Radius
  css += `\n  /* Border Radius */\n`;
  Object.entries(tokens.radius).forEach(([key, value]) => {
    css += `  --xp-radius-${key}: ${value}px;\n`;
  });
  
  // Opacity
  css += `\n  /* Opacity */\n`;
  Object.entries(tokens.opacity).forEach(([key, value]) => {
    css += `  --xp-opacity-${key}: ${value};\n`;
  });
  
  // Z-Index
  css += `\n  /* Z-Index */\n`;
  Object.entries(tokens.zIndex).forEach(([key, value]) => {
    css += `  --xp-z-index-${key}: ${value};\n`;
  });
  
  // Motion
  css += `\n  /* Motion */\n`;
  Object.entries(tokens.motion.duration).forEach(([key, value]) => {
    css += `  --xp-duration-${key}: ${value};\n`;
  });
  Object.entries(tokens.motion.easing).forEach(([key, value]) => {
    css += `  --xp-easing-${key}: ${value};\n`;
  });
  
  // Component tokens
  css += `\n  /* Component Sizes */\n`;
  Object.entries(tokens.component).forEach(([component, values]) => {
    Object.entries(values).forEach(([prop, value]) => {
      if (typeof value === 'object') {
        Object.entries(value).forEach(([subKey, subValue]) => {
          const resolvedValue = resolveTokenValue(subValue, tokens);
          css += `  --xp-${component}-${prop}-${subKey}: ${resolvedValue};\n`;
        });
      } else {
        const resolvedValue = resolveTokenValue(value, tokens);
        const unit = typeof resolvedValue === 'number' ? 'px' : '';
        css += `  --xp-${component}-${prop}: ${resolvedValue}${unit};\n`;
      }
    });
  });
  
  // Charts
  css += `\n  /* Charts */\n`;
  tokens.charts.palette.forEach((color, index) => {
    css += `  --xp-chart-palette-${index + 1}: ${color};\n`;
  });
  css += `  --xp-chart-grid-opacity: ${tokens.charts.grid.opacity};\n`;
  css += `  --xp-chart-axis-label-size: ${tokens.charts.axis.labelSize}px;\n`;
  css += `  --xp-chart-axis-tick-size: ${tokens.charts.axis.tickSize}px;\n`;
  css += `  --xp-chart-axis-line-opacity: ${tokens.charts.axis.lineOpacity};\n`;
  css += `  --xp-chart-tooltip-bg: ${tokens.charts.tooltip.bg};\n`;
  css += `  --xp-chart-tooltip-text: ${tokens.charts.tooltip.text};\n`;
  css += `  --xp-chart-tooltip-radius: ${tokens.charts.tooltip.radius}px;\n`;
  
  // A11y
  css += `\n  /* Accessibility */\n`;
  css += `  --xp-focus-ring-width: ${tokens.a11y.focusRingWidth}px;\n`;
  css += `  --xp-focus-ring-offset: ${tokens.a11y.focusRingOffset}px;\n`;
  css += `  --xp-min-touch-target: ${tokens.a11y.minTouchTarget}px;\n`;
  
  return css;
}

// Generate palette colors
function generatePaletteColors() {
  let css = `  /* Color Palette */\n`;
  
  Object.entries(tokens.color.palette).forEach(([colorName, shades]) => {
    Object.entries(shades).forEach(([shade, value]) => {
      css += `  --xp-color-${colorName}-${shade}: ${value};\n`;
    });
  });
  
  return css;
}

// Generate light theme CSS
function generateLightTheme() {
  const baseVars = generateBaseVariables();
  const paletteVars = generatePaletteColors();
  const themeVars = generateThemeVariables(tokens.color.semantic.light);
  const elevationVars = Object.entries(tokens.elevation.light)
    .map(([key, value]) => `  --xp-elevation-${key}: ${value};`)
    .join('\n');
  
  return `:root {
${baseVars}
${paletteVars}
${themeVars}
  /* Elevation - Light */
${elevationVars}
}`;
}

// Generate dark theme CSS  
function generateDarkTheme() {
  const themeVars = generateThemeVariables(tokens.color.semantic.dark);
  const elevationVars = Object.entries(tokens.elevation.dark)
    .map(([key, value]) => `  --xp-elevation-${key}: ${value};`)
    .join('\n');
  
  return `[data-theme="dark"] {
${themeVars}
  /* Elevation - Dark */
${elevationVars}
}`;
}

// Generate utility classes
function generateUtilityCSS() {
  return `
/* Utility Classes */
.xp-font-base { font-family: var(--xp-font-family-base); }
.xp-font-regular { font-weight: var(--xp-font-weight-regular); }
.xp-font-medium { font-weight: var(--xp-font-weight-medium); }
.xp-font-semibold { font-weight: var(--xp-font-weight-semibold); }
.xp-font-bold { font-weight: var(--xp-font-weight-bold); }

.xp-text-h1 { font-size: var(--xp-font-size-h1); }
.xp-text-h2 { font-size: var(--xp-font-size-h2); }
.xp-text-h3 { font-size: var(--xp-font-size-h3); }
.xp-text-body { font-size: var(--xp-font-size-body); }
.xp-text-body-lg { font-size: var(--xp-font-size-bodyLg); }
.xp-text-caption { font-size: var(--xp-font-size-caption); }

.xp-bg-page { background-color: var(--xp-bg-page); }
.xp-bg-card { background-color: var(--xp-bg-card); }
.xp-bg-elevated { background-color: var(--xp-bg-elevated); }

.xp-text-primary { color: var(--xp-text-primary); }
.xp-text-secondary { color: var(--xp-text-secondary); }
.xp-text-muted { color: var(--xp-text-muted); }

.xp-border-default { border-color: var(--xp-border-default); }

.xp-focus-ring {
  outline: var(--xp-focus-ring-width) solid var(--xp-focus-ring);
  outline-offset: var(--xp-focus-ring-offset);
}

/* Reduced motion support */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;
}

// Write files
function writeTokenFiles() {
  const cssDir = path.join(__dirname, '../css');
  
  // Ensure directory exists
  if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
  }
  
  // Generate and write light theme
  const lightCSS = generateLightTheme() + generateUtilityCSS();
  fs.writeFileSync(path.join(cssDir, 'xp-tokens.css'), lightCSS);
  console.log('✅ Generated xp-tokens.css (light theme)');
  
  // Generate and write dark theme
  const darkCSS = generateDarkTheme();
  fs.writeFileSync(path.join(cssDir, 'xp-tokens.dark.css'), darkCSS);
  console.log('✅ Generated xp-tokens.dark.css (dark theme)');
  
  // Write JS tokens for runtime access
  const jsDir = path.join(__dirname, '../js');
  if (!fs.existsSync(jsDir)) {
    fs.mkdirSync(jsDir, { recursive: true });
  }
  
  const jsTokens = `export const designTokens = ${JSON.stringify(tokens, null, 2)};

export function getTokenValue(path) {
  const pathParts = path.split('.');
  let value = designTokens;
  
  for (const part of pathParts) {
    if (value && value[part] !== undefined) {
      value = value[part];
    } else {
      console.warn(\`Token not found: \${path}\`);
      return null;
    }
  }
  
  return value;
}

export function getCSSVariable(tokenPath) {
  const cssVar = '--xp-' + tokenPath.replace(/[./]/g, '-');
  return \`var(\${cssVar})\`;
}
`;
  
  fs.writeFileSync(path.join(jsDir, 'tokens.js'), jsTokens);
  console.log('✅ Generated tokens.js (JavaScript access)');
}

// Validation
function validateTokens() {
  console.log('🔍 Validating design tokens...');
  
  const requiredPaths = [
    'color.semantic.light',
    'color.semantic.dark', 
    'typography.fontFamily.base',
    'spacing.scale',
    'radius',
    'motion.duration',
    'component.button'
  ];
  
  const errors = [];
  
  requiredPaths.forEach(path => {
    const pathParts = path.split('.');
    let value = tokens;
    
    for (const part of pathParts) {
      if (value && value[part] !== undefined) {
        value = value[part];
      } else {
        errors.push(`Required token path missing: ${path}`);
        break;
      }
    }
  });
  
  if (errors.length > 0) {
    console.error('❌ Token validation failed:');
    errors.forEach(error => console.error(`  ${error}`));
    process.exit(1);
  }
  
  console.log('✅ Token validation passed');
}

// Main execution
function main() {
  try {
    console.log('🎨 Generating Xpress Ops design tokens...');
    validateTokens();
    writeTokenFiles();
    console.log('🎉 Design tokens generated successfully!');
  } catch (error) {
    console.error('❌ Failed to generate tokens:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main, validateTokens };