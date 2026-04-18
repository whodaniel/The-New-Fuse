import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request, Response } from 'express';
import { RedisRateLimiterService, RateLimitConfig } from './redis-rate-limiter.service.js';

export const RATE_LIMIT_KEY = 'rateLimit';
export const RATE_LIMIT_TIER_KEY = 'rateLimitTier';
export const SKIP_RATE_LIMIT_KEY = 'skipRateLimit';

/**
 * Rate limiting guard using Redis
 *
 * Usage:
 * @UseGuards(RateLimitGuard)
 * @RateLimit({ points: 100, duration: 60 })
 * async myEndpoint() { ... }
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);

  constructor(
    private reflector: Reflector,
    private rateLimiter: RedisRateLimiterService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Check if rate limiting is skipped for this route
    const skipRateLimit = this.reflector.getAllAndOverride<boolean>(
      SKIP_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()]
    );

    if (skipRateLimit) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    // Get rate limit configuration from decorator
    const rateLimitConfig = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Get tier from decorator
    const tier = this.reflector.getAllAndOverride<string>(
      RATE_LIMIT_TIER_KEY,
      [context.getHandler(), context.getClass()]
    );

    // Determine the configuration to use
    let config: RateLimitConfig;
    if (rateLimitConfig) {
      config = rateLimitConfig;
    } else if (tier) {
      config = this.rateLimiter.getTierConfig(tier);
    } else {
      // Default to free tier
      config = this.rateLimiter.getTierConfig('free');
    }

    // Generate rate limit key based on user ID or IP
    const key = this.getRateLimitKey(request);

    // Check if key is blocked
    const isBlocked = await this.rateLimiter.isBlocked(key);
    if (isBlocked) {
      this.setRateLimitHeaders(response, {
        allowed: false,
        remaining: 0,
        resetTime: new Date(Date.now() + 60000), // 1 minute default
        totalHits: config.points + 1
      });

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. You are temporarily blocked.',
          error: 'Too Many Requests'
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Apply any penalties
    const penalty = await this.rateLimiter.getPenalty(key);
    if (penalty > 0) {
      config = {
        ...config,
        points: Math.max(1, config.points - penalty)
      };
    }

    // Check rate limit
    const result = await this.rateLimiter.consume(key, config);

    // Set rate limit headers
    this.setRateLimitHeaders(response, result);

    if (!result.allowed) {
      this.logger.warn(
        `Rate limit exceeded for key: ${key}, endpoint: ${request.path}`
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Rate limit exceeded. Please try again later.',
          error: 'Too Many Requests',
          retryAfter: result.retryAfter
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // Log if approaching limit (80% consumed)
    if (result.remaining < config.points * 0.2) {
      this.logger.warn(
        `Rate limit approaching for key: ${key}, remaining: ${result.remaining}`
      );
    }

    return true;
  }

  private getRateLimitKey(request: Request): string {
    // Priority: User ID > API Key > IP Address
    const user = (request as any).user;

    if (user?.id) {
      return `user:${user.id}`;
    }

    const apiKey = request.headers['x-api-key'] as string;
    if (apiKey) {
      return `apikey:${apiKey}`;
    }

    const ip = request.ip ||
                request.headers['x-forwarded-for'] as string ||
                request.connection.remoteAddress ||
                'unknown';

    return `ip:${ip}`;
  }

  private setRateLimitHeaders(response: Response, result: any): void {
    response.setHeader('X-RateLimit-Limit', result.totalHits || 0);
    response.setHeader('X-RateLimit-Remaining', result.remaining);
    response.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

    if (result.retryAfter) {
      response.setHeader('Retry-After', result.retryAfter);
    }
  }
}
