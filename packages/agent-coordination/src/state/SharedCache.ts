import { EventEmitter } from 'events';
import Redis from 'ioredis';

/**
 * Shared cache for agent collaboration
 */
export class SharedCache extends EventEmitter {
  private redis: Redis;
  private readonly prefix: string;

  constructor(
    redisUrl: string = 'redis://default:mDNmtwseaVHcQsCHaIoZapjlWrvAjtot@tramway.proxy.rlwy.net:13570',
    prefix: string = 'cache'
  ) {
    super();
    this.redis = new Redis(redisUrl);
    this.prefix = prefix;
  }

  /**
   * Get a value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const value = await this.redis.get(fullKey);

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
      await this.redis.setex(fullKey, Math.floor(ttl / 1000), serialized);
    } else {
      await this.redis.set(fullKey, serialized);
    }

    this.emit('cache:set', key, value);
  }

  /**
   * Delete a value from cache
   */
  async delete(key: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const result = await this.redis.del(fullKey);

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
    const result = await this.redis.exists(fullKey);
    return result === 1;
  }

  /**
   * Get multiple values
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (keys.length === 0) return [];

    const fullKeys = keys.map((k) => this.getFullKey(k));
    const values = await this.redis.mget(...fullKeys);

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
    const pipeline = this.redis.pipeline();

    for (const [key, value] of Object.entries(entries)) {
      const fullKey = this.getFullKey(key);
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      pipeline.set(fullKey, serialized);
    }

    await pipeline.exec();
    this.emit('cache:mset', Object.keys(entries));
  }

  /**
   * Increment a value
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.getFullKey(key);
    const result = await this.redis.incrby(fullKey, amount);
    this.emit('cache:increment', key, amount);
    return result;
  }

  /**
   * Decrement a value
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    const fullKey = this.getFullKey(key);
    const result = await this.redis.decrby(fullKey, amount);
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

    const value = await this.redis.eval(script, 1, fullKey);

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
    const result = await this.redis.sadd(fullKey, ...members);
    this.emit('cache:set:add', key, members);
    return result;
  }

  /**
   * Remove from a set
   */
  async removeFromSet(key: string, ...members: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const result = await this.redis.srem(fullKey, ...members);
    this.emit('cache:set:remove', key, members);
    return result;
  }

  /**
   * Get set members
   */
  async getSetMembers(key: string): Promise<string[]> {
    const fullKey = this.getFullKey(key);
    return await this.redis.smembers(fullKey);
  }

  /**
   * Check if member is in set
   */
  async isSetMember(key: string, member: string): Promise<boolean> {
    const fullKey = this.getFullKey(key);
    const result = await this.redis.sismember(fullKey, member);
    return result === 1;
  }

  /**
   * Push to list (queue)
   */
  async pushToList(key: string, ...values: string[]): Promise<number> {
    const fullKey = this.getFullKey(key);
    const result = await this.redis.rpush(fullKey, ...values);
    this.emit('cache:list:push', key, values);
    return result;
  }

  /**
   * Pop from list (queue)
   */
  async popFromList(key: string): Promise<string | null> {
    const fullKey = this.getFullKey(key);
    return await this.redis.lpop(fullKey);
  }

  /**
   * Get list length
   */
  async getListLength(key: string): Promise<number> {
    const fullKey = this.getFullKey(key);
    return await this.redis.llen(fullKey);
  }

  /**
   * Get list range
   */
  async getListRange(key: string, start: number, end: number): Promise<string[]> {
    const fullKey = this.getFullKey(key);
    return await this.redis.lrange(fullKey, start, end);
  }

  /**
   * Set hash field
   */
  async setHashField(key: string, field: string, value: any): Promise<void> {
    const fullKey = this.getFullKey(key);
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    await this.redis.hset(fullKey, field, serialized);
    this.emit('cache:hash:set', key, field);
  }

  /**
   * Get hash field
   */
  async getHashField<T>(key: string, field: string): Promise<T | null> {
    const fullKey = this.getFullKey(key);
    const value = await this.redis.hget(fullKey, field);

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
    const hash = await this.redis.hgetall(fullKey);

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
    const result = await this.redis.hdel(fullKey, field);
    return result > 0;
  }

  /**
   * Get keys matching pattern
   */
  async getKeys(pattern: string = '*'): Promise<string[]> {
    const fullPattern = this.getFullKey(pattern);
    const keys = await this.redis.keys(fullPattern);

    // Remove prefix from keys
    return keys.map((key) => key.substring(this.prefix.length + 1));
  }

  /**
   * Clear all cache entries with prefix
   */
  async clear(): Promise<void> {
    const keys = await this.redis.keys(`${this.prefix}:*`);

    if (keys.length > 0) {
      await this.redis.del(...keys);
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
    const keys = await this.redis.keys(`${this.prefix}:*`);
    const info = await this.redis.info('memory');

    const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
    const memoryUsed = memoryMatch ? memoryMatch[1] : 'unknown';

    return {
      keyCount: keys.length,
      memoryUsed,
    };
  }

  /**
   * Get full key with prefix
   */
  private getFullKey(key: string): string {
    return `${this.prefix}:${key}`;
  }

  /**
   * Close Redis connection
   */
  async close(): Promise<void> {
    await this.redis.quit();
    this.removeAllListeners();
  }
}
