/**
 * Rate Limit Configuration by Trust Level
 * Configurable via environment variables
 */

import {
  AgentTrustLevel,
  getRateLimits,
  TRUST_LEVEL_CONFIG,
} from '../modules/agent-registry/types/agent-trust.types.js';

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
 * Parsed rate limit configuration
 */
export interface RateLimitConfig {
  requestsPerMinute: number;
  requestsPerHour: number;
  requestsPerDay: number;
}

/**
 * Get environment variable as number, or return default
 */
function getEnvNumber(key: string, defaultValue: number): number {
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
export function getRateLimitConfig(trustLevel: AgentTrustLevel): RateLimitConfig {
  const defaultConfig = getRateLimits(trustLevel);
  
  switch (trustLevel) {
    case AgentTrustLevel.EPHEMERAL:
      return {
        requestsPerMinute: getEnvNumber(
          ENV_KEYS.EPHEMERAL_REQUESTS_PER_MINUTE,
          defaultConfig.requestsPerMinute
        ),
        requestsPerHour: getEnvNumber(
          ENV_KEYS.EPHEMERAL_REQUESTS_PER_HOUR,
          defaultConfig.requestsPerHour
        ),
        requestsPerDay: getEnvNumber(
          ENV_KEYS.EPHEMERAL_REQUESTS_PER_DAY,
          defaultConfig.requestsPerDay
        ),
      };
      
    case AgentTrustLevel.VERIFIED:
      return {
        requestsPerMinute: getEnvNumber(
          ENV_KEYS.VERIFIED_REQUESTS_PER_MINUTE,
          defaultConfig.requestsPerMinute
        ),
        requestsPerHour: getEnvNumber(
          ENV_KEYS.VERIFIED_REQUESTS_PER_HOUR,
          defaultConfig.requestsPerHour
        ),
        requestsPerDay: getEnvNumber(
          ENV_KEYS.VERIFIED_REQUESTS_PER_DAY,
          defaultConfig.requestsPerDay
        ),
      };
      
    case AgentTrustLevel.PREMIUM:
      return {
        requestsPerMinute: getEnvNumber(
          ENV_KEYS.PREMIUM_REQUESTS_PER_MINUTE,
          defaultConfig.requestsPerMinute
        ),
        requestsPerHour: getEnvNumber(
          ENV_KEYS.PREMIUM_REQUESTS_PER_HOUR,
          defaultConfig.requestsPerHour
        ),
        requestsPerDay: getEnvNumber(
          ENV_KEYS.PREMIUM_REQUESTS_PER_DAY,
          defaultConfig.requestsPerDay
        ),
      };
      
    case AgentTrustLevel.ADMIN:
      return {
        requestsPerMinute: getEnvNumber(
          ENV_KEYS.ADMIN_REQUESTS_PER_MINUTE,
          defaultConfig.requestsPerMinute
        ),
        requestsPerHour: getEnvNumber(
          ENV_KEYS.ADMIN_REQUESTS_PER_HOUR,
          defaultConfig.requestsPerHour
        ),
        requestsPerDay: getEnvNumber(
          ENV_KEYS.ADMIN_REQUESTS_PER_DAY,
          defaultConfig.requestsPerDay
        ),
      };
      
    default:
      // Default to EPHEMERAL for unknown trust levels
      return getRateLimitConfig(AgentTrustLevel.EPHEMERAL);
  }
}

/**
 * Get all rate limit configurations
 */
export function getAllRateLimitConfigs(): Record<AgentTrustLevel, RateLimitConfig> {
  return {
    [AgentTrustLevel.EPHEMERAL]: getRateLimitConfig(AgentTrustLevel.EPHEMERAL),
    [AgentTrustLevel.VERIFIED]: getRateLimitConfig(AgentTrustLevel.VERIFIED),
    [AgentTrustLevel.PREMIUM]: getRateLimitConfig(AgentTrustLevel.PREMIUM),
    [AgentTrustLevel.ADMIN]: getRateLimitConfig(AgentTrustLevel.ADMIN),
  };
}

/**
 * Rate limit window configurations
 */
export const RATE_LIMIT_WINDOWS = {
  MINUTE: 60 * 1000, // 60 seconds in milliseconds
  HOUR: 60 * 60 * 1000, // 60 minutes in milliseconds
  DAY: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
};

/**
 * Redis key prefixes for rate limiting
 */
export const RATE_LIMIT_KEY_PREFIXES = {
  PER_MINUTE: 'ratelimit:minute:',
  PER_HOUR: 'ratelimit:hour:',
  PER_DAY: 'ratelimit:day:',
};

/**
 * Build Redis key for rate limiting
 */
export function buildRateLimitKey(
  agentId: string,
  trustLevel: AgentTrustLevel,
  window: 'minute' | 'hour' | 'day'
): string {
  const prefix = window === 'minute' 
    ? RATE_LIMIT_KEY_PREFIXES.PER_MINUTE
    : window === 'hour'
    ? RATE_LIMIT_KEY_PREFIXES.PER_HOUR
    : RATE_LIMIT_KEY_PREFIXES.PER_DAY;
  
  return `${prefix}${trustLevel}:${agentId}`;
}

/**
 * Check if rate limit is exceeded
 */
export function isRateLimitExceeded(
  currentCount: number,
  limit: number
): boolean {
  // -1 means unlimited
  if (limit === -1) {
    return false;
  }
  return currentCount >= limit;
}

/**
 * Get remaining requests for rate limit
 */
export function getRemainingRequests(
  currentCount: number,
  limit: number
): number {
  // -1 means unlimited
  if (limit === -1) {
    return Infinity;
  }
  return Math.max(0, limit - currentCount);
}

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
export function buildRateLimitHeaders(
  limit: number,
  remaining: number,
  resetTime: Date
): RateLimitHeaders {
  return {
    'X-RateLimit-Limit': limit === -1 ? 'unlimited' : String(limit),
    'X-RateLimit-Remaining': remaining === Infinity ? 'unlimited' : String(remaining),
    'X-RateLimit-Reset': String(Math.floor(resetTime.getTime() / 1000)),
  };
}

/**
 * Export default configuration for easy access
 */
export const DEFAULT_RATE_LIMITS = TRUST_LEVEL_CONFIG;
