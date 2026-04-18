import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Rate Limiting
import { RateLimitModule } from './rate-limiting/index.js';
import { RedisRateLimiterService } from './rate-limiting/redis-rate-limiter.service.js';
import { RateLimitGuard } from './rate-limiting/rate-limit.guard.js';
import { RateLimitMiddleware } from './rate-limiting/rate-limit.middleware.js';

// Caching
import { CacheModule } from './caching/index.js';
import { ResponseCacheService } from './caching/response-cache.service.js';
import { CacheInterceptor } from './caching/cache.interceptor.js';
import { CacheInvalidationService } from './caching/cache-invalidation.service.js';

// CDN
import { CDNConfigService } from './cdn/cdn-config.service.js';
import { CacheHeadersMiddleware } from './cdn/cache-headers.middleware.js';

// Monitoring
import { OptimizationMonitoringService } from './monitoring/optimization-monitoring.service.js';

// Quota Management
import { QuotaManagementService } from './quota/quota-management.service.js';

// Backpressure
import { BackpressureMiddleware } from './backpressure/backpressure.middleware.js';

// Cache Warming
import { CacheWarmingService } from './warming/cache-warming.service.js';

@Global()
@Module({
  imports: [
    ConfigModule,
    RateLimitModule,
    CacheModule
  ],
  providers: [
    // Rate Limiting
    RedisRateLimiterService,
    RateLimitGuard,
    RateLimitMiddleware,

    // Caching
    ResponseCacheService,
    CacheInterceptor,
    CacheInvalidationService,

    // CDN
    CDNConfigService,
    CacheHeadersMiddleware,

    // Monitoring
    OptimizationMonitoringService,

    // Quota
    QuotaManagementService,

    // Backpressure
    BackpressureMiddleware,

    // Warming
    CacheWarmingService
  ],
  exports: [
    // Rate Limiting
    RedisRateLimiterService,
    RateLimitGuard,
    RateLimitMiddleware,

    // Caching
    ResponseCacheService,
    CacheInterceptor,
    CacheInvalidationService,

    // CDN
    CDNConfigService,
    CacheHeadersMiddleware,

    // Monitoring
    OptimizationMonitoringService,

    // Quota
    QuotaManagementService,

    // Backpressure
    BackpressureMiddleware,

    // Warming
    CacheWarmingService
  ]
})
export class ApiOptimizationModule {}
