import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private _client: Redis;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this._client = new Redis({
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      keyPrefix: 'fuse:',
    });

    this._client.on('error', (error) => {
      this.logger.error('Redis connection error:', error);
    });

    this._client.on('connect', () => {
      this.logger.log('Connected to Redis');
    });
  }

  async onModuleDestroy() {
    if (this._client) {
      await this._client.quit();
    }
  }

  get client(): Redis {
    return this._client;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) {
      await this._client.set(key, value, 'EX', ttl);
    } else {
      await this._client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    return await this._client.get(key);
  }

  async del(key: string): Promise<number> {
    return await this._client.del(key);
  }

  async exists(key: string): Promise<number> {
    return await this._client.exists(key);
  }
}