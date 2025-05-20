import { vol } from 'memfs';

// Clear memfs volume before each test
beforeEach(() => {
  vol.reset();
});

// Mock resource monitoring functions
const mockMemoryUsage = {
  heapUsed: 0,
  heapTotal: 0,
  external: 0,
  arrayBuffers: 0,
  rss: 0 // Added missing rss property
};

process.memoryUsage = jest.fn(() => ({
  ...mockMemoryUsage,
  heapUsed: Math.floor(Math.random() * 1024 * 1024) // Simulate varying memory usage
}));

// Set up console capture for sandbox tests
const originalConsole = { ...console };
beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.log = originalConsole.log;
  console.error = originalConsole.error;
  console.warn = originalConsole.warn;
});