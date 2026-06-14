/**
 * Rate Limit Configuration by Trust Level
 * Configurable via environment variables
 */
import { AgentTrustLevel } from '../modules/agent-registry/types/agent-trust.types';
/**
 * Parsed rate limit configuration
 */
export interface RateLimitConfig {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
}
/**
 * Rate limits by trust level (with environment variable overrides)
 */
export declare function getRateLimitConfig(trustLevel: AgentTrustLevel): RateLimitConfig;
/**
 * Get all rate limit configurations
 */
export declare function getAllRateLimitConfigs(): Record<AgentTrustLevel, RateLimitConfig>;
/**
 * Rate limit window configurations
 */
export declare const RATE_LIMIT_WINDOWS: {
    MINUTE: number;
    HOUR: number;
    DAY: number;
};
/**
 * Redis key prefixes for rate limiting
 */
export declare const RATE_LIMIT_KEY_PREFIXES: {
    PER_MINUTE: string;
    PER_HOUR: string;
    PER_DAY: string;
};
/**
 * Build Redis key for rate limiting
 */
export declare function buildRateLimitKey(agentId: string, trustLevel: AgentTrustLevel, window: 'minute' | 'hour' | 'day'): string;
/**
 * Check if rate limit is exceeded
 */
export declare function isRateLimitExceeded(currentCount: number, limit: number): boolean;
/**
 * Get remaining requests for rate limit
 */
export declare function getRemainingRequests(currentCount: number, limit: number): number;
/**
 * Rate limit headers for HTTP responses
 */
export interface RateLimitHeaders {
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
}
/**
 * Build rate limit headers for response
 */
export declare function buildRateLimitHeaders(limit: number, remaining: number, resetTime: Date): RateLimitHeaders;
/**
 * Export default configuration for easy access
 */
export declare const DEFAULT_RATE_LIMITS: Record<AgentTrustLevel, import("../modules/agent-registry/types/agent-trust.types").TrustLevelPermissions>;
//# sourceMappingURL=rate-limit.config.d.ts.map