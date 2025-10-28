import { Injectable, NestMiddleware, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import Redis from 'ioredis';
import { SecurityService } from '../security.service';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly redis: Redis;

  // Configuration options
  private readonly windowMs = 60 * 1000; // 1 minute
  private readonly maxRequests = 100;

  constructor(private readonly securityService: SecurityService) {
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
    });
  }

  async use(req: Request, res: Response, next: NextFunction) {
    const key = `rate-limit:${req.ip}`;

    try {
      const current = await this.redis.get(key);
      const count = current ? parseInt(current, 10) : 0;

      if (count >= this.maxRequests) {
        await this.securityService.audit('rate_limit.exceeded', {
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          limit: this.maxRequests,
        });
        throw new HttpException('Too Many Requests', HttpStatus.TOO_MANY_REQUESTS);
      }

      const multi = this.redis.multi();
      multi.incr(key);
      if (count === 0) {
        multi.expire(key, this.windowMs / 1000);
      }
      await multi.exec();

      res.setHeader('X-RateLimit-Limit', this.maxRequests);
      res.setHeader('X-RateLimit-Remaining', this.maxRequests - (count + 1));

      next();
    } catch (error) {
      await this.securityService.audit('rate_limit.error', {
        ip: req.ip,
        error: error.message,
      });
      next(error);
    }
  }
}
