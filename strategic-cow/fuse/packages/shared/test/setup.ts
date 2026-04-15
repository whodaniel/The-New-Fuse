// Jest setup file for shared package
import '@testing-library/jest-dom';

// Reset mocks between tests
beforeEach(() => {
  jest.resetAllMocks();
});

// Clean up after tests
afterEach(() => {
  // Add any cleanup code here
});

// Global mocks and setup
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock console methods if needed
// global.console = {
//   ...console,
//   error: jest.fn(),
//   warn: jest.fn(),
//   log: jest.fn(),
// };
