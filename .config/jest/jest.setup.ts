import '@testing-library/jest-dom';

// Set up global test environment
process.env.NODE_ENV = 'test';

// Add any global test setup here
global.console = {
  ...console,
  // Ignore console.log in tests
  log: jest.fn(),
  // Keep error and warn for debugging
  error: console.error,
  warn: console.warn,
};

// Add custom matchers if needed
expect.extend({
  // Add custom matchers here if required
});