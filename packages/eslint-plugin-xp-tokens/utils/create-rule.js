/**
 * Creates an ESLint rule with TypeScript-style configuration
 */
function createRule(config) {
  return {
    meta: {
      ...config.meta,
      docs: {
        ...config.meta.docs,
        category: 'Best Practices',
      },
    },
    create(context) {
      const options = context.options || config.defaultOptions || [];
      return config.create(context, options);
    },
  };
}

module.exports = { createRule };