const noRawColors = require('./rules/no-raw-colors');
const noRawSpacing = require('./rules/no-raw-spacing');
const noRawRadii = require('./rules/no-raw-radii');
const useTokenVariables = require('./rules/use-token-variables');

module.exports = {
  rules: {
    'no-raw-colors': noRawColors,
    'no-raw-spacing': noRawSpacing,
    'no-raw-radii': noRawRadii,
    'use-token-variables': useTokenVariables,
  },
  configs: {
    recommended: {
      plugins: ['@xpress-ops/xp-tokens'],
      rules: {
        '@xpress-ops/xp-tokens/no-raw-colors': 'error',
        '@xpress-ops/xp-tokens/no-raw-spacing': 'error',
        '@xpress-ops/xp-tokens/no-raw-radii': 'error',
        '@xpress-ops/xp-tokens/use-token-variables': 'warn',
      },
    },
    strict: {
      plugins: ['@xpress-ops/xp-tokens'],
      rules: {
        '@xpress-ops/xp-tokens/no-raw-colors': 'error',
        '@xpress-ops/xp-tokens/no-raw-spacing': 'error',
        '@xpress-ops/xp-tokens/no-raw-radii': 'error',
        '@xpress-ops/xp-tokens/use-token-variables': 'error',
      },
    },
  },
};