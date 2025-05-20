import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Logger } from '@the-new-fuse/utils';
import { IpBlockingService } from './ip-blocking.service.js';
import { Request } from 'express';

export interface RateLimitOptions {
  limit: number;
  windowMs: number;
  message?: string;
  keyPrefix?: string;
}

export const RATE_LIMIT_KEY = 'rate_limit';

export const RateLimit = (options: RateLimitOptions): any => {
  return (target: any, key?: string, descriptor?: any) => {
    if (descriptor) {
      Reflect.defineMetadata(RATE_LIMIT_KEY, options, descriptor.value);
      return descriptor;
    }
    Reflect.defineMetadata(RATE_LIMIT_KEY, options, target);
    return target;
  };
};

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly defaultOptions: RateLimitOptions;
  private readonly store: Map<string, { count: number; resetTime: number }> = new Map();
  private readonly cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly reflector: Reflector,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
    private readonly ipBlockingService: IpBlockingService
  ) {
    // Load default options from config
    this.defaultOptions = {
      limit: this.configService.get<number>('security.rateLimit.limit', 100),
      windowMs: this.configService.get<number>('security.rateLimit.windowMs', 60000), // 1 minute
      message: this.configService.get<string>('security.rateLimit.message', 'Too many requests, please try again later'),
      keyPrefix: this.configService.get<string>('security.rateLimit.keyPrefix', 'rl:')
    };

    // Set up cleanup interval
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000); // Every minute
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const ip = request.ip;
    
    // Check if IP is blocked
    const isBlocked = await this.ipBlockingService.isBlocked(ip);
    if (isBlocked) {
      throw new HttpException('Access Denied', HttpStatus.FORBIDDEN);
    }
    
    // Get rate limit options
    const handler = context.getHandler();
    const controller = context.getClass();
    
    const handlerOptions = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, handler);
    const controllerOptions = this.reflector.get<RateLimitOptions>(RATE_LIMIT_KEY, controller);
    
    // Use handler options, then controller options, then default options
    const options = handlerOptions || controllerOptions || this.defaultOptions;
    
    // Generate key based on IP and route
    const route = request.route?.path || request.path;
    const key = `${options.keyPrefix}:${ip}:${route}`;
    
    // Check rate limit
    const now = Date.now();
    const entry = this.store.get(key);
    
    if (!entry) {
      // First request
      this.store.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return true;
    }
    
    if (now > entry.resetTime) {
      // Window expired, reset
      this.store.set(key, {
        count: 1,
        resetTime: now + options.windowMs
      });
      return true;
    }
    
    if (entry.count >= options.limit) {
      // Rate limit exceeded
      this.logger.warn(`Rate limit exceeded for IP: ${ip}, route: ${route}`);
      
      // Emit event
      this.eventEmitter.emit('security.rateLimitExceeded', {
        ip,
        path: route,
        limit: options.limit,
        windowMs: options.windowMs
      });
      
      // Set headers
      const response = context.switchToHttp().getResponse();
      response.header('Retry-After', Math.ceil((entry.resetTime - now) / 1000));
      response.header('X-RateLimit-Limit', options.limit);
      response.header('X-RateLimit-Remaining', 0);
      response.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
      
      throw new HttpException(options.message, HttpStatus.TOO_MANY_REQUESTS);
    }
    
    // Increment count
    entry.count++;
    this.store.set(key, entry);
    
    // Set headers
    const response = context.switchToHttp().getResponse();
    response.header('X-RateLimit-Limit', options.limit);
    response.header('X-RateLimit-Remaining', options.limit - entry.count);
    response.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));
    
    return true;
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }
}
