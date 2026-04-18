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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisRelayBridge = void 0;
exports.createRedisRelayBridge = createRedisRelayBridge;
// @ts-ignore
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const events_1 = require("events");
const ioredis_1 = __importDefault(require("ioredis"));
const identity_js_1 = require("./contracts/identity.js");
const tnf_envelope_js_1 = require("./protocol/tnf-envelope.js");
class RedisRelayBridge extends events_1.EventEmitter {
    constructor(config = {}) {
        super();
        this.upstashClient = null;
        this.connected = false;
        this.config = {
            redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
            ingressChannel: config.ingressChannel || 'tnf:bus:ingress',
            egressChannelPrefix: config.egressChannelPrefix || 'tnf:bus:egress',
            enableLegacyShim: config.enableLegacyShim ?? true,
        };
        // Create Redis clients using unified standalone utility
        this.redisClient = (0, infrastructure_1.createStandaloneRedisClient)({
            redisUrl: this.config.redisUrl,
            lazyConnect: true,
        });
        this.redisSubscriber = (0, infrastructure_1.createStandaloneRedisClient)({
            redisUrl: this.config.redisUrl,
            lazyConnect: true,
        });
        // Create Upstash REST client if available
        this.upstashClient = (0, infrastructure_1.createUpstashRestClient)();
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
            // ioredis connects automatically or via .connect() if lazyConnect is true
            if (this.redisClient instanceof ioredis_1.default)
                await this.redisClient.connect();
            if (this.redisSubscriber instanceof ioredis_1.default)
                await this.redisSubscriber.connect();
            this.connected = true;
            if (this.upstashClient) {
                console.log('[Redis-Bridge] Connected to Redis (Hybrid: Upstash REST + ioredis TCP)');
            }
            else {
                console.log('[Redis-Bridge] Connected to Redis (ioredis TCP)');
            }
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
            envelope = (0, tnf_envelope_js_1.validateTNFEnvelope)(rawMessage);
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
            const normalizedEnvelope = (0, tnf_envelope_js_1.validateTNFEnvelope)(envelope);
            await this.redisClient.publish(this.config.ingressChannel, JSON.stringify(normalizedEnvelope));
            console.log(`[Redis-Bridge] Published to ${this.config.ingressChannel}:`, normalizedEnvelope.id);
            this.emit('ingress', normalizedEnvelope);
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
        await this.redisSubscriber.subscribe(channel);
        this.redisSubscriber.on('message', (ch, message) => {
            if (ch === channel) {
                try {
                    const envelope = (0, tnf_envelope_js_1.validateTNFEnvelope)(JSON.parse(message));
                    console.log(`[Redis-Bridge] Received from ${channel}:`, envelope.id);
                    callback(envelope);
                    this.emit('egress', envelope);
                }
                catch (error) {
                    console.error('[Redis-Bridge] Invalid egress message:', error);
                }
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
        const identity = (0, identity_js_1.createAgentIdentityRecord)({
            operationalHandle: agentId,
            runtimeSessionId: agentId,
            aliases: [agentId],
        });
        const payloadMetadata = rawMessage?.payload && typeof rawMessage.payload === 'object'
            ? rawMessage.payload.metadata
            : undefined;
        const metadata = (typeof rawMessage?.metadata === 'object' ? rawMessage.metadata : payloadMetadata) ||
            undefined;
        return (0, tnf_envelope_js_1.createTNFEnvelope)('event', {
            agentId,
            operationalHandle: identity.operationalHandle,
            runtimeSessionId: identity.runtimeSessionId || undefined,
            aliases: identity.aliases,
            role: 'worker',
            platform: typeof rawMessage?.platform === 'string' ? rawMessage.platform : undefined,
        }, { broadcast: true }, {
            legacy: true,
            originalMessage: rawMessage,
        }, {
            channelId: rawMessage.channel,
            sessionId: identity.runtimeSessionId || agentId,
        }, {
            metadata,
            audit: {
                source: 'redis-relay-bridge',
                actor: identity.operationalHandle,
                channelId: rawMessage.channel,
                sessionId: identity.runtimeSessionId || agentId,
                operationalHandle: identity.operationalHandle,
                runtimeSessionId: identity.runtimeSessionId,
                canonicalEntityId: identity.canonicalEntityId,
            },
        });
    }
    /**
     * Publish message to ingress (for direct use)
     */
    async publishToIngress(envelope) {
        if (!this.connected) {
            throw new Error('Not connected to Redis');
        }
        const normalizedEnvelope = (0, tnf_envelope_js_1.validateTNFEnvelope)(envelope);
        await this.redisClient.publish(this.config.ingressChannel, JSON.stringify(normalizedEnvelope));
        console.log(`[Redis-Bridge] Published to ingress:`, normalizedEnvelope.id);
    }
    /**
     * Publish message to specific agent's egress
     */
    async publishToAgent(agentId, envelope) {
        if (!this.connected) {
            throw new Error('Not connected to Redis');
        }
        const channel = `${this.config.egressChannelPrefix}:${agentId}`;
        const normalizedEnvelope = (0, tnf_envelope_js_1.validateTNFEnvelope)(envelope);
        await this.redisClient.publish(channel, JSON.stringify(normalizedEnvelope));
        console.log(`[Redis-Bridge] Published to ${channel}:`, normalizedEnvelope.id);
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