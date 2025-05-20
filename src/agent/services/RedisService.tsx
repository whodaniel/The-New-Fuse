import { Injectable, Logger } from "@nestjs/common";
import { Redis, RedisOptions } from "ioredis";
import { CacheConfig } from '../../config/cache.config.js';

interface CacheEntry<T> {
  value: T;
  expireAt?: number;
}

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly client: Redis;
  private isConnected = false;

  constructor(private readonly config: CacheConfig) {
    const options: RedisOptions = {
      host: config.host,
      port: config.port,
      password: config.password,
      db: config.db,
      retryStrategy: (times: number) => {
        if (times > config.maxRetries) {
          return null;
        }
        return Math.min(times * 100, 3000);
      },
    };

    this.client = new Redis(options);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.client.on("connect", () => {
      this.isConnected = true;
      this.logger.log("Connected to Redis");
    });

    this.client.on("error", (error: Error) => {
      this.logger.error(`Redis error: ${error.message}`);
    });

    this.client.on("close", () => {
      this.isConnected = false;
      this.logger.warn("Redis connection closed");
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.client.get(key);
      if (!data) return null;

      const entry: CacheEntry<T> = JSON.parse(data);

      if (entry.expireAt && entry.expireAt < Date.now()) {
        await this.delete(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      this.logger.error(`Error getting key ${key}: ${error}`);
      throw error;
    }
  }

  async set<T>(
    key: string,
    value: T,
    ttlMs?: number
  ): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        value,
        expireAt: ttlMs ? Date.now() + ttlMs : undefined
      };

      await this.client.set(
        key,
        JSON.stringify(entry),
        "PX",
        ttlMs ?? this.config.defaultTTL
      );
    } catch (error) {
      this.logger.error(`Error setting key ${key}: ${error}`);
      throw error;
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.client.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key}: ${error}`);
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Error checking existence of key ${key}: ${error}`);
      throw error;
    }
  }

  async increment(key: string, value = 1): Promise<number> {
    try {
      return await this.client.incrby(key, value);
    } catch (error) {
      this.logger.error(`Error incrementing key ${key}: ${error}`);
      throw error;
    }
  }

  async decrement(key: string, value = 1): Promise<number> {
    try {
      return await this.client.decrby(key, value);
    } catch (error) {
      this.logger.error(`Error decrementing key ${key}: ${error}`);
      throw error;
    }
  }

  async flush(): Promise<void> {
    try {
      await this.client.flushdb();
    } catch (error) {
      this.logger.error(`Error flushing database: ${error}`);
      throw error;
    }
  }

  async getTTL(key: string): Promise<number> {
    try {
      return await this.client.pttl(key);
    } catch (error) {
      this.logger.error(`Error getting TTL for key ${key}: ${error}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await this.client.quit();
      this.isConnected = false;
      this.logger.log("Disconnected from Redis");
    } catch (error) {
      this.logger.error(`Error disconnecting from Redis: ${error}`);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isConnected;
  }
}
