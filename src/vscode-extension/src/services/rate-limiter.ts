/**
 * Simple rate limiter for WebSocket connections
 */
export interface RateLimiterConfig {
    maxMessages: number;
    windowMs: number;
    emitWarnings: boolean;
    warningThreshold: number;
}

export interface RateLimitStatus {
    limited: boolean;
    remaining: number;
    resetTime: number;
}

export class RateLimiter {
    private config: RateLimiterConfig;
    private clients: Map<string, {
        messages: number;
        lastReset: number;
    }> = new Map();

    constructor(config: RateLimiterConfig) {
        this.config = config;
    }

    /**
     * Update the rate limiter configuration
     */
    public updateConfig(config: Partial<RateLimiterConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Check if a client is rate limited
     * @param clientId The client ID
     * @returns Rate limit status
     */
    public checkLimit(clientId: string): RateLimitStatus {
        const now = Date.now();
        const client = this.clients.get(clientId);

        // If client doesn't exist, create it
        if (!client) {
            this.clients.set(clientId, {
                messages: 1,
                lastReset: now
            });
            return {
                limited: false,
                remaining: this.config.maxMessages - 1,
                resetTime: now + this.config.windowMs
            };
        }

        // Check if window has expired
        if (now - client.lastReset > this.config.windowMs) {
            // Reset client
            client.messages = 1;
            client.lastReset = now;
            return {
                limited: false,
                remaining: this.config.maxMessages - 1,
                resetTime: now + this.config.windowMs
            };
        }

        // Check if client is rate limited
        if (client.messages >= this.config.maxMessages) {
            return {
                limited: true,
                remaining: 0,
                resetTime: client.lastReset + this.config.windowMs
            };
        }

        // Increment message count
        client.messages++;

        // Check if warning should be emitted
        const remaining = this.config.maxMessages - client.messages;
        const warningThreshold = this.config.maxMessages * this.config.warningThreshold;
        const shouldWarn = this.config.emitWarnings && remaining <= warningThreshold;

        return {
            limited: false,
            remaining,
            resetTime: client.lastReset + this.config.windowMs,
            warning: shouldWarn ? `Rate limit warning: ${remaining} requests remaining` : undefined
        };
    }

    /**
     * Reset rate limit for a client
     * @param clientId The client ID
     */
    public resetLimit(clientId: string): void {
        this.clients.delete(clientId);
    }

    /**
     * Reset all rate limits
     */
    public resetAllLimits(): void {
        this.clients.clear();
    }
}
