import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

// Rate Limiting
import { RateLimitModule } from './rate-limiting';
import { RateLimitGuard } from './rate-limiting/rate-limit.guard';
import { RateLimitMiddleware } from './rate-limiting/rate-limit.middleware';
import { RedisRateLimiterService } from './rate-limiting/redis-rate-limiter.service';

// Caching
import { CacheModule } from './caching';
import { CacheInvalidationService } from './caching/cache-invalidation.service';
import { CacheInterceptor } from './caching/cache.interceptor';
import { ResponseCacheService } from './caching/response-cache.service';

// CDN
import { CacheHeadersMiddleware } from './cdn/cache-headers.middleware';
import { CDNConfigService } from './cdn/cdn-config.service';

// Monitoring
import { OptimizationMonitoringService } from './monitoring/optimization-monitoring.service';

// Quota Management
import { QuotaManagementService } from './quota/quota-management.service';

// Backpressure
import { BackpressureMiddleware } from './backpressure/backpressure.middleware';

// Cache Warming
import { CacheWarmingService } from './warming/cache-warming.service';

@Global()
@Module({
  imports: [ConfigModule, RateLimitModule, CacheModule],
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
    CacheWarmingService,
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
    CacheWarmingService,
  ],
})
export class ApiOptimizationModule {}
