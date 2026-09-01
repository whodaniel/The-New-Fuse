// Custom Jest resolver: when a relative/workspace import uses the `.js`
// extension (required by TS NodeNext source) but only a `.ts` file exists
// (because we compile from source), fall back to the `.ts` file. Real
// node_modules `.js` files resolve normally and are left untouched.

module.exports = (request, options) => {
  const defaultResolver = options.defaultResolver;

  try {
    return defaultResolver(request, options);
  } catch (err) {
    if (typeof request === 'string' && request.endsWith('.js')) {
      try {
        return defaultResolver(request.replace(/\.js$/, '.ts'), options);
      } catch {
        // fall through to original error
      }
    }
    throw err;
  }
};
