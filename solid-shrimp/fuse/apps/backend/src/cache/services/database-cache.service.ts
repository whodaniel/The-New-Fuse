import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AdvancedCacheManager } from './advanced-cache.manager';
import * as crypto from 'crypto';

export interface QueryCacheOptions {
  ttl?: number;
  tags?: string[];
  invalidateOn?: string[];
}

@Injectable()
export class DatabaseCacheService {
  private readonly logger = new Logger(DatabaseCacheService.name);
  private readonly defaultTTL: number;

  constructor(
    private readonly cacheManager: AdvancedCacheManager,
    private readonly configService: ConfigService,
  ) {
    const cacheConfig = this.configService.get('cache');
    this.defaultTTL = cacheConfig?.ttl?.medium || 1800; // 30 minutes default
  }

  /**
   * Execute a query with caching
   * @param queryFn Function that executes the query
   * @param cacheKey Cache key or object to generate key from
   * @param options Cache options
   */
  async cachedQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey: string | object,
    options: QueryCacheOptions = {},
  ): Promise<T> {
    const key = typeof cacheKey === 'string'
      ? cacheKey
      : this.generateQueryKey(cacheKey);

    return this.cacheManager.getOrSet(
      key,
      queryFn,
      {
        ttl: options.ttl || this.defaultTTL,
        prefix: 'db:',
        tags: options.tags,
      },
    );
  }

  /**
   * Cache a single entity by ID
   */
  async cacheEntity<T>(
    entityName: string,
    id: string | number,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const key = `${entityName}:${id}`;

    return this.cacheManager.getOrSet(
      key,
      fetchFn,
      {
        ttl: ttl || this.defaultTTL,
        prefix: 'entity:',
        tags: [entityName, `${entityName}:${id}`],
      },
    );
  }

  /**
   * Cache a list of entities
   */
  async cacheEntityList<T>(
    entityName: string,
    listKey: string,
    fetchFn: () => Promise<T[]>,
    ttl?: number,
  ): Promise<T[]> {
    const key = `${entityName}:list:${listKey}`;

    return this.cacheManager.getOrSet(
      key,
      fetchFn,
      {
        ttl: ttl || this.defaultTTL,
        prefix: 'entity:',
        tags: [entityName, `${entityName}:list`],
      },
    );
  }

  /**
   * Invalidate cache for a specific entity
   */
  async invalidateEntity(entityName: string, id?: string | number): Promise<void> {
    if (id) {
      await this.cacheManager.invalidateByTag(`${entityName}:${id}`);
    } else {
      await this.cacheManager.invalidateByTag(entityName);
    }

    this.logger.debug(`Invalidated cache for entity ${entityName}${id ? `:${id}` : ''}`);
  }

  /**
   * Invalidate cache for entity lists
   */
  async invalidateEntityLists(entityName: string): Promise<void> {
    await this.cacheManager.invalidateByTag(`${entityName}:list`);
    this.logger.debug(`Invalidated list cache for entity ${entityName}`);
  }

  /**
   * Cache aggregation results
   */
  async cacheAggregation<T>(
    aggregationKey: string,
    fetchFn: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    return this.cacheManager.getOrSet(
      aggregationKey,
      fetchFn,
      {
        ttl: ttl || this.defaultTTL,
        prefix: 'aggregation:',
      },
    );
  }

  /**
   * Cache count queries
   */
  async cacheCount(
    countKey: string,
    countFn: () => Promise<number>,
    ttl?: number,
  ): Promise<number> {
    return this.cacheManager.getOrSet(
      countKey,
      countFn,
      {
        ttl: ttl || this.defaultTTL,
        prefix: 'count:',
      },
    );
  }

  /**
   * Generate a deterministic cache key from query parameters
   */
  private generateQueryKey(queryParams: any): string {
    const hash = crypto
      .createHash('sha256')
      .update(JSON.stringify(queryParams))
      .digest('hex')
      .substring(0, 16);

    return `query:${hash}`;
  }

  /**
   * Cache paginated results
   */
  async cachePaginatedQuery<T>(
    baseKey: string,
    page: number,
    pageSize: number,
    fetchFn: () => Promise<{ data: T[]; total: number }>,
    ttl?: number,
  ): Promise<{ data: T[]; total: number }> {
    const key = `${baseKey}:page:${page}:size:${pageSize}`;

    return this.cacheManager.getOrSet(
      key,
      fetchFn,
      {
        ttl: ttl || this.defaultTTL,
        prefix: 'pagination:',
        tags: [baseKey],
      },
    );
  }

  /**
   * Cache search results
   */
  async cacheSearchResults<T>(
    searchKey: string,
    searchParams: any,
    fetchFn: () => Promise<T[]>,
    ttl?: number,
  ): Promise<T[]> {
    const paramsHash = this.generateQueryKey(searchParams);
    const key = `${searchKey}:${paramsHash}`;

    return this.cacheManager.getOrSet(
      key,
      fetchFn,
      {
        ttl: ttl || this.defaultTTL,
        prefix: 'search:',
        tags: [searchKey],
      },
    );
  }

  /**
   * Invalidate all pagination caches for a base key
   */
  async invalidatePagination(baseKey: string): Promise<void> {
    await this.cacheManager.invalidateByTag(baseKey);
    this.logger.debug(`Invalidated pagination cache for ${baseKey}`);
  }

  /**
   * Batch cache multiple entities
   */
  async batchCacheEntities<T>(
    entityName: string,
    entities: Array<{ id: string | number; data: T }>,
    ttl?: number,
  ): Promise<void> {
    const entries = entities.map((entity) => ({
      key: `${entityName}:${entity.id}`,
      value: entity.data,
      ttl: ttl || this.defaultTTL,
    }));

    await this.cacheManager.mset(entries, {
      prefix: 'entity:',
      tags: [entityName],
    });

    this.logger.debug(`Batch cached ${entities.length} ${entityName} entities`);
  }

  /**
   * Batch fetch entities with caching
   */
  async batchFetchEntities<T>(
    entityName: string,
    ids: Array<string | number>,
    fetchFn: (missingIds: Array<string | number>) => Promise<T[]>,
    ttl?: number,
  ): Promise<T[]> {
    // Try to get all from cache
    const keys = ids.map((id) => `${entityName}:${id}`);
    const cached = await this.cacheManager.mget<T>(keys, { prefix: 'entity:' });

    // Find missing entities
    const missingIndices: number[] = [];
    const missingIds: Array<string | number> = [];

    cached.forEach((value, index) => {
      if (value === null) {
        missingIndices.push(index);
        missingIds.push(ids[index]);
      }
    });

    // Fetch missing entities
    if (missingIds.length > 0) {
      const fetched = await fetchFn(missingIds);

      // Cache fetched entities
      const entitiesToCache = fetched.map((data, index) => ({
        id: missingIds[index],
        data,
      }));

      await this.batchCacheEntities(entityName, entitiesToCache, ttl);

      // Fill in missing values
      missingIndices.forEach((cacheIndex, fetchedIndex) => {
        cached[cacheIndex] = fetched[fetchedIndex];
      });
    }

    return cached.filter((v): v is T => v !== null);
  }

  /**
   * Cache with automatic refresh (cache warming)
   */
  async cacheWithRefresh<T>(
    key: string,
    fetchFn: () => Promise<T>,
    options: {
      ttl?: number;
      refreshInterval?: number;
      tags?: string[];
    } = {},
  ): Promise<T> {
    const ttl = options.ttl || this.defaultTTL;
    const refreshInterval = options.refreshInterval || ttl * 0.8; // Refresh at 80% of TTL

    const cached = await this.cacheManager.get<T>(key, { prefix: 'db:' });

    if (cached !== null) {
      // Check if we need to refresh in background
      const cacheAge = ttl - (await this.cacheManager.getTTL(key, { prefix: 'db:' }));

      if (cacheAge >= refreshInterval) {
        // Refresh in background
        this.refreshInBackground(key, fetchFn, ttl, options.tags);
      }

      return cached;
    }

    // Cache miss - fetch and cache
    const value = await fetchFn();
    await this.cacheManager.set(key, value, {
      ttl,
      prefix: 'db:',
      tags: options.tags,
    });

    return value;
  }

  /**
   * Refresh cache in background
   */
  private async refreshInBackground<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl: number,
    tags?: string[],
  ): Promise<void> {
    try {
      const value = await fetchFn();
      await this.cacheManager.set(key, value, {
        ttl,
        prefix: 'db:',
        tags,
      });

      this.logger.debug(`Background refreshed cache for key ${key}`);
    } catch (error) {
      this.logger.error(`Failed to refresh cache for key ${key}:`, error);
    }
  }
}
