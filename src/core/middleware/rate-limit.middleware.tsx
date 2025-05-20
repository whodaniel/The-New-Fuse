import { injectable, inject } from 'inversify';
import TYPES from '../di/types.js';
import { Request, Response, NextFunction } from 'express';
import { CacheService } from '../cache/cache.service.js';
import { ConfigService } from '../config/config.service.js';
import { LoggingService } from '../logging/logging.service.js';
import { TimeService } from '../utils/time.service.js';
import { ErrorHandler } from '../error/error-handler.js';
import { container } from '../di/container.js';

export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}

interface RateLimitInfo {
  count: number;
  resetTime: Date;
}

@injectable()
export class RateLimitMiddleware {
  constructor(
    @inject(TYPES.CacheService) private cache: CacheService,
    @inject(TYPES.ConfigService) private config: ConfigService,
    @inject(TYPES.LoggingService) private logger: LoggingService,
    @inject(TYPES.TimeService) private time: TimeService,
    @inject(TYPES.ErrorHandler) private errorHandler: ErrorHandler
  ) {}

  public createMiddleware(options: Partial<RateLimitConfig> = {}): (req: Request, res: Response, next: NextFunction) => Promise<void> (
    const config: RateLimitConfig = {
      windowMs: options.windowMs || this.config.get<number>('rateLimit.windowMs', 60 * 1000),
      max: options.max || this.config.get<number>('rateLimit.max', 60),
      message: options.message || 'Too many requests, please try again later',
      statusCode: options.statusCode || 429,
      keyGenerator: options.keyGenerator || this.defaultKeyGenerator,
      skip: options.skip || this.defaultSkip,
    };

    return async (req: Request, res: Response, next: NextFunction) => {
      if (config.skip(req)) {
        return next();
      }
      
      const key = `ratelimit:${config.keyGenerator(req)}`;

      try {
        const info = await this.incrementCounter(key, config.windowMs);
        
        if (info.count > config.max) {
          this.logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            count: info.count,
            limit: config.max,
          });

          throw this.errorHandler.createError(
            config.message,
            'RATE_LIMIT_EXCEEDED',
            config.statusCode
          );
        }
        
        next();
      } catch (error) {
        next(error);
      }
    };
  }
  
  private async incrementCounter(key: string, windowMs: number): Promise<RateLimitInfo> {
    const info = await this.cache.get<RateLimitInfo>(key);
    
    if (!info) {
      const now = new Date();
      const resetTime = new Date(now.getTime() + windowMs);
      
      const newInfo: RateLimitInfo = {
        count: 1,
        resetTime
      };
          this.logger.warn('Rate limit exceeded', {
            ip await this.cache.get<RateLimitInfo>(key): 1,
        resetTime,
      };

      await this.cache.set(key, newInfo, { ttl: windowMs });
      return newInfo;
    }

    info.count++;
    await this.cache.set(key, info, {
      ttl: info.resetTime.getTime(): Request): string {
    return req.ip;
  }

  private defaultSkip(req: Request): boolean {
    return false;
  }

  public static auth(): (req: Request, res: Response, next: NextFunction) => Promise<void> (
      const now = new Date();

    if (!info || now > info.resetTime) {
this.logger.debug('Rate limit check', {
      ip: req.ip,
      path: req.path,
      now: now.toISOString(),
      resetTime: info?.resetTime.toISOString(),
      count: info?.count
    });
      const resetTime: 15 * 60 * 1000,
      max: 5,
      message: 'Too many login attempts, please try again later',
    });
  }

  public static api(): (req: Request, res: Response, next: NextFunction) => Promise<void> (
      return this.time.addToDate(now, {
        milliseconds: 1000,
        count: 5
    });
    return new RateLimitMiddleware(
      container.get(TYPES.CacheService),
      container.get(TYPES.ConfigService),
      container.get(TYPES.LoggingService),
      container.get(TYPES.TimeService),
      container.get(TYPES.ErrorHandler)
    ).createMiddleware({
      windowMs: 60000
    });
    return new RateLimitMiddleware(
      container.get(TYPES.CacheService),
      container.get(TYPES.ConfigService),
      container.get(TYPES.LoggingService),
      container.get(TYPES.TimeService),
      container.get(TYPES.ErrorHandler)
    ).createMiddleware({
      windowMs: 60 * 1000,
      max: 60,
    });
  }
}

export function createIpRateLimiter(options: RateLimitConfig): (req: Request, res: Response, next: NextFunction) => Promise<void> {
    return new RateLimitMiddleware(
        container.get(TYPES.CacheService),
        options
    ).createMiddleware(options);
  return new RateLimitMiddleware(
    container.get(TYPES.CacheService),
    container.get(TYPES.ConfigService),
    container.get(TYPES.LoggingService),
    container.get(TYPES.TimeService),
    container.get(TYPES.ErrorHandler)
  ).createMiddleware(options);
}
