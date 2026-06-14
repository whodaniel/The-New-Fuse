"use strict";
/**
 * Global Vitest Setup
 *
 * This file is automatically loaded before running tests.
 * Use it to configure global test behavior and utilities.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
require("@testing-library/jest-dom/vitest");
// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error';
// Suppress console output in tests (comment out if you need to debug)
global.console = {
    ...console,
    log: vitest_1.vi.fn(),
    debug: vitest_1.vi.fn(),
    info: vitest_1.vi.fn(),
    warn: vitest_1.vi.fn(),
    // Keep error for important messages
    // error: vi.fn(),
};
// Mock fetch globally
global.fetch = vitest_1.vi.fn();
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vitest_1.vi.fn().mockImplementation((query) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vitest_1.vi.fn(),
        removeListener: vitest_1.vi.fn(),
        addEventListener: vitest_1.vi.fn(),
        removeEventListener: vitest_1.vi.fn(),
        dispatchEvent: vitest_1.vi.fn(),
    })),
});
// Mock IntersectionObserver
global.IntersectionObserver = class IntersectionObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    takeRecords() {
        return [];
    }
    unobserve() { }
};
// Mock ResizeObserver
global.ResizeObserver = class ResizeObserver {
    constructor() { }
    disconnect() { }
    observe() { }
    unobserve() { }
};
// Clean up after each test
(0, vitest_1.afterEach)(() => {
    vitest_1.vi.clearAllMocks();
});
//# sourceMappingURL=vitest-setup.js.map