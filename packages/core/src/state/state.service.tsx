import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import { Logger } from '@the-new-fuse/utils';

@Injectable()
export class StateService {
  private readonly logger = new Logger(StateService.name);
  private readonly defaultTTL = 3600; // 1 hour in seconds

  constructor(private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) as T : null;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get state', { error: errorMessage, key });
      throw new Error('Failed to get state');
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      const serializedValue = JSON.stringify(value);
      if (ttl) {
        await this.redis.setex(key, ttl, serializedValue);
      } else {
        await this.redis.set(key, serializedValue);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to set state:', { error: errorMessage, key });
      throw new Error('Failed to set state');
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to delete state', { error: errorMessage, key });
      throw new Error('Failed to delete state');
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(key);
      return exists === 1;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to check state existence', { error: errorMessage, key });
      throw new Error('Failed to check state existence');
    }
  }

  async setWithDefaultTTL<T>(key: string, value: T): Promise<void> {
    await this.set(key, value, this.defaultTTL);
  }

  async increment(key: string): Promise<number> {
    try {
      return await this.redis.incr(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to increment value', { error: errorMessage, key });
      throw new Error('Failed to increment value');
    }
  }

  async decrement(key: string): Promise<number> {
    try {
      return await this.redis.decr(key);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to decrement value', { error: errorMessage, key });
      throw new Error('Failed to decrement value');
    }
  }

  async getKeys(pattern: string): Promise<string[]> {
    try {
      return await this.redis.keys(pattern);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to get keys', { error: errorMessage, pattern });
      throw new Error('Failed to get keys');
    }
  }

  async clear(): Promise<void> {
    try {
      await this.redis.flushdb();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to clear state', { error: errorMessage });
      throw new Error('Failed to clear state');
    }
  }
}
