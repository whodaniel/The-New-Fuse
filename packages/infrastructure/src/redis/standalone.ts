import { Redis as UpstashRedis } from '@upstash/redis';
import { Cluster, Redis, type RedisOptions } from 'ioredis';

export type StandaloneRedisClient = Redis | Cluster;

export interface StandaloneRedisConfig {
  host: string;
  port: number;
  password?: string;
  db: number;
  /** Present for rediss:// (TLS) endpoints such as Upstash. */
  tls?: Record<string, unknown>;
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
  let tls: Record<string, unknown> | undefined =
    process.env.REDIS_TLS === 'true' || process.env.REDIS_TLS === '1' ? {} : undefined;

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
      // ioredis does not infer TLS from host/port alone — rediss:// must set tls.
      if (url.protocol === 'rediss:') {
        tls = {};
      }
    } catch (error) {
      console.error('[Standalone-Redis] Failed to parse REDIS_URL, using defaults');
    }
  }

  return {
    host,
    port,
    password,
    db,
    tls,
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
    // Cap per-request retries; null previously allowed unbounded offline queuing.
    maxRetriesPerRequest:
      fullConfig.maxRetriesPerRequest === null ? 3 : (fullConfig.maxRetriesPerRequest ?? 3),
    keyPrefix: fullConfig.keyPrefix,
    // Name clients so redis-connection-guard can protect / attribute them.
    connectionName:
      process.env.TNF_REDIS_CLIENT_NAME ||
      process.env.REDIS_CLIENT_NAME ||
      `tnf:node:${process.pid}`,
    enableOfflineQueue: process.env.REDIS_ENABLE_OFFLINE_QUEUE === 'true',
    retryStrategy: (times: number) => {
      const maxAttempts = Number.parseInt(process.env.REDIS_MAX_RETRY_ATTEMPTS || '20', 10);
      if (Number.isFinite(maxAttempts) && times > maxAttempts) {
        return null; // stop reconnecting — prevents connection accumulation
      }
      return Math.min(times * 50, fullConfig.retryDelay);
    },
    ...(fullConfig.tls ? { tls: fullConfig.tls } : {}),
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
  let tls: Record<string, unknown> | undefined;

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
      if (url.protocol === 'rediss:') {
        tls = {};
      }
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

  return { host, port, password, db, tls };
}
