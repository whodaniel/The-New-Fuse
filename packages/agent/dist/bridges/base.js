"use strict";
/**
 * Base Bridge - Abstract base class for all bridges
 *
 * Provides common functionality and interface for all bridge implementations.
 * All bridges should extend this class for consistent behavior.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bridge = void 0;
const events_1 = require("events");
const index_js_1 = require("./index.js");
// ============================================================
// BASE BRIDGE CLASS
// ============================================================
class Bridge extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.isConnected = false;
        this.startTime = null;
        this.heartbeatInterval = null;
        this.reconnectAttempts = 0;
        this.name = config.name;
        this.config = {
            autoConnect: true,
            reconnectOnFailure: true,
            reconnectDelayMs: 5000,
            maxReconnectAttempts: 5,
            heartbeatIntervalMs: 30000,
            ...config,
        };
        this.stats = {
            connected: false,
            messagesSent: 0,
            messagesReceived: 0,
            errors: 0,
            uptime: 0,
            lastActivity: null,
        };
        if (this.config.autoConnect) {
            this.connect().catch((err) => this.emit('error', err));
        }
    }
    // ============================================================
    // COMMON METHODS
    // ============================================================
    /**
     * Get bridge name
     */
    getName() {
        return this.name;
    }
    /**
     * Check if connected
     */
    getConnected() {
        return this.isConnected;
    }
    /**
     * Get bridge statistics
     */
    getStats() {
        return {
            ...this.stats,
            connected: this.isConnected,
            uptime: this.startTime ? (Date.now() - this.startTime.getTime()) / 1000 : 0,
        };
    }
    /**
     * Create a message with standard fields
     */
    createMessage(type, payload, priority = index_js_1.Priority.MEDIUM) {
        return {
            id: `${this.name}-${Date.now()}-${globalThis.crypto.randomUUID().split('-')[0]}`,
            type,
            priority,
            payload,
            timestamp: new Date(),
        };
    }
    /**
     * Send a message with tracking
     */
    async sendMessage(message, type = index_js_1.MessageType.COMMAND, priority = index_js_1.Priority.MEDIUM) {
        const bridgeMessage = this.createMessage(type, message, priority);
        await this.send(bridgeMessage);
        this.stats.messagesSent++;
        this.stats.lastActivity = new Date();
    }
    /**
     * Process received message
     */
    async processMessage(message) {
        this.stats.messagesReceived++;
        this.stats.lastActivity = new Date();
        this.emit('message', message);
        await this.handleMessage(message);
    }
    /**
     * Start heartbeat
     */
    startHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
        }
        this.heartbeatInterval = setInterval(async () => {
            try {
                await this.sendHeartbeat();
            }
            catch (error) {
                this.emit('error', error);
            }
        }, this.config.heartbeatIntervalMs);
    }
    /**
     * Stop heartbeat
     */
    stopHeartbeat() {
        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }
    }
    /**
     * Send heartbeat
     */
    async sendHeartbeat() {
        const heartbeatMessage = this.createMessage(index_js_1.MessageType.HEARTBEAT, { bridgeName: this.name, timestamp: new Date() }, index_js_1.Priority.LOW);
        await this.send(heartbeatMessage);
        this.emit('heartbeat', heartbeatMessage);
    }
    /**
     * Handle connection established
     */
    onConnected() {
        this.isConnected = true;
        this.stats.connected = true;
        this.startTime = new Date();
        this.reconnectAttempts = 0;
        this.startHeartbeat();
        this.emit('connected');
    }
    /**
     * Handle disconnection
     */
    onDisconnected() {
        this.isConnected = false;
        this.stats.connected = false;
        this.stopHeartbeat();
        this.emit('disconnected');
        if (this.config.reconnectOnFailure) {
            this.attemptReconnect();
        }
    }
    /**
     * Attempt reconnection
     */
    async attemptReconnect() {
        if (this.reconnectAttempts >= (this.config.maxReconnectAttempts || 5)) {
            this.emit('reconnect:failed', { attempts: this.reconnectAttempts });
            return;
        }
        this.reconnectAttempts++;
        this.emit('reconnecting', { attempt: this.reconnectAttempts });
        setTimeout(async () => {
            try {
                await this.connect();
            }
            catch (error) {
                this.emit('error', error);
                await this.attemptReconnect();
            }
        }, this.config.reconnectDelayMs);
    }
    /**
     * Handle error
     */
    onError(error) {
        this.stats.errors++;
        this.emit('error', error);
    }
    /**
     * Cleanup resources
     */
    async cleanup() {
        this.stopHeartbeat();
        await this.disconnect();
        this.removeAllListeners();
    }
}
exports.Bridge = Bridge;
exports.default = Bridge;
//# sourceMappingURL=base.js.map