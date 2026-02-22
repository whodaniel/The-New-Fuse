/**
 * Redis Agent Registry
 *
 * Implements capability-based discovery and dual-registration logic
 * Stores agent metadata in Redis with TTL for presence
 */

import { createClient, RedisClientType } from 'redis';
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
  private redis: RedisClientType;
  private config: AgentRegistryConfig;

  constructor(config: Partial<AgentRegistryConfig> = {}) {
    this.config = {
      redisUrl:
        config.redisUrl ||
        process.env.REDIS_URL ||
        'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
      prefix: config.prefix || 'tnf:registry:agents',
      ttl: config.ttl || 60,
    };

    this.redis = createClient({ url: this.config.redisUrl });

    this.redis.on('error', (err) => console.error('[AgentRegistry] Redis error:', err));
  }

  async connect(): Promise<void> {
    await this.redis.connect();
  }

  async disconnect(): Promise<void> {
    await this.redis.quit();
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

    const multi = this.redis.multi();

    // Store agent hash
    multi.hSet(key, {
      ...fullMetadata,
      // Stringify complex types for Redis hash
      capabilities: JSON.stringify(fullMetadata.capabilities),
      metadata: JSON.stringify(fullMetadata.metadata),
      healthScore: (fullMetadata.healthScore ?? 1.0).toString(),
    });
    multi.expire(key, this.config.ttl);

    // Determine which capabilities to add and remove from sets
    const capabilitiesToAdd = [...newCapabilities].filter((c) => !oldCapabilities.has(c));
    const capabilitiesToRemove = [...oldCapabilities].filter((c) => !newCapabilities.has(c));

    // Update capability sets
    for (const cap of capabilitiesToAdd) {
      multi.sAdd(`${this.config.prefix}:capability:${cap}`, agentId);
    }
    for (const cap of capabilitiesToRemove) {
      multi.sRem(`${this.config.prefix}:capability:${cap}`, agentId);
    }

    // Update health score sorted set
    if (fullMetadata.healthScore) {
      multi.zAdd(`${this.config.prefix}:health`, {
        score: fullMetadata.healthScore,
        value: agentId,
      });
    }

    await multi.exec();
  }

  /**
   * Update heartbeat (refresh TTL and lastSeen)
   */
  async updateHeartbeat(agentId: string): Promise<void> {
    const key = `${this.config.prefix}:${agentId}`;

    // Use a transaction to update lastSeen and refresh TTL
    const multi = this.redis.multi();
    multi.hSet(key, 'lastSeen', Date.now());
    multi.expire(key, this.config.ttl);

    await multi.exec();
  }

  /**
   * Unregister agent (explicit offline)
   */
  async unregister(agentId: string): Promise<void> {
    const key = `${this.config.prefix}:${agentId}`;
    const agent = await this.getAgent(agentId);
    if (!agent) return;

    const multi = this.redis.multi();

    // Remove from capability sets
    if (agent.capabilities) {
      for (const cap of agent.capabilities) {
        multi.sRem(`${this.config.prefix}:capability:${cap.name}`, agentId);
      }
    }

    // Delete agent hash
    multi.del(key);

    // Remove from health score sorted set
    multi.zRem(`${this.config.prefix}:health`, agentId);

    await multi.exec();
  }

  /**
   * Get agent details
   */
  async getAgent(agentId: string): Promise<AgentMetadata | null> {
    const key = `${this.config.prefix}:${agentId}`;
    const data = await this.redis.hGetAll(key);
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
    const agentIds = await this.redis.sMembers(capabilityKey);

    if (agentIds.length === 0) {
      return [];
    }

    const multi = this.redis.multi();
    agentIds.forEach((agentId) => {
      multi.hGetAll(`${this.config.prefix}:${agentId}`);
    });

    const results = (await multi.exec()) as unknown as Record<string, string>[];
    return results
      .map((data) => this.parseAgentData(data))
      .filter((agent): agent is AgentMetadata => agent !== null);
  }

  /**
   * List all online agents using SCAN to avoid blocking Redis
   */
  async listAgents(): Promise<AgentMetadata[]> {
    const agents: AgentMetadata[] = [];
    let cursor = '0';

    do {
      const scanResult = await this.redis.scan(cursor as any, {
        MATCH: `${this.config.prefix}:*`,
        COUNT: 100,
      });

      cursor = scanResult.cursor.toString();
      const keys = scanResult.keys.filter(
        (key) => !key.includes(':capability:') && !key.includes(':health')
      );

      if (keys.length > 0) {
        const multi = this.redis.multi();
        keys.forEach((key) => {
          multi.hGetAll(key);
        });

        const results = (await multi.exec()) as unknown as Record<string, string>[];
        for (const data of results) {
          if (data && Object.keys(data).length > 0) {
            const agent = this.parseAgentData(data);
            if (agent) {
              agents.push(agent);
            }
          }
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
    const agentIds = await this.redis.zRangeByScore(
      healthKey,
      minScore,
      1 // max score
    );

    if (agentIds.length === 0) {
      return [];
    }

    const multi = this.redis.multi();
    agentIds.forEach((agentId) => {
      multi.hGetAll(`${this.config.prefix}:${agentId}`);
    });

    const results = (await multi.exec()) as unknown as Record<string, string>[];
    return results
      .map((data) => this.parseAgentData(data))
      .filter((agent): agent is AgentMetadata => agent !== null);
  }
}
