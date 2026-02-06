import { Injectable, TooManyRequestsException } from '@nestjs/common';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitService {
  private readonly buckets = new Map<string, RateLimitEntry>();

  consume(key: string, limit: number, windowMs: number): void {
    const now = Date.now();
    const entry = this.buckets.get(key);

    if (!entry || entry.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (entry.count >= limit) {
      throw new TooManyRequestsException('Rate limit exceeded');
    }

    entry.count += 1;
    this.buckets.set(key, entry);
  }
}
