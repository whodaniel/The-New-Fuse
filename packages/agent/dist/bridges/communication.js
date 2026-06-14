"use strict";
/**
 * Communication Bridge - Inter-agent communication
 *
 * Provides communication capabilities between agents:
 * - Direct messaging
 * - Broadcast messaging
 * - Request/Response patterns
 * - Event streaming
 * - Channel subscriptions
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationBridge = void 0;
const index_js_1 = require("./index.js");
// ============================================================
// COMMUNICATION BRIDGE
// ============================================================
class CommunicationBridge extends index_js_1.BaseBridge {
    constructor() {
        super('communication-bridge');
        this.channels = new Map();
        this.subscribers = new Map();
        this.pendingRequests = new Map();
        this.messageHistory = [];
        this.maxHistorySize = 1000;
        this.defaultTimeout = 30000;
    }
    async connect() {
        this.emit('connecting');
        this.isConnected = true;
        this.emit('connected');
    }
    async disconnect() {
        // Cancel all pending requests
        for (const [id, pending] of this.pendingRequests) {
            clearTimeout(pending.timeout);
            pending.reject(new Error('Bridge disconnected'));
        }
        this.pendingRequests.clear();
        this.isConnected = false;
        this.emit('disconnected');
    }
    async sendMessage(message, messageType = index_js_1.MessageType.COMMAND, priority = index_js_1.Priority.MEDIUM) {
        const fullMessage = this.createMsg(message.from, message.to, message.payload, messageType, priority);
        if (message.channel) {
            fullMessage.channel = message.channel;
        }
        await this.send(fullMessage);
    }
    // ============================================================
    // MESSAGING
    // ============================================================
    /**
     * Create a message
     */
    createMsg(from, to, payload, type = index_js_1.MessageType.COMMAND, priority = index_js_1.Priority.MEDIUM) {
        return {
            id: `msg-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            from,
            to,
            type,
            priority,
            payload,
            timestamp: new Date(),
        };
    }
    /**
     * Send a message
     */
    async send(message) {
        // Add to history
        this.addToHistory(message);
        // Broadcast message
        if (message.to === 'broadcast') {
            this.broadcast(message);
            return;
        }
        // Channel message
        if (message.channel) {
            this.sendToChannel(message.channel, message);
            return;
        }
        // Direct message
        const handler = this.subscribers.get(message.to);
        if (handler) {
            handler(message);
        }
        this.emit('message:sent', message);
    }
    /**
     * Send and wait for response
     */
    async request(message, timeout = this.defaultTimeout) {
        return new Promise((resolve, reject) => {
            const timeoutHandle = setTimeout(() => {
                this.pendingRequests.delete(message.id);
                reject(new Error(`Request timeout after ${timeout}ms`));
            }, timeout);
            this.pendingRequests.set(message.id, {
                messageId: message.id,
                resolve,
                reject,
                timeout: timeoutHandle,
            });
            message.replyTo = message.from;
            this.send(message).catch(reject);
        });
    }
    /**
     * Reply to a message
     */
    async reply(originalMessage, payload) {
        const response = this.createMsg(originalMessage.to === 'broadcast' ? 'system' : originalMessage.to, originalMessage.from, payload, index_js_1.MessageType.RESPONSE);
        response.correlationId = originalMessage.id;
        // Check for pending request
        const pending = this.pendingRequests.get(originalMessage.id);
        if (pending) {
            clearTimeout(pending.timeout);
            pending.resolve(response);
            this.pendingRequests.delete(originalMessage.id);
        }
        else {
            await this.send(response);
        }
    }
    /**
     * Broadcast a message to all subscribers
     */
    broadcast(message) {
        for (const [id, handler] of this.subscribers) {
            if (id !== message.from) {
                handler(message);
            }
        }
        this.emit('message:broadcast', message);
    }
    // ============================================================
    // SUBSCRIPTIONS
    // ============================================================
    /**
     * Subscribe to messages
     */
    subscribe(agentId, handler) {
        this.subscribers.set(agentId, handler);
        this.emit('subscriber:added', { agentId });
    }
    /**
     * Unsubscribe from messages
     */
    unsubscribe(agentId) {
        this.subscribers.delete(agentId);
        // Remove from all channels
        for (const channel of this.channels.values()) {
            channel.subscribers.delete(agentId);
        }
        this.emit('subscriber:removed', { agentId });
    }
    // ============================================================
    // CHANNELS
    // ============================================================
    /**
     * Create a channel
     */
    createChannel(name) {
        if (this.channels.has(name)) {
            return this.channels.get(name);
        }
        const channel = {
            name,
            subscribers: new Set(),
            messageCount: 0,
            createdAt: new Date(),
        };
        this.channels.set(name, channel);
        this.emit('channel:created', channel);
        return channel;
    }
    /**
     * Delete a channel
     */
    deleteChannel(name) {
        this.channels.delete(name);
        this.emit('channel:deleted', { name });
    }
    /**
     * Join a channel
     */
    joinChannel(channelName, agentId) {
        let channel = this.channels.get(channelName);
        if (!channel) {
            channel = this.createChannel(channelName);
        }
        channel.subscribers.add(agentId);
        this.emit('channel:joined', { channelName, agentId });
    }
    /**
     * Leave a channel
     */
    leaveChannel(channelName, agentId) {
        const channel = this.channels.get(channelName);
        if (channel) {
            channel.subscribers.delete(agentId);
            this.emit('channel:left', { channelName, agentId });
        }
    }
    /**
     * Send to a channel
     */
    sendToChannel(channelName, message) {
        const channel = this.channels.get(channelName);
        if (!channel)
            return;
        channel.messageCount++;
        for (const subscriberId of channel.subscribers) {
            if (subscriberId !== message.from) {
                const handler = this.subscribers.get(subscriberId);
                if (handler) {
                    handler(message);
                }
            }
        }
        this.emit('channel:message', { channelName, message });
    }
    /**
     * Get channel info
     */
    getChannel(name) {
        return this.channels.get(name);
    }
    /**
     * List all channels
     */
    listChannels() {
        return Array.from(this.channels.values());
    }
    // ============================================================
    // HISTORY
    // ============================================================
    /**
     * Add message to history
     */
    addToHistory(message) {
        this.messageHistory.push(message);
        if (this.messageHistory.length > this.maxHistorySize) {
            this.messageHistory = this.messageHistory.slice(-this.maxHistorySize / 2);
        }
    }
    /**
     * Get message history
     */
    getHistory(agentId, limit = 100) {
        let messages = this.messageHistory;
        if (agentId) {
            messages = messages.filter((m) => m.from === agentId || m.to === agentId);
        }
        return messages.slice(-limit);
    }
    // ============================================================
    // STATISTICS
    // ============================================================
    getStatistics() {
        return {
            connected: this.isConnected,
            subscribers: this.subscribers.size,
            channels: this.channels.size,
            pendingRequests: this.pendingRequests.size,
            historySize: this.messageHistory.length,
        };
    }
}
exports.CommunicationBridge = CommunicationBridge;
exports.default = CommunicationBridge;
//# sourceMappingURL=communication.js.map