import { Request } from 'express';
import { Logger } from '@the-new-fuse/utils';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetTime: Date;
}

export class RateLimitingService {
  private store: Map<string, { count: number; resetTime: Date }>;
  private readonly config: RateLimitConfig;
  private readonly logger: Logger;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = {
      windowMs: config.windowMs || 60000, // 1 minute default
      maxRequests: config.maxRequests || 100
    };
    this.store = new Map();
    this.logger = new Logger('RateLimitingService');
  }

  async check(req: Request): Promise<RateLimitResult> {
    const key = this.getKey(req);
    const now = new Date();
    const record = this.store.get(key);

    if (!record || now > record.resetTime) {
      const resetTime = new Date(now.getTime() + this.config.windowMs);
      this.store.set(key, { count: 1, resetTime });
      return { allowed: true, remaining: this.config.maxRequests - 1, resetTime };
    }

    if (record.count >= this.config.maxRequests) {
      return { allowed: false, remaining: 0, resetTime: record.resetTime };
    }

    record.count++;
    return {
      allowed: true,
      remaining: this.config.maxRequests - record.count,
      resetTime: record.resetTime
    };
  }

  private getKey(req: Request): string {
    // Use IP as default key, but could be extended to use other identifiers
    return req.ip || req.connection.remoteAddress || '';
  }

  // Clean up old records periodically
  private cleanup(): void {
    const now = new Date();
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime) {
        this.store.delete(key);
      }
    }
  }
}
