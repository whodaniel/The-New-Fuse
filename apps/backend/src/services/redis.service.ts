import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(private readonly unifiedRedis: UnifiedRedisService) {
    this.logger.log('RedisService initialized using UnifiedRedisService');
  }

  async onModuleDestroy() {
    // UnifiedRedisService handles its own cleanup via OnModuleDestroy
  }

  async get(key: string): Promise<string | null> {
    return this.unifiedRedis.get(key);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.unifiedRedis.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.unifiedRedis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.unifiedRedis.exists(key);
  }

  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.unifiedRedis.lpush(key, ...values);
  }

  async rpop(key: string): Promise<string | null> {
    return this.unifiedRedis.rpop(key);
  }

  async llen(key: string): Promise<number> {
    return this.unifiedRedis.llen(key);
  }

  async publish(channel: string, message: string): Promise<number> {
    return this.unifiedRedis.publish(channel, message);
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    await this.unifiedRedis.subscribe(channel, (payload) => {
      callback(typeof payload === 'string' ? payload : JSON.stringify(payload));
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    await this.unifiedRedis.unsubscribe(channel);
  }

  async getTasks(): Promise<any[]> {
    const tasks = await this.unifiedRedis.lrange('tasks', 0, -1);
    return tasks.map((task) => JSON.parse(task));
  }

  async addTask(task: any): Promise<void> {
    await this.unifiedRedis.lpush('tasks', JSON.stringify(task));
  }

  async getQueueLength(queueName: string): Promise<number> {
    return this.unifiedRedis.llen(queueName);
  }

  async flushAll(): Promise<void> {
    await this.unifiedRedis.flushdb();
  }

  getSubClient(): any {
    // Note: Internal clients are private in UnifiedRedisService.
    // Returning the service itself as a proxy for most common operations
    // or returning undefined if direct access is strictly required.
    this.logger.warn(
      'Direct getSubClient() access is deprecated. Use UnifiedRedisService methods.'
    );
    return undefined;
  }

  async sendToComposer(message: any): Promise<void> {
    await this.publish('composer:messages', JSON.stringify(message));
  }

  async sendToRooCoder(message: any): Promise<void> {
    await this.publish('roocoder:messages', JSON.stringify(message));
  }

  async subscribeToChannel(channel: string, callback: (message: string) => void): Promise<void> {
    await this.subscribe(channel, callback);
  }

  async ping(): Promise<string> {
    return this.unifiedRedis.ping();
  }

  async disconnect(): Promise<void> {
    // Handled by UnifiedRedisService
  }
}
