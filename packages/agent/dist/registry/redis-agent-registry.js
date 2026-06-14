"use strict";
/**
 * Redis Agent Registry
 *
 * Implements capability-based discovery and dual-registration logic
 * Stores agent metadata in Redis with TTL for presence
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisAgentRegistry = exports.AgentMetadata = void 0;
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const ioredis_1 = __importDefault(require("ioredis"));
const zod_1 = require("zod");
const AgentStatusSchema = zod_1.z.enum(['online', 'offline', 'busy', 'error']);
const CapabilitySchema = zod_1.z.object({
    name: zod_1.z.string(),
    version: zod_1.z.string().optional(),
});
exports.AgentMetadata = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    platform: zod_1.z.string().optional(),
    capabilities: zod_1.z.array(CapabilitySchema).optional(),
    status: AgentStatusSchema.optional(),
    gatewayId: zod_1.z.string().optional(),
    lastSeen: zod_1.z.number(),
    healthScore: zod_1.z.number().min(0).max(1).optional(),
    metadata: zod_1.z.record(zod_1.z.string(), zod_1.z.unknown()).optional(),
});
class RedisAgentRegistry {
    constructor(config = {}) {
        this.redis = null;
        this.upstash = null;
        this.config = {
            redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
            prefix: config.prefix || 'tnf:registry:agents',
            ttl: config.ttl || 60,
        };
    }
    async connect() {
        this.redis = (0, infrastructure_1.createStandaloneRedisClient)({ redisUrl: this.config.redisUrl, lazyConnect: true });
        this.upstash = (0, infrastructure_1.createUpstashRestClient)();
        if (this.redis instanceof ioredis_1.default) {
            await this.redis.connect().catch(() => { });
        }
    }
    async disconnect() {
        if (this.redis)
            await this.redis.quit();
        this.upstash = null;
    }
    /**
     * Register agent with capabilities
     * Also serves as a heartbeat
     */
    async register(metadata) {
        const agentId = metadata.id;
        const key = `${this.config.prefix}:${agentId}`;
        // Fetch old capabilities for diffing to update sets
        const oldAgent = await this.getAgent(agentId);
        const oldCapabilities = new Set(oldAgent?.capabilities?.map((c) => c.name) || []);
        const fullMetadata = {
            ...metadata,
            platform: metadata.platform || 'unknown',
            capabilities: metadata.capabilities || [],
            status: metadata.status || 'online',
            healthScore: metadata.healthScore ?? 1.0,
            metadata: metadata.metadata || {},
            lastSeen: Date.now(),
        };
        const newCapabilities = new Set(fullMetadata.capabilities?.map((c) => c.name) || []);
        const capabilitiesToAdd = [...newCapabilities].filter((c) => !oldCapabilities.has(c));
        const capabilitiesToRemove = [...oldCapabilities].filter((c) => !newCapabilities.has(c));
        if (this.upstash) {
            const pipeline = this.upstash.pipeline();
            const hashData = {
                ...fullMetadata,
                capabilities: JSON.stringify(fullMetadata.capabilities),
                metadata: JSON.stringify(fullMetadata.metadata),
                healthScore: (fullMetadata.healthScore ?? 1.0).toString(),
            };
            pipeline.hset(key, hashData);
            pipeline.expire(key, this.config.ttl);
            for (const cap of capabilitiesToAdd) {
                pipeline.sadd(`${this.config.prefix}:capability:${cap}`, agentId);
            }
            for (const cap of capabilitiesToRemove) {
                pipeline.srem(`${this.config.prefix}:capability:${cap}`, agentId);
            }
            if (fullMetadata.healthScore) {
                pipeline.zadd(`${this.config.prefix}:health`, {
                    score: fullMetadata.healthScore,
                    member: agentId,
                });
            }
            await pipeline.exec();
        }
        else if (this.redis) {
            const multi = this.redis.multi();
            multi.hset(key, {
                ...fullMetadata,
                capabilities: JSON.stringify(fullMetadata.capabilities),
                metadata: JSON.stringify(fullMetadata.metadata),
                healthScore: (fullMetadata.healthScore ?? 1.0).toString(),
            });
            multi.expire(key, this.config.ttl);
            for (const cap of capabilitiesToAdd) {
                multi.sadd(`${this.config.prefix}:capability:${cap}`, agentId);
            }
            for (const cap of capabilitiesToRemove) {
                multi.srem(`${this.config.prefix}:capability:${cap}`, agentId);
            }
            if (fullMetadata.healthScore) {
                multi.zadd(`${this.config.prefix}:health`, fullMetadata.healthScore, agentId);
            }
            await multi.exec();
        }
    }
    /**
     * Update heartbeat (refresh TTL and lastSeen)
     */
    async updateHeartbeat(agentId) {
        const key = `${this.config.prefix}:${agentId}`;
        if (this.upstash) {
            const pipeline = this.upstash.pipeline();
            pipeline.hset(key, { lastSeen: Date.now().toString() });
            pipeline.expire(key, this.config.ttl);
            await pipeline.exec();
        }
        else if (this.redis) {
            const multi = this.redis.multi();
            multi.hset(key, 'lastSeen', Date.now());
            multi.expire(key, this.config.ttl);
            await multi.exec();
        }
    }
    /**
     * Unregister agent (explicit offline)
     */
    async unregister(agentId) {
        const key = `${this.config.prefix}:${agentId}`;
        const agent = await this.getAgent(agentId);
        if (!agent)
            return;
        if (this.upstash) {
            const pipeline = this.upstash.pipeline();
            if (agent.capabilities) {
                for (const cap of agent.capabilities) {
                    pipeline.srem(`${this.config.prefix}:capability:${cap.name}`, agentId);
                }
            }
            pipeline.del(key);
            pipeline.zrem(`${this.config.prefix}:health`, agentId);
            await pipeline.exec();
        }
        else if (this.redis) {
            const multi = this.redis.multi();
            if (agent.capabilities) {
                for (const cap of agent.capabilities) {
                    multi.srem(`${this.config.prefix}:capability:${cap.name}`, agentId);
                }
            }
            multi.del(key);
            multi.zrem(`${this.config.prefix}:health`, agentId);
            await multi.exec();
        }
    }
    /**
     * Get agent details
     */
    async getAgent(agentId) {
        const key = `${this.config.prefix}:${agentId}`;
        let data = {};
        if (this.upstash) {
            data = (await this.upstash.hgetall(key)) || {};
        }
        else if (this.redis) {
            data = await this.redis.hgetall(key);
        }
        return this.parseAgentData(data);
    }
    parseAgentData(data) {
        if (!data || Object.keys(data).length === 0) {
            return null;
        }
        try {
            const agentData = {
                ...data,
                capabilities: JSON.parse(data.capabilities || '[]'),
                metadata: JSON.parse(data.metadata || '{}'),
                lastSeen: parseInt(data.lastSeen || '0', 10),
                healthScore: data.healthScore ? parseFloat(data.healthScore) : undefined,
            };
            return exports.AgentMetadata.parse(agentData);
        }
        catch (error) {
            console.error(`[AgentRegistry] Failed to parse metadata for agent ${data.id}`, error);
            return null;
        }
    }
    /**
     * Find agents by capability
     */
    async findAgentsByCapability(capability) {
        const capabilityKey = `${this.config.prefix}:capability:${capability}`;
        let agentIds = [];
        if (this.upstash) {
            agentIds = await this.upstash.smembers(capabilityKey);
        }
        else if (this.redis) {
            agentIds = await this.redis.smembers(capabilityKey);
        }
        if (agentIds.length === 0) {
            return [];
        }
        const agents = [];
        for (const agentId of agentIds) {
            const agent = await this.getAgent(agentId);
            if (agent)
                agents.push(agent);
        }
        return agents;
    }
    /**
     * List all online agents using SCAN to avoid blocking Redis
     */
    async listAgents() {
        const agents = [];
        const pattern = `${this.config.prefix}:*`;
        let cursor = '0';
        do {
            let keys = [];
            if (this.upstash) {
                const [nextCursor, foundKeys] = await this.upstash.scan(Number(cursor), { match: pattern, count: 100 });
                cursor = String(nextCursor);
                keys = foundKeys;
            }
            else if (this.redis) {
                const [nextCursor, foundKeys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
                cursor = nextCursor;
                keys = foundKeys;
            }
            const filteredKeys = keys.filter((key) => !key.includes(':capability:') && !key.includes(':health'));
            for (const key of filteredKeys) {
                const agentId = key.split(':').pop();
                if (agentId) {
                    const agent = await this.getAgent(agentId);
                    if (agent)
                        agents.push(agent);
                }
            }
        } while (cursor !== '0');
        return agents;
    }
    /**
     * Get agents with a health score above a certain threshold
     */
    async getHealthyAgents(minScore = 0.9) {
        const healthKey = `${this.config.prefix}:health`;
        let agentIds = [];
        if (this.upstash) {
            // Upstash zrange doesn't always support byScore directly in the same way, using generic approach
            agentIds = await this.upstash.zrange(healthKey, minScore, 1, { byScore: true });
        }
        else if (this.redis) {
            agentIds = await this.redis.zrangebyscore(healthKey, minScore, 1);
        }
        if (agentIds.length === 0) {
            return [];
        }
        const agents = [];
        for (const agentId of agentIds) {
            const agent = await this.getAgent(agentId);
            if (agent)
                agents.push(agent);
        }
        return agents;
    }
}
exports.RedisAgentRegistry = RedisAgentRegistry;
//# sourceMappingURL=redis-agent-registry.js.map