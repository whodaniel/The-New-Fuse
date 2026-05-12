"use strict";
/**
 * Unified Bridge for The New Fuse Framework
 *
 * Consolidates bridge patterns from:
 * - message-bridge.js (file-based agent coordination)
 * - terminal_bridge.js (AI agent terminal sharing)
 * - agent-bridge.service.js (WebSocket gateway)
 * - vscode-lm-bridge (VSCode language model integration)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UnifiedBridge = void 0;
const events_1 = require("events");
class UnifiedBridge extends events_1.EventEmitter {
    constructor(logger) {
        super();
        this.transports = new Map();
        this.logger = logger;
    }
    addTransport(transport) {
        this.transports.set(transport.name, transport);
        transport.onMessage(this.handleMessage.bind(this));
    }
    handleMessage(message) {
        this.emit('message', message);
    }
    async broadcast(message) {
        for (const transport of this.transports.values()) {
            await transport.send(message);
        }
    }
    async send(message) {
        const targetId = message.target;
        if (!targetId) {
            this.logger.warn('Cannot send message without a target.');
            return false;
        }
        for (const transport of this.transports.values()) {
            if (await transport.send(message)) {
                return true;
            }
        }
        return false;
    }
}
exports.UnifiedBridge = UnifiedBridge;
//# sourceMappingURL=UnifiedBridge.js.map