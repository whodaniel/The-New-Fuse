import { BullModuleOptions } from '@nestjs/bull';
import Redis from 'ioredis';
import { QueueName } from './constants/queue-names.js';

/**
 * Parse Redis connection URL if provided, otherwise use individual env vars
 * Railway and other cloud platforms typically provide REDIS_URL as a connection string
 */
const parseRedisConfig = () => {
  let redisUrl = process.env.REDIS_URL;

  if (redisUrl) {
    // Trim whitespace
    redisUrl = redisUrl.trim();

    // Check if URL was accidentally duplicated (e.g., in Railway environment vars)
    // This is a common copy-paste error where the URL is duplicated in the same environment variable string.
    const redisPrefix = 'redis://';
    const firstIndex = redisUrl.indexOf(redisPrefix);
    const secondIndex = redisUrl.indexOf(redisPrefix, firstIndex + redisPrefix.length);

    if (firstIndex !== -1 && secondIndex !== -1) {
      // If a duplicated prefix is found, take only the first valid URL
      redisUrl = redisUrl.substring(0, secondIndex);
      console.warn(
        '[Bull Config] Detected duplicated REDIS_URL in environment variable, auto-corrected.'
      );
    }

    try {
      // Parse connection string manually to ensure we return an object, not a string
      const url = new URL(redisUrl);
      console.log(`[Bull Config] Using REDIS_URL: ${url.hostname}:${url.port || 6379}`);

      // Parse database index from pathname (e.g., /0, /1, /2)
      // Handle empty pathname or invalid integers gracefully
      const dbFromPath =
        url.pathname && url.pathname.length > 1 ? parseInt(url.pathname.slice(1), 10) : 0; // Default to 0 if no path

      // Strict check for db
      const db = !isNaN(dbFromPath) && dbFromPath >= 0 ? dbFromPath : 0;

      return {
        host: url.hostname,
        port: parseInt(url.port || '6379', 10),
        password: url.password || undefined,
        username: url.username || undefined,
        db,
      };
    } catch (error) {
      console.error(
        '[Bull Config] Failed to process REDIS_URL string, falling back to individual env vars:',
        error
      );
    }
  }

  // Fallback to individual environment variables
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379', 10);

  // Parse database index safely - handle empty strings and ensure valid integer
  const dbEnv = process.env.REDIS_DB || '0';
  let db = 0;
  const parsedDb = parseInt(dbEnv, 10);
  if (!Number.isNaN(parsedDb) && parsedDb >= 0) {
    db = parsedDb;
  }

  console.log(`[Bull Config] Using individual env vars: ${host}:${port} (db: ${db})`);

  return {
    host,
    port,
    password: process.env.REDIS_PASSWORD,
    db,
  };
};

/**
 * Base Redis connection options for Bull/ioredis
 * Used as foundation for all client types
 */
const getBaseRedisOptions = () => {
  const connectionConfig = parseRedisConfig();

  return {
    ...connectionConfig,
    // Improved retry strategy with exponential backoff
    retryStrategy: (times: number) => {
      if (times > 15) {
        // After 15 retries, stop trying (prevents infinite loops)
        return null;
      }
      // Exponential backoff: 50ms, 100ms, 200ms... up to 5000ms (5s)
      const delay = Math.min(times * 50, 5000);
      return delay;
    },
    // Enable offline queue to buffer commands when Redis is temporarily unavailable
    enableOfflineQueue: true,
    // Connection timeout
    connectTimeout: 10000, // 10 seconds
    // Reconnect on error
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      return targetErrors.some((targetError) => err.message.includes(targetError));
    },
  };
};

/**
 * Bull queue configuration with per-client type options
 *
 * IMPORTANT: Bull/ioredis has constraints on subscriber and bclient connections:
 * - enableReadyCheck MUST be false (or omitted)
 * - maxRetriesPerRequest MUST be null (or omitted)
 *
 * See: https://github.com/OptimalBits/bull/issues/1873
 *
 * Using createClient factory to provide appropriate options per client type.
 */
export const getBullConfig = (): BullModuleOptions => ({
  createClient: (type, redisOpts) => {
    const baseOpts = getBaseRedisOptions();

    // Main client can have robust retry and ready-check settings
    if (type === 'client') {
      return new Redis({
        ...baseOpts,
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES || '10', 10),
        enableReadyCheck: true,
      });
    }

    // Subscriber and bclient MUST NOT use enableReadyCheck or maxRetriesPerRequest
    // per Bull constraints (see GitHub issue #1873)
    if (type === 'subscriber' || type === 'bclient') {
      return new Redis({
        ...baseOpts,
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
    }

    // Fallback for any other client types
    return new Redis({
      ...baseOpts,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    });
  },
  // Default job options
  defaultJobOptions: {
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 1000, // Keep max 1000 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
    // Stack trace limit for better debugging
    stackTraceLimit: 50,
  },
  // Prometheus metrics
  metrics: {
    maxDataPoints: 100,
  },
});

/**
 * Queue-specific settings
 */
export const QUEUE_SETTINGS = {
  [QueueName.EMAIL]: {
    limiter: {
      max: 100, // Max 100 jobs
      duration: 60000, // Per minute
    },
    settings: {
      lockDuration: 30000, // 30 seconds
      lockRenewTime: 15000, // Renew every 15 seconds
      stalledInterval: 30000, // Check for stalled jobs every 30 seconds
      maxStalledCount: 2, // Max times a job can be recovered from stalled state
    },
  },
  [QueueName.AGENT_EXECUTION]: {
    limiter: {
      max: 10, // Max 10 concurrent agent executions
      duration: 60000, // Per minute
    },
    settings: {
      lockDuration: 300000, // 5 minutes - agents can take longer
      lockRenewTime: 60000, // Renew every minute
      stalledInterval: 60000,
      maxStalledCount: 1,
    },
  },
  [QueueName.REPORT_GENERATION]: {
    limiter: {
      max: 5, // Max 5 concurrent report generations
      duration: 60000, // Per minute
    },
    settings: {
      lockDuration: 600000, // 10 minutes - reports can take longer
      lockRenewTime: 120000, // Renew every 2 minutes
      stalledInterval: 120000,
      maxStalledCount: 1,
    },
  },
  [QueueName.DATA_SYNC]: {
    limiter: {
      max: 2, // Max 2 concurrent syncs
      duration: 60000, // Per minute
    },
    settings: {
      lockDuration: 1800000, // 30 minutes - syncs can be very long
      lockRenewTime: 300000, // Renew every 5 minutes
      stalledInterval: 300000,
      maxStalledCount: 2,
    },
  },
  [QueueName.CLEANUP]: {
    limiter: {
      max: 1, // Only one cleanup job at a time
      duration: 60000, // Per minute
    },
    settings: {
      lockDuration: 3600000, // 1 hour - cleanup can take a while
      lockRenewTime: 600000, // Renew every 10 minutes
      stalledInterval: 600000,
      maxStalledCount: 1,
    },
  },
};
