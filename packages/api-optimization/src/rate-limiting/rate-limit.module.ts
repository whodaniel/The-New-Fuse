import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RedisRateLimiterService } from './redis-rate-limiter.service';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitMiddleware } from './rate-limit.middleware';

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
