/**
 * Agency Hub Cache Service
 * Handles caching for agency hub operations
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  tags?: string[]; // Cache tags for invalidation
}

@Injectable()
export class AgencyHubCacheService {
  private readonly logger = new Logger(AgencyHubCacheService.name);
  private readonly cache = new Map<string, { value: unknown; expires: number; tags?: string[] }>();
  private readonly defaultTtl = 300; // 5 minutes

  constructor(private readonly configService: ConfigService) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }

    this.logger.debug(`Cache hit for key: ${key}`);
    return entry.value as T;
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, options: CacheOptions = {}): Promise<void> {
    const ttl = options.ttl || this.defaultTtl;
    const expires = Date.now() + ttl * 1000;
    this.cache.set(key, {
      value,
      expires,
      tags: options.tags,
    });
    this.logger.debug(`Cache set for key: ${key}, TTL: ${ttl}s`);
  }

  /**
   * Delete value from cache
   */
  async del(key: string): Promise<void> {
    this.cache.delete(key);
    this.logger.debug(`Cache deleted for key: ${key}`);
  }

  /**
   * Clear all cache entries
   */
  async clear(): Promise<void> {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }

  /**
   * Invalidate cache entries by tags
   */
  async invalidateByTags(tags: string[]): Promise<void> {
    const keysToDelete: string[] = [];
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags && entry.tags.some(tag => tags.includes(tag))) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    this.logger.debug(`Cache invalidated for tags: ${tags.join(', ')}`);
  }
}