import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisRateLimiterService } from './redis-rate-limiter.service.js';
import { RateLimitGuard } from './rate-limit.guard.js';
import { RateLimitMiddleware } from './rate-limit.middleware.js';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    RedisRateLimiterService,
    RateLimitGuard,
    RateLimitMiddleware
  ],
  exports: [
    RedisRateLimiterService,
    RateLimitGuard,
    RateLimitMiddleware
  ]
})
export class RateLimitModule {}
