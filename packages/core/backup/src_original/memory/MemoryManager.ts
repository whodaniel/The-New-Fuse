import { Injectable, OnModuleDestroy } from '@nestjs/common';
import * as Redis from 'ioredis';

@Injectable()
export class MemoryManager implements OnModuleDestroy {
  private redis: Redis.Redis;
  private readonly defaultTTL = 3600; // 1 hour

  constructor() {
    this.redis = new Redis.default(process.env.REDIS_URL || 'redis://localhost:6379');
  }

  async store(key: string, value: unknown, ttl?: number): Promise<void> {
    if (!key || key.trim() === '') {
      throw new Error('Key cannot be empty');
    }
    
    const serialized = JSON.stringify(value);
    const timeToLive = ttl || this.defaultTTL;
    
    await this.redis.setex(key, timeToLive, serialized);
  }

  async get(key: string): Promise<unknown> {
    if (!key || key.trim() === '') {
      throw new Error('Key cannot be empty');
    }
    
    const result = await this.redis.get(key);
    return result ? JSON.parse(result) : null;
  }

  async delete(key: string): Promise<void> {
    if (!key || key.trim() === '') {
      throw new Error('Key cannot be empty');
    }
    
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
    if (!key || key.trim() === '') {
      throw new Error('Key cannot be empty');
    }
    
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async getKeys(pattern: string): Promise<string[]> {
    return await this.redis.keys(pattern);
  }

  async disconnect(): Promise<void> {
    await this.redis.disconnect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }
}