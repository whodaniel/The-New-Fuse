import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly subscriptionCallbacks = new Map<string, (message: string) => void>();
  private readonly patternCallbacks = new Map<
    string,
    (pattern: string, channel: string, message: string) => void
  >();

  constructor(private readonly unifiedRedis: UnifiedRedisService) {
    this.logger.log('API Redis Service initialized with UnifiedRedisService');
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  async get(key: string): Promise<string | null> {
    return this.unifiedRedis.get(key);
  }

  async getAll(pattern: string): Promise<string[]> {
    return this.unifiedRedis.getAll(pattern);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.unifiedRedis.set(key, value, ttl);
  }

  async setWorkflowState(workflowId: string, state: any): Promise<void> {
    await this.unifiedRedis.setWorkflowState(workflowId, state);
  }

  async del(key: string): Promise<void> {
    await this.unifiedRedis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.unifiedRedis.exists(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.unifiedRedis.keys(pattern);
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.unifiedRedis.publish(channel, { message });
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    if (this.subscriptionCallbacks.has(channel)) {
      this.logger.warn(`Already subscribed to channel: ${channel}`);
      return;
    }

    this.subscriptionCallbacks.set(channel, callback);
    await this.unifiedRedis.subscribe(channel, (pubSubMessage) => {
      const storedCallback = this.subscriptionCallbacks.get(channel);
      if (storedCallback && typeof pubSubMessage.message === 'string') {
        storedCallback(pubSubMessage.message);
      } else if (storedCallback) {
        storedCallback(JSON.stringify(pubSubMessage.message));
      }
    });

    this.logger.log(`Subscribed to channel: ${channel}`);
  }

  async psubscribe(
    pattern: string,
    callback?: (pattern: string, channel: string, message: string) => void
  ): Promise<void> {
    if (this.patternCallbacks.has(pattern)) {
      this.logger.warn(`Already psubscribed to pattern: ${pattern}`);
      return;
    }

    if (callback) {
      this.patternCallbacks.set(pattern, callback);
    }

    await this.unifiedRedis.psubscribe(pattern, (pubSubMessage) => {
      const storedCallback = this.patternCallbacks.get(pattern);
      if (storedCallback) {
        const messageStr =
          typeof pubSubMessage.message === 'string'
            ? pubSubMessage.message
            : JSON.stringify(pubSubMessage.message);
        storedCallback(pubSubMessage.pattern || pattern, pubSubMessage.channel, messageStr);
      }
    });

    this.logger.log(`Psubscribed to pattern: ${pattern}`);
  }

  async unsubscribe(channel: string): Promise<void> {
    if (this.subscriptionCallbacks.has(channel)) {
      await this.unifiedRedis.unsubscribe(channel);
      this.subscriptionCallbacks.delete(channel);
      this.logger.log(`Unsubscribed from channel: ${channel}`);
    }
  }

  async punsubscribe(pattern: string): Promise<void> {
    if (this.patternCallbacks.has(pattern)) {
      await this.unifiedRedis.punsubscribe(pattern);
      this.patternCallbacks.delete(pattern);
      this.logger.log(`Punsubscribed from pattern: ${pattern}`);
    }
  }

  async disconnect(): Promise<void> {
    // Clear all subscriptions
    for (const [channel] of Array.from(this.subscriptionCallbacks)) {
      await this.unsubscribe(channel);
    }
    for (const [pattern] of Array.from(this.patternCallbacks)) {
      await this.punsubscribe(pattern);
    }

    this.subscriptionCallbacks.clear();
    this.patternCallbacks.clear();

    // UnifiedRedisService handles connection cleanup
    this.logger.log('API Redis Service disconnected');
  }
}
