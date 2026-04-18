import { Injectable, Logger, BadRequestException, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SecurityLoggingService } from './security-logging.service.js';

export interface RateLimitConfig {
  requests: number;
  window: number; // in milliseconds
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  keyGenerator?: (request: any) => string;
  burstMultiplier?: number;
}

export interface RateLimitTier {
  name: string;
  requests: number;
  window: number;
  burstMultiplier: number;
  keyGenerator?: (request: any) => string;
}

@Injectable()
export class EnhancedRateLimitService {
  private readonly logger = new Logger(EnhancedRateLimitService.name);
  private rateLimitStore = new Map<string, { count: number; resetTime: number; burstCount: number }>();
  private readonly BURST_WINDOW = 10000; // 10 seconds burst window

  // Define different rate limit tiers
  private readonly rateLimitTiers: Record<string, RateLimitTier> = {
    // Authentication endpoints - very strict
    auth: {
      name: 'auth',
      requests: 5,
      window: 60000, // 1 minute
      burstMultiplier: 2,
    },
    // API endpoints - medium strict
    api: {
      name: 'api',
      requests: 100,
      window: 60000, // 1 minute
      burstMultiplier: 1.5,
    },
    // Public endpoints - generous
    public: {
      name: 'public',
      requests: 200,
      window: 60000, // 1 minute
      burstMultiplier: 2,
    },
    // Admin endpoints - very strict
    admin: {
      name: 'admin',
      requests: 20,
      window: 60000, // 1 minute
      burstMultiplier: 1,
    },
    // Health checks - minimal
    health: {
      name: 'health',
      requests: 10,
      window: 60000, // 1 minute
      burstMultiplier: 3,
    },
  };

  constructor(
    private configService: ConfigService,
    private securityLogging: SecurityLoggingService
  ) {}

  /**
   * Check rate limit for a request
   */
  async checkRateLimit(
    request: any,
    tier: keyof typeof this.rateLimitTiers = 'api',
    customConfig?: RateLimitConfig
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const config = customConfig || this.rateLimitTiers[tier];
    const key = this.generateKey(request, config.keyGenerator);
    const now = Date.now();

    // Get or create rate limit data
    let rateLimitData = this.rateLimitStore.get(key);
    if (!rateLimitData) {
      rateLimitData = { count: 0, resetTime: now + config.window, burstCount: 0 };
    }

    // Reset window if expired
    if (now > rateLimitData.resetTime) {
      rateLimitData.count = 0;
      rateLimitData.burstCount = 0;
      rateLimitData.resetTime = now + config.window;
    }

    // Allow burst requests
    if (now < rateLimitData.resetTime + this.BURST_WINDOW && rateLimitData.burstCount < (config.burstMultiplier || 1)) {
      rateLimitData.burstCount++;
      rateLimitData.count++;
      this.rateLimitStore.set(key, rateLimitData);

      return {
        allowed: true,
        remaining: Math.max(0, config.requests - rateLimitData.count),
        resetTime: rateLimitData.resetTime,
      };
    }

    // Check if limit exceeded
    if (rateLimitData.count >= config.requests) {
      this.securityLogging.logRateLimit('limit_exceeded', {
        ip: this.getClientIP(request),
        userAgent: request.headers['user-agent'],
        endpoint: request.path,
        method: request.method,
        limit: config.requests,
        current: rateLimitData.count,
        window: config.window,
      });

      throw new HttpException({
        message: 'Rate limit exceeded',
        limit: config.requests,
        remaining: 0,
        resetTime: rateLimitData.resetTime,
      }, HttpStatus.TOO_MANY_REQUESTS);
    }

    // Increment counter
    rateLimitData.count++;
    this.rateLimitStore.set(key, rateLimitData);

    return {
      allowed: true,
      remaining: Math.max(0, config.requests - rateLimitData.count),
      resetTime: rateLimitData.resetTime,
    };
  }

  /**
   * Check rate limit with automatic tier detection
   */
  async checkRateLimitAuto(request: any): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const tier = this.detectTier(request);
    return this.checkRateLimit(request, tier);
  }

  /**
   * Block an IP address temporarily
   */
  blockIP(ip: string, duration: number = 300000): void { // 5 minutes default
    const key = `blocked:${ip}`;
    const now = Date.now();
    const resetTime = now + duration;

    this.rateLimitStore.set(key, { count: 0, resetTime, burstCount: 0 });

    this.securityLogging.logRateLimit('ip_blocked', {
      ip,
      reason: `Blocked for ${duration}ms`,
    });
  }

  /**
   * Check if IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    const key = `blocked:${ip}`;
    const data = this.rateLimitStore.get(key);
    if (!data) return false;

    if (Date.now() > data.resetTime) {
      this.rateLimitStore.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get current rate limit status
   */
  getRateLimitStatus(request: any, tier?: keyof typeof this.rateLimitTiers): any {
    const config = this.rateLimitTiers[tier || this.detectTier(request)];
    const key = this.generateKey(request, config.keyGenerator);
    const data = this.rateLimitStore.get(key) || { count: 0, resetTime: Date.now() + config.window, burstCount: 0 };

    return {
      tier: tier || this.detectTier(request),
      limit: config.requests,
      remaining: Math.max(0, config.requests - data.count),
      resetTime: data.resetTime,
      burstAvailable: data.burstCount < (config.burstMultiplier || 1),
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, data] of this.rateLimitStore.entries()) {
      if (now > data.resetTime && !key.startsWith('blocked:')) {
        this.rateLimitStore.delete(key);
      }
    }
  }

  /**
   * Generate rate limit key
   */
  private generateKey(request: any, customKeyGenerator?: (request: any) => string): string {
    if (customKeyGenerator) {
      return customKeyGenerator(request);
    }

    // Default key generation based on IP and user agent
    const ip = this.getClientIP(request);
    const userAgent = request.headers['user-agent'] || 'unknown';
    const userId = request.user?.id || 'anonymous';

    return `rate_limit:${ip}:${userId}:${userAgent.substring(0, 50)}`;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: any): string {
    return (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
           request.headers['x-real-ip'] as string ||
           request.connection.remoteAddress ||
           request.ip ||
           'unknown';
  }

  /**
   * Detect appropriate rate limit tier based on endpoint
   */
  private detectTier(request: any): keyof typeof this.rateLimitTiers {
    const path = request.path?.toLowerCase() || '';
    const method = request.method?.toLowerCase() || '';

    // Authentication endpoints
    if (path.includes('/auth/') || path.includes('/login') || path.includes('/register')) {
      return 'auth';
    }

    // Admin endpoints
    if (path.includes('/admin/') || path.includes('/system/')) {
      return 'admin';
    }

    // Health check endpoints
    if (path.includes('/health') || path.includes('/ping')) {
      return 'health';
    }

    // Default to API tier
    return 'api';
  }
}
