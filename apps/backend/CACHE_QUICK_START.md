# Cache Quick Start Guide

Get started with The New Fuse caching system in 5 minutes.

## Step 1: Install Dependencies

```bash
cd apps/backend
npm install
```

Required packages (already added to package.json):

- `@nestjs/config`
- `@nestjs/event-emitter`
- `@nestjs/schedule`
- `ioredis`

## Step 2: Configure Redis

Add these to your `.env` file:

```env
# Redis Connection
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_CACHE_DB=1

# Cache Monitoring
CACHE_MONITORING_ENABLED=true
```

## Step 3: Start Redis

### Using Docker

```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

### Using local installation

```bash
redis-server
```

## Step 4: Verify Setup

Start your backend:

```bash
npm run start:dev
```

Test the cache health endpoint:

```bash
curl http://localhost:3004/cache/health
```

Expected response:

```json
{
  "status": "healthy",
  "redis": "connected",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## Step 5: Add Caching to Your Service

### Option 1: Using Decorators (Recommended)

```typescript
import { Injectable } from '@nestjs/common';
import { UseInterceptors } from '@nestjs/common';
import { Cacheable, CacheEvict, CacheInterceptor } from './cache';

@Injectable()
@UseInterceptors(CacheInterceptor)
export class UserService {
  // Cache user data for 5 minutes
  @Cacheable({
    key: (id: string) => `user:${id}`,
    ttl: 300,
    tags: ['users'],
  })
  async getUser(id: string) {
    // Your existing code - only runs on cache miss
    return this.database.findUser(id);
  }

  // Automatically clear cache after update
  @CacheEvict({
    key: (id: string) => `user:${id}`,
    when: 'after',
  })
  async updateUser(id: string, data: any) {
    return this.database.updateUser(id, data);
  }
}
```

### Option 2: Manual Cache Management

```typescript
import { Injectable } from '@nestjs/common';
import { AdvancedCacheManager } from './cache';

@Injectable()
export class ProductService {
  constructor(private readonly cache: AdvancedCacheManager) {}

  async getProduct(id: string) {
    // Cache-aside pattern
    return this.cache.getOrSet(
      `product:${id}`,
      async () => this.database.findProduct(id),
      { ttl: 600 }
    );
  }
}
```

### Option 3: HTTP Response Caching

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { HttpCache, HttpCacheInterceptor } from './cache';

@Controller('products')
@UseInterceptors(HttpCacheInterceptor)
export class ProductController {
  @Get()
  @HttpCache({ ttl: 600 }) // Cache for 10 minutes
  async getProducts() {
    return this.productService.findAll();
  }
}
```

## Common Use Cases

### 1. Cache User Profile

```typescript
@Cacheable({ key: (id) => `user:${id}`, ttl: 300 })
async getUserProfile(id: string) {
  return this.userRepo.findOne(id);
}
```

### 2. Cache Product List

```typescript
@Cacheable({ key: 'products:all', ttl: 600, tags: ['products'] })
async getAllProducts() {
  return this.productRepo.findAll();
}
```

### 3. Cache with Invalidation

```typescript
@Cacheable({ key: (id) => `product:${id}`, ttl: 600 })
@CacheEvict({ key: (id) => `product:${id}`, when: 'after' })
async updateProduct(id: string, data: any) {
  return this.productRepo.update(id, data);
}
```

### 4. Invalidate Related Caches

```typescript
@CacheInvalidate({
  patterns: ['products:*', 'categories:*'],
  tags: ['products'],
  when: 'after'
})
async bulkUpdateProducts(ids: string[]) {
  return this.productRepo.bulkUpdate(ids);
}
```

## Monitoring Cache Performance

### View Statistics

```bash
curl http://localhost:3004/cache/stats
```

### View Top Keys

```bash
curl http://localhost:3004/cache/metrics/top-keys?limit=10
```

### Manual Cache Operations

```bash
# Get cache value
curl http://localhost:3004/cache/key/user:123

# Delete cache key
curl -X DELETE http://localhost:3004/cache/key/user:123

# Clear pattern
curl -X DELETE http://localhost:3004/cache/pattern/users:*

# Invalidate by tag
curl -X DELETE http://localhost:3004/cache/tag/users
```

## TTL Reference

Choose the right TTL for your data:

| TTL Preset | Duration   | Use Case                   |
| ---------- | ---------- | -------------------------- |
| `300`      | 5 minutes  | Frequently changing data   |
| `1800`     | 30 minutes | Standard caching (default) |
| `7200`     | 2 hours    | Relatively static data     |
| `86400`    | 24 hours   | Reference data             |
| `604800`   | 7 days     | User sessions              |

## Advanced Features

### Database Query Caching

```typescript
import { DatabaseCacheService } from './cache';

constructor(private dbCache: DatabaseCacheService) {}

// Cache single entity
const user = await this.dbCache.cacheEntity(
  'user',
  userId,
  async () => this.userRepo.findOne(userId),
  600
);

// Cache paginated results
const products = await this.dbCache.cachePaginatedQuery(
  'products',
  page,
  pageSize,
  async () => this.productRepo.findPaginated(page, pageSize)
);
```

### Session Caching

```typescript
import { SessionCacheService } from './cache';

constructor(private sessionCache: SessionCacheService) {}

// Create session
await this.sessionCache.setSession(sessionId, {
  userId: 'user123',
  email: 'user@example.com',
  roles: ['user'],
  createdAt: Date.now(),
  lastActivity: Date.now(),
}, { ttl: 604800, sliding: true });

// Get session
const session = await this.sessionCache.getSession(sessionId);
```

### Cache Warming

```typescript
import { CacheWarmingService } from './cache';

constructor(private warming: CacheWarmingService) {}

// Register warming task
this.warming.registerTask({
  name: 'popular-products',
  key: 'products:popular',
  fetcher: async () => this.productRepo.findPopular(),
  ttl: 3600,
  priority: 100,
});
```

## Troubleshooting

### Cache not working?

1. **Check Redis connection:**

   ```bash
   curl http://localhost:3004/cache/health
   ```

2. **Verify environment variables:**

   ```bash
   echo $REDIS_HOST
   echo $REDIS_PORT
   ```

3. **Check logs for errors:** Look for "Redis cache connection error" in logs

### Low cache hit rate?

1. **Check metrics:**

   ```bash
   curl http://localhost:3004/cache/metrics
   ```

2. **Review low hit rate keys:**

   ```bash
   curl http://localhost:3004/cache/metrics/low-hit-rate
   ```

3. **Adjust TTLs:** Keys may be expiring too quickly

### Memory issues?

1. **Monitor Redis memory:**

   ```bash
   redis-cli info memory
   ```

2. **Reduce TTLs** for less critical data

3. **Review cache size:**
   ```bash
   curl http://localhost:3004/cache/stats
   ```

## Best Practices

1. ✅ **Use decorators** for automatic caching
2. ✅ **Tag related caches** for easy invalidation
3. ✅ **Monitor hit rates** regularly
4. ✅ **Invalidate on updates** to keep data fresh
5. ✅ **Use appropriate TTLs** based on data change frequency
6. ✅ **Warm critical caches** on startup
7. ✅ **Handle cache failures** gracefully

## Next Steps

- 📖 Read the full [Cache README](./src/cache/README.md)
- 💡 Check [usage examples](./src/cache/examples/cache-usage.example.ts)
- 📊 Review [implementation summary](./CACHING_IMPLEMENTATION_SUMMARY.md)
- 🔧 Configure [cache warming](./src/cache/services/cache-warming.service.ts)
  for your data

## Need Help?

Common issues and solutions:

**Q: How do I cache a complex query?**

```typescript
@Cacheable({
  key: (params) => `query:${JSON.stringify(params)}`,
  ttl: 600
})
```

**Q: How do I invalidate related caches?**

```typescript
@CacheEvict({
  pattern: 'users:*',
  tags: ['users'],
  when: 'after'
})
```

**Q: How do I cache authenticated requests?**

```typescript
@HttpCache({
  keyGenerator: (req) => `user:${req.user.id}:data`,
  ttl: 300
})
```

**Q: How do I warm cache on startup?**

```typescript
// In your service
async onModuleInit() {
  await this.warming.warmIfMissing(
    'config:app',
    async () => this.getConfig()
  );
}
```

Happy caching! 🚀
