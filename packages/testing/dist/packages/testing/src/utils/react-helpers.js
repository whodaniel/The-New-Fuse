"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderWithProviders = renderWithProviders;
exports.waitForLoadingToFinish = waitForLoadingToFinish;
exports.mockIntersectionObserver = mockIntersectionObserver;
exports.mockResizeObserver = mockResizeObserver;
exports.mockMatchMedia = mockMatchMedia;
exports.createMockFile = createMockFile;
exports.uploadFile = uploadFile;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
const user_event_1 = __importDefault(require("@testing-library/user-event"));
/**
 * Render with all providers
 */
function renderWithProviders(ui, options = {}) {
    const { initialState, route = '/', ...renderOptions } = options;
    // Set up user event
    const user = user_event_1.default.setup();
    // Update window location if route is provided
    if (route !== '/') {
        window.history.pushState({}, 'Test page', route);
    }
    // Wrapper component with all providers
    function Wrapper({ children }) {
        // Add your providers here, for example:
        // return (
        //   <Provider store={createTestStore(initialState)}>
        //     <BrowserRouter>
        //       <ThemeProvider>
        //         {children}
        //       </ThemeProvider>
        //     </BrowserRouter>
        //   </Provider>
        // );
        return (0, jsx_runtime_1.jsx)(jsx_runtime_1.Fragment, { children: children });
    }
    return {
        ...(0, react_1.render)(ui, { wrapper: Wrapper, ...renderOptions }),
        user,
    };
}
/**
 * Wait for loading to complete
 */
async function waitForLoadingToFinish() {
    const { waitForElementToBeRemoved, queryByText } = await import('@testing-library/react');
    const loading = queryByText(document.body, /loading/i);
    if (loading) {
        await waitForElementToBeRemoved(loading, { timeout: 5000 });
    }
}
/**
 * Mock IntersectionObserver
 */
function mockIntersectionObserver() {
    global.IntersectionObserver = class IntersectionObserver {
        constructor() { }
        disconnect() { }
        observe() { }
        takeRecords() {
            return [];
        }
        unobserve() { }
    };
}
/**
 * Mock ResizeObserver
 */
function mockResizeObserver() {
    global.ResizeObserver = class ResizeObserver {
        constructor() { }
        disconnect() { }
        observe() { }
        unobserve() { }
    };
}
/**
 * Mock matchMedia
 */
function mockMatchMedia(matches = false) {
    Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation((query) => ({
            matches,
            media: query,
            onchange: null,
            addListener: jest.fn(),
            removeListener: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        })),
    });
}
/**
 * Create a mock file for file input testing
 */
function createMockFile(name, size, type, lastModified) {
    const blob = new Blob(['a'.repeat(size)], { type });
    const file = new File([blob], name, { type, lastModified: lastModified || Date.now() });
    return file;
}
/**
 * Trigger file input change
 */
async function uploadFile(input, file) {
    const files = Array.isArray(file) ? file : [file];
    Object.defineProperty(input, 'files', {
        value: files,
        writable: false,
    });
    const { fireEvent } = await import('@testing-library/react');
    fireEvent.change(input);
}
//# sourceMappingURL=react-helpers.js.map