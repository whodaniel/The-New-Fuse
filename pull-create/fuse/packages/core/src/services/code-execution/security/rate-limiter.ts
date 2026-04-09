/**
 * Rate Limiter for code execution
 */
import { Injectable } from '@nestjs/common';

@Injectable()
export class RateLimiter {
  private readonly clients = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const timestamps = this.clients.get(clientId) || [];
    const recentTimestamps = timestamps.filter(ts => now - ts < this.windowMs);

    if (recentTimestamps.length >= this.maxRequests) {
      return true;
    }

    recentTimestamps.push(now);
    this.clients.set(clientId, recentTimestamps);
    return false;
  }
}
