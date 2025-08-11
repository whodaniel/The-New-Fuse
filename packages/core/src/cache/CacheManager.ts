import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
import * as crypto from 'crypto';
@Injectable()
export class CacheManager implements OnModuleInit, OnModuleDestroy {
  // Implementation needed
}
  private readonly logger = new Logger(CacheManager.name);
  private redis: RedisClientType;
  private isConnected = false;
  constructor() {
  // Implementation needed
}
    this.redis = createClient({
  // Implementation needed
}
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    this.redis.on('error', (err) => this.logger.error('Redis error:', err));
    this.redis.on('ready', () => this.logger.log('Cache ready'));
    this.redis.on('connect', () => {
  // Implementation needed
}
      this.logger.log('Cache connected');
      this.isConnected = true;
    });
    this.redis.on('end', () => {
  // Implementation needed
}
      this.logger.warn('Cache disconnected');
      this.isConnected = false;
    });
  }

  async onModuleInit(): Promise<void> {
  // Implementation needed
}
    await this.connect();
  }

  async onModuleDestroy(): Promise<void> {
  // Implementation needed
}
    await this.disconnect();
  }

  async connect(): Promise<void> {
  // Implementation needed
}
    if (!this.isConnected) {
  // Implementation needed
}
      await this.redis.connect();
    }
  }

  async disconnect(): Promise<void> {
  // Implementation needed
}
    if (this.isConnected) {
  // Implementation needed
}
      await this.redis.disconnect();
    }
  }

  private generateKey(key: string): string {
  // Implementation needed
}
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  async get<T>(key: string): Promise<T | null> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
  // Implementation needed
}
      this.logger.error(`Error getting cache for key ${key}`, error);
      return null;
    }
  }

  async set(key: string, value: unknown, ttl?: number): Promise<void> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      const serializedValue = JSON.stringify(value);
      if (ttl) {
  // Implementation needed
}
        await this.redis.setEx(key, ttl, serializedValue);
      } else {
  // Implementation needed
}
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
  // Implementation needed
}
      this.logger.error(`Error setting cache for key ${key}`, error);
    }
  }

  async del(key: string): Promise<void> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      await this.redis.del(key);
    } catch (error) {
  // Implementation needed
}
      this.logger.error(`Error deleting cache for key ${key}`, error);
    }
  }

  async exists(key: string): Promise<boolean> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
  // Implementation needed
}
      this.logger.error(`Error checking cache existence for key ${key}`, error);
      return false;
    }
  }

  async clear(): Promise<void> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      await this.redis.flushAll();
      this.logger.log('Cache flushed');
    } catch (error) {
  // Implementation needed
}
      this.logger.error('Error flushing cache:', error);
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      const keys = await this.redis.keys(pattern);
      return keys;
    } catch (error) {
  // Implementation needed
}
      this.logger.error(`Error getting keys with pattern ${pattern}`, error);
      return [];
    }
  }

  async increment(key: string, increment = 1): Promise<number> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      return await this.redis.incrBy(key, increment);
    } catch (error) {
  // Implementation needed
}
      this.logger.error(`Error incrementing cache for key ${key}`, error);
      return 0;
    }
  }

  async expire(key: string, ttl: number): Promise<boolean> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      const result = await this.redis.expire(key, ttl);
      return result;
    } catch (error) {
  // Implementation needed
}
      this.logger.error(`Error setting expiration for key ${key}`, error);
      return false;
    }
  }

  async getStats(): Promise<Record<string, string>> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      const info = await this.redis.info('memory');
      const lines = info
        .split('\n')
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split(':'));
      const stats: Record<string, string> = {};
      lines.forEach(([key, value]) => {
  // Implementation needed
}
        if (key && value) {
  // Implementation needed
}
          stats[key.trim()] = value.trim();
        }
      });
      return stats;
    } catch (error) {
  // Implementation needed
}
      this.logger.error('Error getting cache stats:', error);
      return {};
    }
  }
}