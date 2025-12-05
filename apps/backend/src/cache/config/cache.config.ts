import { registerAs } from '@nestjs/config';

export interface CacheTTLConfig {
  short: number; // 5 minutes
  medium: number; // 30 minutes
  long: number; // 2 hours
  veryLong: number; // 24 hours
  session: number; // 7 days
}

export interface CacheConfig {
  redis: {
    /** Optional Redis connection URL. If provided, it takes precedence. */
    url?: string;
    host: string;
    port: number;
    password?: string;
    db: number;
    ttl: number; // default TTL in seconds
    maxRetriesPerRequest: number;
    enableReadyCheck: boolean;
    retryStrategy: (times: number) => number | void;
  };
  ttl: CacheTTLConfig;
  keyPrefix: string;
  monitoring: {
    enabled: boolean;
    sampleRate: number; // percentage of operations to track
    metricsInterval: number; // how often to aggregate metrics (ms)
  };
}

export default registerAs('cache', (): CacheConfig => {
  // Parse and clean REDIS_URL - handle duplicated URLs from Railway
  let redisUrl =
    process.env.REDIS_URL ||
    process.env.REDIS_TLS_URL ||
    process.env.REDISS_URL ||
    process.env.REDIS_CONNECTION_STRING;

  if (redisUrl) {
    redisUrl = redisUrl.trim();

    // Check if URL was accidentally duplicated (common in Railway environment vars)
    const redisPrefix = 'redis://';
    const redissPrefix = 'rediss://';
    const prefix = redisUrl.startsWith(redissPrefix) ? redissPrefix : redisPrefix;
    const firstIndex = redisUrl.indexOf(prefix);
    const secondIndex = redisUrl.indexOf(prefix, firstIndex + prefix.length);

    if (firstIndex !== -1 && secondIndex !== -1) {
      // If duplicated prefix found, take only first valid URL
      redisUrl = redisUrl.substring(0, secondIndex);
      console.warn(
        '[Cache Config] Detected duplicated REDIS_URL in environment variable, auto-corrected.'
      );
    }
  }

  return {
    redis: {
      // Prefer a URL if provided (works with ioredis and supports rediss://)
      url: redisUrl || undefined,
      // Fallback to host/port/password if URL not set
      host:
        process.env.REDIS_HOST ||
        process.env.REDIS_HOSTNAME ||
        process.env.REDISHOST ||
        'localhost',
      port: parseInt(process.env.REDIS_PORT || process.env.REDISPORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || process.env.REDISPASSWORD || undefined,
      // Parse database index safely - handle empty strings and ensure valid integer
      db: (() => {
        const dbEnv = process.env.REDIS_CACHE_DB || process.env.REDIS_DB || '1';
        const parsed = parseInt(dbEnv, 10);
        return !isNaN(parsed) && parsed >= 0 ? parsed : 1;
      })(),
      ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10), // 1 hour default
      // Increased from 3 to 10 for better resilience
      maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '10', 10),
      enableReadyCheck: true,
      // Improved retry strategy with exponential backoff and max delay
      retryStrategy: (times: number) => {
        if (times > 15) {
          // After 15 retries, stop trying (prevents infinite loops)
          return null;
        }
        // Exponential backoff: 50ms, 100ms, 200ms... up to 5000ms (5s)
        const delay = Math.min(times * 50, 5000);
        return delay;
      },
    },
    ttl: {
      short: parseInt(process.env.CACHE_TTL_SHORT || '300', 10), // 5 minutes
      medium: parseInt(process.env.CACHE_TTL_MEDIUM || '1800', 10), // 30 minutes
      long: parseInt(process.env.CACHE_TTL_LONG || '7200', 10), // 2 hours
      veryLong: parseInt(process.env.CACHE_TTL_VERY_LONG || '86400', 10), // 24 hours
      session: parseInt(process.env.CACHE_TTL_SESSION || '604800', 10), // 7 days
    },
    keyPrefix: process.env.CACHE_KEY_PREFIX || 'fuse:',
    monitoring: {
      enabled: process.env.CACHE_MONITORING_ENABLED === 'true',
      sampleRate: parseInt(process.env.CACHE_MONITORING_SAMPLE_RATE || '100', 10),
      metricsInterval: parseInt(process.env.CACHE_METRICS_INTERVAL || '60000', 10), // 1 minute
    },
  };
});
