/**
 * SVG transformer for Jest
 * Converts SVG imports to a simple module that returns the filename
 */

module.exports = {
  process(src, filename) {
    return {
      code: `module.exports = ${JSON.stringify(filename)};`
    };
  }
};
