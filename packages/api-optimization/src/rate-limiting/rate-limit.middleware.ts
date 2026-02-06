import { HttpException, HttpStatus, Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RedisRateLimiterService } from './redis-rate-limiter.service';

/**
 * Global rate limiting middleware
 * Applied to all routes unless explicitly skipped
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly logger = new Logger(RateLimitMiddleware.name);

  constructor(private rateLimiter: RedisRateLimiterService) {}

  async use(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Skip rate limiting for health checks and internal routes
      if (this.shouldSkip(req)) {
        return next();
      }

      const key = this.getRateLimitKey(req);
      const config = this.rateLimiter.getTierConfig('free');

      const result = await this.rateLimiter.consume(key, config);

      // Set rate limit headers
      res.setHeader('X-RateLimit-Limit', config.points);
      res.setHeader('X-RateLimit-Remaining', result.remaining);
      res.setHeader('X-RateLimit-Reset', result.resetTime.toISOString());

      if (!result.allowed) {
        if (result.retryAfter) {
          res.setHeader('Retry-After', result.retryAfter);
        }

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message: 'Too many requests. Please try again later.',
            error: 'Too Many Requests',
          },
          HttpStatus.TOO_MANY_REQUESTS
        );
      }

      next();
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      this.logger.error('Rate limit middleware error:', error);
      // Fail open - allow request if rate limiting fails
      next();
    }
  }

  private shouldSkip(req: Request): boolean {
    const skipPaths = ['/health', '/metrics', '/readiness', '/liveness', '/.well-known'];

    return skipPaths.some((path) => req.path.startsWith(path));
  }

  private getRateLimitKey(req: Request): string {
    const user = (req as any).user;

    if (user?.id) {
      return `user:${user.id}`;
    }

    const ip =
      req.ip ||
      (req.headers['x-forwarded-for'] as string) ||
      req.connection.remoteAddress ||
      'unknown';

    return `ip:${ip}`;
  }
}
