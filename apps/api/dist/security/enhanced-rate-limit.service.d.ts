import { ConfigService } from '@nestjs/config';
import { SecurityLoggingService } from './security-logging.service';
export interface RateLimitConfig {
    requests: number;
    window: number;
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
export declare class EnhancedRateLimitService {
    private configService;
    private securityLogging;
    private readonly logger;
    private rateLimitStore;
    private readonly BURST_WINDOW;
    private readonly rateLimitTiers;
    constructor(configService: ConfigService, securityLogging: SecurityLoggingService);
    /**
     * Check rate limit for a request
     */
    checkRateLimit(request: any, tier?: keyof typeof this.rateLimitTiers, customConfig?: RateLimitConfig): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    /**
     * Check rate limit with automatic tier detection
     */
    checkRateLimitAuto(request: any): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    /**
     * Block an IP address temporarily
     */
    blockIP(ip: string, duration?: number): void;
    /**
     * Check if IP is blocked
     */
    isIPBlocked(ip: string): boolean;
    /**
     * Get current rate limit status
     */
    getRateLimitStatus(request: any, tier?: keyof typeof this.rateLimitTiers): any;
    /**
     * Clean up expired entries
     */
    cleanup(): void;
    /**
     * Generate rate limit key
     */
    private generateKey;
    /**
     * Get client IP address
     */
    private getClientIP;
    /**
     * Detect appropriate rate limit tier based on endpoint
     */
    private detectTier;
}
//# sourceMappingURL=enhanced-rate-limit.service.d.ts.map