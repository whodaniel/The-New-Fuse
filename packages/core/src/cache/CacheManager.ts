import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import * as crypto from 'crypto';
@Injectable()
export class CacheManager {
  private readonly logger = new Logger(CacheManager.name);
  private redis: RedisClientType;
  private isConnected = false;
  constructor() {
    this.redis = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    this.redis.on('error', (err) => this.logger.error('Redis error:', err));
    this.redis.on('ready', () => this.logger.log('Cache ready'));
    this.redis.on('connect', () => {
      this.logger.log('Cache connected');
      this.isConnected = true;
    });
    this.redis.on('end', () => {
      this.logger.warn('Cache disconnected');
      this.isConnected = false;
    });
  }

  async onModuleInit(): Promise<void> {
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    if (!this.isConnected) {
      await this.redis.connect();
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await this.redis.disconnect();
    }
  }

  private generateKey(key: string): string {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      this.logger.error(`Error getting cache for key ${key}`, error);
      return null;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setEx(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      this.logger.error(`Error setting cache for key ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting cache for key ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking cache existence for key ${key}`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushAll();
      this.logger.log('Cache flushed');
    } catch (error) {
      this.logger.error('Error flushing cache:', error);
    }
  }

  async getKeys(pattern: string = '*'): Promise<string[]> {
    try {
      const keys = await this.redis.keys(pattern);
      return keys;
    } catch (error) {
      this.logger.error(`Error getting keys with pattern ${pattern}`, error);
      return [];
    }
  }

  async increment(key: string, increment: number = 1): Promise<number> {
    try {
      return await this.redis.incrBy(key, increment);
    } catch (error) {
      this.logger.error(`Error incrementing cache for key ${key}`, error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redis.expire(key, ttl);
      return result;
    } catch (error) {
      this.logger.error(`Error setting expiration for key ${key}`, error);
      return false;
    }
  }

  async getStats(): Promise<Record<string, string>> {
    try {
      const info = await this.redis.info('memory');
      const lines = info
        .split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split(':'));
      const stats: Record<string, string> = {};
      lines.forEach(([key, value]) => {
        if (key && value) {
          stats[key.trim()] = value.trim();
        }
      });
      return stats;
    } catch (error) {
      this.logger.error('Error getting cache stats:', error);
      return {};
    }
  }
}