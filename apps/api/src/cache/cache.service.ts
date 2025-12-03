import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private client: Redis;
  private logger = new Logger(CacheService.name);

  constructor(private configService: ConfigService) {
    // Parse Redis connection - support both REDIS_URL and individual env vars
    const redisUrl = configService.get('REDIS_URL');
    
    if (redisUrl) {
      // Use connection URL (Railway, Heroku, cloud platforms)
      this.client = new Redis(redisUrl);
      this.logger.log(`[CacheService] Connecting to Redis via REDIS_URL`);
    } else {
      // Fallback to individual environment variables
      const host = configService.get('REDIS_HOST') || 'localhost';
      const port = configService.get('REDIS_PORT') || 6379;
      const password = configService.get('REDIS_PASSWORD');
      const db = configService.get('REDIS_DB') || 0;
      
      this.client = new Redis({
        host,
        port: typeof port === 'string' ? parseInt(port, 10) : port,
        password,
        db: typeof db === 'string' ? parseInt(db, 10) : db,
      });
      this.logger.log(`[CacheService] Connecting to Redis at ${host}:${port}`);
    }
    
    this.client.on('error', (err: any) => this.logger.error('Redis error', err));
    this.client.on('connect', () => this.logger.log('Redis connected successfully'));
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
    return this.client.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    return this.client.srem(key, member);
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }
}
