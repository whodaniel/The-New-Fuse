import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis, { RedisOptions } from 'ioredis';
import { LoggingService } from '../services/LoggingService.ts';

@Injectable()
export class RedisService implements OnModuleDestroy {
  private client: Redis | null = null;
  private readonly logger: LoggingService;

  constructor(private readonly configService: ConfigService) {
    this.logger = new LoggingService('RedisService');
    this.connect();
  }

  async connect() {
    if (this.client) {
      return;
    }

    try {
      const options: RedisOptions = {
        host: this.configService.get('REDIS_HOST', 'localhost'),
        port: this.configService.get('REDIS_PORT', 6379),
        password: this.configService.get('REDIS_PASSWORD'),
        db: this.configService.get('REDIS_DB', 0),
      };

      this.client = new Redis(options);

      this.client.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
      });

      this.client.on('connect', () => {
        this.logger.info('Connected to Redis');
      });
    } catch (error) {
      this.logger.error('Failed to create Redis connection:', error);
      throw error;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.client = null;
    }
  }

  getClient(): Redis {
    if (!this.client) {
      throw new Error('Redis client not initialized');
    }
    return this.client;
  }

  async set(key: string, value: string, mode?: string, duration?: number): Promise<void> {
    const client = this.getClient();
    if (mode === 'EX' && duration) {
      await client.set(key, value, 'EX', duration);
    } else {
      await client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    const client = this.getClient();
    return client.get(key);
  }

  async del(key: string): Promise<void> {
    const client = this.getClient();
    await client.del(key);
  }

  async keys(pattern: string): Promise<string[]> {
    const client = this.getClient();
    return client.keys(pattern);
  }

  async flushDb(): Promise<void> {
    const client = this.getClient();
    await client.flushdb();
  }
}