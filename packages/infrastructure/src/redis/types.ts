export interface RedisConfiguration {
  host: string;
  port: number;
  password?: string;
  db: number;
  upstash?: {
    restUrl?: string;
    restToken?: string;
  };
  poolSize: number;
  retryAttempts: number;
  retryDelay: number;
  connectTimeout?: number;
  lazyConnect?: boolean;
  maxRetriesPerRequest?: number;
  cluster?: {
    enableReadyCheck: boolean;
    maxRedirections: number;
    retryDelayOnFailover: number;
  };
}

export interface QueueTask<T = any> {
  id: string;
  type: string;
  data: T;
  priority?: number;
  retryCount?: number;
  maxRetries?: number;
  createdAt?: Date;
  scheduledAt?: Date;
  processedAt?: Date;
}

export interface SearchResult {
  id: string;
  score: number;
  vector?: number[];
  metadata?: Record<string, any>;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  namespace?: string;
}

export interface PubSubMessage {
  channel: string;
  pattern?: string;
  message: string | object;
  timestamp: Date;
}

export interface RedisHealth {
  status: 'healthy' | 'unhealthy' | 'degraded';
  latency: number;
  memoryUsage: number;
  connectedClients: number;
  uptime: number;
  lastError?: string;
}

export interface RedisMetrics {
  operations: {
    get: number;
    set: number;
    del: number;
    hget: number;
    hset: number;
    lpush: number;
    rpop: number;
    lrem: number;
    publish: number;
  };
  performance: {
    avgLatency: number;
    maxLatency: number;
    errorRate: number;
  };
  memory: {
    used: number;
    peak: number;
    fragmentation: number;
  };
  connections: {
    active: number;
    total: number;
    rejected: number;
  };
}

export type RedisOperationType = 
  | 'get' | 'set' | 'del' | 'exists' | 'expire' | 'pttl' | 'pexpire'
  | 'hget' | 'hset' | 'hgetall' | 'hdel' | 'hincrby'
  | 'lpush' | 'rpush' | 'rpop' | 'lpop' | 'llen' | 'lrange' | 'lrem' | 'ltrim' | 'lindex'
  | 'zadd' | 'zrange' | 'zpopmax' | 'zrem' | 'zremrangebyscore' | 'zcard' | 'zcount'
  | 'sadd' | 'srem' | 'smembers' | 'sismember' | 'sinter'
  | 'publish' | 'subscribe' | 'unsubscribe'
  | 'psubscribe' | 'punsubscribe'
  | 'ping' | 'flushdb' | 'keys' | 'scan' | 'incr' | 'incrby' | 'decrby'
  | 'mget' | 'mset' | 'eval' | 'pipeline' | 'get_client';

export interface RedisOperationLog {
  operation: RedisOperationType;
  key?: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}