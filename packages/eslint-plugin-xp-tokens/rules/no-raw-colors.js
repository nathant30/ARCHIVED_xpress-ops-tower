const { createRule } = require('../utils/create-rule');

// Color patterns to detect
const COLOR_PATTERNS = [
  // Hex colors
  /#[0-9a-fA-F]{3,8}\b/g,
  // RGB/RGBA
  /rgba?\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+)?\s*\)/g,
  // HSL/HSLA
  /hsla?\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*(?:,\s*[\d.]+)?\s*\)/g,
];

// Named colors to avoid (common ones that should use tokens)
const NAMED_COLORS = [
  'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'cyan',
  'white', 'black', 'gray', 'grey',
];

// Token mapping suggestions
const COLOR_TOKEN_SUGGESTIONS = {
  '#ffffff': 'var(--xp-bg-card)',
  '#000000': 'var(--xp-text-primary)',
  'white': 'var(--xp-bg-card)',
  'black': 'var(--xp-text-primary)',
  'red': 'var(--xp-status-critical)',
  'green': 'var(--xp-status-success)',
  'yellow': 'var(--xp-status-warning)',
  'blue': 'var(--xp-status-info)',
};

function findTokenSuggestion(colorValue) {
  const lower = colorValue.toLowerCase();
  return COLOR_TOKEN_SUGGESTIONS[lower] || 'var(--xp-*)';
}

module.exports = createRule({
  name: 'no-raw-colors',
  meta: {
    type: 'problem',
    docs: {
      description: 'Disallow raw color values in favor of design tokens',
      recommended: true,
    },
    fixable: 'code',
    schema: [
      {
        type: 'object',
        properties: {
          allowedColors: {
            type: 'array',
            items: { type: 'string' },
            description: 'List of allowed raw color values',
          },
          ignoredProperties: {
            type: 'array',
            items: { type: 'string' },
            description: 'CSS properties to ignore',
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      noRawColor: 'Raw color "{{color}}" detected. Use design token instead: {{suggestion}}',
    },
  },
  defaultOptions: [
    {
      allowedColors: ['transparent', 'inherit', 'currentColor'],
      ignoredProperties: [],
    },
  ],
  create(context, options) {
    const { allowedColors = [], ignoredProperties = [] } = options[0] || {};
    
    function checkForRawColors(node, value) {
      if (!value || typeof value !== 'string') return;
      
      // Skip if it's already using a CSS variable
      if (value.includes('var(--')) return;
      
      // Skip allowed colors
      if (allowedColors.includes(value.toLowerCase())) return;
      
      // Check for hex colors
      const hexMatches = value.match(COLOR_PATTERNS[0]);
      if (hexMatches) {
        hexMatches.forEach(color => {
          if (!allowedColors.includes(color.toLowerCase())) {
            context.report({
              node,
              messageId: 'noRawColor',
              data: {
                color,
                suggestion: findTokenSuggestion(color),
              },
              fix(fixer) {
                const suggestion = findTokenSuggestion(color);
                if (suggestion !== 'var(--xp-*)') {
                  return fixer.replaceText(node, value.replace(color, suggestion));
                }
                return null;
              },
            });
          }
        });
      }
      
      // Check for RGB/HSL colors
      const rgbHslMatches = [
        ...value.match(COLOR_PATTERNS[1]) || [],
        ...value.match(COLOR_PATTERNS[2]) || [],
      ];
      
      rgbHslMatches.forEach(color => {
        context.report({
          node,
          messageId: 'noRawColor',
          data: {
            color,
            suggestion: 'var(--xp-*)',
          },
        });
      });
      
      // Check for named colors
      const words = value.split(/\s+/);
      words.forEach(word => {
        if (NAMED_COLORS.includes(word.toLowerCase())) {
          context.report({
            node,
            messageId: 'noRawColor',
            data: {
              color: word,
              suggestion: findTokenSuggestion(word),
            },
            fix(fixer) {
              const suggestion = findTokenSuggestion(word);
              if (suggestion !== 'var(--xp-*)') {
                return fixer.replaceText(node, value.replace(word, suggestion));
              }
              return null;
            },
          });
        }
      });
    }
    
    return {
      // JSX style attribute
      JSXAttribute(node) {
        if (node.name.name === 'style' && node.value?.expression?.properties) {
          node.value.expression.properties.forEach(prop => {
            if (prop.type === 'Property' && !ignoredProperties.includes(prop.key.name)) {
              const value = prop.value?.value || prop.value?.raw;
              checkForRawColors(prop.value, value);
            }
          });
        }
      },
      
      // Template literals (styled-components, emotion, etc.)
      TemplateLiteral(node) {
        node.quasis.forEach(quasi => {
          checkForRawColors(quasi, quasi.value.cooked);
        });
      },
      
      // String literals
      Literal(node) {
        if (typeof node.value === 'string') {
          // Check if this looks like CSS
          if (node.value.includes(':') || node.value.includes('px') || node.value.includes('#')) {
            checkForRawColors(node, node.value);
          }
        }
      },
    };
  },
});