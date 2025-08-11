import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
@Injectable()
export class CacheManager {
  // Implementation needed
}
  private readonly logger = new Logger(CacheManager.name);
  private client: RedisClientType;
  private isConnected = false;
  constructor() {
  // Implementation needed
}
    this.client = createClient({
  // Implementation needed
}
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
    this.client.on('error', (err) => {
  // Implementation needed
}
      this.logger.error('Redis Client Error', err);
    });
    this.client.on('connect', () => {
  // Implementation needed
}
      this.logger.log('Connected to Redis');
      this.isConnected = true;
    });
    this.client.on('disconnect', () => {
  // Implementation needed
}
      this.logger.warn('Disconnected from Redis');
      this.isConnected = false;
    });
  }

  async connect(): Promise<void> {
  // Implementation needed
}
    if (!this.isConnected) {
  // Implementation needed
}
      await this.client.connect();
    }
  }

  async disconnect(): Promise<void> {
  // Implementation needed
}
    if (this.isConnected) {
  // Implementation needed
}
      await this.client.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      await this.connect();
      const value = await this.client.get(key);
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
      await this.connect();
      const serializedValue = JSON.stringify(value);
      if (ttl) {
  // Implementation needed
}
        await this.client.setEx(key, ttl, serializedValue);
      } else {
  // Implementation needed
}
        await this.client.set(key, serializedValue);
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
      await this.connect();
      await this.client.del(key);
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
      await this.connect();
      const result = await this.client.exists(key);
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
      await this.connect();
      await this.client.flushAll();
    } catch (error) {
  // Implementation needed
}
      this.logger.error('Error clearing cache', error);
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
  // Implementation needed
}
    try {
  // Implementation needed
}
      await this.connect();
      const keys = await this.client.keys(pattern);
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
      await this.connect();
      return await this.client.incrBy(key, increment);
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
      await this.connect();
      const result = await this.client.expire(key, ttl);
      return result;
    } catch (error) {
  // Implementation needed
}
      this.logger.error(`Error setting expiration for key ${key}`, error);
      return false;
    }
  }
}