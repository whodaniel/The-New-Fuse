/**
 * Context management for agent operations
 * Handles context storage, retrieval, and synchronization
 */

import type { Redis } from 'ioredis';

export enum ContextType {
  AGENT = 'agent',
  SESSION = 'session',
  TASK = 'task',
  WORKFLOW = 'workflow',
  USER = 'user',
}

export interface ContextEntry {
  id: string;
  type: ContextType;
  data: Record<string, unknown>;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export class ContextManager {
  private contextType: ContextType;
  private entityId: string;
  private redisClient?: Redis;
  private localContext: Map<string, ContextEntry> = new Map();

  constructor(contextType: ContextType, entityId: string, redisClient?: Redis) {
    this.contextType = contextType;
    this.entityId = entityId;
    this.redisClient = redisClient;
  }

  /**
   * Store context entry
   */
  async store(
    key: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const entry: ContextEntry = {
      id: `${this.contextType}:${this.entityId}:${key}`,
      type: this.contextType,
      data,
      timestamp: Date.now(),
      metadata,
    };

    // Store locally
    this.localContext.set(key, entry);

    // Store in Redis if available
    if (this.redisClient) {
      await this.redisClient.set(
        entry.id,
        JSON.stringify(entry),
        'EX',
        3600 // 1 hour TTL
      );
    }
  }

  /**
   * Retrieve context entry
   */
  async retrieve(key: string): Promise<ContextEntry | null> {
    // Try local cache first
    const entry = this.localContext.get(key);
    if (entry) {
      return entry;
    }

    // Try Redis if available
    if (this.redisClient) {
      const entryId = `${this.contextType}:${this.entityId}:${key}`;
      const data = await this.redisClient.get(entryId);
      if (data) {
        const parsedEntry = JSON.parse(data) as ContextEntry;
        // Cache locally
        this.localContext.set(key, parsedEntry);
        return parsedEntry;
      }
    }

    return null;
  }

  /**
   * Update context entry
   */
  async update(
    key: string,
    data: Record<string, unknown>,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    const existing = await this.retrieve(key);
    if (existing) {
      existing.data = { ...existing.data, ...data };
      existing.timestamp = Date.now();
      if (metadata) {
        existing.metadata = { ...existing.metadata, ...metadata };
      }
      await this.store(key, existing.data, existing.metadata);
    } else {
      await this.store(key, data, metadata);
    }
  }

  /**
   * Remove context entry
   */
  async remove(key: string): Promise<void> {
    this.localContext.delete(key);

    if (this.redisClient) {
      const entryId = `${this.contextType}:${this.entityId}:${key}`;
      await this.redisClient.del(entryId);
    }
  }

  /**
   * Clear all context entries
   */
  async clear(): Promise<void> {
    this.localContext.clear();

    if (this.redisClient) {
      const pattern = `${this.contextType}:${this.entityId}:*`;
      const keys = await this.redisClient.keys(pattern);
      if (keys.length > 0) {
        await this.redisClient.del(...keys);
      }
    }
  }

  /**
   * Get all context keys
   */
  async getKeys(): Promise<string[]> {
    const localKeys = Array.from(this.localContext.keys());

    if (this.redisClient) {
      const pattern = `${this.contextType}:${this.entityId}:*`;
      const redisKeys = await this.redisClient.keys(pattern);
      const parsedKeys = redisKeys.map((key) => key.split(':').pop() || '');
      return Array.from(new Set([...localKeys, ...parsedKeys]));
    }

    return localKeys;
  }

  /**
   * Get context statistics
   */
  getStats(): { localCount: number; type: ContextType; entityId: string } {
    return {
      localCount: this.localContext.size,
      type: this.contextType,
      entityId: this.entityId,
    };
  }
}
