// Mock WebSocket for tests
jest.mock('ws', () => {
    const EventEmitter = require('events');
    return class MockWebSocket extends EventEmitter {
        constructor() {
            super();
            this.readyState = 1; // OPEN
            this.send = jest.fn();
            this.close = jest.fn();
            this.terminate = jest.fn();
        }
    };
});

// Add custom matchers
expect.extend({
    toBeValidJSON(received) {
        try {
            JSON.parse(received);
            return {
                message: () => 'expected value to not be valid JSON',
                pass: true
            };
        } catch (error) {
            return {
                message: () => 'expected value to be valid JSON',
                pass: false
            };
        }
    }
});

// Global test timeout
jest.setTimeout(10000); // 10 seconds

// Cleanup between tests
afterEach(() => {
    jest.clearAllMocks();
});