import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Observable } from 'rxjs';

// Metadata key to bypass rate limiting
export const BYPASS_RATE_LIMIT_KEY = 'bypassRateLimit';
export const BypassRateLimit = () => new Reflector().set(BYPASS_RATE_LIMIT_KEY, true);

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly logger = new Logger(RateLimitGuard.name);
  private readonly requests = new Map<string, RateLimitEntry>();

  // Configuration options
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor(
    private readonly reflector: Reflector,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // These values would typically come from a config service
    this.windowMs = 60 * 1000; // 1 minute
    this.maxRequests = 100; // 100 requests per minute
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const bypass = this.reflector.get<boolean>(BYPASS_RATE_LIMIT_KEY, context.getHandler());
    if (bypass) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const key = this.getIdentifier(request);

    const now = Date.now();
    const entry = this.requests.get(key) || { count: 0, resetTime: now + this.windowMs };

    if (now > entry.resetTime) {
      entry.count = 0;
      entry.resetTime = now + this.windowMs;
    }

    entry.count++;
    this.requests.set(key, entry);

    // Set response headers
    const response = context.switchToHttp().getResponse();
    response.header('X-RateLimit-Limit', this.maxRequests);
    response.header('X-RateLimit-Remaining', Math.max(0, this.maxRequests - entry.count));
    response.header('X-RateLimit-Reset', Math.ceil(entry.resetTime / 1000));

    if (entry.count > this.maxRequests) {
      this.eventEmitter.emit('rate.limit.exceeded', { key, timestamp: new Date() });
      throw new HttpException(
        'Too Many Requests',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }

  private getIdentifier(request: any): string {
    // Use IP address as the primary identifier
    return request.ip || 'unknown';
  }
}
