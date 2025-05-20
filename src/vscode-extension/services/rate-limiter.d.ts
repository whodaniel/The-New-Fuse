/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
    /**
     * Maximum number of messages allowed in the time window
     */
    maxMessages: number;
    /**
     * Time window in milliseconds
     */
    windowMs: number;
    /**
     * Whether to emit warnings when approaching the limit
     */
    emitWarnings: boolean;
    /**
     * Percentage of the limit at which to emit a warning
     */
    warningThreshold: number;
}
/**
 * Rate limit status
 */
export interface RateLimitStatus {
    /**
     * Whether the client is rate limited
     */
    limited: boolean;
    /**
     * Number of messages remaining in the current window
     */
    remaining: number;
    /**
     * Time in milliseconds until the rate limit resets
     */
    resetMs: number;
    /**
     * Whether the client is approaching the rate limit
     */
    warning: boolean;
}
/**
 * Rate limiter for WebSocket connections
 */
export declare class RateLimiter {
    private logger;
    private config;
    private clientLimits;
    private cleanupInterval;
    /**
     * Create a new rate limiter
     * @param config Rate limit configuration
     */
    constructor(config?: Partial<RateLimitConfig>);
    /**
     * Check if a client is rate limited
     * @param clientId Client identifier
     * @returns Rate limit status
     */
    checkLimit(clientId: string): RateLimitStatus;
    /**
     * Get rate limit status for a client without incrementing the counter
     * @param clientId Client identifier
     * @returns Rate limit status
     */
    getStatus(clientId: string): RateLimitStatus;
    /**
     * Reset rate limit for a client
     * @param clientId Client identifier
     */
    resetLimit(clientId: string): void;
    /**
     * Update rate limit configuration
     * @param config New configuration
     */
    updateConfig(config: Partial<RateLimitConfig>): void;
    /**
     * Start cleanup interval to remove old client data
     */
    private startCleanupInterval;
    /**
     * Dispose of the rate limiter
     */
    dispose(): void;
}
//# sourceMappingURL=rate-limiter.d.ts.map