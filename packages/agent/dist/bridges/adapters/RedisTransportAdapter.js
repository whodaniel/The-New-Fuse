"use strict";
/**
 * Redis Pub/Sub Transport Adapter
 *
 * ORCHESTRATOR IMPROVEMENT: Architecture enhancement from federated intelligence
 * - Enables true distributed agent federation across containers/servers
 * - Replaces ad-hoc file-based queues with scalable event bus
 * - Supports horizontal scaling of relay servers
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisTransportAdapter = void 0;
const events_1 = require("events");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const ioredis_1 = __importDefault(require("ioredis"));
class RedisTransportAdapter extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.type = 'redis';
        this.publisher = null;
        this.subscriber = null;
        this.upstash = null;
        this.messageHandlers = new Map();
        this.reconnectAttempts = 0;
        this.connected = false;
        this.config = {
            redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6380',
            serialization: config.serialization || 'json',
            reconnectOnError: config.reconnectOnError ?? true,
            maxReconnectAttempts: config.maxReconnectAttempts || 10,
        };
        console.log('[RedisTransport] Initializing...', {
            url: this.config.redisUrl,
            serialization: this.config.serialization,
        });
    }
    async connect() {
        if (this.connected)
            return;
        try {
            this.publisher = (0, infrastructure_1.createStandaloneRedisClient)({ redisUrl: this.config.redisUrl, lazyConnect: true });
            this.subscriber = (0, infrastructure_1.createStandaloneRedisClient)({ redisUrl: this.config.redisUrl, lazyConnect: true });
            this.upstash = (0, infrastructure_1.createUpstashRestClient)();
            if (this.publisher instanceof ioredis_1.default) {
                await this.publisher.connect().catch(() => { });
            }
            if (this.subscriber instanceof ioredis_1.default) {
                await this.subscriber.connect().catch(() => { });
                this.setupSubscriberHandlers();
            }
            this.connected = true;
            this.emit('connected');
        }
        catch (error) {
            console.error(`[RedisTransport] Initialization failed: ${error.message}`);
            throw error;
        }
    }
    createRedisClient(role) {
        // This is no longer used but kept for structural integrity during refactor
        return null;
    }
    setupSubscriberHandlers() {
        if (!this.subscriber)
            return;
        this.subscriber.on('message', (channel, message) => {
            const handler = this.messageHandlers.get(channel);
            if (!handler) {
                const broadcastHandler = this.messageHandlers.get('broadcast');
                if (broadcastHandler) {
                    try {
                        const parsed = this.deserialize(message);
                        broadcastHandler(parsed);
                    }
                    catch (error) {
                        console.error('[RedisTransport] Broadcast message parse error:', error);
                    }
                }
                return;
            }
            try {
                const parsed = this.deserialize(message);
                handler(parsed);
            }
            catch (error) {
                console.error('[RedisTransport] Message parse error:', error);
            }
        });
    }
    /**
     * Send a message
     */
    async send(message) {
        try {
            const channel = message.target.broadcastGroup || message.target.agentId;
            const serialized = this.serialize(message);
            let recipientCount = 0;
            if (this.upstash) {
                recipientCount = await this.upstash.publish(channel, serialized);
            }
            else if (this.publisher) {
                recipientCount = await this.publisher.publish(channel, serialized);
            }
            console.log('[RedisTransport] Message published', {
                channel,
                messageId: message.id,
                recipients: recipientCount,
            });
        }
        catch (error) {
            console.error('[RedisTransport] Send error:', error);
            throw error;
        }
    }
    /**
     * Subscribe to a pattern
     */
    async subscribe(pattern, handler) {
        try {
            this.messageHandlers.set(pattern, handler);
            if (this.subscriber) {
                await this.subscriber.subscribe(pattern);
            }
        }
        catch (error) {
            console.error('[RedisTransport] Subscribe error:', error);
            this.messageHandlers.delete(pattern);
            throw error;
        }
    }
    /**
     * Unsubscribe from a pattern
     */
    async unsubscribe(pattern) {
        try {
            this.messageHandlers.delete(pattern);
            if (this.subscriber) {
                await this.subscriber.unsubscribe(pattern);
            }
        }
        catch (error) {
            console.error('[RedisTransport] Unsubscribe error:', error);
            throw error;
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        console.log('[RedisTransport] Disconnecting...');
        try {
            this.connected = false;
            if (this.subscriber)
                await this.subscriber.quit();
            if (this.publisher)
                await this.publisher.quit();
            this.upstash = null;
            console.log('[RedisTransport] ✅ Disconnected successfully');
        }
        catch (error) {
            console.error('[RedisTransport] Disconnect error:', error);
        }
    }
    /**
     * Get connection status
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Get subscribed channels
     */
    getSubscribedChannels() {
        return Array.from(this.messageHandlers.keys());
    }
    /**
     * Serialize message based on config
     */
    serialize(message) {
        switch (this.config.serialization) {
            case 'msgpack':
                // TODO: Implement msgpack serialization
                // For now, fall back to JSON
                console.warn('[RedisTransport] MsgPack not yet implemented, using JSON');
                return JSON.stringify(message);
            case 'json':
            default:
                return JSON.stringify(message);
        }
    }
    /**
     * Deserialize message based on config
     */
    deserialize(data) {
        switch (this.config.serialization) {
            case 'msgpack':
                // TODO: Implement msgpack deserialization
                // For now, fall back to JSON
                return JSON.parse(data);
            case 'json':
            default:
                return JSON.parse(data);
        }
    }
    /**
     * Health check
     */
    async healthCheck() {
        try {
            if (this.upstash) {
                await this.upstash.ping();
            }
            if (this.publisher) {
                await this.publisher.ping();
            }
            return true;
        }
        catch (error) {
            console.error('[RedisTransport] Health check failed:', error);
            return false;
        }
    }
}
exports.RedisTransportAdapter = RedisTransportAdapter;
//# sourceMappingURL=RedisTransportAdapter.js.map