import { BaseService } from '../core/BaseService.js';
import { Logger } from '../types/core.js';
import { UnifiedRedisService, QueueTask } from '@the-new-fuse/infrastructure';
import { ConfigService } from './ConfigService.js';

/**
 * Service for interacting with Redis via UnifiedRedisService.
 * Provides Redis commands while maintaining BaseService compatibility.
 */
export class RedisService extends BaseService {
  private logger: Logger;

  constructor(
    configService: ConfigService,
    private readonly unifiedRedis: UnifiedRedisService
  ) {
    super({ name: 'RedisService' });
    this.logger = new Logger('RedisService');
    
    this.logger.info('Agent Redis Service initialized with UnifiedRedisService');
  }

  /**
   * Connection is managed by UnifiedRedisService
   */
  async connect(): Promise<void> {
    // UnifiedRedisService handles connection management
    this.logger.debug('Connection managed by UnifiedRedisService');
  }

  /**
   * Disconnection is managed by UnifiedRedisService
   */
  async disconnect(): Promise<void> {
    // UnifiedRedisService handles connection cleanup
    this.logger.debug('Disconnection managed by UnifiedRedisService');
  }

  /**
   * Gets the UnifiedRedisService instance.
   */
  getClient(): UnifiedRedisService {
    return this.unifiedRedis;
  }

  // --- Redis Commands ---

  async set(key: string, value: string | number | Buffer, expirySeconds?: number): Promise<void> {
    const stringValue = typeof value === 'string' ? value : String(value);
    await this.unifiedRedis.set(key, stringValue, expirySeconds);
  }

  async get(key: string): Promise<string | null> {
    return this.unifiedRedis.get(key);
  }

  async del(key: string | string[]): Promise<number> {
    if (Array.isArray(key)) {
      let deleted = 0;
      for (const k of key) {
        deleted += await this.unifiedRedis.del(k);
      }
      return deleted;
    }
    return this.unifiedRedis.del(key);
  }

  async incr(key: string): Promise<number> {
    // Implement using get/set since UnifiedRedisService doesn't have incr
    const current = await this.unifiedRedis.get(key);
    const value = current ? parseInt(current, 10) + 1 : 1;
    await this.unifiedRedis.set(key, value.toString());
    return value;
  }

  async decr(key: string): Promise<number> {
    // Implement using get/set since UnifiedRedisService doesn't have decr
    const current = await this.unifiedRedis.get(key);
    const value = current ? parseInt(current, 10) - 1 : -1;
    await this.unifiedRedis.set(key, value.toString());
    return value;
  }

  async publish(channel: string, message: string | Buffer): Promise<void> {
    const messageStr = typeof message === 'string' ? message : message.toString();
    await this.unifiedRedis.publish(channel, { message: messageStr });
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.unifiedRedis.subscribe(channel, (pubSubMessage) => {
      const messageStr = typeof pubSubMessage.message === 'string' 
        ? pubSubMessage.message 
        : JSON.stringify(pubSubMessage.message);
      callback(messageStr);
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.unifiedRedis.unsubscribe(channel);
  }

  // Hash operations
  async hset(key: string, field: string, value: string): Promise<void>;
  async hset(key: string, data: Record<string, string>): Promise<void>;
  async hset(key: string, fieldOrData: string | Record<string, string>, value?: string): Promise<void> {
    if (typeof fieldOrData === 'string' && value !== undefined) {
      await this.unifiedRedis.hset(key, fieldOrData, value);
    } else if (typeof fieldOrData === 'object') {
      await this.unifiedRedis.hset(key, fieldOrData);
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.unifiedRedis.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.unifiedRedis.hgetall(key);
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.unifiedRedis.hdel(key, field);
  }

  // List operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.unifiedRedis.lpush(key, ...values);
  }

  async rpop(key: string): Promise<string | null> {
    return this.unifiedRedis.rpop(key);
  }

  async llen(key: string): Promise<number> {
    return this.unifiedRedis.llen(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.unifiedRedis.lrange(key, start, stop);
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.unifiedRedis.sadd(key, ...members);
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.unifiedRedis.srem(key, ...members);
  }

  async smembers(key: string): Promise<string[]> {
    return this.unifiedRedis.smembers(key);
  }

  async sismember(key: string, member: string): Promise<boolean> {
    return this.unifiedRedis.sismember(key, member);
  }

  // Utility methods
  async exists(key: string): Promise<boolean> {
    return this.unifiedRedis.exists(key);
  }

  async expire(key: string, seconds: number): Promise<boolean> {
    return this.unifiedRedis.expire(key, seconds);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.unifiedRedis.keys(pattern);
  }

  async ping(): Promise<string> {
    return this.unifiedRedis.ping();
  }

  async flushdb(): Promise<void> {
    await this.unifiedRedis.flushdb();
  }

  // Advanced features
  async cache<T>(
    key: string,
    factory: () => Promise<T>,
    options?: { ttl?: number; tags?: string[] }
  ): Promise<T> {
    return this.unifiedRedis.cache(key, factory, options);
  }

    async enqueue<T>(queueName: string, task: any, priority: number = 1): Promise<void> {
    await this.unifiedRedis.enqueue(queueName, task, priority);
  }

  async dequeue<T>(queueName: string): Promise<QueueTask<T> | null> {
    return this.unifiedRedis.dequeue<T>(queueName);
  }

  // Health and monitoring
  async getHealth() {
    return this.unifiedRedis.getHealth();
  }

  getMetrics() {
    return this.unifiedRedis.getMetrics();
  }

  // Add more Redis command wrappers as needed...
}