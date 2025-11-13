"use strict";
/**
 * Test Setup for Advanced MCP Capabilities
 *
 * This file configures the global test environment, sets up mocks,
 * and provides common utilities for all test suites.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.testUtils = void 0;
// Global test configuration
const GLOBAL_TEST_TIMEOUT = 30000;
const MOCK_DELAY_MS = 100;
// Mock Jest functions for environments without Jest
const mockJest = {
    fn: (implementation) => implementation || (() => { }),
    setTimeout: (timeout) => { },
    clearAllMocks: () => { },
    clearAllTimers: () => { },
    runOnlyPendingTimers: () => { },
    useRealTimers: () => { }
};
// Create a mock function factory
const createMockFn = (returnValue) => {
    const fn = jest.fn();
    if (returnValue !== undefined) {
        fn.mockResolvedValue = () => fn;
        fn.mockReturnValue = () => fn;
        fn.mockReturnThis = () => fn;
    }
    return fn;
};
// Use global jest if available, otherwise use mock
const jest = global.jest || mockJest;
// Set global test timeout if jest is available
if (global.jest) {
    jest.setTimeout(GLOBAL_TEST_TIMEOUT);
}
// Global mocks for Node.js APIs
global.fetch = jest.fn();
global.WebSocket = jest.fn();
global.EventSource = jest.fn();
// Mock console methods to reduce noise in tests
const originalConsole = { ...console };
global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn()
};
// Restore console for specific tests if needed
global.restoreConsole = () => {
    global.console = originalConsole;
};
// Mock beforeEach and afterEach if not available
const beforeEach = global.beforeEach || ((fn) => { });
const afterEach = global.afterEach || ((fn) => { });
// Mock timers setup
beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
});
afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
});
// Global test utilities
global.testUtils = {
    // Create a promise that resolves after a delay
    delay: (ms = MOCK_DELAY_MS) => new Promise(resolve => setTimeout(resolve, ms)),
    // Create a mock WebSocket
    createMockWebSocket: () => {
        const mockWs = {
            readyState: 1, // OPEN
            send: jest.fn(),
            close: jest.fn(),
            addEventListener: jest.fn(),
            removeEventListener: jest.fn(),
            dispatchEvent: jest.fn(),
            onopen: null,
            onclose: null,
            onmessage: null,
            onerror: null,
            url: 'ws://localhost:8080',
            protocol: '',
            extensions: '',
            bufferedAmount: 0,
            binaryType: 'blob',
            CONNECTING: 0,
            OPEN: 1,
            CLOSING: 2,
            CLOSED: 3
        };
        // Add event emitter functionality
        const listeners = {};
        mockWs.addEventListener = jest.fn((event, listener) => {
            if (!listeners[event])
                listeners[event] = [];
            listeners[event].push(listener);
        });
        mockWs.removeEventListener = jest.fn((event, listener) => {
            if (listeners[event]) {
                const index = listeners[event].indexOf(listener);
                if (index > -1)
                    listeners[event].splice(index, 1);
            }
        });
        mockWs.dispatchEvent = jest.fn((event) => {
            const eventListeners = listeners[event.type] || [];
            eventListeners.forEach(listener => listener(event));
            // Also call direct event handlers
            if (event.type === 'open' && mockWs.onopen)
                mockWs.onopen(event);
            if (event.type === 'close' && mockWs.onclose)
                mockWs.onclose(event);
            if (event.type === 'message' && mockWs.onmessage)
                mockWs.onmessage(event);
            if (event.type === 'error' && mockWs.onerror)
                mockWs.onerror(event);
        });
        // Helper to simulate events
        mockWs.simulateOpen = () => {
            mockWs.readyState = 1;
            mockWs.dispatchEvent({ type: 'open' });
        };
        mockWs.simulateMessage = (data) => {
            mockWs.dispatchEvent({ type: 'message', data });
        };
        mockWs.simulateClose = (code = 1000, reason = '') => {
            mockWs.readyState = 3;
            mockWs.dispatchEvent({ type: 'close', code, reason });
        };
        mockWs.simulateError = (error) => {
            mockWs.dispatchEvent({ type: 'error', error });
        };
        return mockWs;
    },
    // Create mock Chrome DevTools Protocol
    createMockCDP: () => ({
        Runtime: {
            enable: jest.fn().mockResolvedValue({}),
            evaluate: jest.fn().mockResolvedValue({ result: { value: null } }),
            callFunctionOn: jest.fn().mockResolvedValue({ result: { value: null } })
        },
        Page: {
            enable: jest.fn().mockResolvedValue({}),
            navigate: jest.fn().mockResolvedValue({ frameId: 'frame-1' }),
            reload: jest.fn().mockResolvedValue({}),
            captureScreenshot: jest.fn().mockResolvedValue({ data: 'base64-image-data' }),
            printToPDF: jest.fn().mockResolvedValue({ data: 'base64-pdf-data' }),
            getLayoutMetrics: jest.fn().mockResolvedValue({
                layoutViewport: { clientWidth: 1920, clientHeight: 1080 }
            })
        },
        DOM: {
            enable: jest.fn().mockResolvedValue({}),
            getDocument: jest.fn().mockResolvedValue({ root: { nodeId: 1 } }),
            querySelector: jest.fn().mockResolvedValue({ nodeId: 2 }),
            querySelectorAll: jest.fn().mockResolvedValue({ nodeIds: [2, 3, 4] }),
            getOuterHTML: jest.fn().mockResolvedValue({ outerHTML: '<div>Mock HTML</div>' }),
            setAttributeValue: jest.fn().mockResolvedValue({}),
            removeAttribute: jest.fn().mockResolvedValue({})
        },
        Input: {
            dispatchMouseEvent: jest.fn().mockResolvedValue({}),
            dispatchKeyEvent: jest.fn().mockResolvedValue({}),
            insertText: jest.fn().mockResolvedValue({})
        },
        Network: {
            enable: jest.fn().mockResolvedValue({}),
            setUserAgentOverride: jest.fn().mockResolvedValue({}),
            setCacheDisabled: jest.fn().mockResolvedValue({})
        },
        Security: {
            enable: jest.fn().mockResolvedValue({}),
            setIgnoreCertificateErrors: jest.fn().mockResolvedValue({})
        }
    }),
    // Create mock file system
    createMockFS: () => ({
        readFile: jest.fn().mockResolvedValue('mock file content'),
        writeFile: jest.fn().mockResolvedValue(undefined),
        readdir: jest.fn().mockResolvedValue(['file1.js', 'file2.js']),
        stat: jest.fn().mockResolvedValue({
            isFile: () => true,
            isDirectory: () => false,
            size: 1024,
            mtime: new Date()
        }),
        mkdir: jest.fn().mockResolvedValue(undefined),
        rmdir: jest.fn().mockResolvedValue(undefined),
        unlink: jest.fn().mockResolvedValue(undefined),
        access: jest.fn().mockResolvedValue(undefined),
        exists: jest.fn().mockResolvedValue(true)
    }),
    // Create mock crypto
    createMockCrypto: () => ({
        randomBytes: jest.fn((size) => Buffer.alloc(size, 'a')),
        createHash: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('mock-hash')
        })),
        createHmac: jest.fn(() => ({
            update: jest.fn().mockReturnThis(),
            digest: jest.fn().mockReturnValue('mock-hmac')
        })),
        createCipher: jest.fn(() => ({
            update: jest.fn().mockReturnValue('encrypted-'),
            final: jest.fn().mockReturnValue('data')
        })),
        createDecipher: jest.fn(() => ({
            update: jest.fn().mockReturnValue('decrypted-'),
            final: jest.fn().mockReturnValue('data')
        })),
        pbkdf2: jest.fn((password, salt, iterations, keylen, digest, callback) => {
            callback(null, Buffer.alloc(keylen, 'a'));
        }),
        randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9abc-def0')
    }),
    // Create mock performance observer
    createMockPerformanceObserver: () => {
        const mockObserver = {
            observe: jest.fn(),
            disconnect: jest.fn(),
            takeRecords: jest.fn().mockReturnValue([])
        };
        global.PerformanceObserver = jest.fn(() => mockObserver);
        return mockObserver;
    },
    // Create mock metrics data
    createMockMetrics: () => ({
        timestamp: Date.now(),
        cpu: {
            usage: 45.2,
            cores: 8,
            loadAverage: [1.2, 1.5, 1.8]
        },
        memory: {
            used: 1024 * 1024 * 512, // 512MB
            total: 1024 * 1024 * 1024 * 8, // 8GB
            percentage: 6.25
        },
        network: {
            bytesReceived: 1024 * 100,
            bytesSent: 1024 * 50,
            connectionsActive: 5
        },
        agents: {
            total: 3,
            active: 2,
            idle: 1,
            averageResponseTime: 150
        }
    }),
    // Create mock agent data
    createMockAgent: (id = 'agent-1') => ({
        id,
        name: `Mock Agent ${id}`,
        type: 'browser-automation',
        status: 'active',
        capabilities: ['screenshot', 'navigation', 'interaction'],
        metadata: {
            version: '1.0.0',
            lastSeen: new Date().toISOString(),
            performance: {
                tasksCompleted: 10,
                averageExecutionTime: 200,
                successRate: 0.95
            }
        },
        connection: {
            url: `ws://localhost:8080/agent/${id}`,
            connected: true,
            lastPing: Date.now()
        }
    }),
    // Create mock task data
    createMockTask: (id = 'task-1') => ({
        id,
        type: 'screenshot',
        priority: 'medium',
        status: 'pending',
        payload: {
            url: 'https://example.com',
            options: { fullPage: true }
        },
        metadata: {
            createdAt: new Date().toISOString(),
            assignedTo: null,
            retryCount: 0,
            maxRetries: 3
        },
        result: null,
        error: null
    }),
    // Assertion helpers
    expectEventuallyToBe: async (getValue, expected, timeout = 5000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (getValue() === expected)
                return;
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        throw new Error(`Expected ${getValue()} to eventually be ${expected}`);
    },
    expectEventuallyToMatch: async (getValue, matcher, timeout = 5000) => {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (matcher(getValue()))
                return;
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        throw new Error(`Expected ${getValue()} to eventually match condition`);
    }
};
// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.MCP_TEST_MODE = 'true';
process.env.MCP_LOG_LEVEL = 'error';
// Suppress specific warnings in test environment
const originalEmit = process.emit;
process.emit = function (name, data) {
    // Suppress MaxListenersExceededWarning in tests
    if (name === 'warning' && data.name === 'MaxListenersExceededWarning') {
        return false;
    }
    return originalEmit.apply(process, arguments);
};
// Global error handling for unhandled promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
});
// Export test utilities for direct import
exports.testUtils = global.testUtils;
console.log('🧪 Advanced MCP Test Environment Initialized');
//# sourceMappingURL=setup.js.map