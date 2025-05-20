export {}
require("@testing-library/jest-dom");
import vitest_1 from 'vitest';
import react_1 from '@testing-library/react';
(0, vitest_1.afterEach)(() => {
    (0, react_1.cleanup)();
});
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
const mockIntersectionObserver = vitest_1.vi.fn();
mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;
export {};
//# sourceMappingURL=setup.js.map