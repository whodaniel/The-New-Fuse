/**
 * Frontend Test Setup
 *
 * Setup file for frontend tests with Vitest
 */
import { afterEach, vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
// Custom matchers
expect.extend({
    toHaveVariant: function (received, variant) {
        var hasVariant = received.className.includes(variant);
        return {
            message: function () { return "expected ".concat(received.className, " ").concat(hasVariant ? 'not ' : '', "to have variant ").concat(variant); },
            pass: hasVariant,
        };
    },
});
// Cleanup after each test
afterEach(function () {
    cleanup();
    vi.clearAllMocks();
});
// Mock environment variables
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('VITE_API_URL', 'http://localhost:3001');
// Mock IntersectionObserver
var mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
    observe: function () { return null; },
    unobserve: function () { return null; },
    disconnect: function () { return null; },
});
window.IntersectionObserver = mockIntersectionObserver;
// Mock ResizeObserver
window.ResizeObserver = vi.fn().mockImplementation(function () { return ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}); });
// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(function (query) { return ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    }); }),
});
// Mock fetch
global.fetch = vi.fn();
