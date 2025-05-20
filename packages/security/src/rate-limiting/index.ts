import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { Logger } from '@the-new-fuse/utils';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

@Injectable()
export class RateLimitingService {
  private readonly logger: Logger;
  private readonly store: Map<string, { count: number; resetTime: Date }>;
  private readonly windowMs: number;
  private readonly maxRequests: number;

  constructor() {
    this.logger = new Logger('RateLimitingService');
    this.store = new Map();
    this.windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10); // 15 minutes default
    this.maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10); // 100 requests default
  }

  async isAllowed(req: Request): Promise<RateLimitResult> {
    const key = this.getKey(req);
    const now = new Date();
    const record = this.store.get(key);

    if (!record || record.resetTime < now) {
      // First request or expired window
      this.store.set(key, {
        count: 1,
        resetTime: new Date(now.getTime() + this.windowMs)
      });
      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetTime: new Date(now.getTime() + this.windowMs)
      };
    }

    if (record.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime
      };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: this.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  private getKey(req: Request): string {
    return `${req.ip}-${req.path}`;
  }
}
