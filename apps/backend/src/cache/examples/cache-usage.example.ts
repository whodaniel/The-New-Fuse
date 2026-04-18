import { Injectable, UseInterceptors } from '@nestjs/common';
import { Cacheable, CacheEvict, CacheInvalidate } from '../decorators/cacheable.decorator';
import { CacheInterceptor } from '../interceptors/cache.interceptor';
import { HttpCache, HttpCacheInterceptor } from '../interceptors/http-cache.interceptor';
import { AdvancedCacheManager } from '../services/advanced-cache.manager';
import { CacheInvalidationService } from '../services/cache-invalidation.service';
import { CacheWarmingService } from '../services/cache-warming.service';
import { DatabaseCacheService } from '../services/database-cache.service';
import { SessionCacheService } from '../services/session-cache.service';

/**
 * Example 1: Using @Cacheable decorator for automatic caching
 */
@Injectable()
@UseInterceptors(CacheInterceptor)
export class UserService {
  constructor(private readonly dbCache: DatabaseCacheService) {}

  /**
   * Cache user by ID with 5 minutes TTL
   */
  @Cacheable({
    key: (id: string) => `user:${id}`,
    ttl: 300,
    tags: ['users'],
  })
  async getUserById(id: string) {
    // This will only execute on cache miss
    console.log('Fetching user from database:', id);
    return { id, name: 'John Doe', email: 'john@example.com' };
  }

  /**
   * Cache user with automatic eviction after update
   */
  @Cacheable({
    key: (id: string) => `user:${id}`,
    ttl: 300,
  })
  @CacheEvict({
    key: (id: string) => `user:${id}`,
    when: 'after',
  })
  async updateUser(id: string, data: any) {
    console.log('Updating user:', id, data);
    return { id, ...data };
  }

  /**
   * Invalidate user lists when creating a new user
   */
  @CacheEvict({
    pattern: 'users:list:*',
    tags: ['users'],
    when: 'after',
  })
  async createUser(data: any) {
    console.log('Creating user:', data);
    return { id: '123', ...data };
  }

  /**
   * Invalidate multiple cache entries
   */
  @CacheInvalidate({
    keys: ['users:count', 'users:stats'],
    patterns: ['users:list:*'],
    tags: ['users', 'analytics'],
    when: 'after',
  })
  async bulkDeleteUsers(ids: string[]) {
    console.log('Deleting users:', ids);
    return { deleted: ids.length };
  }
}

/**
 * Example 2: Using HTTP cache interceptor for API responses
 */
@Injectable()
@UseInterceptors(HttpCacheInterceptor)
export class ProductController {
  /**
   * Cache GET requests for 10 minutes
   */
  @HttpCache({ ttl: 600 })
  async getProducts() {
    console.log('Fetching products from database');
    return [
      { id: 1, name: 'Product 1' },
      { id: 2, name: 'Product 2' },
    ];
  }

  /**
   * Cache with custom key generator
   */
  @HttpCache({
    ttl: 300,
    keyGenerator: (req) => `products:category:${req.query.category}`,
  })
  async getProductsByCategory() {
    console.log('Fetching products by category');
    return [];
  }

  /**
   * Cache with Vary header
   */
  @HttpCache({
    ttl: 600,
    varyBy: ['Accept-Language', 'Accept-Encoding'],
  })
  async getProductsLocalized() {
    console.log('Fetching localized products');
    return [];
  }
}

/**
 * Example 3: Manual cache management with AdvancedCacheManager
 */
@Injectable()
export class ManualCacheExample {
  constructor(private readonly cacheManager: AdvancedCacheManager) {}

  async cacheExample() {
    // Simple set/get
    await this.cacheManager.set('key1', { value: 'data' }, { ttl: 300 });
    const data = await this.cacheManager.get('key1');

    // Cache-aside pattern
    const user = await this.cacheManager.getOrSet(
      'user:123',
      async () => {
        // This only executes on cache miss
        return { id: '123', name: 'John' };
      },
      { ttl: 600, tags: ['users'] }
    );

    // Batch operations
    await this.cacheManager.mset([
      { key: 'user:1', value: { id: '1', name: 'Alice' } },
      { key: 'user:2', value: { id: '2', name: 'Bob' } },
    ]);

    const users = await this.cacheManager.mget(['user:1', 'user:2']);

    // Pattern-based deletion
    await this.cacheManager.deletePattern('user:*');

    // Tag-based invalidation
    await this.cacheManager.invalidateByTag('users');

    // Check TTL
    const ttl = await this.cacheManager.getTTL('key1');
    console.log('TTL:', ttl);
  }
}

/**
 * Example 4: Database query caching
 */
@Injectable()
export class DatabaseCacheExample {
  constructor(private readonly dbCache: DatabaseCacheService) {}

  async exampleUsage() {
    // Cache single entity
    const user = await this.dbCache.cacheEntity(
      'user',
      '123',
      async () => ({ id: '123', name: 'John' }),
      600
    );

    // Cache entity list
    const users = await this.dbCache.cacheEntityList(
      'user',
      'active',
      async () => [{ id: '1' }, { id: '2' }],
      300
    );

    // Cache paginated query
    const result = await this.dbCache.cachePaginatedQuery('products', 1, 20, async () => ({
      data: [{ id: 1 }, { id: 2 }],
      total: 100,
    }));

    // Cache search results
    const searchResults = await this.dbCache.cacheSearchResults(
      'products',
      { query: 'laptop', category: 'electronics' },
      async () => [{ id: 1 }]
    );

    // Batch fetch with caching
    const batchUsers = await this.dbCache.batchFetchEntities(
      'user',
      ['1', '2', '3'],
      async (missingIds) => {
        // Only fetch missing IDs
        return [{ id: '3', name: 'Charlie' }];
      }
    );

    // Invalidate entity cache
    await this.dbCache.invalidateEntity('user', '123');
    await this.dbCache.invalidateEntityLists('user');
  }
}

/**
 * Example 5: Session caching
 */
@Injectable()
export class SessionCacheExample {
  constructor(private readonly sessionCache: SessionCacheService) {}

  async exampleUsage() {
    // Create session
    await this.sessionCache.setSession(
      'session123',
      {
        userId: 'user123',
        email: 'user@example.com',
        roles: ['user', 'admin'],
        metadata: { loginTime: Date.now() },
        createdAt: Date.now(),
        lastActivity: Date.now(),
      },
      { ttl: 604800, sliding: true } // 7 days with sliding expiration
    );

    // Get session
    const session = await this.sessionCache.getSession('session123');

    // Update session
    await this.sessionCache.updateSessionData('session123', {
      metadata: { lastPage: '/dashboard' },
    });

    // Get all user sessions
    const userSessions = await this.sessionCache.getUserSessionsWithData('user123');

    // Limit user sessions to maximum 5
    await this.sessionCache.limitUserSessions('user123', 5);

    // Delete session
    await this.sessionCache.deleteSession('session123');

    // Delete all user sessions
    await this.sessionCache.deleteUserSessions('user123');
  }
}

/**
 * Example 6: Cache warming
 */
@Injectable()
export class CacheWarmingExample {
  constructor(private readonly warmingService: CacheWarmingService) {}

  async setupWarmingTasks() {
    // Register common warming tasks
    this.warmingService.registerCommonTasks({
      siteConfig: async () => ({
        siteName: 'My Site',
        theme: 'dark',
      }),
      navigationMenu: async () => [
        { id: 1, label: 'Home', url: '/' },
        { id: 2, label: 'Products', url: '/products' },
      ],
      popularProducts: async () => [
        { id: 1, name: 'Product 1' },
        { id: 2, name: 'Product 2' },
      ],
    });

    // Register custom warming task
    this.warmingService.registerTask({
      name: 'user-stats',
      key: 'stats:users',
      fetcher: async () => ({
        total: 1000,
        active: 750,
        premium: 200,
      }),
      ttl: 3600,
      priority: 75,
      tags: ['stats', 'users'],
    });

    // Execute all warming tasks
    await this.warmingService.executeAllTasksParallel(5);

    // Execute specific task
    await this.warmingService.executeTask('user-stats');

    // Warm if missing
    await this.warmingService.warmIfMissing('config:app', async () => ({ version: '1.0.0' }), {
      ttl: 7200,
    });
  }
}

/**
 * Example 7: Cache invalidation strategies
 */
@Injectable()
export class CacheInvalidationExample {
  constructor(private readonly invalidationService: CacheInvalidationService) {}

  async setupInvalidation() {
    // Register custom invalidation rule
    this.invalidationService.registerRule({
      name: 'product-price-update',
      event: 'product.price.updated',
      handler: async (payload) => {
        await this.invalidationService.invalidate({
          tags: [`product:${payload.productId}`],
          patterns: ['products:*', 'cart:*'],
        });
      },
    });

    // Manual invalidation
    await this.invalidationService.invalidate({
      keys: ['config:app'],
      patterns: ['users:list:*'],
      tags: ['users', 'products'],
    });

    // Schedule invalidation
    this.invalidationService.scheduleInvalidation(
      'clear-temp-cache',
      { patterns: ['temp:*'] },
      3600000 // 1 hour
    );

    // Conditional invalidation
    await this.invalidationService.conditionalInvalidate(
      async () => {
        // Check if invalidation is needed
        return true;
      },
      { tags: ['users'] }
    );

    // Invalidate related caches
    await this.invalidationService.invalidateRelated('user', '123', ['orders', 'cart', 'wishlist']);
  }
}

/**
 * Example 8: Cache with automatic refresh
 */
@Injectable()
export class CacheRefreshExample {
  constructor(private readonly dbCache: DatabaseCacheService) {}

  async exampleUsage() {
    // Cache with automatic refresh before expiration
    const stats = await this.dbCache.cacheWithRefresh(
      'stats:dashboard',
      async () => ({
        users: 1000,
        orders: 5000,
        revenue: 100000,
      }),
      {
        ttl: 3600,
        refreshInterval: 2880, // Refresh at 80% of TTL
        tags: ['stats'],
      }
    );
  }
}
