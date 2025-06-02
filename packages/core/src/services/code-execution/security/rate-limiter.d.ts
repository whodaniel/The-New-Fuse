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
export declare class RateLimiter {
    private readonly configService;
    private readonly logger;
    private readonly config;
    private readonly clientRequests;
    constructor(configService: ConfigService);
    /**
     * Check if a client is rate limited
     * @param clientId Client ID
     * @returns Rate limit result
     */
    checkRateLimit(clientId: string): RateLimitResult;
    /**
     * Clean up expired rate limits
     */
    private cleanupExpiredRateLimits;
}
