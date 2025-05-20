import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
expect.extend({
    toHaveVariant(received, variant) {
        const hasVariant = received.className.includes(variant);
        return {
            message: () => `expected ${received.className} ${hasVariant ? 'not ' : ''}to have variant ${variant}`,
            pass: hasVariant,
        };
    },
});
afterEach(() => {
    cleanup();
});
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;
window.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});
//# sourceMappingURL=setup.js.map