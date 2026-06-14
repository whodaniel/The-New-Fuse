"use strict";
/**
 * Rate Limit Configuration by Trust Level
 * Configurable via environment variables
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_RATE_LIMITS = exports.RATE_LIMIT_KEY_PREFIXES = exports.RATE_LIMIT_WINDOWS = void 0;
exports.getRateLimitConfig = getRateLimitConfig;
exports.getAllRateLimitConfigs = getAllRateLimitConfigs;
exports.buildRateLimitKey = buildRateLimitKey;
exports.isRateLimitExceeded = isRateLimitExceeded;
exports.getRemainingRequests = getRemainingRequests;
exports.buildRateLimitHeaders = buildRateLimitHeaders;
const agent_trust_types_1 = require("../modules/agent-registry/types/agent-trust.types");
/**
 * Environment variable names for rate limits
 */
const ENV_KEYS = {
    EPHEMERAL_REQUESTS_PER_MINUTE: 'RATE_LIMIT_EPHEMERAL_RPM',
    EPHEMERAL_REQUESTS_PER_HOUR: 'RATE_LIMIT_EPHEMERAL_RPH',
    EPHEMERAL_REQUESTS_PER_DAY: 'RATE_LIMIT_EPHEMERAL_RPD',
    VERIFIED_REQUESTS_PER_MINUTE: 'RATE_LIMIT_VERIFIED_RPM',
    VERIFIED_REQUESTS_PER_HOUR: 'RATE_LIMIT_VERIFIED_RPH',
    VERIFIED_REQUESTS_PER_DAY: 'RATE_LIMIT_VERIFIED_RPD',
    PREMIUM_REQUESTS_PER_MINUTE: 'RATE_LIMIT_PREMIUM_RPM',
    PREMIUM_REQUESTS_PER_HOUR: 'RATE_LIMIT_PREMIUM_RPH',
    PREMIUM_REQUESTS_PER_DAY: 'RATE_LIMIT_PREMIUM_RPD',
    ADMIN_REQUESTS_PER_MINUTE: 'RATE_LIMIT_ADMIN_RPM',
    ADMIN_REQUESTS_PER_HOUR: 'RATE_LIMIT_ADMIN_RPH',
    ADMIN_REQUESTS_PER_DAY: 'RATE_LIMIT_ADMIN_RPD',
};
/**
 * Get environment variable as number, or return default
 */
function getEnvNumber(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined || value === '') {
        return defaultValue;
    }
    const parsed = parseInt(value, 10);
    if (isNaN(parsed)) {
        console.warn(`Invalid rate limit value for ${key}: ${value}, using default ${defaultValue}`);
        return defaultValue;
    }
    return parsed;
}
/**
 * Rate limits by trust level (with environment variable overrides)
 */
function getRateLimitConfig(trustLevel) {
    const defaultConfig = (0, agent_trust_types_1.getRateLimits)(trustLevel);
    switch (trustLevel) {
        case agent_trust_types_1.AgentTrustLevel.EPHEMERAL:
            return {
                requestsPerMinute: getEnvNumber(ENV_KEYS.EPHEMERAL_REQUESTS_PER_MINUTE, defaultConfig.requestsPerMinute),
                requestsPerHour: getEnvNumber(ENV_KEYS.EPHEMERAL_REQUESTS_PER_HOUR, defaultConfig.requestsPerHour),
                requestsPerDay: getEnvNumber(ENV_KEYS.EPHEMERAL_REQUESTS_PER_DAY, defaultConfig.requestsPerDay),
            };
        case agent_trust_types_1.AgentTrustLevel.VERIFIED:
            return {
                requestsPerMinute: getEnvNumber(ENV_KEYS.VERIFIED_REQUESTS_PER_MINUTE, defaultConfig.requestsPerMinute),
                requestsPerHour: getEnvNumber(ENV_KEYS.VERIFIED_REQUESTS_PER_HOUR, defaultConfig.requestsPerHour),
                requestsPerDay: getEnvNumber(ENV_KEYS.VERIFIED_REQUESTS_PER_DAY, defaultConfig.requestsPerDay),
            };
        case agent_trust_types_1.AgentTrustLevel.PREMIUM:
            return {
                requestsPerMinute: getEnvNumber(ENV_KEYS.PREMIUM_REQUESTS_PER_MINUTE, defaultConfig.requestsPerMinute),
                requestsPerHour: getEnvNumber(ENV_KEYS.PREMIUM_REQUESTS_PER_HOUR, defaultConfig.requestsPerHour),
                requestsPerDay: getEnvNumber(ENV_KEYS.PREMIUM_REQUESTS_PER_DAY, defaultConfig.requestsPerDay),
            };
        case agent_trust_types_1.AgentTrustLevel.ADMIN:
            return {
                requestsPerMinute: getEnvNumber(ENV_KEYS.ADMIN_REQUESTS_PER_MINUTE, defaultConfig.requestsPerMinute),
                requestsPerHour: getEnvNumber(ENV_KEYS.ADMIN_REQUESTS_PER_HOUR, defaultConfig.requestsPerHour),
                requestsPerDay: getEnvNumber(ENV_KEYS.ADMIN_REQUESTS_PER_DAY, defaultConfig.requestsPerDay),
            };
        default:
            // Default to EPHEMERAL for unknown trust levels
            return getRateLimitConfig(agent_trust_types_1.AgentTrustLevel.EPHEMERAL);
    }
}
/**
 * Get all rate limit configurations
 */
function getAllRateLimitConfigs() {
    return {
        [agent_trust_types_1.AgentTrustLevel.EPHEMERAL]: getRateLimitConfig(agent_trust_types_1.AgentTrustLevel.EPHEMERAL),
        [agent_trust_types_1.AgentTrustLevel.VERIFIED]: getRateLimitConfig(agent_trust_types_1.AgentTrustLevel.VERIFIED),
        [agent_trust_types_1.AgentTrustLevel.PREMIUM]: getRateLimitConfig(agent_trust_types_1.AgentTrustLevel.PREMIUM),
        [agent_trust_types_1.AgentTrustLevel.ADMIN]: getRateLimitConfig(agent_trust_types_1.AgentTrustLevel.ADMIN),
    };
}
/**
 * Rate limit window configurations
 */
exports.RATE_LIMIT_WINDOWS = {
    MINUTE: 60 * 1000, // 60 seconds in milliseconds
    HOUR: 60 * 60 * 1000, // 60 minutes in milliseconds
    DAY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};
/**
 * Redis key prefixes for rate limiting
 */
exports.RATE_LIMIT_KEY_PREFIXES = {
    PER_MINUTE: 'ratelimit:minute:',
    PER_HOUR: 'ratelimit:hour:',
    PER_DAY: 'ratelimit:day:',
};
/**
 * Build Redis key for rate limiting
 */
function buildRateLimitKey(agentId, trustLevel, window) {
    const prefix = window === 'minute'
        ? exports.RATE_LIMIT_KEY_PREFIXES.PER_MINUTE
        : window === 'hour'
            ? exports.RATE_LIMIT_KEY_PREFIXES.PER_HOUR
            : exports.RATE_LIMIT_KEY_PREFIXES.PER_DAY;
    return `${prefix}${trustLevel}:${agentId}`;
}
/**
 * Check if rate limit is exceeded
 */
function isRateLimitExceeded(currentCount, limit) {
    // -1 means unlimited
    if (limit === -1) {
        return false;
    }
    return currentCount >= limit;
}
/**
 * Get remaining requests for rate limit
 */
function getRemainingRequests(currentCount, limit) {
    // -1 means unlimited
    if (limit === -1) {
        return Infinity;
    }
    return Math.max(0, limit - currentCount);
}
/**
 * Build rate limit headers for response
 */
function buildRateLimitHeaders(limit, remaining, resetTime) {
    return {
        'X-RateLimit-Limit': limit === -1 ? 'unlimited' : String(limit),
        'X-RateLimit-Remaining': remaining === Infinity ? 'unlimited' : String(remaining),
        'X-RateLimit-Reset': String(Math.floor(resetTime.getTime() / 1000)),
    };
}
/**
 * Export default configuration for easy access
 */
exports.DEFAULT_RATE_LIMITS = agent_trust_types_1.TRUST_LEVEL_CONFIG;
//# sourceMappingURL=rate-limit.config.js.map