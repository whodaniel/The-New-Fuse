import { registerAs } from '@nestjs/config';

export interface CacheTTLConfig {
  short: number;      // 5 minutes
  medium: number;     // 30 minutes
  long: number;       // 2 hours
  veryLong: number;   // 24 hours
  session: number;    // 7 days
}

export interface CacheConfig {
  redis: {
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

export default registerAs('cache', (): CacheConfig => ({
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.REDIS_CACHE_DB || '1', 10), // Use separate DB for cache
    ttl: parseInt(process.env.REDIS_DEFAULT_TTL || '3600', 10), // 1 hour default
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    retryStrategy: (times: number) => {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  },
  ttl: {
    short: parseInt(process.env.CACHE_TTL_SHORT || '300', 10),        // 5 minutes
    medium: parseInt(process.env.CACHE_TTL_MEDIUM || '1800', 10),     // 30 minutes
    long: parseInt(process.env.CACHE_TTL_LONG || '7200', 10),         // 2 hours
    veryLong: parseInt(process.env.CACHE_TTL_VERY_LONG || '86400', 10), // 24 hours
    session: parseInt(process.env.CACHE_TTL_SESSION || '604800', 10),  // 7 days
  },
  keyPrefix: process.env.CACHE_KEY_PREFIX || 'fuse:',
  monitoring: {
    enabled: process.env.CACHE_MONITORING_ENABLED === 'true',
    sampleRate: parseInt(process.env.CACHE_MONITORING_SAMPLE_RATE || '100', 10),
    metricsInterval: parseInt(process.env.CACHE_METRICS_INTERVAL || '60000', 10), // 1 minute
  },
}));
