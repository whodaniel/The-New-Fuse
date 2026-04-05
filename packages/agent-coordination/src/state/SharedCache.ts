import { EventEmitter } from 'events';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

/**
 * Shared cache for agent collaboration
 */
export class SharedCache extends EventEmitter {
  private redisService: UnifiedRedisService;
  private readonly prefix: string;

  constructor(redisService: UnifiedRedisService, prefix: string = 'cache') {
    super();
    this.redisService = redisService;
    this.prefix = prefix;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const value = await this.redisService.get(fullKey);

    if (value === null) {
      return null;
    }

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Set a value in cache
   */
  async set(key: string, value: any, ttl?: number): Promise<void> {
    const fullKey = this.getFullKey(key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl) {
      await this.redisService.set(fullKey, serialized, Math.floor(ttl / 1000));
    } else {
      await this.redisService.set(fullKey, serialized);
    }

    this.emit('cache:set', key, value);
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const result = await this.redisService.del(fullKey);

    if (result > 0) {
      this.emit('cache:delete', key);
      return true;
    }

    return false;
  }

  /**
   * Check if key exists
   */
  async exists(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    return await this.redisService.exists(fullKey);
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    const fullKeys = keys.map((k) => this.getFullKey(k));
    const values = await this.redisService.mget(...fullKeys);

    return values.map((value) => {
      if (value === null) return null;
      try {
        return JSON.parse(value) as T;
      } catch {
        return value as unknown as T;
      }
    });
  }

  /**
   * Set multiple values
   */
  async mset(entries: Record<string, any>): Promise<void> {
    const data: Record<string, string> = {};

    for (const [key, value] of Object.entries(entries)) {
      const fullKey = this.getFullKey(key);
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      data[fullKey] = serialized;
    }

    await this.redisService.mset(data);
    this.emit('cache:mset', Object.keys(entries));
  }

  /**
   * Increment a value
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.getFullKey(key);
    const result = await this.redisService.incrby(fullKey, amount);
    this.emit('cache:increment', key, amount);
    return result;
  }

  /**
   * Decrement a value
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.getFullKey(key);
    const result = await this.redisService.decrby(fullKey, amount);
    this.emit('cache:decrement', key, amount);
    return result;
  }

  /**
   * Get and delete (atomic)
   */
  async getAndDelete<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);

    const script = `
      local value = redis.call("get", KEYS[1])
      if value then
        redis.call("del", KEYS[1])
      end
      return value
    `;

    const value = await this.redisService.eval(script, [fullKey], []);

    if (value === null) return null;

    try {
      return JSON.parse(value as string) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Add to a set
   */
  async addToSet(key: string, ...members: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const result = await this.redisService.sadd(fullKey, ...members);
    this.emit('cache:set:add', key, members);
    return result;
  }

  /**
   * Remove from a set
   */
  async removeFromSet(key: string, ...members: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const result = await this.redisService.srem(fullKey, ...members);
    this.emit('cache:set:remove', key, members);
    return result;
  }

  /**
   * Get set members
   */
  async getSetMembers(key: string): Promise<string[]> {
    const fullKey = this.getFullKey(key);
    return await this.redisService.smembers(fullKey);
  }

  /**
   * Check if member is in set
   */
  async isSetMember(key: string, member: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    return await this.redisService.sismember(fullKey, member);
  }

  /**
   * Push to list (queue)
   */
  async pushToList(key: string, ...values: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const result = await this.redisService.rpush(fullKey, ...values);
    this.emit('cache:list:push', key, values);
    return result;
  }

  /**
   * Pop from list (queue)
   */
  async popFromList(key: string): Promise<string | null> {
    const fullKey = this.getFullKey(key);
    return await this.redisService.lpop(fullKey);
  }

  /**
   * Get list length
   */
  async getListLength(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return await this.redisService.llen(fullKey);
  }

  /**
   * Get list range
   */
  async getListRange(key: string, start: number, end: number): Promise<string[]> {
    const fullKey = this.getFullKey(key);
    return await this.redisService.lrange(fullKey, start, end);
  }

  /**
   * Set hash field
   */
  async setHashField(key: string, field: string, value: any): Promise<void> {
    const fullKey = this.getFullKey(key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redisService.hset(fullKey, field, serialized);
    this.emit('cache:hash:set', key, field);
  }

  /**
   * Get hash field
   */
  async getHashField<T>(key: string, field: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const value = await this.redisService.hget(fullKey, field);

    if (value === null) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  /**
   * Get all hash fields
   */
  async getHashAll<T>(key: string): Promise<Record<string, T>> {
    const fullKey = this.getFullKey(key);
    const hash = await this.redisService.hgetall(fullKey);

    const result: Record<string, T> = {};
    for (const [field, value] of Object.entries(hash)) {
      try {
        result[field] = JSON.parse(value) as T;
      } catch {
        result[field] = value as unknown as T;
      }
    }

    return result;
  }

  /**
   * Delete hash field
   */
  async deleteHashField(key: string, field: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const result = await this.redisService.hdel(fullKey, field);
    return result > 0;
  }

  /**
   * Get keys matching pattern
   */
  async getKeys(pattern: string = '*'): Promise<string[]> {
    const fullPattern = this.getFullKey(pattern);
    const keys = await this.redisService.keys(fullPattern);

    // Remove prefix from keys
    return keys.map((key) => key.substring(this.prefix.length + 1));
  }

  /**
   * Clear all cache entries with prefix
   */
  async clear(): Promise<void> {
    const pattern = `${this.prefix}:*`;
    const keys = await this.redisService.keys(pattern);

    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.redisService.del(key)));
    }

    this.emit('cache:cleared');
  }

  /**
   * Get cache statistics
   */
  async getStatistics(): Promise<{
    keyCount: number;
    memoryUsed: string;
    hitRate?: number;
  }> {
    const pattern = `${this.prefix}:*`;
    const keys = await this.redisService.keys(pattern);
    // Info('memory') is not yet in UnifiedRedisService, falling back to a dummy or extending it.
    // For now, let's keep it simple or skip the memory info if not critical.
    
    return {
      keyCount: keys.length,
      memoryUsed: 'unknown (managed)',
    };
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Close connections and cleanup
   */
  async close(): Promise<void> {
    this.removeAllListeners();
  }
}
