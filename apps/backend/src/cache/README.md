# Advanced Caching System

A comprehensive, production-ready caching infrastructure for The New Fuse
backend built with NestJS and Redis.

## Features

- **Cache-Aside Pattern**: Automatic cache management with fallback to data
  source
- **Multiple Caching Layers**: API, database, computed results, and session
  caching
- **Declarative Decorators**: `@Cacheable`, `@CacheEvict`, `@CacheInvalidate`
  for easy integration
- **HTTP Response Caching**: Automatic caching with proper Cache-Control headers
- **Cache Monitoring**: Real-time hit/miss rate tracking and performance metrics
- **Cache Warming**: Proactive cache population for critical data
- **Event-Based Invalidation**: Automatic cache invalidation based on domain
  events
- **Tag-Based Invalidation**: Group and invalidate related cache entries
- **Session Management**: High-performance session storage with sliding
  expiration
- **Batch Operations**: Efficient multi-key operations
- **Flexible TTL Configuration**: Multiple TTL presets for different use cases

## Table of Contents

- [Installation](#installation)
- [Configuration](#configuration)
- [Quick Start](#quick-start)
- [Caching Strategies](#caching-strategies)
- [API Reference](#api-reference)
- [Performance Monitoring](#performance-monitoring)
- [Best Practices](#best-practices)

## Installation

The cache module is already integrated into the application. Required
dependencies:

```bash
npm install @nestjs/config @nestjs/event-emitter @nestjs/schedule ioredis
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_CACHE_DB=1

# Cache TTL Configuration (in seconds)
REDIS_DEFAULT_TTL=3600
CACHE_TTL_SHORT=300
CACHE_TTL_MEDIUM=1800
CACHE_TTL_LONG=7200
CACHE_TTL_VERY_LONG=86400
CACHE_TTL_SESSION=604800

# Cache Monitoring
CACHE_MONITORING_ENABLED=true
CACHE_MONITORING_SAMPLE_RATE=100
CACHE_METRICS_INTERVAL=60000

# Cache Key Prefix
CACHE_KEY_PREFIX=fuse:
```

### TTL Presets

- **Short** (5 min): Frequently changing data
- **Medium** (30 min): Standard cache duration
- **Long** (2 hours): Relatively static data
- **Very Long** (24 hours): Nearly static data
- **Session** (7 days): User sessions

## Quick Start

### 1. Using Decorators (Recommended)

```typescript
import { Injectable } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { Cacheable, CacheEvict } from '../cache';
import { CacheInterceptor } from '../cache';

@Injectable()
@UseInterceptors(CacheInterceptor)
export class UserService {
  @Cacheable({
    key: (id: string) => `user:${id}`,
    ttl: 300,
    tags: ['users'],
  })
  async getUser(id: string) {
    // Only executes on cache miss
    return this.database.findUser(id);
  }

  @CacheEvict({
    key: (id: string) => `user:${id}`,
    when: 'after',
  })
  async updateUser(id: string, data: any) {
    return this.database.updateUser(id, data);
  }
}
```

### 2. Manual Cache Management

```typescript
import { Injectable } from '@nestjs/common';
import { AdvancedCacheManager } from '../cache';

@Injectable()
export class ProductService {
  constructor(private readonly cache: AdvancedCacheManager) {}

  async getProduct(id: string) {
    return this.cache.getOrSet(
      `product:${id}`,
      async () => this.database.findProduct(id),
      { ttl: 600, tags: ['products'] }
    );
  }
}
```

### 3. HTTP Response Caching

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { HttpCache, HttpCacheInterceptor } from '../cache';

@Controller('products')
@UseInterceptors(HttpCacheInterceptor)
export class ProductController {
  @Get()
  @HttpCache({ ttl: 600 })
  async getProducts() {
    return this.productService.findAll();
  }
}
```

## Caching Strategies

### 1. API Response Caching

Automatically caches HTTP GET/HEAD responses with proper headers:

```typescript
@HttpCache({
  ttl: 600,
  varyBy: ['Accept-Language'],
  keyGenerator: (req) => `products:${req.query.category}`,
})
async getProducts() {
  return this.productService.findAll();
}
```

**Headers Set:**

- `Cache-Control: public, max-age=600`
- `X-Cache: HIT|MISS`
- `Vary: Accept-Language`
- `ETag`

### 2. Database Query Caching

Specialized service for caching database queries:

```typescript
import { DatabaseCacheService } from '../cache';

// Cache single entity
const user = await this.dbCache.cacheEntity(
  'user',
  '123',
  async () => this.userRepo.findOne('123'),
  600
);

// Cache paginated results
const products = await this.dbCache.cachePaginatedQuery(
  'products',
  page,
  pageSize,
  async () => this.productRepo.findPaginated(page, pageSize)
);

// Batch fetch with caching
const users = await this.dbCache.batchFetchEntities(
  'user',
  ['1', '2', '3'],
  async (missingIds) => this.userRepo.findByIds(missingIds)
);
```

### 3. Session Caching

High-performance session management:

```typescript
import { SessionCacheService } from '../cache';

// Create session with sliding expiration
await this.sessionCache.setSession(
  sessionId,
  {
    userId: 'user123',
    email: 'user@example.com',
    roles: ['admin'],
    metadata: {},
    createdAt: Date.now(),
    lastActivity: Date.now(),
  },
  { ttl: 604800, sliding: true }
);

// Get session (automatically extends TTL if sliding)
const session = await this.sessionCache.getSession(sessionId);

// Limit concurrent sessions
await this.sessionCache.limitUserSessions(userId, 5);
```

### 4. Cache Warming

Proactively populate cache for critical data:

```typescript
import { CacheWarmingService } from '../cache';

// Register warming tasks
this.warmingService.registerTask({
  name: 'popular-products',
  key: 'products:popular',
  fetcher: async () => this.productService.findPopular(),
  ttl: 3600,
  priority: 100, // Critical
  tags: ['products'],
});

// Execute all tasks
await this.warmingService.executeAllTasksParallel();
```

**Automatic Scheduling:**

- Critical tasks (priority >= 100) warm on startup
- All tasks warm every 6 hours automatically
- Custom schedules supported via cron expressions

### 5. Cache Invalidation

#### Event-Based Invalidation

```typescript
// Emit event to trigger automatic invalidation
this.eventEmitter.emit('user.updated', { userId: '123' });
this.eventEmitter.emit('product.price.updated', { productId: '456' });
```

#### Tag-Based Invalidation

```typescript
// Invalidate all caches with 'users' tag
await this.cache.invalidateByTag('users');

// Invalidate multiple tags
await this.cache.invalidateByTags(['users', 'products']);
```

#### Pattern-Based Invalidation

```typescript
// Delete all keys matching pattern
await this.cache.deletePattern('user:*');
await this.cache.deletePattern('products:category:electronics:*');
```

#### Scheduled Invalidation

```typescript
// Schedule invalidation after delay
this.invalidationService.scheduleInvalidation(
  'clear-temp',
  { patterns: ['temp:*'] },
  3600000 // 1 hour
);
```

## API Reference

### AdvancedCacheManager

Core cache management service with Redis integration.

```typescript
// Get or compute value (cache-aside pattern)
getOrSet<T>(key: string, factory: () => Promise<T>, options?: CacheOptions): Promise<T>

// Basic operations
get<T>(key: string, options?: CacheOptions): Promise<T | null>
set<T>(key: string, value: T, options?: CacheOptions): Promise<void>
delete(key: string, options?: CacheOptions): Promise<void>

// Batch operations
mget<T>(keys: string[], options?: CacheOptions): Promise<Array<T | null>>
mset<T>(entries: Array<{key, value, ttl?}>, options?: CacheOptions): Promise<void>

// Pattern operations
deletePattern(pattern: string, options?: CacheOptions): Promise<number>

// Tag operations
invalidateByTag(tag: string): Promise<number>
invalidateByTags(tags: string[]): Promise<number>

// TTL management
getTTL(key: string, options?: CacheOptions): Promise<number>
refreshTTL(key: string, ttl?: number, options?: CacheOptions): Promise<void>

// Utilities
exists(key: string, options?: CacheOptions): Promise<boolean>
clear(): Promise<void>
getStats(): Promise<CacheStats>
```

### Decorators

```typescript
// Cache method result
@Cacheable(options: CacheableOptions)

// Evict cache entries
@CacheEvict(options: CacheEvictOptions)

// Invalidate multiple entries
@CacheInvalidate(options: CacheInvalidateOptions)

// HTTP response caching
@HttpCache(options: HttpCacheOptions)
@HttpCacheTTL(ttl: number)
```

### Cache Options

```typescript
interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix
  tags?: string[]; // Tags for invalidation
}

interface CacheableOptions extends CacheOptions {
  key?: string | ((...args) => string); // Cache key or generator
  condition?: (...args) => boolean; // Conditional caching
}
```

## Performance Monitoring

### Access Metrics Endpoint

```bash
# Get overall cache statistics
GET /cache/stats

# Get detailed metrics
GET /cache/metrics

# Get top accessed keys
GET /cache/metrics/top-keys?limit=10

# Get keys with low hit rates
GET /cache/metrics/low-hit-rate?limit=10
```

### Programmatic Access

```typescript
import { CacheMonitoringService } from '../cache';

const metrics = this.monitoring.getDetailedMetrics();
// Returns: { hits, misses, hitRate, missRate, averageHitTime, ... }

const topKeys = this.monitoring.getTopKeys(10);
// Returns: Most accessed cache keys

const lowHitRate = this.monitoring.getLowHitRateKeys(10);
// Returns: Keys with poor hit rates (candidates for removal)
```

### Metrics Collected

- **Hit Rate**: Percentage of cache hits
- **Miss Rate**: Percentage of cache misses
- **Average Hit Time**: Average time for cache hits (ms)
- **Average Miss Time**: Average time for cache misses (ms)
- **Per-Key Metrics**: Hits, misses, last access, average time
- **Redis Metrics**: Memory usage, DB size, connection status

## Best Practices

### 1. Choose Appropriate TTLs

```typescript
// Frequently changing data
@Cacheable({ ttl: 300 })  // 5 minutes

// User-specific data
@Cacheable({ ttl: 1800 }) // 30 minutes

// Reference data
@Cacheable({ ttl: 86400 }) // 24 hours
```

### 2. Use Tags for Related Data

```typescript
@Cacheable({
  key: (id) => `product:${id}`,
  tags: ['products', `category:${categoryId}`]
})
```

Allows invalidating all products or all products in a category.

### 3. Implement Cache-Aside for Critical Queries

```typescript
async getUser(id: string) {
  return this.cache.getOrSet(
    `user:${id}`,
    async () => this.database.findUser(id),
    { ttl: 600, tags: ['users'] }
  );
}
```

### 4. Monitor and Optimize

- Review low hit rate keys regularly
- Adjust TTLs based on access patterns
- Use cache warming for critical data
- Monitor memory usage

### 5. Handle Cache Failures Gracefully

```typescript
async getData(id: string) {
  try {
    return await this.cache.getOrSet(
      `data:${id}`,
      async () => this.fetchData(id),
      { ttl: 600 }
    );
  } catch (error) {
    this.logger.warn('Cache error, falling back to database', error);
    return this.fetchData(id);
  }
}
```

### 6. Use Batch Operations

```typescript
// Instead of multiple get() calls
const results = await this.cache.mget(['user:1', 'user:2', 'user:3']);

// Instead of multiple set() calls
await this.cache.mset([
  { key: 'user:1', value: user1 },
  { key: 'user:2', value: user2 },
]);
```

### 7. Invalidate Proactively

```typescript
// After update
@CacheEvict({
  key: (id) => `user:${id}`,
  when: 'after'
})
async updateUser(id: string, data: any) {
  return this.userRepo.update(id, data);
}
```

## Cache Management API

### Manual Cache Operations

```bash
# Get cache value
GET /cache/key/:key?prefix=entity

# Set cache value
POST /cache/key/:key
{
  "value": {...},
  "ttl": 600,
  "tags": ["users"]
}

# Delete cache key
DELETE /cache/key/:key?prefix=entity

# Delete by pattern
DELETE /cache/pattern/user:*

# Invalidate by tag
DELETE /cache/tag/users

# Clear all cache (use with caution!)
DELETE /cache/clear-all

# Warm specific task
POST /cache/warm/popular-products

# Warm all caches
POST /cache/warm-all?parallel=true

# Health check
GET /cache/health
```

## Troubleshooting

### High Miss Rate

1. Check TTL configuration
2. Review cache key generation logic
3. Verify cache warming is working
4. Monitor memory usage (cache may be evicting entries)

### Memory Issues

1. Review TTLs (reduce if too long)
2. Check for cache key explosion
3. Monitor cache size growth
4. Implement LRU eviction policy in Redis

### Slow Performance

1. Use batch operations for multiple keys
2. Enable cache warming for critical data
3. Use appropriate Redis connection pooling
4. Monitor network latency to Redis

## Performance Improvements Expected

### Response Times

- **API Responses**: 50-90% reduction for cached endpoints
- **Database Queries**: 70-95% reduction for frequently accessed data
- **Computed Results**: 80-99% reduction for expensive calculations

### System Load

- **Database Load**: 40-70% reduction in query volume
- **CPU Usage**: 20-40% reduction for computation-heavy operations
- **Memory**: Efficient Redis memory usage with TTL-based eviction

### Scalability

- **Concurrent Users**: 3-5x increase in supportable concurrent users
- **Throughput**: 2-4x increase in requests per second
- **Latency**: 60-80% reduction in P95/P99 latencies

## License

MIT
