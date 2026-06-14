"use strict";
// packages/relay-core/src/services/redis-client-manager.service.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClientManager = void 0;
// Assuming @the-new-fuse/infrastructure is available or its utilities are moved here
// Assume a logger is passed or imported
function log(level, category, message, data = {}) {
    console.log(`[${level.toUpperCase()}] [${category}] ${message}`, data);
}
// Assume CONFIG or relevant parts of it are passed or imported
const CONFIG = {
    REDIS_URL: process.env.REDIS_URL,
    REDIS_KEYS: {
        INGRESS: 'tnf:bus:ingress',
        EGRESS_PREFIX: 'tnf:bus:egress',
        // other keys used for persistence
        AGENTS: 'tnf:master:agents',
        HEARTBEATS: 'tnf:master:heartbeats',
        CHANNELS: 'tnf:master:channels',
        TASKS: 'tnf:master:tasks:pending',
        TASKS_REALTIME: 'tnf:master:tasks:realtime',
        TASKS_PLANNING: 'tnf:master:tasks:planning',
        SUGGESTIONS: 'tnf:master:suggestions:votes',
        CHANGELOG: 'tnf:master:changelog:suggestions',
        KANBAN: 'tnf:master:kanban:delivery',
        LOGS: 'tnf:master:logs',
        STATE: 'tnf:master:state',
        SUPER_CYCLE: 'tnf:master:super-cycle',
        SELF_PROMPTS: 'tnf:master:self-prompts',
    },
};
class RedisClientManager {
    constructor(config, logger, onIngressMessage, onRelayAgentRegisterRequest) {
        this.redis = null;
        this.redisSub = null;
        this.upstash = null; // Upstash REST client
        this.config = config;
        this.logger = logger;
        this.onIngressMessage = onIngressMessage;
        this.onRelayAgentRegisterRequest = onRelayAgentRegisterRequest;
    }
    async connectRedis() {
        this.logger('info', 'REDIS', 'Connecting to Redis for cloud coordination...');
        if (!this.config.REDIS_URL) {
            this.logger('warn', 'REDIS', 'REDIS_URL not configured. Skipping Redis connection.');
            return;
        }
        try {
            // Use unified standalone utilities via dynamic import for ESM/CJS compatibility
            // This dependency @the-new-fuse/infrastructure will need to be properly managed.
            // For now, assuming it's importable.
            const infrastructure = await import('@the-new-fuse/infrastructure');
            this.redis = infrastructure.createStandaloneRedisClient({ lazyConnect: true });
            this.redisSub = infrastructure.createStandaloneRedisClient({ lazyConnect: true });
            this.upstash = infrastructure.createUpstashRestClient();
            if (this.redis) {
                this.redis.on('error', (err) => this.logger('error', 'REDIS', `Client error: ${err.message}`));
                await infrastructure.connectStandaloneRedisClient(this.redis).catch((err) => {
                    this.logger('warn', 'REDIS', `Failed to connect primary client (TCP): ${err.message}`);
                });
            }
            if (this.redisSub) {
                this.redisSub.on('error', (err) => this.logger('error', 'REDIS', `Subscriber error: ${err.message}`));
                await infrastructure.connectStandaloneRedisClient(this.redisSub).catch((err) => {
                    this.logger('warn', 'REDIS', `Failed to connect subscriber client (TCP): ${err.message}`);
                });
                // Subscribe to ingress for messages from other components and agent registration requests from relay
                await this.redisSub.subscribe(this.config.REDIS_KEYS.INGRESS, 'tnf:relay:agent_register_requests');
                this.redisSub.on('message', (channel, message) => {
                    try {
                        const envelope = JSON.parse(message);
                        if (channel === this.config.REDIS_KEYS.INGRESS) {
                            this.onIngressMessage(envelope);
                        }
                        else if (channel === 'tnf:relay:agent_register_requests') {
                            void this.onRelayAgentRegisterRequest(envelope).catch((e) => {
                                this.logger('error', 'REDIS', `Error handling relay agent register request: ${e.message}`);
                            });
                        }
                    }
                    catch (e) {
                        // Invalid message
                        this.logger('warn', 'REDIS', `Invalid Redis message on channel ${channel}: ${e.message}`);
                    }
                });
            }
            this.logger('info', 'REDIS', '✅ Connected to Redis cloud coordination');
        }
        catch (error) {
            this.logger('error', 'REDIS', `Failed to initialize Redis: ${error.message}`);
        }
    }
    async quit() {
        this.logger('info', 'REDIS', 'Shutting down Redis connections...');
        if (this.redis) {
            await this.redis.quit();
            this.redis = null;
        }
        if (this.redisSub) {
            await this.redisSub.quit();
            this.redisSub = null;
        }
        this.upstash = null; // Upstash client doesn't need explicit quit
        this.logger('info', 'REDIS', 'Redis connections closed.');
    }
    // Generic methods for other services to use
    async hset(key, field, value) {
        if (this.upstash) {
            // Upstash's hset takes an object for multiple fields or field, value for single
            if (typeof field === 'object') {
                return this.upstash.hset(key, field);
            }
            return this.upstash.hset(key, { [field]: value });
        }
        else if (this.redis) {
            if (typeof field === 'object') {
                // Redis hset can take key, field1, value1, field2, value2...
                // Need to flatten the object
                const args = [];
                for (const [k, v] of Object.entries(field)) {
                    args.push(k, String(v));
                }
                return this.redis.hset(key, ...args);
            }
            return this.redis.hset(key, field, value);
        }
        this.logger('warn', 'REDIS', `HSET failed: Redis not connected. Key: ${key}`);
        return null;
    }
    async smembers(key) {
        if (this.upstash) {
            return this.upstash.smembers(key);
        }
        else if (this.redis) {
            return this.redis.smembers(key);
        }
        this.logger('warn', 'REDIS', `SMEMBERS failed: Redis not connected. Key: ${key}`);
        return [];
    }
    async sadd(key, member) {
        if (this.upstash) {
            return this.upstash.sadd(key, member);
        }
        else if (this.redis) {
            return this.redis.sadd(key, member);
        }
        this.logger('warn', 'REDIS', `SADD failed: Redis not connected. Key: ${key}`);
        return 0;
    }
    async lpush(key, value) {
        if (this.upstash) {
            return this.upstash.lpush(key, value);
        }
        else if (this.redis) {
            return this.redis.lpush(key, value);
        }
        this.logger('warn', 'REDIS', `LPUSH failed: Redis not connected. Key: ${key}`);
        return 0;
    }
    async ltrim(key, start, stop) {
        if (this.upstash) {
            // Upstash client might not have direct ltrim, but typical Redis REST APIs would.
            // Assuming it exists or will be proxied.
            // This would require a more specific Upstash client implementation if not directly available.
            this.logger('warn', 'REDIS', `ltrim not natively supported/implemented for Upstash client directly. Key: ${key}`);
            return; // Or throw error
        }
        else if (this.redis) {
            return this.redis.ltrim(key, start, stop);
        }
        this.logger('warn', 'REDIS', `LTRIM failed: Redis not connected. Key: ${key}`);
        return null;
    }
    async publish(channel, message) {
        if (this.upstash) {
            // Upstash REST client might need a specific /publish endpoint
            // Assuming a generic publish method exists for the Upstash client.
            return this.upstash.publish(channel, message);
        }
        else if (this.redis) {
            return this.redis.publish(channel, message);
        }
        this.logger('warn', 'REDIS', `PUBLISH failed: Redis not connected. Channel: ${channel}`);
        return 0;
    }
    async del(key) {
        if (this.upstash) {
            return this.upstash.del(key);
        }
        else if (this.redis) {
            return this.redis.del(key);
        }
        this.logger('warn', 'REDIS', `DEL failed: Redis not connected. Key: ${key}`);
        return 0;
    }
    // Expose redis and upstash instances for direct access by other services if needed
    // This breaks encapsulation a bit, but might be necessary for specific complex operations
    // where the generic methods are insufficient.
    get rawRedisClient() {
        return this.redis;
    }
    get rawUpstashClient() {
        return this.upstash;
    }
    get redisKeys() {
        return this.config.REDIS_KEYS;
    }
}
exports.RedisClientManager = RedisClientManager;
//# sourceMappingURL=redis-client-manager.service.js.map