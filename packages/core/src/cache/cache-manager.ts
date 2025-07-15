import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheManager {
  private readonly logger = new Logger(CacheManager.name);
  private client: RedisClientType;
  private isConnected = false;

  constructor() {
    this.client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });

    this.client.on('error', (err) => {
      this.logger.error('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.logger.log('Connected to Redis');
      this.isConnected = true;
    });

    this.client.on('disconnect', () => {
      this.logger.warn('Disconnected from Redis');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.client.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      await this.connect();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
    try {
      await this.connect();
      const serializedValue = JSON.stringify(value);
      
      if (ttl) {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
        await this.client.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.connect();
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache existence for key ${key}`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.connect();
      await this.client.flushAll();
    } catch (error) {
      this.logger.error('Error clearing cache', error);
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      await this.connect();
      const keys = await this.client.keys(pattern);
      return keys;
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}`, error);
      return [];
    }
  }

  async increment(key: string, increment = 1): Promise<number> {
    try {
      await this.connect();
      return await this.client.incrBy(key, increment);
    } catch (error) {
      this.logger.error(`Error incrementing cache for key ${key}`, error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      await this.connect();
      const result = await this.client.expire(key, ttl);
      return result;
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}`, error);
      return false;
    }
  }
}