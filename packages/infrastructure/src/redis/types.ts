export interface RedisConfiguration {
  host: string;
  port: number;
  password?: string;
  db: number;
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
  | 'get'
  | 'set'
  | 'del'
  | 'exists'
  | 'expire'
  | 'hget'
  | 'hset'
  | 'hgetall'
  | 'hdel'
  | 'lpush'
  | 'rpop'
  | 'llen'
  | 'lrange'
  | 'ltrim'
  | 'lindex'
  | 'zadd'
  | 'zrange'
  | 'zpopmax'
  | 'zrem'
  | 'sadd'
  | 'srem'
  | 'smembers'
  | 'sismember'
  | 'publish'
  | 'subscribe'
  | 'unsubscribe'
  | 'psubscribe'
  | 'punsubscribe'
  | 'ping'
  | 'flushdb'
  | 'keys';

export interface RedisOperationLog {
  operation: RedisOperationType;
  key?: string;
  duration: number;
  success: boolean;
  error?: string;
  timestamp: Date;
}
