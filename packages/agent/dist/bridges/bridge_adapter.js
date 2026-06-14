"use strict";
/**
 * Bridge Adapter - Adapts different bridge interfaces to a common format
 *
 * Provides translation layer between different bridge implementations,
 * allowing agents to communicate across different protocols seamlessly.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.BridgeAdapter = void 0;
const events_1 = require("events");
const index_js_1 = require("./index.js");
// ============================================================
// BRIDGE ADAPTER
// ============================================================
class BridgeAdapter extends events_1.EventEmitter {
    constructor() {
        super();
        this.bridges = new Map();
        this.adapters = new Map();
        this.messageQueue = [];
        this.processing = false;
    }
    /**
     * Register a bridge
     */
    registerBridge(name, bridge) {
        this.bridges.set(name, bridge);
        // Forward messages to adapter
        bridge.on('message', (message) => {
            this.handleBridgeMessage(name, message);
        });
        this.emit('bridge:registered', { name });
    }
    /**
     * Unregister a bridge
     */
    unregisterBridge(name) {
        this.bridges.delete(name);
        this.emit('bridge:unregistered', { name });
    }
    /**
     * Create an adapter between two bridges
     */
    createAdapter(config) {
        const key = `${config.sourceBridge}:${config.targetBridge}`;
        this.adapters.set(key, config);
        this.emit('adapter:created', { key });
    }
    /**
     * Remove an adapter
     */
    removeAdapter(sourceBridge, targetBridge) {
        const key = `${sourceBridge}:${targetBridge}`;
        this.adapters.delete(key);
        this.emit('adapter:removed', { key });
    }
    /**
     * Route a message from one bridge to another
     */
    async routeMessage(sourceBridge, targetBridge, message) {
        const source = this.bridges.get(sourceBridge);
        const target = this.bridges.get(targetBridge);
        if (!source || !target) {
            throw new Error(`Bridge not found: ${!source ? sourceBridge : targetBridge}`);
        }
        const adapterKey = `${sourceBridge}:${targetBridge}`;
        const adapter = this.adapters.get(adapterKey);
        // Transform message if adapter exists
        let transformedMessage = message;
        if (adapter && adapter.transformations) {
            transformedMessage = this.applyTransformations(message, adapter.transformations);
        }
        const adaptedMessage = {
            originalFormat: sourceBridge,
            adaptedFormat: targetBridge,
            sourceId: sourceBridge,
            targetId: targetBridge,
            content: transformedMessage,
            metadata: { timestamp: new Date() },
        };
        this.messageQueue.push(adaptedMessage);
        await this.processQueue();
    }
    /**
     * Broadcast message to all bridges
     */
    async broadcastMessage(sourceBridge, message, excludeBridges = []) {
        for (const [name, bridge] of this.bridges) {
            if (name !== sourceBridge && !excludeBridges.includes(name)) {
                await this.routeMessage(sourceBridge, name, message);
            }
        }
    }
    /**
     * Handle incoming message from a bridge
     */
    async handleBridgeMessage(bridgeName, message) {
        this.emit('message:received', { bridge: bridgeName, message });
        // Check for adapters that route from this bridge
        for (const [key, adapter] of this.adapters) {
            if (adapter.sourceBridge === bridgeName) {
                await this.routeMessage(bridgeName, adapter.targetBridge, message);
            }
        }
    }
    /**
     * Process message queue
     */
    async processQueue() {
        if (this.processing || this.messageQueue.length === 0) {
            return;
        }
        this.processing = true;
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            if (message) {
                try {
                    const targetBridge = this.bridges.get(message.targetId);
                    if (targetBridge) {
                        await targetBridge.sendMessage(message.content, index_js_1.MessageType.COMMAND, index_js_1.Priority.MEDIUM);
                        this.emit('message:routed', message);
                    }
                }
                catch (error) {
                    this.emit('error', { message, error });
                }
            }
        }
        this.processing = false;
    }
    /**
     * Apply transformations to a message
     */
    applyTransformations(message, transformations) {
        if (typeof message !== 'object' || message === null) {
            return message;
        }
        const result = { ...message };
        for (const { field, transform } of transformations) {
            if (field in result) {
                result[field] = transform(result[field]);
            }
        }
        return result;
    }
    /**
     * Get all registered bridges
     */
    getBridges() {
        return Array.from(this.bridges.keys());
    }
    /**
     * Get all adapters
     */
    getAdapters() {
        return Array.from(this.adapters.keys());
    }
    /**
     * Get adapter statistics
     */
    getStats() {
        return {
            bridges: this.bridges.size,
            adapters: this.adapters.size,
            queueLength: this.messageQueue.length,
            processing: this.processing,
        };
    }
}
exports.BridgeAdapter = BridgeAdapter;
exports.default = BridgeAdapter;
//# sourceMappingURL=bridge_adapter.js.map