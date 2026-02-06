import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import cacheConfig from './config/cache.config';

// Services
import { AdvancedCacheManager } from './services/advanced-cache.manager';
import { CacheInvalidationService } from './services/cache-invalidation.service';
import { CacheMonitoringService } from './services/cache-monitoring.service';
import { CacheWarmingService } from './services/cache-warming.service';
import { DatabaseCacheService } from './services/database-cache.service';
import { SessionCacheService } from './services/session-cache.service';

// Interceptors
import { CacheInterceptor } from './interceptors/cache.interceptor';
import { HttpCacheInterceptor } from './interceptors/http-cache.interceptor';

@Global()
@Module({
  imports: [
    ConfigModule.forFeature(cacheConfig),
    ScheduleModule.forRoot(),
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),
  ],
  providers: [
    // Core services
    AdvancedCacheManager,
    CacheMonitoringService,

    // Specialized services
    DatabaseCacheService,
    SessionCacheService,
    CacheWarmingService,
    CacheInvalidationService,

    // Interceptors
    CacheInterceptor,
    HttpCacheInterceptor,
  ],
  exports: [
    // Export all services for use in other modules
    AdvancedCacheManager,
    CacheMonitoringService,
    DatabaseCacheService,
    SessionCacheService,
    CacheWarmingService,
    CacheInvalidationService,
    CacheInterceptor,
    HttpCacheInterceptor,
  ],
})
export class CacheModule {}
