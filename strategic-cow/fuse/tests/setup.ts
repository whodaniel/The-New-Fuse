// Jest setup file

// Set up global test environment
import 'reflect-metadata';

// Increase timeout for all tests
jest.setTimeout(30000);

// Use real console for testing
// This ensures we're testing with actual console methods
// If needed, you can still configure console output levels through other means

// Reset mocks automatically between tests
beforeEach(() => {
  jest.resetAllMocks();
});

// Clean up after all tests
afterAll(() => {
  // Add any global cleanup here if needed
});