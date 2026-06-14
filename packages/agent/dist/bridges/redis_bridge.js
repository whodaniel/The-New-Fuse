"use strict";
/**
 * Redis Transport Adapter for UniversalBridge
 *
 * Provides Redis pub/sub transport for distributed agent communication.
 *
 * CONNECTS TO:
 * - UniversalBridge: Parent bridge system
 * - Redis: Via ioredis for pub/sub
 * - EventEmitter: For local event handling
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisTransportAdapter = void 0;
const events_1 = require("events");
/**
 * Redis Transport Adapter
 * Uses Redis pub/sub for distributed agent messaging
 */
class RedisTransportAdapter extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.type = 'redis';
        this.publisher = null;
        this.subscriber = null;
        this.subscriptions = new Map();
        this.connected = false;
        this.config = {
            host: config.host || process.env.REDIS_HOST || 'localhost',
            port: config.port || parseInt(process.env.REDIS_PORT || '6379'),
            password: config.password || process.env.REDIS_PASSWORD,
            db: config.db || 0,
            keyPrefix: config.keyPrefix || 'tnf:',
            channelPrefix: config.channelPrefix || 'tnf:agent:',
            ...config,
        };
        this.channelPrefix = this.config.channelPrefix || 'tnf:agent:';
    }
    /**
     * Connect to Redis
     */
    async connect() {
        if (this.connected) {
            return;
        }
        try {
            // Dynamic import for ioredis (may not be available)
            const Redis = await this.loadRedisClient();
            if (!Redis) {
                this.emit('warning', 'Redis client not available, falling back to memory transport');
                this.connected = true;
                this.emit('connected');
                return;
            }
            // Create publisher connection
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const RedisClass = Redis;
            this.publisher = new RedisClass({
                host: this.config.host,
                port: this.config.port,
                password: this.config.password,
                db: this.config.db,
                keyPrefix: this.config.keyPrefix,
                retryStrategy: this.config.retryStrategy ||
                    ((times) => {
                        if (times > 10) {
                            return null;
                        }
                        return Math.min(times * 100, 3000);
                    }),
            });
            // Create subscriber connection (separate connection required for pub/sub)
            this.subscriber = this.publisher.duplicate();
            // Setup message handler
            this.subscriber.on('message', (channel, messageStr) => {
                this.handleRedisMessage(channel, messageStr);
            });
            // Setup error handlers
            this.publisher.on('error', (err) => {
                this.emit('error', err instanceof Error ? err : new Error(String(err)));
            });
            this.subscriber.on('error', (err) => {
                this.emit('error', err instanceof Error ? err : new Error(String(err)));
            });
            this.connected = true;
            this.emit('connected');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        if (!this.connected) {
            return;
        }
        try {
            if (this.subscriber) {
                await this.subscriber.quit();
                this.subscriber = null;
            }
            if (this.publisher) {
                await this.publisher.quit();
                this.publisher = null;
            }
            this.subscriptions.clear();
            this.connected = false;
            this.emit('disconnected');
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    /**
     * Send a message via Redis pub/sub
     */
    async send(message) {
        if (!this.connected || !this.publisher) {
            // Fallback: emit locally if Redis not available
            this.emit(`message:${message.target.agentId}`, message);
            return;
        }
        const channel = this.getChannel(message.target.agentId);
        const messageStr = JSON.stringify(message);
        await this.publisher.publish(channel, messageStr);
        // Also publish to broadcast channel if specified
        if (message.target.broadcastGroup) {
            const broadcastChannel = `${this.channelPrefix}broadcast:${message.target.broadcastGroup}`;
            await this.publisher.publish(broadcastChannel, messageStr);
        }
    }
    /**
     * Subscribe to messages for a specific agent
     */
    subscribe(pattern, handler) {
        this.subscriptions.set(pattern, handler);
        if (this.subscriber) {
            const channel = this.getChannel(pattern);
            void this.subscriber.subscribe(channel);
            // Also subscribe to broadcast pattern
            const broadcastChannel = `${this.channelPrefix}broadcast:${pattern}`;
            void this.subscriber.subscribe(broadcastChannel);
        }
        // Also handle local events
        this.on(`message:${pattern}`, handler);
    }
    /**
     * Unsubscribe from messages
     */
    unsubscribe(pattern) {
        const handler = this.subscriptions.get(pattern);
        if (handler) {
            this.off(`message:${pattern}`, handler);
            this.subscriptions.delete(pattern);
        }
        if (this.subscriber) {
            const channel = this.getChannel(pattern);
            this.subscriber.unsubscribe(channel);
            const broadcastChannel = `${this.channelPrefix}broadcast:${pattern}`;
            this.subscriber.unsubscribe(broadcastChannel);
        }
    }
    /**
     * Check if connected
     */
    isConnected() {
        return this.connected;
    }
    /**
     * Handle incoming Redis messages
     */
    handleRedisMessage(channel, messageStr) {
        try {
            const message = JSON.parse(messageStr);
            // Extract agent ID from channel
            const agentId = channel.replace(this.channelPrefix, '').replace('broadcast:', '');
            // Find matching handler
            const handler = this.subscriptions.get(agentId);
            if (handler) {
                handler(message);
            }
            // Also emit for general handlers
            this.emit('message', message);
        }
        catch (error) {
            this.emit('error', new Error(`Failed to parse Redis message: ${error}`));
        }
    }
    /**
     * Get Redis channel name for an agent
     */
    getChannel(agentId) {
        return `${this.channelPrefix}${agentId}`;
    }
    /**
     * Attempt to load Redis client dynamically
     */
    async loadRedisClient() {
        try {
            // Try to import ioredis
            const module = await import('ioredis');
            return module.default || module;
        }
        catch {
            // ioredis not available
            return null;
        }
    }
    /**
     * Get transport statistics
     */
    getStats() {
        return {
            connected: this.connected,
            subscriptionCount: this.subscriptions.size,
            channelPrefix: this.channelPrefix,
        };
    }
}
exports.RedisTransportAdapter = RedisTransportAdapter;
exports.default = RedisTransportAdapter;
//# sourceMappingURL=redis_bridge.js.map