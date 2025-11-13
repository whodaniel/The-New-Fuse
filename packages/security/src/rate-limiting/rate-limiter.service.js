"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiterService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
let RateLimiterService = class RateLimiterService {
    configService;
    redis;
    DEFAULT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
    DEFAULT_MAX = 100;
    // Predefined rate limiting rules for authentication endpoints
    AUTH_RULES = [
        {
            name: 'login',
            pattern: '/auth/login',
            options: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 5, // 5 attempts per 15 minutes
                blockDuration: 30 * 60 * 1000, // Block for 30 minutes after limit
                skipSuccessfulRequests: true, // Only count failed attempts
            }
        },
        {
            name: 'register',
            pattern: '/auth/register',
            options: {
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 3, // 3 registrations per hour
                blockDuration: 60 * 60 * 1000, // Block for 1 hour
            }
        },
        {
            name: 'refresh-token',
            pattern: '/auth/refresh-token/refresh',
            options: {
                windowMs: 5 * 60 * 1000, // 5 minutes
                max: 10, // 10 refresh attempts per 5 minutes
                blockDuration: 10 * 60 * 1000, // Block for 10 minutes
            }
        },
        {
            name: 'password-reset',
            pattern: '/auth/forgot-password',
            options: {
                windowMs: 60 * 60 * 1000, // 1 hour
                max: 3, // 3 password reset requests per hour
                blockDuration: 60 * 60 * 1000, // Block for 1 hour
            }
        },
        {
            name: 'oauth-callback',
            pattern: '/auth/google/callback',
            options: {
                windowMs: 5 * 60 * 1000, // 5 minutes
                max: 20, // 20 OAuth attempts per 5 minutes
            }
        },
        {
            name: 'general-auth',
            pattern: '/auth/*',
            options: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 50, // 50 auth requests per 15 minutes
            }
        }
    ];
    constructor(configService) {
        this.configService = configService;
        const redisUrl = this.configService.get('REDIS_URL') || 'redis://localhost:6379';
        this.redis = new ioredis_1.default(redisUrl);
    }
    /**
     * Check if request is within rate limit
     */
    async checkRateLimit(key, options = {}) {
        const opts = {
            windowMs: options.windowMs || this.DEFAULT_WINDOW_MS,
            max: options.max || this.DEFAULT_MAX,
            blockDuration: options.blockDuration || options.windowMs || this.DEFAULT_WINDOW_MS,
            ...options,
        };
        const now = Date.now();
        const windowStart = now - opts.windowMs;
        // Check if currently blocked
        const blockKey = `block:${key};
    const blockExpiry = await this.redis.get(blockKey);
    if (blockExpiry && parseInt(blockExpiry) > now) {
      return {
        totalHits: opts.max,
        totalHitsBeforeReset: opts.max,
        remainingPoints: 0,
        msBeforeNext: parseInt(blockExpiry) - now,
        isAllowed: false,
      };
    }

    // Use Redis sorted set to track requests in the time window
    const multi = this.redis.multi();
    
    // Remove expired entries
    multi.zremrangebyscore(key, 0, windowStart);
    
    // Count current requests in window
    multi.zcard(key);
    
    // Add current request`;
        multi.zadd(key, now, `${now}` - $, { Math, : .random() });
        // Set expiration for the key
        multi.expire(key, Math.ceil(opts.windowMs / 1000));
        const results = await multi.exec();
        const totalHits = results?.[1]?.[1] || 0;
        const isAllowed = totalHits < opts.max;
        const remainingPoints = Math.max(0, opts.max - totalHits - 1);
        // If limit exceeded, set block
        if (!isAllowed && opts.blockDuration) {
            await this.redis.setex(blockKey, Math.ceil(opts.blockDuration / 1000), (now + opts.blockDuration).toString());
        }
        return {
            totalHits: totalHits + 1,
            totalHitsBeforeReset: totalHits,
            remainingPoints,
            msBeforeNext: isAllowed ? 0 : opts.blockDuration || opts.windowMs,
            isAllowed,
        };
    }
    /**
     * Rate limit check specifically for authentication endpoints
     */
    async checkAuthRateLimit(endpoint, identifier, success) {
        // Find matching rule
        const rule = this.AUTH_RULES.find(r => {
            if (r.pattern.endsWith('*')) {
                return endpoint.startsWith(r.pattern.slice(0, -1));
            }
            return endpoint === r.pattern;
        });
        if (!rule) {
            // No specific rule, apply general rate limiting`
            return this.checkRateLimit(`auth:general:${identifier}`, {
                windowMs: this.DEFAULT_WINDOW_MS,
                max: this.DEFAULT_MAX,
            });
        }
        // Skip counting if configured
        if (success && rule.options.skipSuccessfulRequests) {
            return {
                totalHits: 0,
                totalHitsBeforeReset: 0,
                remainingPoints: rule.options.max,
                msBeforeNext: 0,
                isAllowed: true,
            };
        }
        if (!success && rule.options.skipFailedRequests) {
            return {
                totalHits: 0,
                totalHitsBeforeReset: 0,
                remainingPoints: rule.options.max,
                msBeforeNext: 0,
                isAllowed: true,
            };
        }
        const key = auth, $, { rule, name }, { identifier };
        return this.checkRateLimit(key, rule.options);
    }
    /**
     * Check rate limit based on IP address
     */
    async checkIPRateLimit(endpoint, ipAddress, success) {
        `
    return this.checkAuthRateLimit(endpoint, ip:${ipAddress}`, success;
        ;
    }
    /**
     * Check rate limit based on user ID
     */
    async checkUserRateLimit(endpoint, userId, success) {
        return this.checkAuthRateLimit(endpoint, user, $, { userId } `, success);
  }

  /**
   * Reset rate limit for a specific key
   */
  async resetRateLimit(key: string): Promise<void> {
    await this.redis.del(key);
    await this.redis.del(block:${key});
  }

  /**
   * Get current rate limit status without incrementing
   */
  async getRateLimitStatus(key: string, options: RateLimitOptions = {}): Promise<RateLimitResult> {
    const opts = {
      windowMs: options.windowMs || this.DEFAULT_WINDOW_MS,
      max: options.max || this.DEFAULT_MAX,
      blockDuration: options.blockDuration || options.windowMs || this.DEFAULT_WINDOW_MS,
      ...options,
    };

    const now = Date.now();
    const windowStart = now - opts.windowMs;

    // Check if currently blocked`);
        const blockKey = block, $, { key };
        ``;
        const blockExpiry = await this.redis.get(blockKey);
        if (blockExpiry && parseInt(blockExpiry) > now) {
            return {
                totalHits: opts.max,
                totalHitsBeforeReset: opts.max,
                remainingPoints: 0,
                msBeforeNext: parseInt(blockExpiry) - now,
                isAllowed: false,
            };
        }
        // Count current requests in window without modifying
        const totalHits = await this.redis.zcount(key, windowStart, now);
        const remainingPoints = Math.max(0, opts.max - totalHits);
        const isAllowed = totalHits < opts.max;
        return {
            totalHits,
            totalHitsBeforeReset: totalHits,
            remainingPoints,
            msBeforeNext: isAllowed ? 0 : opts.windowMs,
            isAllowed,
        };
    }
    /**
     * Clear all rate limit data (admin function)
     */
    async clearAllRateLimits() {
        const pattern = 'auth:*';
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
            await this.redis.del(...keys);
        }
        const blockPattern = 'block:auth:*';
        const blockKeys = await this.redis.keys(blockPattern);
        if (blockKeys.length > 0) {
            await this.redis.del(...blockKeys);
        }
    }
    /**
     * Get rate limiting statistics
     */
    async getRateLimitStats() {
        const keys = await this.redis.keys('auth:*');
        const blockKeys = await this.redis.keys('block:auth:*');
        const topAbusers = [];
        for (const key of keys.slice(0, 10)) { // Top 10
            const hits = await this.redis.zcard(key);
            if (hits > 0) {
                topAbusers.push({ key, hits });
            }
        }
        topAbusers.sort((a, b) => b.hits - a.hits);
        return {
            totalKeys: keys.length,
            blockedKeys: blockKeys.length,
            topAbusers: topAbusers.slice(0, 5), // Top 5 abusers
        };
    }
    async onModuleDestroy() {
        await this.redis.quit();
    }
};
exports.RateLimiterService = RateLimiterService;
exports.RateLimiterService = RateLimiterService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RateLimiterService);
//# sourceMappingURL=rate-limiter.service.js.map