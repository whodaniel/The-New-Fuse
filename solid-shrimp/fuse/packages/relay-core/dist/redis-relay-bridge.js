"use strict";
/**
 * Redis-Relay Bridge
 *
 * Bridges the WebSocket Relay to Redis for orchestration
 * Implements the "Data Plane → Control Plane" pattern
 *
 * Flow:
 * 1. Relay receives WS message
 * 2. Emits 'message' event
 * 3. Bridge publishes to Redis 'tnf:bus:ingress'
 * 4. Orchestrator processes via Redis
 * 5. Orchestrator publishes to 'tnf:bus:egress:{agentId}'
 * 6. Bridge subscribes and forwards back to Relay
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisRelayBridge = void 0;
exports.createRedisRelayBridge = createRedisRelayBridge;
const events_1 = require("events");
const redis_1 = require("redis");
const tnf_envelope_1 = require("./protocol/tnf-envelope");
class RedisRelayBridge extends events_1.EventEmitter {
    redisClient;
    redisSubscriber;
    config;
    connected = false;
    constructor(config = {}) {
        super();
        this.config = {
            redisUrl: config.redisUrl ||
                process.env.REDIS_URL ||
                'redis://localhost:6379',
            ingressChannel: config.ingressChannel || 'tnf:bus:ingress',
            egressChannelPrefix: config.egressChannelPrefix || 'tnf:bus:egress',
            enableLegacyShim: config.enableLegacyShim ?? true,
        };
        // Create Redis clients
        this.redisClient = (0, redis_1.createClient)({ url: this.config.redisUrl });
        this.redisSubscriber = (0, redis_1.createClient)({ url: this.config.redisUrl });
        this.setupErrorHandlers();
    }
    setupErrorHandlers() {
        this.redisClient.on('error', (err) => {
            console.error('[Redis-Bridge] Client error:', err);
            this.emit('error', err);
        });
        this.redisSubscriber.on('error', (err) => {
            console.error('[Redis-Bridge] Subscriber error:', err);
            this.emit('error', err);
        });
    }
    /**
     * Connect to Redis
     */
    async connect() {
        try {
            await this.redisClient.connect();
            await this.redisSubscriber.connect();
            this.connected = true;
            console.log('[Redis-Bridge] Connected to Redis');
            this.emit('connected');
        }
        catch (error) {
            console.error('[Redis-Bridge] Connection failed:', error);
            throw error;
        }
    }
    /**
     * Disconnect from Redis
     */
    async disconnect() {
        await this.redisClient.quit();
        await this.redisSubscriber.quit();
        this.connected = false;
        console.log('[Redis-Bridge] Disconnected from Redis');
        this.emit('disconnected');
    }
    /**
     * Handle incoming message from Relay
     * Publishes to Redis ingress channel
     */
    async handleRelayMessage(rawMessage, agentId) {
        if (!this.connected) {
            console.warn('[Redis-Bridge] Not connected, dropping message');
            return;
        }
        let envelope;
        try {
            // Try to parse as TNF Envelope
            envelope = (0, tnf_envelope_1.validateTNFEnvelope)(rawMessage);
            console.log('[Redis-Bridge] Valid TNF Envelope received');
        }
        catch (error) {
            if (this.config.enableLegacyShim) {
                // Wrap legacy message in envelope
                console.log('[Redis-Bridge] Legacy message detected, wrapping in envelope');
                envelope = this.wrapLegacyMessage(rawMessage, agentId);
            }
            else {
                console.error('[Redis-Bridge] Invalid envelope, dropping:', error);
                return;
            }
        }
        // Publish to ingress
        try {
            await this.redisClient.publish(this.config.ingressChannel, JSON.stringify(envelope));
            console.log(`[Redis-Bridge] Published to ${this.config.ingressChannel}:`, envelope.id);
            this.emit('ingress', envelope);
        }
        catch (error) {
            console.error('[Redis-Bridge] Failed to publish:', error);
            this.emit('error', error);
        }
    }
    /**
     * Subscribe to egress channel for a specific agent
     */
    async subscribeToAgent(agentId, callback) {
        const channel = `${this.config.egressChannelPrefix}:${agentId}`;
        await this.redisSubscriber.subscribe(channel, (message) => {
            try {
                const envelope = (0, tnf_envelope_1.validateTNFEnvelope)(JSON.parse(message));
                console.log(`[Redis-Bridge] Received from ${channel}:`, envelope.id);
                callback(envelope);
                this.emit('egress', envelope);
            }
            catch (error) {
                console.error('[Redis-Bridge] Invalid egress message:', error);
            }
        });
        console.log(`[Redis-Bridge] Subscribed to ${channel}`);
    }
    /**
     * Unsubscribe from agent's egress channel
     */
    async unsubscribeFromAgent(agentId) {
        const channel = `${this.config.egressChannelPrefix}:${agentId}`;
        await this.redisSubscriber.unsubscribe(channel);
        console.log(`[Redis-Bridge] Unsubscribed from ${channel}`);
    }
    /**
     * Wrap legacy message in TNF Envelope
     */
    wrapLegacyMessage(rawMessage, agentId) {
        return (0, tnf_envelope_1.createTNFEnvelope)('event', { agentId, role: 'worker' }, { broadcast: true }, {
            legacy: true,
            originalMessage: rawMessage,
        }, {
            channelId: rawMessage.channel,
        });
    }
    /**
     * Publish message to ingress (for direct use)
     */
    async publishToIngress(envelope) {
        if (!this.connected) {
            throw new Error('Not connected to Redis');
        }
        await this.redisClient.publish(this.config.ingressChannel, JSON.stringify(envelope));
        console.log(`[Redis-Bridge] Published to ingress:`, envelope.id);
    }
    /**
     * Publish message to specific agent's egress
     */
    async publishToAgent(agentId, envelope) {
        if (!this.connected) {
            throw new Error('Not connected to Redis');
        }
        const channel = `${this.config.egressChannelPrefix}:${agentId}`;
        await this.redisClient.publish(channel, JSON.stringify(envelope));
        console.log(`[Redis-Bridge] Published to ${channel}:`, envelope.id);
    }
    /**
     * Get connection status
     */
    isConnected() {
        return this.connected;
    }
}
exports.RedisRelayBridge = RedisRelayBridge;
/**
 * Create and configure bridge
 */
function createRedisRelayBridge(config) {
    return new RedisRelayBridge(config);
}
//# sourceMappingURL=redis-relay-bridge.js.map