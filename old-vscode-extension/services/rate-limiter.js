"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RateLimiter = void 0;
const logging_1 = require("../core/logging");
/**
 * Rate limiter for WebSocket connections
 */
class RateLimiter {
    /**
     * Create a new rate limiter
     * @param config Rate limit configuration
     */
    constructor(config) {
        this.clientLimits = new Map();
        this.cleanupInterval = null;
        this.logger = (0, logging_1.getLogger)();
        // Default configuration
        this.config = {
            maxMessages: 100,
            windowMs: 60000, // 1 minute
            emitWarnings: true,
            warningThreshold: 0.8,
            ...config
        };
        this.logger.info(`Rate limiter initialized: ${this.config.maxMessages} messages per ${this.config.windowMs}ms`);
        // Start cleanup interval
        this.startCleanupInterval();
    }
    /**
     * Check if a client is rate limited
     * @param clientId Client identifier
     * @returns Rate limit status
     */
    checkLimit(clientId) {
        const now = Date.now();
        // Get or create client rate limit info
        let clientLimit = this.clientLimits.get(clientId);
        if (!clientLimit) {
            clientLimit = {
                timestamps: [],
                lastWarningTime: 0
            };
            this.clientLimits.set(clientId, clientLimit);
        }
        // Remove timestamps outside the current window
        const windowStart = now - this.config.windowMs;
        clientLimit.timestamps = clientLimit.timestamps.filter(timestamp => timestamp >= windowStart);
        // Check if client has exceeded the rate limit
        const messageCount = clientLimit.timestamps.length;
        const isLimited = messageCount >= this.config.maxMessages;
        const remaining = Math.max(0, this.config.maxMessages - messageCount);
        // Calculate time until reset
        let oldestTimestamp = 0;
        if (clientLimit.timestamps.length > 0) {
            oldestTimestamp = Math.min(...clientLimit.timestamps);
        }
        const resetMs = Math.max(0, this.config.windowMs - (now - oldestTimestamp));
        // Check if client is approaching the rate limit
        const warningThreshold = this.config.maxMessages * this.config.warningThreshold;
        const isApproachingLimit = messageCount >= warningThreshold;
        const shouldWarn = this.config.emitWarnings &&
            isApproachingLimit &&
            !isLimited &&
            (now - clientLimit.lastWarningTime) > 10000; // Don't warn more than once every 10 seconds
        if (shouldWarn) {
            clientLimit.lastWarningTime = now;
            this.logger.warn(`Client ${clientId} is approaching rate limit: ${messageCount}/${this.config.maxMessages} messages`);
        }
        if (isLimited) {
            this.logger.warn(`Client ${clientId} has been rate limited: ${messageCount}/${this.config.maxMessages} messages`);
        }
        else {
            // Add current timestamp to the list
            clientLimit.timestamps.push(now);
        }
        return {
            limited: isLimited,
            remaining,
            resetMs,
            warning: isApproachingLimit
        };
    }
    /**
     * Get rate limit status for a client without incrementing the counter
     * @param clientId Client identifier
     * @returns Rate limit status
     */
    getStatus(clientId) {
        const now = Date.now();
        // Get client rate limit info
        const clientLimit = this.clientLimits.get(clientId);
        if (!clientLimit) {
            return {
                limited: false,
                remaining: this.config.maxMessages,
                resetMs: 0,
                warning: false
            };
        }
        // Remove timestamps outside the current window
        const windowStart = now - this.config.windowMs;
        const validTimestamps = clientLimit.timestamps.filter(timestamp => timestamp >= windowStart);
        // Check if client has exceeded the rate limit
        const messageCount = validTimestamps.length;
        const isLimited = messageCount >= this.config.maxMessages;
        const remaining = Math.max(0, this.config.maxMessages - messageCount);
        // Calculate time until reset
        let oldestTimestamp = 0;
        if (validTimestamps.length > 0) {
            oldestTimestamp = Math.min(...validTimestamps);
        }
        const resetMs = Math.max(0, this.config.windowMs - (now - oldestTimestamp));
        // Check if client is approaching the rate limit
        const warningThreshold = this.config.maxMessages * this.config.warningThreshold;
        const isApproachingLimit = messageCount >= warningThreshold;
        return {
            limited: isLimited,
            remaining,
            resetMs,
            warning: isApproachingLimit
        };
    }
    /**
     * Reset rate limit for a client
     * @param clientId Client identifier
     */
    resetLimit(clientId) {
        this.clientLimits.delete(clientId);
        this.logger.info(`Rate limit reset for client ${clientId}`);
    }
    /**
     * Update rate limit configuration
     * @param config New configuration
     */
    updateConfig(config) {
        this.config = {
            ...this.config,
            ...config
        };
        this.logger.info(`Rate limiter configuration updated: ${this.config.maxMessages} messages per ${this.config.windowMs}ms`);
    }
    /**
     * Start cleanup interval to remove old client data
     */
    startCleanupInterval() {
        // Clear existing interval if any
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }
        // Run cleanup every minute
        this.cleanupInterval = setInterval(() => {
            const now = Date.now();
            const windowStart = now - this.config.windowMs;
            // Clean up client data
            for (const [clientId, clientLimit] of this.clientLimits.entries()) {
                // Remove timestamps outside the current window
                clientLimit.timestamps = clientLimit.timestamps.filter(timestamp => timestamp >= windowStart);
                // Remove client if no recent activity
                if (clientLimit.timestamps.length === 0) {
                    this.clientLimits.delete(clientId);
                }
            }
            this.logger.debug(`Rate limiter cleanup: ${this.clientLimits.size} clients tracked`);
        }, 60000); // Run every minute
    }
    /**
     * Dispose of the rate limiter
     */
    dispose() {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        this.clientLimits.clear();
        this.logger.info('Rate limiter disposed');
    }
}
exports.RateLimiter = RateLimiter;
//# sourceMappingURL=rate-limiter.js.map