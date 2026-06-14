"use strict";
/**
 * Universal Bridge - Unified Agent Communication Layer
 *
 * Provides a single interface for agent-to-agent communication regardless
 * of the underlying transport (WebSocket, HTTP, Redis, MCP).
 *
 * CONNECTS TO:
 * - BaseBridge: Base class for bridges (from index.ts)
 * - EventEmitter: For pub/sub communication
 * - Relay transports: WebSocket, HTTP, Redis (from relay-core)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniversalBridge = void 0;
const events_1 = require("events");
const RedisTransportAdapter_js_1 = require("./adapters/RedisTransportAdapter.js");
const index_js_1 = require("./index.js");
/**
 * In-memory transport adapter for local/testing scenarios
 */
class MemoryTransportAdapter extends events_1.EventEmitter {
    constructor() {
        super(...arguments);
        this.type = 'memory';
        this.subscriptions = new Map();
        this.connected = false;
    }
    static { this.messageBuffer = new Map(); }
    async connect() {
        this.connected = true;
        this.emit('connected');
    }
    async disconnect() {
        this.connected = false;
        this.subscriptions.clear();
        this.emit('disconnected');
    }
    async send(message) {
        if (!this.connected) {
            throw new Error('Not connected');
        }
        const targetId = message.target.agentId;
        const messages = MemoryTransportAdapter.messageBuffer.get(targetId) || [];
        messages.push(message);
        MemoryTransportAdapter.messageBuffer.set(targetId, messages);
        // Emit for subscribers
        this.emit(`message:${targetId}`, message);
        if (message.target.broadcastGroup) {
            this.emit(`broadcast:${message.target.broadcastGroup}`, message);
        }
    }
    subscribe(pattern, handler) {
        this.subscriptions.set(pattern, handler);
        this.on(`message:${pattern}`, handler);
        this.on(`broadcast:${pattern}`, handler);
    }
    unsubscribe(pattern) {
        const handler = this.subscriptions.get(pattern);
        if (handler) {
            this.off(`message:${pattern}`, handler);
            this.off(`broadcast:${pattern}`, handler);
            this.subscriptions.delete(pattern);
        }
    }
    isConnected() {
        return this.connected;
    }
    // Retrieve pending messages for an agent
    getPendingMessages(agentId) {
        const messages = MemoryTransportAdapter.messageBuffer.get(agentId) || [];
        MemoryTransportAdapter.messageBuffer.set(agentId, []);
        return messages;
    }
}
/**
 * WebSocket transport adapter
 */
class WebSocketTransportAdapter extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.type = 'websocket';
        this.socket = null;
        this.subscriptions = new Map();
        this.url = options.url;
        this.reconnectAttempts = options.reconnectAttempts || 3;
    }
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Check if we're in a browser environment
                if (typeof WebSocket !== 'undefined') {
                    this.socket = new WebSocket(this.url);
                    this.socket.onopen = () => {
                        this.emit('connected');
                        resolve();
                    };
                    this.socket.onmessage = (event) => {
                        try {
                            const message = JSON.parse(event.data);
                            this.handleMessage(message);
                        }
                        catch (_error) {
                            this.emit('error', new Error('Failed to parse message'));
                        }
                    };
                    this.socket.onerror = (error) => {
                        this.emit('error', error);
                    };
                    this.socket.onclose = () => {
                        this.emit('disconnected');
                    };
                }
                else {
                    // Node.js environment - use ws package if available
                    this.emit('warning', 'WebSocket not available in this environment');
                    resolve(); // Continue without WebSocket
                }
            }
            catch (error) {
                reject(error);
            }
        });
    }
    async disconnect() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
    async send(message) {
        if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
            throw new Error('WebSocket not connected');
        }
        this.socket.send(JSON.stringify(message));
    }
    handleMessage(message) {
        const handler = this.subscriptions.get(message.target.agentId);
        if (handler) {
            handler(message);
        }
        this.emit('message', message);
    }
    subscribe(pattern, handler) {
        this.subscriptions.set(pattern, handler);
    }
    unsubscribe(pattern) {
        this.subscriptions.delete(pattern);
    }
    isConnected() {
        return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
    }
}
/**
 * Universal Bridge - Main implementation
 */
class UniversalBridge extends index_js_1.BaseBridge {
    constructor(config) {
        super(`universal-bridge-${config.agentId}`);
        this.transports = new Map();
        this.pendingReplies = new Map();
        this.messageHandlers = new Map();
        this.config = {
            ...config,
            defaultTransport: config.defaultTransport || 'memory',
            retryAttempts: config.retryAttempts || 3,
            retryDelayMs: config.retryDelayMs || 1000,
            messageTimeout: config.messageTimeout || 30000,
        };
    }
    /**
     * Connect all configured transports
     */
    async connect() {
        this.emit('connecting');
        for (const transportConfig of this.config.transports) {
            const adapter = this.createTransportAdapter(transportConfig);
            try {
                await adapter.connect();
                this.transports.set(transportConfig.type, adapter);
                // Subscribe to messages for this agent
                adapter.subscribe(this.config.agentId, (message) => {
                    this.handleIncomingMessage(message);
                });
                this.emit('transport:connected', transportConfig.type);
            }
            catch (error) {
                this.emit('transport:error', { type: transportConfig.type, error });
            }
        }
        // Ensure at least one transport connected
        if (this.transports.size === 0) {
            // Fall back to memory transport
            const memoryAdapter = new MemoryTransportAdapter();
            await memoryAdapter.connect();
            this.transports.set('memory', memoryAdapter);
            memoryAdapter.subscribe(this.config.agentId, (message) => {
                this.handleIncomingMessage(message);
            });
        }
        this.isConnected = true;
        this.emit('connected');
    }
    /**
     * Disconnect all transports
     */
    async disconnect() {
        for (const [type, adapter] of this.transports) {
            try {
                await adapter.disconnect();
                this.emit('transport:disconnected', type);
            }
            catch (error) {
                this.emit('transport:error', { type, error });
            }
        }
        this.transports.clear();
        this.pendingReplies.clear();
        this.isConnected = false;
        this.emit('disconnected');
    }
    /**
     * Send a message (implements BaseBridge)
     */
    async sendMessage(message, messageType = index_js_1.MessageType.REQUEST, priority = index_js_1.Priority.MEDIUM) {
        const universalMessage = {
            id: this.generateMessageId(),
            type: messageType,
            priority,
            source: {
                agentId: this.config.agentId,
                bridgeType: 'universal',
            },
            target: {
                agentId: message.targetAgentId || 'broadcast',
                broadcastGroup: message.broadcastGroup,
            },
            payload: message.payload ?? message,
            metadata: {
                timestamp: new Date(),
                correlationId: message.correlationId,
                ttl: message.ttl,
            },
        };
        await this.send(universalMessage);
    }
    /**
     * Send a universal message with more control
     */
    async send(message, transportType) {
        const transport = this.getTransport(transportType);
        if (!transport) {
            throw new Error(`No transport available: ${transportType || 'default'}`);
        }
        await transport.send(message);
        this.emit('message:sent', message);
    }
    /**
     * Send and wait for a reply
     */
    async sendAndWaitForReply(targetAgentId, payload, options) {
        const messageId = this.generateMessageId();
        const timeout = options?.timeout || this.config.messageTimeout || 30000;
        const message = {
            id: messageId,
            type: index_js_1.MessageType.REQUEST,
            priority: options?.priority || index_js_1.Priority.MEDIUM,
            source: {
                agentId: this.config.agentId,
                bridgeType: 'universal',
            },
            target: {
                agentId: targetAgentId,
            },
            payload,
            metadata: {
                timestamp: new Date(),
                correlationId: messageId,
                ttl: timeout,
            },
        };
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.pendingReplies.delete(messageId);
                reject(new Error(`Reply timeout after ${timeout}ms`));
            }, timeout);
            this.pendingReplies.set(messageId, { resolve, reject, timeout: timeoutHandle });
            this.send(message, options?.transportType).catch(reject);
        });
    }
    /**
     * Broadcast a message to all agents in a group
     */
    async broadcast(groupId, payload, messageType = index_js_1.MessageType.EVENT) {
        const message = {
            id: this.generateMessageId(),
            type: messageType,
            priority: index_js_1.Priority.MEDIUM,
            source: {
                agentId: this.config.agentId,
                bridgeType: 'universal',
            },
            target: {
                agentId: 'broadcast',
                broadcastGroup: groupId,
            },
            payload,
            metadata: {
                timestamp: new Date(),
            },
        };
        // Send via all connected transports
        const sendPromises = Array.from(this.transports.values()).map((transport) => transport.send(message).catch((err) => {
            this.emit('error', err);
        }));
        await Promise.all(sendPromises);
        this.emit('message:broadcast', { groupId, message });
    }
    /**
     * Register a message handler
     */
    onMessage(handler) {
        const handlerId = `handler-${Date.now()}`;
        this.messageHandlers.set(handlerId, handler);
    }
    /**
     * Register a handler for specific message types
     */
    onMessageType(type, handler) {
        this.onMessage((message) => {
            if (message.type === type) {
                handler(message);
            }
        });
    }
    /**
     * Reply to a message
     */
    async reply(originalMessage, payload) {
        const replyMessage = {
            id: this.generateMessageId(),
            type: index_js_1.MessageType.RESPONSE,
            priority: originalMessage.priority,
            source: {
                agentId: this.config.agentId,
                bridgeType: 'universal',
            },
            target: {
                agentId: originalMessage.source.agentId,
            },
            payload,
            metadata: {
                timestamp: new Date(),
                correlationId: originalMessage.id,
                replyTo: originalMessage.id,
            },
        };
        await this.send(replyMessage);
    }
    /**
     * Get a specific transport
     */
    getTransport(type) {
        if (type) {
            return this.transports.get(type);
        }
        return (this.transports.get(this.config.defaultTransport) || this.transports.values().next().value);
    }
    /**
     * Create a transport adapter based on configuration
     */
    createTransportAdapter(config) {
        switch (config.type) {
            case 'memory':
                return new MemoryTransportAdapter();
            case 'websocket':
                return new WebSocketTransportAdapter({
                    url: config.options.url || 'ws://localhost:8080',
                    reconnectAttempts: config.options.reconnectAttempts,
                });
            case 'http':
                // HTTP adapter would make REST calls
                return new MemoryTransportAdapter(); // Fallback for now
            case 'redis':
                return new RedisTransportAdapter_js_1.RedisTransportAdapter({
                    redisUrl: config.options.redisUrl,
                    serialization: config.options.serialization,
                });
            case 'mcp':
                // MCP adapter would use Model Context Protocol
                return new MemoryTransportAdapter(); // Fallback for now
            default:
                return new MemoryTransportAdapter();
        }
    }
    /**
     * Handle incoming messages
     */
    handleIncomingMessage(message) {
        this.emit('message:received', message);
        // Check if this is a reply to a pending request
        if (message.metadata.replyTo) {
            const pending = this.pendingReplies.get(message.metadata.replyTo);
            if (pending) {
                clearTimeout(pending.timeout);
                pending.resolve(message);
                this.pendingReplies.delete(message.metadata.replyTo);
                return;
            }
        }
        // Invoke all registered handlers
        for (const handler of this.messageHandlers.values()) {
            try {
                const result = handler(message);
                if (result instanceof Promise) {
                    result.catch((err) => this.emit('error', err));
                }
            }
            catch (error) {
                this.emit('error', error);
            }
        }
    }
    /**
     * Generate a unique message ID
     */
    generateMessageId() {
        return `msg-${this.config.agentId}-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`;
    }
    /**
     * Get bridge statistics
     */
    getStats() {
        return {
            agentId: this.config.agentId,
            connectedTransports: Array.from(this.transports.keys()),
            pendingReplies: this.pendingReplies.size,
            handlerCount: this.messageHandlers.size,
        };
    }
}
exports.UniversalBridge = UniversalBridge;
exports.default = UniversalBridge;
//# sourceMappingURL=universal_bridge.js.map