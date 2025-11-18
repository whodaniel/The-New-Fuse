# API Optimization Package

Comprehensive API optimization infrastructure with rate limiting, caching, CDN configuration, and performance features for The New Fuse platform.

## Features

### 1. Redis-Based Rate Limiting
- Distributed rate limiting using Redis
- Sliding window algorithm for accurate rate limiting
- Tiered rate limits (free, pro, enterprise, custom)
- Per-user and per-IP rate limiting
- Rate limit monitoring and metrics
- Automatic blocking and penalty system

### 2. Response Caching
- Two-tier caching (Redis + LRU in-memory)
- Tag-based cache invalidation
- ETags for conditional requests
- Cache warming for critical data
- Automatic cache headers
- Cache statistics and monitoring

### 3. CDN Configuration
- Multi-provider support (Cloudflare, CloudFront, Fastly)
- Automatic CDN URL generation
- Cache purging and invalidation
- Optimal cache headers for static assets

### 4. Cache Invalidation
- Multiple invalidation strategies (tag, pattern, time, event)
- Scheduled invalidation
- Smart entity-based invalidation
- Bulk invalidation support

### 5. Quota Management
- Hourly, daily, and monthly quotas
- Fixed and rolling window quotas
- Tier-based quota management
- Usage tracking and reporting

### 6. Backpressure Handling
- Request queuing to prevent overload
- Configurable concurrency limits
- Automatic request timeout
- Performance metrics and monitoring

### 7. Cache Warming
- Preload critical data on startup
- Scheduled cache warming
- Priority-based warming strategies
- URL and tag-based warming

### 8. Monitoring & Alerting
- Real-time metrics for all optimization features
- Automatic alerting for degraded performance
- Health checks and status reporting
- Performance recommendations

## Installation

```bash
pnpm add @the-new-fuse/api-optimization
```

## Quick Start

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { ApiOptimizationModule } from '@the-new-fuse/api-optimization';

@Module({
  imports: [ApiOptimizationModule],
})
export class AppModule {}
```

### 2. Environment Variables

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your_password

# Rate Limiting
BACKPRESSURE_ENABLED=true
BACKPRESSURE_MAX_CONCURRENT=100
BACKPRESSURE_MAX_QUEUE=50

# Caching
CACHE_TTL=300
CACHE_WARM_ON_STARTUP=true
CACHE_STATIC_MAX_AGE=31536000
CACHE_API_MAX_AGE=300

# CDN
CDN_ENABLED=true
CDN_PROVIDER=cloudflare
CDN_DOMAIN=cdn.example.com
CDN_API_KEY=your_api_key
CDN_ZONE_ID=your_zone_id
```

## Usage

### Rate Limiting

#### Using Guards

```typescript
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RateLimitGuard, RateLimit, RateLimitPresets } from '@the-new-fuse/api-optimization';

@Controller('users')
@UseGuards(RateLimitGuard)
export class UsersController {
  // Custom rate limit
  @Get()
  @RateLimit({ points: 100, duration: 60 })
  getUsers() {
    return this.usersService.findAll();
  }

  // Use predefined preset
  @Get('search')
  @RateLimit(RateLimitPresets.SEARCH)
  searchUsers() {
    return this.usersService.search();
  }

  // Use tier-based rate limit
  @Get('premium')
  @RateLimitTier('pro')
  getPremiumFeatures() {
    return this.usersService.getPremiumFeatures();
  }

  // Skip rate limiting
  @Get('health')
  @SkipRateLimit()
  healthCheck() {
    return { status: 'ok' };
  }
}
```

#### Using Middleware

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { RateLimitMiddleware } from '@the-new-fuse/api-optimization';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RateLimitMiddleware)
      .forRoutes('*');
  }
}
```

### Response Caching

#### Using Interceptors

```typescript
import { Controller, Get, UseInterceptors } from '@nestjs/common';
import {
  CacheInterceptor,
  CacheResponse,
  CachePresets,
  InvalidateCache
} from '@the-new-fuse/api-optimization';

@Controller('dashboard')
@UseInterceptors(CacheInterceptor)
export class DashboardController {
  // Cache with custom TTL and tags
  @Get()
  @CacheResponse({ ttl: 300, tags: ['dashboard', 'analytics'] })
  getDashboard() {
    return this.dashboardService.getData();
  }

  // Use predefined preset
  @Get('analytics')
  @CacheResponse(CachePresets.ANALYTICS)
  getAnalytics() {
    return this.analyticsService.getData();
  }

  // Invalidate cache on mutation
  @Post()
  @InvalidateCache(['dashboard', 'analytics'])
  async updateDashboard(@Body() data: UpdateDashboardDto) {
    return this.dashboardService.update(data);
  }

  // Skip caching for dynamic data
  @Get('live')
  @SkipCache()
  getLiveData() {
    return this.dashboardService.getLiveData();
  }
}
```

#### Direct Service Usage

```typescript
import { Injectable } from '@nestjs/common';
import { ResponseCacheService } from '@the-new-fuse/api-optimization';

@Injectable()
export class UsersService {
  constructor(private cacheService: ResponseCacheService) {}

  async getUser(userId: string) {
    const cacheKey = `user:${userId}`;

    // Check cache
    const cached = await this.cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Fetch from database
    const user = await this.userRepository.findById(userId);

    // Cache result
    await this.cacheService.set(cacheKey, user, {
      ttl: 300,
      tags: ['users', `user:${userId}`]
    });

    return user;
  }

  async updateUser(userId: string, data: UpdateUserDto) {
    const user = await this.userRepository.update(userId, data);

    // Invalidate cache
    await this.cacheService.invalidateByTag(`user:${userId}`);

    return user;
  }
}
```

### Cache Invalidation

```typescript
import { Injectable } from '@nestjs/common';
import { CacheInvalidationService } from '@the-new-fuse/api-optimization';

@Injectable()
export class WorkflowService {
  constructor(private invalidationService: CacheInvalidationService) {}

  async updateWorkflow(workflowId: string, data: UpdateWorkflowDto) {
    // Update workflow
    const workflow = await this.workflowRepository.update(workflowId, data);

    // Smart invalidation - invalidates all related caches
    await this.invalidationService.invalidateEntity('workflow', workflowId);

    return workflow;
  }

  async scheduleInvalidation() {
    // Schedule cache invalidation in 1 hour
    this.invalidationService.scheduleInvalidation(
      'workflow-cache',
      { type: 'tag', value: 'workflows' },
      3600000 // 1 hour
    );
  }
}
```

### CDN Configuration

```typescript
import { Injectable } from '@nestjs/common';
import { CDNConfigService } from '@the-new-fuse/api-optimization';

@Injectable()
export class AssetService {
  constructor(private cdnService: CDNConfigService) {}

  getAssetUrl(assetPath: string): string {
    // Automatically use CDN if enabled
    return this.cdnService.getCDNUrl(assetPath);
  }

  async purgeAssets(urls: string[]) {
    // Purge CDN cache
    const result = await this.cdnService.purgeUrls(urls);
    return result;
  }
}
```

### Cache Headers Middleware

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { CacheHeadersMiddleware } from '@the-new-fuse/api-optimization';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CacheHeadersMiddleware)
      .forRoutes('*');
  }
}
```

### Quota Management

```typescript
import { Injectable } from '@nestjs/common';
import { QuotaManagementService } from '@the-new-fuse/api-optimization';

@Injectable()
export class ApiService {
  constructor(private quotaService: QuotaManagementService) {}

  async handleRequest(userId: string, tier: string = 'free') {
    // Check and consume quota
    const result = await this.quotaService.consumeQuota(userId, tier);

    if (!result.allowed) {
      throw new Error('Quota exceeded');
    }

    // Process request
    return this.processRequest();
  }

  async getUserQuotas(userId: string, tier: string) {
    // Get quota usage
    const quotas = await this.quotaService.getUserQuotas(userId, tier);
    return quotas;
  }
}
```

### Backpressure Handling

```typescript
import { Module, NestModule, MiddlewareConsumer } from '@nestjs/common';
import { BackpressureMiddleware } from '@the-new-fuse/api-optimization';

@Module({})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(BackpressureMiddleware)
      .forRoutes('*');
  }
}
```

### Cache Warming

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CacheWarmingService } from '@the-new-fuse/api-optimization';

@Injectable()
export class AppService implements OnModuleInit {
  constructor(private warmingService: CacheWarmingService) {}

  async onModuleInit() {
    // Add custom warming strategy
    this.warmingService.addStrategy({
      name: 'user-data',
      enabled: true,
      priority: 1,
      tags: ['users', 'profiles'],
      urls: ['/api/users/popular', '/api/users/recent']
    });

    // Schedule periodic warming (every 5 minutes)
    this.warmingService.scheduleWarming(
      { name: 'critical-data', enabled: true, priority: 1, tags: ['critical'] },
      300000
    );
  }
}
```

### Monitoring

```typescript
import { Controller, Get } from '@nestjs/common';
import { OptimizationMonitoringService } from '@the-new-fuse/api-optimization';

@Controller('monitoring')
export class MonitoringController {
  constructor(private monitoringService: OptimizationMonitoringService) {}

  @Get('metrics')
  async getMetrics() {
    return this.monitoringService.getMetrics();
  }

  @Get('health')
  async getHealth() {
    return this.monitoringService.getHealthStatus();
  }

  @Get('report')
  async getReport() {
    return this.monitoringService.generateReport();
  }

  @Get('alerts')
  async getAlerts() {
    return this.monitoringService.getAlerts(100);
  }
}
```

## Rate Limit Presets

```typescript
RateLimitPresets.STRICT       // 10 requests/minute (expensive operations)
RateLimitPresets.STANDARD     // 100 requests/minute (normal endpoints)
RateLimitPresets.RELAXED      // 500 requests/minute (read operations)
RateLimitPresets.BURST        // 10 requests/second (burst protection)
RateLimitPresets.API_KEY      // 1000 requests/minute (authenticated)
RateLimitPresets.AUTH         // 5 requests/minute (auth endpoints)
RateLimitPresets.SEARCH       // 50 requests/minute (search)
RateLimitPresets.UPLOAD       // 20 requests/hour (file uploads)
RateLimitPresets.WEBHOOK      // 100 requests/minute (webhooks)
```

## Cache TTL Presets

```typescript
CacheTTL.VERY_SHORT  // 30 seconds
CacheTTL.SHORT       // 1 minute
CacheTTL.MEDIUM      // 5 minutes (default)
CacheTTL.LONG        // 15 minutes
CacheTTL.VERY_LONG   // 1 hour
CacheTTL.DAY         // 24 hours
CacheTTL.WEEK        // 1 week
CacheTTL.MONTH       // 1 month
```

## Best Practices

### Rate Limiting
1. Use tiered rate limits based on user subscription level
2. Implement stricter limits for expensive operations
3. Monitor rate limit metrics to adjust thresholds
4. Use penalties for abusive behavior
5. Provide clear error messages with retry-after headers

### Caching
1. Cache frequently accessed data with appropriate TTL
2. Use tags for easy cache invalidation
3. Implement cache warming for critical data
4. Monitor cache hit rates and adjust strategies
5. Use ETagssage patterns for conditional requests

### CDN
1. Use CDN for all static assets
2. Set long cache times for immutable assets
3. Implement cache purging for updated content
4. Use cache headers appropriately
5. Monitor CDN usage and performance

### Quota Management
1. Set realistic quotas based on system capacity
2. Implement multiple quota periods (hourly, daily, monthly)
3. Provide quota information in API responses
4. Alert users when approaching quota limits
5. Offer quota upgrades for power users

### Backpressure
1. Set appropriate concurrency limits
2. Monitor queue sizes and response times
3. Implement graceful degradation
4. Provide clear feedback when under load
5. Scale infrastructure based on metrics

## Monitoring

The package provides comprehensive monitoring:

- **Rate Limiting**: Track blocked keys, top consumers, and consumption patterns
- **Caching**: Monitor hit rates, memory usage, and invalidations
- **Performance**: Response times, queue sizes, and throughput
- **Health**: Overall system health and component status
- **Alerts**: Automatic alerts for degraded performance

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   API Optimization                       │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Rate Limiting│  │   Caching    │  │     CDN      │  │
│  │   (Redis)    │  │(Redis + LRU) │  │Configuration │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │    Quota     │  │ Backpressure │  │    Cache     │  │
│  │ Management   │  │   Handling   │  │   Warming    │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│                                                           │
│  ┌─────────────────────────────────────────────────┐   │
│  │         Monitoring & Alerting                    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Contributing

Contributions are welcome! Please ensure:
- All tests pass
- Code follows the project style guide
- Documentation is updated
- Changes are backward compatible

## License

MIT
