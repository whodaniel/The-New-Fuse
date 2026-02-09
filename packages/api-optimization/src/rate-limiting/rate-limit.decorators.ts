import { SetMetadata } from '@nestjs/common';
import { RateLimitConfig } from './redis-rate-limiter.service';
import {
  RATE_LIMIT_KEY,
  RATE_LIMIT_TIER_KEY,
  SKIP_RATE_LIMIT_KEY
} from './rate-limit.guard';

/**
 * Set custom rate limit configuration for an endpoint
 *
 * @example
 * @RateLimit({ points: 100, duration: 60 })
 * async myEndpoint() { ... }
 */
export const RateLimit = (config: RateLimitConfig) =>
  SetMetadata(RATE_LIMIT_KEY, config);

/**
 * Use a predefined rate limit tier
 *
 * @example
 * @RateLimitTier('pro')
 * async myEndpoint() { ... }
 */
export const RateLimitTier = (tier: string) =>
  SetMetadata(RATE_LIMIT_TIER_KEY, tier);

/**
 * Skip rate limiting for an endpoint
 *
 * @example
 * @SkipRateLimit()
 * async healthCheck() { ... }
 */
export const SkipRateLimit = () => SetMetadata(SKIP_RATE_LIMIT_KEY, true);

/**
 * Common rate limit presets
 */
export const RateLimitPresets = {
  /**
   * Very strict rate limit for expensive operations
   * 10 requests per minute
   */
  STRICT: { points: 10, duration: 60, blockDuration: 300 },

  /**
   * Standard rate limit for normal endpoints
   * 100 requests per minute
   */
  STANDARD: { points: 100, duration: 60, blockDuration: 120 },

  /**
   * Relaxed rate limit for read operations
   * 500 requests per minute
   */
  RELAXED: { points: 500, duration: 60, blockDuration: 60 },

  /**
   * Burst protection - per second limit
   * 10 requests per second
   */
  BURST: { points: 10, duration: 1, blockDuration: 5 },

  /**
   * API key authenticated endpoints
   * 1000 requests per minute
   */
  API_KEY: { points: 1000, duration: 60, blockDuration: 60 },

  /**
   * Authentication endpoints
   * 5 requests per minute (prevent brute force)
   */
  AUTH: { points: 5, duration: 60, blockDuration: 600 },

  /**
   * Search endpoints
   * 50 requests per minute
   */
  SEARCH: { points: 50, duration: 60, blockDuration: 180 },

  /**
   * File upload endpoints
   * 20 requests per hour
   */
  UPLOAD: { points: 20, duration: 3600, blockDuration: 3600 },

  /**
   * Webhook endpoints
   * 100 requests per minute
   */
  WEBHOOK: { points: 100, duration: 60, blockDuration: 300 }
};
