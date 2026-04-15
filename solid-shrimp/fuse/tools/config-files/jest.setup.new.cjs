/**
 * Global Jest setup file
 * This file runs before each test file
 */

// Configure Jest environment
jest.setTimeout(30000); // 30 second timeout

// Mock process.env
process.env.NODE_ENV = 'test';

// Set up testing library jest-dom matchers
require('@testing-library/jest-dom');

// Mock common browser APIs that might not be available in test environment
if (typeof window !== 'undefined') {
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
}

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock requestAnimationFrame
global.requestAnimationFrame = jest.fn(cb => setTimeout(cb, 16));
global.cancelAnimationFrame = jest.fn(clearTimeout);

// Mock console methods to prevent noise in test output (optional)
const originalConsole = { ...console };
global.console = {
  ...console,
  log: process.env.DEBUG_TESTS ? originalConsole.log : jest.fn(),
  error: originalConsole.error, // Keep errors visible
  warn: process.env.DEBUG_TESTS ? originalConsole.warn : jest.fn(),
  info: process.env.DEBUG_TESTS ? originalConsole.info : jest.fn()
};

// Mock fetch for API tests
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
  })
);

// Add global helper for test artifacts
const fs = require('fs');
const path = require('path');

global.saveArtifact = (name, content, type = 'other') => {
  const artifactsDir = path.join(process.cwd(), 'test-artifacts');
  if (!fs.existsSync(artifactsDir)) {
    fs.mkdirSync(artifactsDir, { recursive: true });
  }
  
  const typeDir = path.join(artifactsDir, type);
  if (!fs.existsSync(typeDir)) {
    fs.mkdirSync(typeDir, { recursive: true });
  }
  
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const fileName = `${name}-${timestamp}`;
  const filePath = path.join(typeDir, fileName);
  
  fs.writeFileSync(filePath, content);
  return filePath;
};
