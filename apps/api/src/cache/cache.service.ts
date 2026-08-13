import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

@Injectable()
export class CacheService {
  private client: Redis | null = null;
  private logger = new Logger(CacheService.name);
  private enabled = true;

  constructor(private configService: ConfigService) {
    // Check if Redis is explicitly disabled
    const redisEnabled = configService.get<string>('REDIS_ENABLED', 'true');
    if (redisEnabled === 'false') {
      this.logger.warn(
        '[CacheService] Redis is disabled via REDIS_ENABLED=false. Cache operations will be no-ops.'
      );
      this.enabled = false;
      return;
    }

    // Parse Redis connection - support both REDIS_URL and individual env vars
    let redisUrl = configService.get('REDIS_URL');

    if (redisUrl) {
      // Trim whitespace
      redisUrl = redisUrl.trim();

      // Check if URL was accidentally duplicated (e.g., in CloudRuntime environment vars)
      // Check for both redis:// and rediss:// (TLS) prefixes
      const supportedPrefixes = ['redis://', 'rediss://'];
      const prefix = supportedPrefixes.find((p) => redisUrl.startsWith(p));

      if (prefix) {
        const secondIndex = redisUrl.indexOf(prefix, prefix.length);

        if (secondIndex !== -1) {
          // If a duplicated prefix is found, take only the first valid URL
          const originalUrlLength = redisUrl.length;
          redisUrl = redisUrl.substring(0, secondIndex);
          this.logger.warn(
            `[CacheService] Detected duplicated REDIS_URL in environment variable. Truncated from ${originalUrlLength} to ${redisUrl.length} characters.`
          );
        }
      }

      // CloudRuntime Redis Check: Log if it is a CloudRuntime URL
      if (redisUrl.includes('cloud_runtime')) {
        this.logger.log(`[CacheService] Detected CloudRuntime Redis URL`);
      }

      // Initialize Redis client with the connection string
      // This automatically handles hostname, port, password, database, and TLS (rediss://)
      try {
        // Validate URL parsing before passing to ioredis to ensure it's valid
        // and to extract information for logging
        const url = new URL(redisUrl);

        this.client = new Redis(redisUrl);

        this.logger.log(
          `[CacheService] Connecting to Redis at ${url.hostname}:${url.port || 6379}${
            url.pathname && url.pathname.length > 1 ? ` (db: ${url.pathname.slice(1)})` : ''
          }`
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
    if (!this.enabled || !this.client) return null;
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<'OK'> {
    if (!this.enabled || !this.client) return 'OK';
    return this.client.set(key, value);
  }

  async del(key: string): Promise<number> {
    if (!this.enabled || !this.client) return 0;
    return this.client.del(key);
  }

  async sadd(key: string, member: string): Promise<number> {
    if (!this.enabled || !this.client) return 0;
    return this.client.sadd(key, member);
  }

  async srem(key: string, member: string): Promise<number> {
    if (!this.enabled || !this.client) return 0;
    return this.client.srem(key, member);
  }

  async scard(key: string): Promise<number> {
    if (!this.enabled || !this.client) return 0;
    return this.client.scard(key);
  }

  async hget(key: string, field: string): Promise<string | null> {
    if (!this.enabled || !this.client) return null;
    return this.client.hget(key, field);
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    if (!this.enabled || !this.client) return {};
    return this.client.hgetall(key);
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    if (!this.enabled || !this.client) return [];
    return this.client.lrange(key, start, stop);
  }
}
