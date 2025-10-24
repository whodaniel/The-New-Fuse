import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '../config/ConfigService';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redis = new (Redis as any)(this.configService.getRedisUrl());
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.redis.ping();
    } catch {
      throw new Error('Failed to connect to Redis');
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.redis.quit();
  }

  getRedis(): Redis {
    return this.redis;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this.redis.set(key, value, ''EX', ttl);
    } else {
      await this.redis.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch {
      return false;
    }
  }
}