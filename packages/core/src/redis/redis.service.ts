import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
import IORedis, { Redis } from 'ioredis';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly redis: Redis;
  private readonly subClient: Redis;

  constructor(private readonly configService: ConfigService) {
    const redisConfig = {
      host: this.configService.getRedisHost(),
      port: this.configService.getRedisPort(),
      password: this.configService.getRedisPassword(),
      db: this.configService.getRedisDb()
    };
    this.redis = new IORedis(redisConfig);
    this.subClient = new IORedis(redisConfig);
    this.logger.log('Redis service initialized');
  }

  async onModuleDestroy() {
    await this.redis.quit();
    await this.subClient.quit();
    this.logger.log('Redis connections closed');
  }

  // Basic Redis Operations
  async get(key: string): Promise<string | null> {
    try {
      return await this.redis.get(key);
    } catch (error) {
      this.logger.error('Failed to get key', { key, error });
      throw error;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    try {
      if (ttl) {
        await this.redis.set(key, value, 'EX', ttl);
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error('Failed to set key', { key, error });
      throw error;
    }
  }

  async del(key: string): Promise<number> {
    try {
      return await this.redis.del(key);
    } catch (error) {
      this.logger.error('Failed to delete key', { key, error });
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error('Failed to check key existence', { key, error });
      throw error;
    }
  }

  async hset(key: string, field: string, value: string): Promise<void>;
  async hset(key: string, data: Record<string, string>): Promise<void>;
  async hset(key: string, fieldOrData: string | Record<string, string>, value?: string): Promise<void> {
    try {
      if (typeof fieldOrData === 'string' && value !== undefined) {
        await this.redis.hset(key, fieldOrData, value);
      } else if (typeof fieldOrData === 'object') {
        await this.redis.hset(key, fieldOrData);
      } else {
        throw new Error('Invalid arguments for hset');
      }
    } catch (error) {
      this.logger.error('Failed to set hash field', { key, error });
      throw error;
    }
  }

  async hget(key: string, field: string): Promise<string | null> {
    try {
      return await this.redis.hget(key, field);
    } catch (error) {
      this.logger.error('Failed to get hash field', { key, field, error });
      throw error;
    }
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    try {
      return await this.redis.hgetall(key);
    } catch (error) {
      this.logger.error('Failed to get all hash fields', { key, error });
      throw error;
    }
  }

  // Pub/Sub Operations
  async publish(channel: string, message: string | object): Promise<number> {
    try {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      return await this.redis.publish(channel, messageStr);
    } catch (error) {
      this.logger.error('Failed to publish message', { channel, error });
      throw error;
    }
  }

  async subscribe(channel: string, callback: (message: string) => void): Promise<void> {
    try {
      await this.subClient.subscribe(channel);
      this.subClient.on('message', (ch: string, message: string) => {
        if (ch === channel) {
          callback(message);
        }
      });
    } catch (error) {
      this.logger.error('Failed to subscribe to channel', { channel, error });
      throw error;
    }
  }

  async unsubscribe(channel: string): Promise<void> {
    try {
      await this.subClient.unsubscribe(channel);
    } catch (error) {
      this.logger.error('Failed to unsubscribe from channel', { channel, error });
      throw error;
    }
  }

  // List Operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    try {
      return await this.redis.lpush(key, ...values);
    } catch (error) {
      this.logger.error('Failed to push to list', { key, error });
      throw error;
    }
  }

  async rpop(key: string): Promise<string | null> {
    try {
      return await this.redis.rpop(key);
    } catch (error) {
      this.logger.error('Failed to pop from list', { key, error });
      throw error;
    }
  }

  async llen(key: string): Promise<number> {
    try {
      return await this.redis.llen(key);
    } catch (error) {
      this.logger.error('Failed to get list length', { key, error });
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error('Failed to set key expiration', { key, ttl, error });
      throw error;
    }
  }

  // Utility methods
  async ping(): Promise<string> {
    try {
      return await this.redis.ping();
    } catch (error) {
      this.logger.error('Failed to ping Redis', { error });
      throw error;
    }
  }

  async flushdb(): Promise<void> {
    try {
      await this.redis.flushdb();
      this.logger.log('Redis database flushed');
    } catch (error) {
      this.logger.error('Failed to flush Redis database', { error });
      throw error;
    }
  }
}