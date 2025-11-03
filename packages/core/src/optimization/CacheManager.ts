import { Injectable, Logger, OnModuleInit, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheManagerService implements OnModuleInit {
  private readonly logger = new Logger(CacheManagerService.name);

  constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

  onModuleInit() {
    this.logger.log('Cache Manager Initialized.');
  }

  async get<T>(key: string): Promise<T | undefined> {
    try {
      const value = await this.cache.get<T>(key);
      if (value) {
        this.logger.debug(`Cache hit for key: ${key}`);
        return value;
      } else {
        this.logger.debug(`Cache miss for key: ${key}`);
        return undefined;
      }
    } catch (error) {
      this.logger.error(`Error getting value from cache for key ${key}:`, error);
      return undefined;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cache.set(key, value, ttl);
      this.logger.debug(`Set cache for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error setting value in cache for key ${key}:`, error);
    }
  }

  async del(key: string): Promise<void> {
    try {
      await this.cache.del(key);
      this.logger.debug(`Deleted cache for key: ${key}`);
    } catch (error) {
      this.logger.error(`Error deleting value from cache for key ${key}:`, error);
    }
  }

  async reset(): Promise<void> {
    try {
      await this.cache.reset();
      this.logger.log('Cache has been reset.');
    } catch (error) {
      this.logger.error('Error resetting cache:', error);
    }
  }
}
