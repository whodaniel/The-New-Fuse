import { Request, Response, NextFunction } from "express";
import { CacheService } from '../cache/cache.service.js';
import { ConfigService } from '../config/config.service.js';
import { LoggingService } from '../logging/logging.service.js';
import { TimeService } from '../utils/time.service.js';
import { ErrorHandler } from '../error/error-handler.js';
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  statusCode?: number;
  keyGenerator?: (req: Request) => string;
  skip?: (req: Request) => boolean;
}
export declare class RateLimitMiddleware {
  private cache;
  private config;
  private logger;
  private time;
  private errorHandler;
  constructor(
    cache: CacheService,
    config: ConfigService,
    logger: LoggingService,
    time: TimeService,
    errorHandler: ErrorHandler,
  );
  createMiddleware(
    options?: Partial<RateLimitConfig>,
  ): (req: Request, res: Response, next: NextFunction) => Promise<void>;
  private incrementCounter;
  private defaultKeyGenerator;
  private defaultSkip;
  static auth(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
  static api(): (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => Promise<void>;
}
export declare function createIpRateLimiter(
  options: RateLimitConfig,
): (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare function createAuthRateLimiter(
  options: RateLimitConfig,
): (req: Request, res: Response, next: NextFunction) => Promise<void>;
