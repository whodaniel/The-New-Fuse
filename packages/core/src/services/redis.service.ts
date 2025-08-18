import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly unifiedRedis: UnifiedRedisService) {}

  async onModuleInit(): Promise<void> {
    this.logger.log('Core Redis Service initialized with UnifiedRedisService');
  }

  async onModuleDestroy(): Promise<void> {
    // UnifiedRedisService handles connection cleanup
    this.logger.log('Core Redis Service destroyed');
  }

  // Expose UnifiedRedisService methods for backward compatibility
  get client(): UnifiedRedisService {
    return this.unifiedRedis;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    return this.unifiedRedis.set(key, value, ttl);
  }

  async get(key: string): Promise<string | null> {
    return this.unifiedRedis.get(key);
  }

  async del(key: string): Promise<number> {
    return this.unifiedRedis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.unifiedRedis.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.unifiedRedis.keys(pattern);
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return this.unifiedRedis.expire(key, ttl);
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.unifiedRedis.publish(channel, { message });
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
  async ping(): Promise<string> {
    return this.unifiedRedis.ping();
  }

  async flushdb(): Promise<void> {
    await this.unifiedRedis.flushdb();
  }

  // Advanced features from UnifiedRedisService
  async cache<T>(
    key: string,
    factory: () => Promise<T>,
    options?: { ttl?: number; tags?: string[] }
  ): Promise<T> {
    return this.unifiedRedis.cache(key, factory, options);
  }

  async setWorkflowState(workflowId: string, state: any): Promise<void> {
    await this.unifiedRedis.setWorkflowState(workflowId, state);
  }

  async getWorkflowState<T = any>(workflowId: string): Promise<T | null> {
    return this.unifiedRedis.getWorkflowState<T>(workflowId);
  }

  async enqueue<T>(queueName: string, task: any, priority: number = 1): Promise<void> {
    await this.unifiedRedis.enqueue(queueName, task, priority);
  }

  async dequeue<T>(queueName: string): Promise<T | null> {
    return this.unifiedRedis.dequeue<T>(queueName);
  }

  async getHealth() {
    return this.unifiedRedis.getHealth();
  }

  getMetrics() {
    return this.unifiedRedis.getMetrics();
  }
}