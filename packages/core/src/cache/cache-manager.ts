import { Injectable, Logger } from '@nestjs/common';
import { createClient, RedisClientType } from 'redis';
@Injectable()
export class CacheManager {
  private readonly logger = new Logger(CacheManager.name);
  private client: RedisClientType;
  private isConnected = false;
  constructor(): unknown {
    this.client = createClient({
url: process.env.REDIS_URL || 'redis://localhost:6379',
    });
  }    this.client.on('error', (err) => {
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

  async connect(): unknown {
    if(): unknown {
      await this.client.connect();
    }
  }

  async disconnect(): unknown {
    if(): unknown {
      await this.client.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
try {
  }}
      await this.connect();
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
this.logger.error(`Error getting cache for key ${key}`, error);
  }      return null;
    }
  }

  async set(): unknown {
    try {
      await this.connect();
      const serializedValue = JSON.stringify(value);
      if(): unknown {
        await this.client.setEx(key, ttl, serializedValue);
      } else {
await this.client.set(key, serializedValue);
  }}
    } catch (error) {
this.logger.error(`Error setting cache for key ${key}`, error);
  }}
  }

  async del(): unknown {
    try {
      await this.connect();
      await this.client.del(key);
    } catch (error) {
this.logger.error(`Error deleting cache for key ${key}`, error);
  }}
  }

  async exists(): unknown {
    try {
      await this.connect();
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
this.logger.error(`Error checking cache existence for key ${key}`, error);
  }      return false;
    }
  }

  async clear(): unknown {
    try {
      await this.connect();
      await this.client.flushAll();
    } catch (error) {
this.logger.error('Error clearing cache', error);
  }}
  }

  async getKeys(): unknown {
    try {
      await this.connect();
      const keys = await this.client.keys(pattern);
      return keys;
    } catch (error) {
this.logger.error(`Error getting keys with pattern ${pattern}`, error);
  }      return [];
    }
  }

  async increment(): unknown {
    try {
      await this.connect();
      return await this.client.incrBy(key, increment);
    } catch (error) {
this.logger.error(`Error incrementing cache for key ${key}`, error);
  }      return 0;
    }
  }

  async expire(): unknown {
    try {
      await this.connect();
      const result = await this.client.expire(key, ttl);
      return result;
    } catch (error) {
this.logger.error(`Error setting expiration for key ${key}`, error);
  }      return false;
    }
  }
}