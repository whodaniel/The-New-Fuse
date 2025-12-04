import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private client: Redis;
  private logger = new Logger(CacheService.name);

  constructor(private configService: ConfigService) {
    // Parse Redis connection - support both REDIS_URL and individual env vars
    let redisUrl = configService.get('REDIS_URL');

    // Railway-specific fix: Check for Railway Redis URL format
    if (redisUrl && redisUrl.includes('railway')) {
      this.logger.log(`[CacheService] Detected Railway Redis URL: ${redisUrl}`);

      // Railway Redis URLs are in format: redis://host:port
      // No password or database selection needed for Railway Redis
      try {
        const url = new URL(redisUrl);
        this.client = new Redis({
          host: url.hostname,
          port: parseInt(url.port || '6379', 10),
          // Railway Redis doesn't require password for basic connections
          // Remove db parameter as Railway Redis doesn't support database selection
        });
        this.logger.log(
          `[CacheService] Connecting to Railway Redis at ${url.hostname}:${url.port}`
        );
      } catch (error) {
        this.logger.error(
          `[CacheService] Failed to parse Railway REDIS_URL: ${(error as Error).message}`
        );
        throw error;
      }
    } else if (redisUrl) {
      // Trim whitespace
      redisUrl = redisUrl.trim();

      // Check if URL was accidentally duplicated (e.g., in Railway environment vars)
      const redisPrefix = 'redis://';
      const firstIndex = redisUrl.indexOf(redisPrefix);
      const secondIndex = redisUrl.indexOf(redisPrefix, firstIndex + redisPrefix.length);

      if (firstIndex !== -1 && secondIndex !== -1) {
        // If a duplicated prefix is found, take only the first valid URL
        redisUrl = redisUrl.substring(0, secondIndex);
        this.logger.warn(
          `[CacheService] Detected duplicated REDIS_URL in environment variable. Using only the first occurrence: ${redisUrl}`
        );
      }

      // Parse URL explicitly to avoid ioredis env fallbacks
      try {
        const url = new URL(redisUrl);
        const dbFromPath =
          url.pathname && url.pathname.length > 1 ? parseInt(url.pathname.slice(1), 10) : NaN;
        const db = !isNaN(dbFromPath) && dbFromPath >= 0 ? dbFromPath : 0;

        this.client = new Redis({
          host: url.hostname,
          port: parseInt(url.port || '6379', 10),
          password: url.password || undefined,
          db,
        });
        this.logger.log(
          `[CacheService] Connecting to Redis at ${url.hostname}:${url.port || 6379} (db: ${db})`
        );
      } catch (error) {
        this.logger.error(`[CacheService] Failed to parse REDIS_URL: ${(error as Error).message}`);
        throw error;
      }
    } else {
      // Fallback to individual environment variables
      const host = configService.get('REDIS_HOST') || 'localhost';
      const port = configService.get('REDIS_PORT') || 6379;
      const password = configService.get('REDIS_PASSWORD');
      const dbEnv = configService.get('REDIS_DB');

      // Parse database index safely - handle empty strings, NaN, invalid values
      let db = 0;
      if (dbEnv !== undefined && dbEnv !== null && dbEnv !== '') {
        const parsed = typeof dbEnv === 'string' ? parseInt(dbEnv, 10) : dbEnv;
        db = !isNaN(parsed) && parsed >= 0 ? parsed : 0;
      }

      this.client = new Redis({
        host,
        port: typeof port === 'string' ? parseInt(port, 10) : port,
        password,
        db,
      });
      this.logger.log(`[CacheService] Connecting to Redis at ${host}:${port} (db: ${db})`);
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
