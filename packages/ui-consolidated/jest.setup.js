// Mock ResizeObserver
var ResizeObserver = /** @class */ (function () {
    function ResizeObserver(callback) {
        this.callback = callback;
    }
    ResizeObserver.prototype.observe = function () { };
    ResizeObserver.prototype.unobserve = function () { };
    ResizeObserver.prototype.disconnect = function () { };
    return ResizeObserver;
}());
global.ResizeObserver = ResizeObserver;

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation(function (query) {
        return {
            matches: false,
            media: query,
            onchange: null,
            addListener: jest.fn(), // Deprecated
            removeListener: jest.fn(), // Deprecated
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
        };
    }),
});

// Mock IntersectionObserver
var IntersectionObserver = /** @class */ (function () {
    function IntersectionObserver(callback) {
        this.callback = callback;
    }
    IntersectionObserver.prototype.observe = function () { };
    IntersectionObserver.prototype.unobserve = function () { };
    IntersectionObserver.prototype.disconnect = function () { };
    return IntersectionObserver;
}());
global.IntersectionObserver = IntersectionObserver;