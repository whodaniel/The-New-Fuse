/**
 * Redis Agent Registry
 *
 * Implements capability-based discovery and dual-registration logic
 * Stores agent metadata in Redis with TTL for presence
 */

import {
  createStandaloneRedisClient,
  createUpstashRestClient,
} from '@the-new-fuse/infrastructure';
import { Redis as UpstashRedis } from '@upstash/redis';
import Redis, { Cluster } from 'ioredis';
import { z } from 'zod';

const AgentStatusSchema = z.enum(['online', 'offline', 'busy', 'error']);
export type AgentStatus = z.infer<typeof AgentStatusSchema>;

const CapabilitySchema = z.object({
  name: z.string(),
  version: z.string().optional(),
});
export type Capability = z.infer<typeof CapabilitySchema>;

export const AgentMetadata = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.string().optional(),
  capabilities: z.array(CapabilitySchema).optional(),
  status: AgentStatusSchema.optional(),
  gatewayId: z.string().optional(),
  lastSeen: z.number(),
  healthScore: z.number().min(0).max(1).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type AgentMetadata = z.infer<typeof AgentMetadata>;

export interface AgentRegistryConfig {
  redisUrl: string;
  prefix: string;
  ttl: number; // Seconds
}

export class RedisAgentRegistry {
  private redis: Redis | Cluster | null = null;
  private upstash: UpstashRedis | null = null;
  private config: AgentRegistryConfig;

  constructor(config: Partial<AgentRegistryConfig> = {}) {
    this.config = {
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
      prefix: config.prefix || 'tnf:registry:agents',
      ttl: config.ttl || 60,
    };
  }

  async connect(): Promise<void> {
    this.redis = createStandaloneRedisClient({ redisUrl: this.config.redisUrl, lazyConnect: true } as any);
    this.upstash = createUpstashRestClient();

    if (this.redis instanceof Redis) {
      await this.redis.connect().catch(() => {});
    }
  }

  async disconnect(): Promise<void> {
    if (this.redis) await this.redis.quit();
    this.upstash = null;
  }

  /**
   * Register agent with capabilities
   * Also serves as a heartbeat
   */
  async register(metadata: Omit<AgentMetadata, 'lastSeen'>): Promise<void> {
    const agentId = metadata.id;
    const key = `${this.config.prefix}:${agentId}`;

    // Fetch old capabilities for diffing to update sets
    const oldAgent = await this.getAgent(agentId);
    const oldCapabilities = new Set(oldAgent?.capabilities?.map((c) => c.name) || []);

    const fullMetadata: AgentMetadata = {
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
    } else if (this.redis) {
      const multi = (this.redis as any).multi();
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
  async updateHeartbeat(agentId: string): Promise<void> {
    const key = `${this.config.prefix}:${agentId}`;

    if (this.upstash) {
      const pipeline = this.upstash.pipeline();
      pipeline.hset(key, { lastSeen: Date.now().toString() });
      pipeline.expire(key, this.config.ttl);
      await pipeline.exec();
    } else if (this.redis) {
      const multi = (this.redis as any).multi();
      multi.hset(key, 'lastSeen', Date.now());
      multi.expire(key, this.config.ttl);
      await multi.exec();
    }
  }

  /**
   * Unregister agent (explicit offline)
   */
  async unregister(agentId: string): Promise<void> {
    const key = `${this.config.prefix}:${agentId}`;
    const agent = await this.getAgent(agentId);
    if (!agent) return;

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
    } else if (this.redis) {
      const multi = (this.redis as any).multi();
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
  async getAgent(agentId: string): Promise<AgentMetadata | null> {
    const key = `${this.config.prefix}:${agentId}`;
    let data: Record<string, string> = {};
    if (this.upstash) {
      data = (await this.upstash.hgetall<Record<string, string>>(key)) || {};
    } else if (this.redis) {
      data = await this.redis.hgetall(key);
    }
    return this.parseAgentData(data);
  }

  private parseAgentData(data: Record<string, string>): AgentMetadata | null {
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
      return AgentMetadata.parse(agentData);
    } catch (error) {
      console.error(`[AgentRegistry] Failed to parse metadata for agent ${data.id}`, error);
      return null;
    }
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: string): Promise<AgentMetadata[]> {
    const capabilityKey = `${this.config.prefix}:capability:${capability}`;
    let agentIds: string[] = [];

    if (this.upstash) {
      agentIds = await this.upstash.smembers(capabilityKey);
    } else if (this.redis) {
      agentIds = await this.redis.smembers(capabilityKey);
    }

    if (agentIds.length === 0) {
      return [];
    }

    const agents: AgentMetadata[] = [];
    for (const agentId of agentIds) {
      const agent = await this.getAgent(agentId);
      if (agent) agents.push(agent);
    }
    return agents;
  }

  /**
   * List all online agents using SCAN to avoid blocking Redis
   */
  async listAgents(): Promise<AgentMetadata[]> {
    const agents: AgentMetadata[] = [];
    const pattern = `${this.config.prefix}:*`;
    let cursor = '0';

    do {
      let keys: string[] = [];
      if (this.upstash) {
        const [nextCursor, foundKeys] = await this.upstash.scan(Number(cursor), { match: pattern, count: 100 });
        cursor = String(nextCursor);
        keys = foundKeys;
      } else if (this.redis) {
        const [nextCursor, foundKeys] = await this.redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        keys = foundKeys;
      }

      const filteredKeys = keys.filter(
        (key: any) => !key.includes(':capability:') && !key.includes(':health')
      );

      for (const key of filteredKeys) {
        const agentId = key.split(':').pop();
        if (agentId) {
          const agent = await this.getAgent(agentId);
          if (agent) agents.push(agent);
        }
      }
    } while (cursor !== '0');

    return agents;
  }

  /**
   * Get agents with a health score above a certain threshold
   */
  async getHealthyAgents(minScore = 0.9): Promise<AgentMetadata[]> {
    const healthKey = `${this.config.prefix}:health`;
    let agentIds: string[] = [];

    if (this.upstash) {
      // Upstash zrange doesn't always support byScore directly in the same way, using generic approach
      agentIds = await this.upstash.zrange(healthKey, minScore, 1, { byScore: true });
    } else if (this.redis) {
      agentIds = await (this.redis as any).zrangebyscore(healthKey, minScore, 1);
    }

    if (agentIds.length === 0) {
      return [];
    }

    const agents: AgentMetadata[] = [];
    for (const agentId of agentIds) {
      const agent = await this.getAgent(agentId);
      if (agent) agents.push(agent);
    }
    return agents;
  }
}
