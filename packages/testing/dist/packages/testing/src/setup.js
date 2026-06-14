"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const memfs_1 = require("memfs");
// Clear memfs volume before each test
beforeEach(() => {
    memfs_1.vol.reset();
});
// Mock resource monitoring functions
const mockMemoryUsage = {
    heapUsed: 0,
    heapTotal: 0,
    external: 0,
    arrayBuffers: 0,
    rss: 0 // Ensure this line exists and is correct
};
process.memoryUsage = jest.fn(() => ({
    heapUsed: Math.floor(Math.random() * 1024 * 1024), // Simulate varying memory usage
    heapTotal: Math.floor(Math.random() * 2048 * 1024),
    external: Math.floor(Math.random() * 512 * 1024),
    arrayBuffers: Math.floor(Math.random() * 256 * 1024),
    rss: Math.floor(Math.random() * 4096 * 1024)
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
//# sourceMappingURL=setup.js.map