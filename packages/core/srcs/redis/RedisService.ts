import { Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST,
      port: parseInt(process.env.REDIS_PORT, 10),
    });
  }

  async get(key: string): Promise<string> {
    this.logger.log(`Getting value for key: ${key}`);
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<void> {
    this.logger.log(`Setting value for key: ${key}`);
    await this.client.set(key, value);
  }
}
