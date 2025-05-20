/**
 * Rate Limiter for code execution
 */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /**
   * Maximum number of requests per window
   */
  maxRequests: number;
  
  /**
   * Window size in milliseconds
   */
  windowMs: number;
  
  /**
   * Whether to skip rate limiting for certain clients
   */
  skipList: string[];
}

/**
 * Rate limit result
 */
export interface RateLimitResult {
  /**
   * Whether the request is allowed
   */
  allowed: boolean;
  
  /**
   * Number of remaining requests in the current window
   */
  remaining: number;
  
  /**
   * Time in milliseconds until the rate limit resets
   */
  resetMs: number;
}

/**
 * Rate Limiter Service
 */
@Injectable()
export class RateLimiter {
  private readonly logger = new Logger(RateLimiter.name);
  private readonly config: RateLimitConfig;
  private readonly clientRequests: Map<string, { count: number, resetTime: number }> = new Map();
  
  constructor(private readonly configService: ConfigService) {
    // Load configuration from environment variables
    this.config = {
      maxRequests: this.configService.get<number>('CODE_EXECUTION_RATE_LIMIT_MAX_REQUESTS', 10),
      windowMs: this.configService.get<number>('CODE_EXECUTION_RATE_LIMIT_WINDOW_MS', 60000), // 1 minute
      skipList: this.configService.get<string>('CODE_EXECUTION_RATE_LIMIT_SKIP_LIST', '').split(',').filter(Boolean),
    };
    
    this.logger.log(`Rate limiter initialized: ${this.config.maxRequests} requests per ${this.config.windowMs}ms`);
    
    // Clean up expired rate limits periodically
    setInterval(() => this.cleanupExpiredRateLimits(), this.config.windowMs);
  }
  
  /**
   * Check if a client is rate limited
   * @param clientId Client ID
   * @returns Rate limit result
   */
  checkRateLimit(clientId: string): RateLimitResult {
    // Skip rate limiting for certain clients
    if (this.config.skipList.includes(clientId)) {
      return {
        allowed: true,
        remaining: this.config.maxRequests,
        resetMs: 0,
      };
    }
    
    const now = Date.now();
    
    // Get or create client request record
    let clientRecord = this.clientRequests.get(clientId);
    
    if (!clientRecord || clientRecord.resetTime <= now) {
      // Create new record if none exists or if the window has expired
      clientRecord = {
        count: 0,
        resetTime: now + this.config.windowMs,
      };
      this.clientRequests.set(clientId, clientRecord);
    }
    
    // Check if client has exceeded rate limit
    const allowed = clientRecord.count < this.config.maxRequests;
    
    // Increment request count if allowed
    if (allowed) {
      clientRecord.count++;
    }
    
    // Calculate remaining requests and reset time
    const remaining = Math.max(0, this.config.maxRequests - clientRecord.count);
    const resetMs = Math.max(0, clientRecord.resetTime - now);
    
    if (!allowed) {
      this.logger.warn(`Rate limit exceeded for client ${clientId}: ${clientRecord.count} requests`);
    }
    
    return {
      allowed,
      remaining,
      resetMs,
    };
  }
  
  /**
   * Clean up expired rate limits
   */
  private cleanupExpiredRateLimits(): void {
    const now = Date.now();
    let expiredCount = 0;
    
    for (const [clientId, record] of this.clientRequests.entries()) {
      if (record.resetTime <= now) {
        this.clientRequests.delete(clientId);
        expiredCount++;
      }
    }
    
    if (expiredCount > 0) {
      this.logger.debug(`Cleaned up ${expiredCount} expired rate limits`);
    }
  }
}
