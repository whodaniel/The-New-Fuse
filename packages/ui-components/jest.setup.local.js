/**
 * Jest setup for ui-components package
 */

// Import testing-library jest-dom matchers
import '@testing-library/jest-dom';

// Add custom matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received && document.body.contains(received);
    return {
      message: () =>
        pass
          ? `expected element not to be in the document`
          : `expected element to be in the document`,
      pass,
    };
  },
  toHaveClass(received, className) {
    const pass = received && received.classList && received.classList.contains(className);
    return {
      message: () =>
        pass
          ? `expected element not to have class "${className}"`
          : `expected element to have class "${className}"`,
      pass,
    };
  },
});

// Mock CSS modules
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(), // deprecated
    removeListener: jest.fn(), // deprecated
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};