'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.loadStandaloneRedisConfig = loadStandaloneRedisConfig;
exports.createStandaloneRedisClient = createStandaloneRedisClient;
exports.createUpstashRestClient = createUpstashRestClient;
const redis_1 = require('@upstash/redis');
const ioredis_1 = __importDefault(require('ioredis'));
/**
 * Load Redis configuration from environment variables without NestJS dependencies
 */
function loadStandaloneRedisConfig() {
  let redisUrl = process.env.REDIS_URL || '';
  let host = process.env.REDIS_HOST || 'localhost';
  let port = parseInt(process.env.REDIS_PORT || '6379', 10);
  let password = process.env.REDIS_PASSWORD;
  let db = parseInt(process.env.REDIS_DB || '0', 10);
  let tls = undefined;
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
    maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES_PER_REQUEST || '3', 10),
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
function createStandaloneRedisClient(config) {
  const fullConfig = { ...loadStandaloneRedisConfig(), ...config };
  const redisOptions = {
    host: fullConfig.host,
    port: fullConfig.port,
    password: fullConfig.password,
    db: fullConfig.db,
    tls: fullConfig.tls,
    connectTimeout: fullConfig.connectTimeout,
    lazyConnect: fullConfig.lazyConnect,
    maxRetriesPerRequest: fullConfig.maxRetriesPerRequest,
    keyPrefix: fullConfig.keyPrefix,
    retryStrategy: (times) => Math.min(times * 50, fullConfig.retryDelay),
  };
  if (fullConfig.clusterMode && fullConfig.clusterNodes.length > 0) {
    return new ioredis_1.default.Cluster(fullConfig.clusterNodes, {
      redisOptions,
    });
  }
  return new ioredis_1.default(redisOptions);
}
/**
 * Create an Upstash REST client using standalone configuration
 */
function createUpstashRestClient(config) {
  const standaloneConfig = loadStandaloneRedisConfig();
  const restUrl = config?.restUrl || standaloneConfig.upstash?.restUrl;
  const restToken = config?.restToken || standaloneConfig.upstash?.restToken;
  if (restUrl && restToken) {
    return new redis_1.Redis({
      url: restUrl,
      token: restToken,
    });
  }
  return null;
}
//# sourceMappingURL=standalone.js.map
