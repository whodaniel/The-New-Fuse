import { ConfigService } from '@nestjs/config';
export interface RateLimitOptions {
    windowMs: number;
    max: number;
    keyGenerator?: (req: any) => string;
    skipSuccessfulRequests?: boolean;
    skipFailedRequests?: boolean;
    blockDuration?: number;
}
export interface RateLimitResult {
    totalHits: number;
    totalHitsBeforeReset: number;
    remainingPoints: number;
    msBeforeNext: number;
    isAllowed: boolean;
}
export interface RateLimitRule {
    name: string;
    pattern: string;
    options: RateLimitOptions;
}
export declare class RateLimiterService {
    private readonly configService;
    private redis;
    private readonly DEFAULT_WINDOW_MS;
    private readonly DEFAULT_MAX;
    private readonly AUTH_RULES;
    constructor(configService: ConfigService);
    /**
     * Check if request is within rate limit
     */
    checkRateLimit(key: string, options?: RateLimitOptions): Promise<RateLimitResult>;
    /**
     * Rate limit check specifically for authentication endpoints
     */
    checkAuthRateLimit(endpoint: string, identifier: string, success?: boolean): Promise<RateLimitResult>;
    /**
     * Check rate limit based on IP address
     */
    checkIPRateLimit(endpoint: string, ipAddress: string, success?: boolean): Promise<RateLimitResult>;
    /**
     * Check rate limit based on user ID
     */
    checkUserRateLimit(endpoint: string, userId: string, success?: boolean): Promise<RateLimitResult>;
    /**
     * Clear all rate limit data (admin function)
     */
    clearAllRateLimits(): Promise<void>;
    /**
     * Get rate limiting statistics
     */
    getRateLimitStats(): Promise<{
        totalKeys: number;
        blockedKeys: number;
        topAbusers: Array<{
            key: string;
            hits: number;
        }>;
    }>;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=rate-limiter.service.d.ts.map