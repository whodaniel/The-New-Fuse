import { Injectable } from '@nestjs/common';
import { RedisService } from '../services/redis.service.js';
import { LoggingService } from '../services/logging.service.js';

@Injectable()
export class CacheService {
  constructor(
    private readonly redisService: RedisService,
    private readonly logger: LoggingService
  ) {}

  /**
   * Set a value in the cache
   * @param key The key to store the value under
   * @param value The value to store
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      const client = await this.redisService.getClient();

      if (ttl) {
        await client.set(key, serializedValue, 'EX', ttl);
      } else {
        await client.set(key, serializedValue);
      }

      this.logger.debug(`Cache set for key: ${key}`, { ttl });
    } catch(error) {
      this.logger.error(`Failed to set cache for key: ${key}`, error);
    }
  }

  /**
   * Get a value from the cache
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await this.redisService.getClient();
      const value = await client.get(key);

      if (!value) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch(error) {
      this.logger.error(`Failed to get cache for key: ${key}`, error);
      return null;
    }
  }

  /**
   * Delete a value from the cache
   * @param key The key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      const client = await this.redisService.getClient();
      await client.del(key);
      this.logger.debug(`Cache deleted for key: ${key}`);
    } catch(error) {
      this.logger.error(`Failed to delete cache for key: ${key}`, error);
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key The key to check
   * @returns True if the key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const client = await this.redisService.getClient();
      const result = await client.exists(key);
      return result === 1;
    } catch(error) {
      this.logger.error(`Failed to check existence for key: ${key}`, error);
      return false;
    }
  }
}
