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

export const AgentMetadata = z.object({
  id: z.string(),
  name: z.string(),
  platform: z.string().optional(),
  capabilities: z.array(z.string()).optional(),
  status: z.enum(['online', 'offline', 'busy', 'error']).optional(),
  gatewayId: z.string().optional(),
  lastSeen: z.number(),
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
      redisUrl: config.redisUrl || process.env.REDIS_URL || 'redis://localhost:6379',
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
    const fullMetadata: AgentMetadata = {
      ...metadata,
      platform: metadata.platform || 'unknown',
      capabilities: metadata.capabilities || [],
      status: metadata.status || 'online',
      metadata: metadata.metadata || {},
      lastSeen: Date.now(),
    };

    const key = `${this.config.prefix}:${metadata.id}`;

    // Use transaction to set hash and expiry
    const multi = this.redis.multi();
    multi.hSet(key, {
      ...fullMetadata,
      capabilities: JSON.stringify(fullMetadata.capabilities),
      metadata: JSON.stringify(fullMetadata.metadata),
    });
    multi.expire(key, this.config.ttl);

    await multi.exec();
  }

  /**
   * Unregister agent (explicit offline)
   */
  async unregister(agentId: string): Promise<void> {
    const key = `${this.config.prefix}:${agentId}`;
    await this.redis.del(key);
  }

  /**
   * Get agent details
   */
  async getAgent(agentId: string): Promise<AgentMetadata | null> {
    const key = `${this.config.prefix}:${agentId}`;
    const data = await this.redis.hGetAll(key);

    if (!data || Object.keys(data).length === 0) {
      return null;
    }

    // Parse JSON fields
    return {
      ...data,
      capabilities: JSON.parse(data.capabilities || '[]'),
      metadata: JSON.parse(data.metadata || '{}'),
      lastSeen: parseInt(data.lastSeen || '0', 10),
    } as AgentMetadata;
  }

  /**
   * Find agents by capability
   */
  async findAgentsByCapability(capability: string): Promise<AgentMetadata[]> {
    const keys = await this.redis.keys(`${this.config.prefix}:*`);
    const agents: AgentMetadata[] = [];

    for (const key of keys) {
      const data = await this.redis.hGetAll(key);
      if (data.capabilities) {
        const caps = JSON.parse(data.capabilities);
        if (caps.includes(capability)) {
          agents.push({
            ...data,
            capabilities: caps,
            metadata: data.metadata ? JSON.parse(data.metadata) : {},
            lastSeen: parseInt(data.lastSeen || '0', 10),
          } as AgentMetadata);
        }
      }
    }

    return agents;
  }

  /**
   * List all online agents
   */
  async listAgents(): Promise<AgentMetadata[]> {
    const keys = await this.redis.keys(`${this.config.prefix}:*`);
    const agents: AgentMetadata[] = [];

    for (const key of keys) {
      const data = await this.redis.hGetAll(key);
      if (Object.keys(data).length > 0) {
        agents.push({
          ...data,
          capabilities: data.capabilities ? JSON.parse(data.capabilities) : [],
          metadata: data.metadata ? JSON.parse(data.metadata) : {},
          lastSeen: parseInt(data.lastSeen || '0', 10),
        } as AgentMetadata);
      }
    }

    return agents;
  }
}
