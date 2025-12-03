import { BullModuleOptions } from '@nestjs/bull';
import { QueueName } from './constants/queue-names';

/**
 * Bull queue configuration
 */
export const getBullConfig = (): BullModuleOptions => {
  const redisConfig: any = {};

  if (process.env.REDIS_URL) {
    try {
      const url = new URL(process.env.REDIS_URL);
      redisConfig.host = url.hostname;
      redisConfig.port = parseInt(url.port || '6379');
      redisConfig.password = url.password;
      redisConfig.username = url.username;
      // Pathname is usually /<db_number>, e.g., /0
      const dbStr = url.pathname.slice(1);
      redisConfig.db = dbStr ? parseInt(dbStr) : 0;

      console.log(
        `[Bull Config] Using REDIS_URL: ${url.hostname}:${url.port} (DB: ${redisConfig.db})`
      );
    } catch (e) {
      console.error('[Bull Config] Invalid REDIS_URL, falling back to individual vars', e);
    }
  }

  if (!redisConfig.host) {
    redisConfig.host = process.env.REDIS_HOST || 'localhost';
    redisConfig.port = parseInt(process.env.REDIS_PORT || '6379');
    redisConfig.password = process.env.REDIS_PASSWORD;
    redisConfig.db = parseInt(process.env.REDIS_DB || '0');
  }

  // Final safety check for db
  if (isNaN(redisConfig.db)) {
    console.warn(`[Bull Config] Invalid DB value, defaulting to 0`);
    redisConfig.db = 0;
  }

  return {
    redis: {
      ...redisConfig,
      // Connection retry strategy
      retryStrategy: (times: number) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      // Enable offline queue
      enableOfflineQueue: true,
      // Set max retry attempts
      maxRetriesPerRequest: 3,
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
  };
};

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
