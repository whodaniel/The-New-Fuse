import { Redis as UpstashRedis } from '@upstash/redis';
import { Cluster, Redis, type RedisOptions } from 'ioredis';

export type StandaloneRedisClient = Redis | Cluster;

export interface StandaloneRedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  connectTimeout: number;
  lazyConnect: boolean;
  maxRetriesPerRequest: number | null;
  retryDelay: number;
  keyPrefix: string;
  clusterMode: boolean;
  clusterNodes: string[];
  upstash?: {
    restUrl?: string;
    restToken?: string;
  };
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
    maxRetriesPerRequest: null,
    retryDelay: parseInt(process.env.REDIS_RETRY_DELAY || '1000', 10),
    keyPrefix: process.env.REDIS_KEY_PREFIX || '',
    clusterMode: process.env.REDIS_CLUSTER_MODE === 'true',
    clusterNodes: (process.env.REDIS_CLUSTER_NODES || '')
      .split(',')
      .map((n) => n.trim())
      .filter(Boolean),
    upstash: {
      restUrl: process.env.UPSTASH_REDIS_REST_URL,
      restToken: process.env.UPSTASH_REDIS_REST_TOKEN,
    },
  };
}

/**
 * Create an ioredis client using standalone configuration
 */
export function createStandaloneRedisClient(
  config?: Partial<StandaloneRedisConfig>
): StandaloneRedisClient {
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
    return new Cluster(fullConfig.clusterNodes, {
      redisOptions,
    });
  }

  return new Redis(redisOptions);
}

export function describeStandaloneRedisClient(
  client: StandaloneRedisClient
): 'cluster' | 'standalone' {
  return client instanceof Cluster ? 'cluster' : 'standalone';
}

export async function connectStandaloneRedisClient(client: StandaloneRedisClient): Promise<void> {
  const status = (client as { status?: string }).status;
  if (status === 'ready' || status === 'connecting' || status === 'connect') {
    return;
  }

  await client.connect();
}

/**
 * Create an Upstash REST client using standalone configuration
 */
export function createUpstashRestClient(config?: { restUrl?: string; restToken?: string }): any {
  const standaloneConfig = loadStandaloneRedisConfig();
  const restUrl = config?.restUrl || standaloneConfig.upstash?.restUrl;
  const restToken = config?.restToken || standaloneConfig.upstash?.restToken;

  if (restUrl && restToken) {
    return new UpstashRedis({
      url: restUrl,
      token: restToken,
    });
  }

  return null;
}

/**
 * Parse a Redis URL string into a Partial<StandaloneRedisConfig>
 */
export function parseRedisUrl(redisUrl: string): Partial<StandaloneRedisConfig> {
  let host: string | undefined;
  let port: number | undefined;
  let password: string | undefined;
  let db: number | undefined;

  if (redisUrl) {
    try {
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
      console.error(
        '[Standalone-Redis] Failed to parse Redis URL, using defaults for URL component parsing:',
        error
      );
      // Fallback to default host/port if URL parsing fails
      host = 'localhost';
      port = 6379;
      db = 0;
    }
  }

  return { host, port, password, db };
}
