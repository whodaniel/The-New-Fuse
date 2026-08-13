import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RedisLockService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisLockService.name);
  private redis: Redis;
  private processId = process.pid;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const redisUrl = this.configService.get<string>('REDIS_URL');
    this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
    });

    this.redis.on('connect', () => this.logger.log('Redis connection established for locking'));
    this.redis.on('error', (error) => this.logger.error('Redis connection error:', error));

    await this.redis.connect();

    this.defineLuaScripts();
  }

  async onModuleDestroy() {
    await this.redis.quit();
    this.logger.log('Redis connection closed');
  }

  private defineLuaScripts() {
    this.redis.defineCommand('releaseLock', {
      numberOfKeys: 1,
      lua: `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("del", KEYS[1])
        else
          return 0
        end
      `,
    });

    this.redis.defineCommand('extendLock', {
      numberOfKeys: 1,
      lua: `
        if redis.call("get", KEYS[1]) == ARGV[1] then
          return redis.call("expire", KEYS[1], ARGV[2])
        else
          return 0
        end
      `,
    });
  }

  private generateLockId(): string {
    return `${uuidv4()}-${this.processId}`;
  }

  public async acquireLock(key: string, ttl: number, maxRetries = 3, initialDelay = 100): Promise<string | null> {
    const lockId = this.generateLockId();
    const lockKey = `lock:${key}`;
    let retries = 0;

    while (retries < maxRetries) {
      const result = await this.redis.set(lockKey, lockId, 'EX', ttl, 'NX');
      if (result === 'OK') {
        this.logger.debug(`Lock acquired for key: ${lockKey}`);
        return lockId;
      }

      const delay = initialDelay * Math.pow(2, retries);
      this.logger.debug(`Failed to acquire lock for key: ${lockKey}. Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      retries++;
    }

    this.logger.warn(`Could not acquire lock for key: ${lockKey} after ${maxRetries} retries.`);
    return null;
  }

  public async releaseLock(key: string, lockId: string): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await (this.redis as any).releaseLock(lockKey, lockId);
    if (result === 1) {
      this.logger.debug(`Lock released for key: ${lockKey}`);
      return true;
    }
    this.logger.warn(`Failed to release lock for key: ${lockKey}. Lock ID mismatch or key expired.`);
    return false;
  }

  public async extendLock(key: string, lockId: string, ttl: number): Promise<boolean> {
    const lockKey = `lock:${key}`;
    const result = await (this.redis as any).extendLock(lockKey, lockId, ttl);
    if (result === 1) {
      this.logger.debug(`Lock extended for key: ${lockKey}`);
      return true;
    }
    this.logger.warn(`Failed to extend lock for key: ${lockKey}. Lock ID mismatch or key expired.`);
    return false;
  }
}
