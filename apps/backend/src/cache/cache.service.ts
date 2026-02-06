import { Injectable } from '@nestjs/common';
import { LoggingService } from '../services/logging.service';
import { RedisService } from '../services/redis.service';

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
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redisService.getSubClient().set(key, serializedValue, 'EX', ttl);
      } else {
        await this.redisService.getSubClient().set(key, serializedValue);
      }
      this.logger.debug(`Cache set: ${key}, TTL: ${ttl}`);
    } catch (error) {
      this.logger.error(`Failed to set cache for key: ${key}. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Get a value from the cache
   * @param key The key to retrieve
   * @returns The stored value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redisService.getSubClient().get(key);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get cache for key: ${key}. Error: ${error}`);
      return null;
    }
  }

  /**
   * Delete a value from the cache
   * @param key The key to delete
   */
  async delete(key: string): Promise<void> {
    try {
      await this.redisService.getSubClient().del(key);
      this.logger.debug(`Cache deleted: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete cache for key: ${key}. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Check if a key exists in the cache
   * @param key The key to check
   * @returns True if the key exists, false otherwise
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisService.getSubClient().exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Failed to check existence for key: ${key}. Error: ${error}`);
      return false;
    }
  }

  /**
   * Set a hash field in the cache
   * @param key The hash key
   * @param field The field to set
   * @param value The value to set
   */
  async hset(key: string, field: string, value: any): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redisService.getSubClient().hset(key, field, serializedValue);
      this.logger.debug(`Cache hset: ${key}.${field}`);
    } catch (error) {
      this.logger.error(`Failed to set hash cache for key: ${key}.${field}. Error: ${error}`);
      throw error;
    }
  }

  /**
   * Get a hash field from the cache
   * @param key The hash key
   * @param field The field to get
   * @returns The stored value or null if not found
   */
  async hget<T>(key: string, field: string): Promise<T | null> {
    try {
      const value = await this.redisService.getSubClient().hget(key, field);
      if (!value) return null;

      return JSON.parse(value) as T;
    } catch (error) {
      this.logger.error(`Failed to get hash cache for key: ${key}.${field}. Error: ${error}`);
      return null;
    }
  }
}
