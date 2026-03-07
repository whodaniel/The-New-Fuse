/**
 * SVG transformer for Jest tests
 * This transforms SVG imports into a React component
 */

module.exports = {
  process() {
    return {
      code: `
        const React = require('react');
        module.exports = {
          __esModule: true,
          default: props => React.createElement('svg', {
            ...props,
            'data-testid': 'svg-mock',
          }),
        };
      `,
    };
  },
  getCacheKey() {
    return 'svgTransformer';
  },
};
