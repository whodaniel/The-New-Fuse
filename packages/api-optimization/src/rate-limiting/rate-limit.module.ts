import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RateLimitGuard } from './rate-limit.guard';
import { RateLimitMiddleware } from './rate-limit.middleware';
import { RedisRateLimiterService } from './redis-rate-limiter.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [RedisRateLimiterService, RateLimitGuard, RateLimitMiddleware],
  exports: [RedisRateLimiterService, RateLimitGuard, RateLimitMiddleware],
})
export class RateLimitModule {}
