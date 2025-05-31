import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  private client: Redis;
  private logger = new Logger(CacheService.name);

  constructor() {
    this.client = new Redis();
    this.client.on('error', (err) => this.logger.error('Redis error', err));
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<'OK'> {
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    return this.client.del(key);
  }

  async sadd(key: string, member: string): Promise<number> {
    return this.client.sAdd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return this.client.sRem(key, member);
  }

  async scard(key: string): Promise<number> {
    return this.client.sCard(key);
  }
}