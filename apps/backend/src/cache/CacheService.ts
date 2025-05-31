import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';

interface CacheOptions {
  ttl?: number;
  namespace?: string;
}

@Injectable()
export class CacheService {
  private readonly redis: Redis;
  private readonly logger: Logger;
  private readonly defaultTTL: number = 3600; // 1 hour

  constructor(
    redisUrl: string = process.env.REDIS_URL || 'redis://localhost:6379'
  ) {
    this.redis = new Redis(redisUrl);
    this.logger = new Logger(CacheService.name);

    this.redis.on('error', (error: Error) => {
      this.logger.error(`Redis cache error: ${error.message}`);
    });
  }

  private getKey(key: string, namespace?: string): string {
    return namespace ? `${namespace}:${key}` : key;
  }

  async set<T>(
    key: string,
    value: T,
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const finalKey = this.getKey(key, options.namespace);
      const serializedValue = JSON.stringify(value);
      const ttl = options.ttl || this.defaultTTL;

      await this.redis.setex(finalKey, ttl, serializedValue);
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
      throw error;
    }
  }

  async get<T>(key: string, namespace?: string): Promise<T | null> {
    try {
      const finalKey = this.getKey(key, namespace);
      const value = await this.redis.get(finalKey);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`);
      throw error;
    }
  }

  async delete(key: string, namespace?: string): Promise<void> {
    try {
      const finalKey = this.getKey(key, namespace);
      await this.redis.del(finalKey);
    } catch (error) {
      this.logger.error(`Cache delete error: ${error.message}`);
      throw error;
    }
  }

  async has(key: string, namespace?: string): Promise<boolean> {
    try {
      const finalKey = this.getKey(key, namespace);
      return await this.redis.exists(finalKey) === 1;
    } catch (error) {
      this.logger.error(`Cache has error: ${error.message}`);
      throw error;
    }
  }

  async clear(namespace?: string): Promise<void> {
    try {
      if (namespace) {
        const keys = await this.redis.keys(`${namespace}:*`);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        await this.redis.flushdb();
      }
    } catch (error) {
      this.logger.error(`Cache clear error: ${error.message}`);
      throw error;
    }
  }

  async getMultiple<T>(
    keys: string[],
    namespace?: string
  ): Promise<(T | null)[]> {
    try {
      const finalKeys = keys.map(key => this.getKey(key, namespace));
      const values = await this.redis.mget(...finalKeys);
      return values.map(value => (value ? JSON.parse(value) : null));
    } catch (error) {
      this.logger.error(`Cache getMultiple error: ${error.message}`);
      throw error;
    }
  }

  async setMultiple<T>(
    entries: { key: string; value: T }[],
    options: CacheOptions = {}
  ): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();
      const ttl = options.ttl || this.defaultTTL;

      entries.forEach(({ key, value }) => {
        const finalKey = this.getKey(key, options.namespace);
        const serializedValue = JSON.stringify(value);
        pipeline.setex(finalKey, ttl, serializedValue);
      });

      await pipeline.exec();
    } catch (error) {
      this.logger.error(`Cache setMultiple error: ${error.message}`);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.redis.quit();
  }
}
