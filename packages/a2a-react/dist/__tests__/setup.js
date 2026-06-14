"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.renderWithProvider = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const react_1 = require("@testing-library/react");
const A2AProvider_1 = require("../A2AProvider");
// Mock WebSocket for testing
class MockWebSocket {
    static { this.CONNECTING = 0; }
    static { this.OPEN = 1; }
    static { this.CLOSING = 2; }
    static { this.CLOSED = 3; }
    constructor(url) {
        this.CONNECTING = 0;
        this.OPEN = 1;
        this.CLOSING = 2;
        this.CLOSED = 3;
        this.readyState = 0;
        this.onopen = null;
        this.onclose = null;
        this.onmessage = null;
        this.onerror = null;
        this.url = url;
        // Simulate connection opening asynchronously
        setTimeout(() => {
            this.readyState = 1;
            this.onopen?.(new Event('open'));
            // Send initial agents list
            setTimeout(() => {
                if (this.onmessage && this.readyState === 1) {
                    this.onmessage(new MessageEvent('message', {
                        data: JSON.stringify({
                            type: 'agents',
                            agents: []
                        })
                    }));
                }
            }, 5);
        }, 1);
    }
    send(data) {
        try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'send_message') {
                // Echo the message back for testing
                setTimeout(() => {
                    if (this.onmessage && this.readyState === 1) {
                        this.onmessage(new MessageEvent('message', {
                            data: JSON.stringify({
                                type: 'message',
                                message: parsed.message
                            })
                        }));
                    }
                }, 10);
            }
        }
        catch (error) {
            // Ignore parsing errors in tests
        }
    }
    close() {
        this.readyState = 3;
        this.onclose?.(new CloseEvent('close'));
    }
}
// Set up global WebSocket mock
global.WebSocket = MockWebSocket;
// Mock console methods to reduce noise in tests
global.console = {
    ...console,
    log: () => { },
    error: () => { },
    warn: () => { },
};
const renderWithProvider = (ui) => {
    return (0, react_1.render)((0, jsx_runtime_1.jsx)(A2AProvider_1.A2AProvider, { config: { url: 'ws://test', agentId: 'test-agent' }, children: ui }));
};
exports.renderWithProvider = renderWithProvider;
//# sourceMappingURL=setup.js.map