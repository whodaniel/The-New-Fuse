import { createStandaloneRedisClient, createUpstashRestClient } from '@the-new-fuse/infrastructure';
import type { Redis as UpstashRedis } from '@upstash/redis';
import { Cluster, Redis } from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

class RedisClient {
  private static instance: RedisClient;
  private client: Redis | Cluster | null = null;
  private upstash: UpstashRedis | null = null;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.client && !this.upstash) {
      this.client = createStandaloneRedisClient({ lazyConnect: true } as any);
      this.upstash = createUpstashRestClient();

      if (this.client instanceof Redis) {
        this.client.on('error', (err: any) => console.error('Redis Client Error:', err));
        await this.client.connect().catch(() => {});
      }
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
    this.upstash = null;
  }

  public async set(key: string, value: string): Promise<void> {
    await this.connect();
    if (this.upstash) {
      await this.upstash.set(key, value);
    } else if (this.client) {
      await this.client.set(key, value);
    }
  }

  public async get(key: string): Promise<string | null> {
    await this.connect();
    if (this.upstash) {
      return await this.upstash.get<string>(key);
    }
    if (this.client) {
      return await this.client.get(key);
    }
    return null;
  }

  public async delete(key: string): Promise<number> {
    await this.connect();
    if (this.upstash) {
      return await this.upstash.del(key);
    }
    if (this.client) {
      return await this.client.del(key);
    }
    return 0;
  }
}

export const redisClient = RedisClient.getInstance();
