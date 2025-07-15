import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '../config/ConfigService';
import * as IORedis from 'ioredis';

@Injectable()
export class MemoryManager implements OnModuleDestroy {
  private redis: IORedis.Redis;
  private readonly defaultTTL = 3600; // 1 hour

  constructor(private readonly configService: ConfigService) {
    const redisConfig = {
      host: this.configService.getRedisHost(),
      port: this.configService.getRedisPort(),
      password: this.configService.getRedisPassword(),
      db: this.configService.getRedisDb()
    };
    this.redis = new IORedis(redisConfig);
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