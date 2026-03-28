import Redis, { Cluster, RedisOptions } from 'ioredis';

export interface StandaloneRedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  connectTimeout: number;
  lazyConnect: boolean;
  maxRetriesPerRequest: number;
  retryDelay: number;
  keyPrefix: string;
  clusterMode: boolean;
  clusterNodes: string[];
}

/**
 * Load Redis configuration from environment variables without NestJS dependencies
 */
export function loadStandaloneRedisConfig(): StandaloneRedisConfig {
  let redisUrl = process.env.REDIS_URL || '';
  let host = process.env.REDIS_HOST || 'localhost';
  let port = parseInt(process.env.REDIS_PORT || '6379', 10);
  let password = process.env.REDIS_PASSWORD;
  let db = parseInt(process.env.REDIS_DB || '0', 10);

  if (redisUrl) {
    try {
      // Handle potential duplicate URL prefix
      const redisPrefix = 'redis://';
      const secondIndex = redisUrl.indexOf(redisPrefix, redisPrefix.length);
      if (secondIndex !== -1) {
        redisUrl = redisUrl.substring(0, secondIndex);
      }

      const url = new URL(redisUrl);
      host = url.hostname;
      port = parseInt(url.port || '6379', 10);
      password = url.password || undefined;
      const dbFromPath =
        url.pathname && url.pathname.length > 1 ? parseInt(url.pathname.slice(1), 10) : 0;
      db = !isNaN(dbFromPath) && dbFromPath >= 0 ? dbFromPath : 0;
    } catch (error) {
      console.error('[Standalone-Redis] Failed to parse REDIS_URL, using defaults');
    }
  }

  return {
    host,
    port,
    password,
    db,
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT || '10000', 10),
    lazyConnect: process.env.REDIS_LAZY_CONNECT === 'true',
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10),
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || '',
    clusterMode: process.env.REDIS_CLUSTER_MODE === 'true',
    clusterNodes: (process.env.REDIS_CLUSTER_NODES || '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean),
  };
}

/**
 * Create an ioredis client using standalone configuration
 */
export function createStandaloneRedisClient(
  config?: Partial<StandaloneRedisConfig>
): Redis | Cluster {
  const fullConfig = { ...loadStandaloneRedisConfig(), ...config };

  const redisOptions: RedisOptions = {
    host: fullConfig.host,
    port: fullConfig.port,
    password: fullConfig.password,
    db: fullConfig.db,
    connectTimeout: fullConfig.connectTimeout,
    lazyConnect: fullConfig.lazyConnect,
    maxRetriesPerRequest: fullConfig.maxRetriesPerRequest,
    keyPrefix: fullConfig.keyPrefix,
    retryStrategy: (times: number) => Math.min(times * 50, fullConfig.retryDelay),
  };

  if (fullConfig.clusterMode && fullConfig.clusterNodes.length > 0) {
    return new Redis.Cluster(fullConfig.clusterNodes, {
      redisOptions,
    });
  }

  return new Redis(redisOptions);
}
