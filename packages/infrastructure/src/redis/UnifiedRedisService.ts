import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis, { Cluster } from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';
import { RedisConfig } from './RedisConfig';
import {
  CacheOptions,
  PubSubMessage,
  QueueTask,
  RedisHealth,
  RedisMetrics,
  RedisOperationLog,
  RedisOperationType,
  SearchResult,
} from './types';

@Injectable()
export class UnifiedRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UnifiedRedisService.name);

  private mainClient!: Redis | Cluster;
  private pubSubClient!: Redis | Cluster;
  private upstashClient?: UpstashRedis;
  private subscribers: Map<string, Redis | Cluster> = new Map();
  private patternSubscribers: Map<string, Redis | Cluster> = new Map();

  private metrics: RedisMetrics = {
    operations: {
      get: 0,
      set: 0,
      del: 0,
      hget: 0,
      hset: 0,
      lpush: 0,
      rpop: 0,
      lrem: 0,
      publish: 0,
    },
    performance: {
      avgLatency: 0,
      maxLatency: 0,
      errorRate: 0,
    },
    memory: {
      used: 0,
      peak: 0,
      fragmentation: 0,
    },
    connections: {
      active: 0,
      total: 0,
      rejected: 0,
    },
  };

  private operationLogs: RedisOperationLog[] = [];
  private readonly MAX_LOG_SIZE = 1000;
  private _isConnected = false;

  /**
   * Check if Redis is connected and available
   */
  get isConnected(): boolean {
    return this._isConnected;
  }

  constructor(private readonly redisConfig: RedisConfig) {
    console.log('[UnifiedRedisService] Constructor called');
    console.log('[UnifiedRedisService] RedisConfig injected:', !!redisConfig);
    if (!redisConfig) {
      console.error('[UnifiedRedisService] CRITICAL: RedisConfig is undefined!');
      throw new Error('RedisConfig was not injected into UnifiedRedisService');
    }
  }

  async onModuleInit() {
    await this.initializeConnections();
    this.logger.log('Unified Redis Service initialized');
  }

  async onModuleDestroy() {
    await this.closeAllConnections();
    this.logger.log('Unified Redis Service destroyed');
  }

  private async initializeConnections() {
    const config = this.redisConfig.getConnectionOptions();
    const upstashConfig = this.redisConfig.getUpstashConfig();

    // Setup Upstash REST client if available
    if (upstashConfig) {
      try {
        this.upstashClient = new UpstashRedis({
          url: upstashConfig.url,
          token: upstashConfig.token,
        });
        this.logger.log('Upstash REST client initialized');
      } catch (error) {
        this.logger.error('Failed to initialize Upstash REST client', error);
      }
    }

    // If Redis is disabled, skip initialization of standard clients
    if (!config) {
      this.logger.warn('Redis TCP is disabled - connections will not be initialized');
      this._isConnected = this.upstashClient !== undefined;
      return;
    }

    try {
      if (this.redisConfig.isClusterMode()) {
        const nodes = this.redisConfig.getClusterNodes();
        this.mainClient = new Redis.Cluster(nodes, {
          redisOptions: config,
          ...this.redisConfig.getConfiguration().cluster,
        });
        this.pubSubClient = new Redis.Cluster(nodes, {
          redisOptions: config,
          ...this.redisConfig.getConfiguration().cluster,
        });
      } else {
        this.mainClient = new Redis(config);
        this.pubSubClient = new Redis(config);
      }

      this.setupEventHandlers();

      await this.mainClient.ping();
      await this.pubSubClient.ping();

      this._isConnected = true;
      this.logger.log('Redis connections established successfully');
    } catch (error) {
      this._isConnected = false;
      // Log error but don't crash the application - operate in degraded mode
      this.logger.warn('Failed to initialize Redis connections - operating in degraded mode');
      this.logger.warn(
        'Redis connection error:',
        error instanceof Error ? error.message : String(error)
      );
      this.logger.warn('Features requiring Redis will be unavailable until connection is restored');

      // Set up dummy clients that will fail gracefully on operations
      if (!this.mainClient) {
        this.mainClient = this.createDummyClient();
      }
      if (!this.pubSubClient) {
        this.pubSubClient = this.createDummyClient();
      }
    }
  }

  /**
   * Create a dummy Redis client that fails gracefully for when Redis is unavailable
   */
  private createDummyClient(): Redis {
    const client = new Redis({
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // Never retry
    });
    return client;
  }

  private setupEventHandlers() {
    this.mainClient.on('connect', () => {
      this.logger.log('Main Redis client connected');
      this.metrics.connections.active++;
    });

    this.mainClient.on('error', (err) => {
      this.logger.error('Main Redis client error', err);
      this.metrics.performance.errorRate++;
    });

    this.pubSubClient.on('connect', () => {
      this.logger.log('PubSub Redis client connected');
    });

    this.pubSubClient.on('error', (err) => {
      this.logger.error('PubSub Redis client error', err);
    });
  }

  private async executeOperation<T>(
    operation: RedisOperationType,
    key: string | undefined,
    executor: () => Promise<T>
  ): Promise<T> {
    const startTime = Date.now();

    try {
      const result = await executor();
      const duration = Date.now() - startTime;

      this.logOperation(operation, key, duration, true);
      this.updateMetrics(operation, duration);

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logOperation(
        operation,
        key,
        duration,
        false,
        error instanceof Error ? error.message : String(error)
      );
      this.metrics.performance.errorRate++;
      throw error;
    }
  }

  private logOperation(
    operation: RedisOperationType,
    key: string | undefined,
    duration: number,
    success: boolean,
    error?: string
  ) {
    const log: RedisOperationLog = {
      operation,
      key,
      duration,
      success,
      error,
      timestamp: new Date(),
    };

    this.operationLogs.push(log);

    if (this.operationLogs.length > this.MAX_LOG_SIZE) {
      this.operationLogs = this.operationLogs.slice(-this.MAX_LOG_SIZE);
    }
  }

  private updateMetrics(operation: RedisOperationType, duration: number) {
    if (operation in this.metrics.operations) {
      this.metrics.operations[operation as keyof typeof this.metrics.operations]++;
    }

    this.metrics.performance.maxLatency = Math.max(this.metrics.performance.maxLatency, duration);

    const totalOps = Object.values(this.metrics.operations).reduce((sum, count) => sum + count, 0);
    this.metrics.performance.avgLatency =
      totalOps > 0
        ? (this.metrics.performance.avgLatency * (totalOps - 1) + duration) / totalOps
        : duration;
  }

  // Core Redis Operations
  async get(key: string): Promise<string | null> {
    return this.executeOperation('get', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.get<string>(key);
      }
      return this.mainClient.get(key);
    });
  }

  async set(
    key: string,
    value: string,
    ttl?: number,
    mode?: 'NX' | 'XX',
    ttlUnit: 'EX' | 'PX' = 'EX'
  ): Promise<string | null> {
    return this.executeOperation('set', key, async () => {
      if (this.upstashClient) {
        const options: any = {};
        if (mode === 'NX') options.nx = true;
        if (mode === 'XX') options.xx = true;
        if (ttl) {
          if (ttlUnit === 'EX') options.ex = ttl;
          else options.px = ttl;
        }
        return this.upstashClient.set(key, value, options);
      }

      if (mode || ttlUnit === 'PX') {
        const args: any[] = [key, value];
        if (ttlUnit === 'PX') {
          args.push('PX', ttl);
        } else if (ttl) {
          args.push('EX', ttl);
        }
        if (mode) {
          args.push(mode);
        }
        return (this.mainClient as any).set(...args);
      }

      if (ttl) {
        await this.mainClient.set(key, value, 'EX', ttl);
      } else {
        await this.mainClient.set(key, value);
      }
      return 'OK';
    });
  }

  async del(key: string): Promise<number> {
    return this.executeOperation('del', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.del(key);
      }
      return this.mainClient.del(key);
    });
  }

  async exists(key: string): Promise<boolean> {
    return this.executeOperation('exists', key, async () => {
      if (this.upstashClient) {
        const result = await this.upstashClient.exists(key);
        return result === 1;
      }
      const result = await this.mainClient.exists(key);
      return result === 1;
    });
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return this.executeOperation('expire', key, async () => {
      if (this.upstashClient) {
        const result = await this.upstashClient.expire(key, ttl);
        return result === 1;
      }
      const result = await this.mainClient.expire(key, ttl);
      return result === 1;
    });
  }

  async pexpire(key: string, ttlMs: number): Promise<boolean> {
    return this.executeOperation('pexpire', key, async () => {
      if (this.upstashClient) {
        const result = await this.upstashClient.pexpire(key, ttlMs);
        return result === 1;
      }
      const result = await this.mainClient.pexpire(key, ttlMs);
      return result === 1;
    });
  }

  async pttl(key: string): Promise<number> {
    return this.executeOperation('pttl', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.pttl(key);
      }
      return this.mainClient.pttl(key);
    });
  }

  async incrby(key: string, increment: number): Promise<number> {
    return this.executeOperation('incrby', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.incrby(key, increment);
      }
      return this.mainClient.incrby(key, increment);
    });
  }

  async decrby(key: string, decrement: number): Promise<number> {
    return this.executeOperation('decrby', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.decrby(key, decrement);
      }
      return this.mainClient.decrby(key, decrement);
    });
  }

  // Hash Operations
  async hset(key: string, field: string, value: string): Promise<void>;
  async hset(key: string, data: Record<string, string>): Promise<void>;
  async hset(
    key: string,
    fieldOrData: string | Record<string, string>,
    value?: string
  ): Promise<void> {
    await this.executeOperation('hset', key, async () => {
      if (this.upstashClient) {
        if (typeof fieldOrData === 'string' && value !== undefined) {
          await this.upstashClient.hset(key, { [fieldOrData]: value });
        } else if (typeof fieldOrData === 'object') {
          await this.upstashClient.hset(key, fieldOrData);
        }
        return;
      }
      if (typeof fieldOrData === 'string' && value !== undefined) {
        await this.mainClient.hset(key, fieldOrData, value);
      } else if (typeof fieldOrData === 'object') {
        await this.mainClient.hset(key, fieldOrData);
      } else {
        throw new Error('Invalid arguments for hset');
      }
    });
  }

  async hget(key: string, field: string): Promise<string | null> {
    return this.executeOperation('hget', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.hget<string>(key, field);
      }
      return this.mainClient.hget(key, field);
    });
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.executeOperation('hgetall', key, async () => {
      if (this.upstashClient) {
        const result = await this.upstashClient.hgetall<Record<string, string>>(key);
        return result || {};
      }
      return this.mainClient.hgetall(key);
    });
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.executeOperation('hdel', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.hdel(key, field);
      }
      return this.mainClient.hdel(key, field);
    });
  }

  async hincrby(key: string, field: string, increment: number): Promise<number> {
    return this.executeOperation('hincrby', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.hincrby(key, field, increment);
      }
      return this.mainClient.hincrby(key, field, increment);
    });
  }

  // List Operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.executeOperation('lpush', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.lpush(key, ...values);
      }
      return this.mainClient.lpush(key, ...values);
    });
  }

  async rpush(key: string, ...values: string[]): Promise<number> {
    return this.executeOperation('rpush', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.rpush(key, ...values);
      }
      return this.mainClient.rpush(key, ...values);
    });
  }

  async rpop(key: string): Promise<string | null> {
    return this.executeOperation('rpop', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.rpop<string>(key);
      }
      return this.mainClient.rpop(key);
    });
  }

  async lpop(key: string): Promise<string | null> {
    return this.executeOperation('lpop', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.lpop<string>(key);
      }
      return this.mainClient.lpop(key);
    });
  }

  async llen(key: string): Promise<number> {
    return this.executeOperation('llen', key, () => this.mainClient.llen(key));
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.executeOperation('lrange', key, () => this.mainClient.lrange(key, start, stop));
  }

  async lrem(key: string, value: string, count: number = 0): Promise<number> {
    return this.executeOperation('lrem', key, async () => {
      if (this.upstashClient) {
        return this.upstashClient.lrem(key, count, value);
      }
      return this.mainClient.lrem(key, count, value);
    });
  }

  // Multi-key Operations
  async mget(...keys: string[]): Promise<(string | null)[]> {
    return this.executeOperation('mget', undefined, async () => {
      if (this.upstashClient) {
        return this.upstashClient.mget<string[]>(...keys);
      }
      return this.mainClient.mget(...keys);
    });
  }

  async mset(data: Record<string, string>): Promise<void> {
    await this.executeOperation('mset', undefined, async () => {
      if (this.upstashClient) {
        await this.upstashClient.mset(data);
        return;
      }
      await this.mainClient.mset(data);
    });
  }

  async zremrangebyscore(key: string, min: number | string, max: number | string): Promise<number> {
    return this.executeOperation('zremrangebyscore', key, () => this.mainClient.zremrangebyscore(key, min, max));
  }

  async zcard(key: string): Promise<number> {
    return this.executeOperation('zcard', key, () => this.mainClient.zcard(key));
  }

  async zcount(key: string, min: number | string, max: number | string): Promise<number> {
    return this.executeOperation('zcount', key, () => this.mainClient.zcount(key, min, max));
  }

  async incr(key: string): Promise<number> {
    return this.executeOperation('incr', key, () => this.mainClient.incr(key));
  }

  // Sorted Set Operations (for queue implementation)
  async zadd(key: string, score: number, member: string): Promise<number> {
    return this.executeOperation('zadd', key, () => this.mainClient.zadd(key, score, member));
  }

  async zpopmax(key: string): Promise<string[]> {
    return this.executeOperation('zpopmax', key, () => this.mainClient.zpopmax(key));
  }

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.executeOperation('zrange', key, () => this.mainClient.zrange(key, start, stop));
  }

  async zrem(key: string, member: string): Promise<number> {
    return this.executeOperation('zrem', key, () => this.mainClient.zrem(key, member));
  }

  // Set operations
  async sadd(key: string, ...members: string[]): Promise<number> {
    return this.executeOperation('sadd', key, async () => {
      return await this.mainClient.sadd(key, ...members);
    });
  }

  async srem(key: string, ...members: string[]): Promise<number> {
    return this.executeOperation('srem', key, async () => {
      return await this.mainClient.srem(key, ...members);
    });
  }

  async smembers(key: string): Promise<string[]> {
    return this.executeOperation('smembers', key, async () => {
      return await this.mainClient.smembers(key);
    });
  }

  async sismember(key: string, member: string): Promise<boolean> {
    return this.executeOperation('sismember', key, async () => {
      if (this.upstashClient) {
        const result = await this.upstashClient.sismember(key, member);
        return result === 1;
      }
      return (await this.mainClient.sismember(key, member)) === 1;
    });
  }

  async sinter(...keys: string[]): Promise<string[]> {
    return this.executeOperation('sinter', undefined, async () => {
      if (this.upstashClient) {
        // @ts-ignore - Argument spread issue in some versions of @upstash/redis
        return this.upstashClient.sinter(...keys);
      }
      return this.mainClient.sinter(...keys);
    });
  }

  // List operations (additional)
  async ltrim(key: string, start: number, stop: number): Promise<void> {
    await this.executeOperation('ltrim', key, async () => {
      await this.mainClient.ltrim(key, start, stop);
    });
  }

  async lindex(key: string, index: number): Promise<string | null> {
    return this.executeOperation('lindex', key, async () => {
      return await this.mainClient.lindex(key, index);
    });
  }

  // Pub/Sub Operations
  async publish(channel: string, message: string | object): Promise<number> {
    return this.executeOperation('publish', channel, async () => {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      if (this.upstashClient) {
        return this.upstashClient.publish(channel, messageStr);
      }
      return this.mainClient.publish(channel, messageStr);
    });
  }

  async subscribe(channel: string, callback: (message: PubSubMessage) => void): Promise<void> {
    return this.executeOperation('subscribe', channel, async () => {
      if (this.subscribers.has(channel)) {
        this.logger.warn(`Already subscribed to channel: ${channel}`);
        return;
      }

      const config = this.redisConfig.getConnectionOptions();
      if (!config) {
        this.logger.warn('Redis is disabled - cannot subscribe to channel');
        return;
      }

      const subscriber =
        this.pubSubClient instanceof Redis.Cluster
          ? new Redis.Cluster(this.redisConfig.getClusterNodes(), {
              redisOptions: config,
            })
          : new Redis(config);

      await subscriber.subscribe(channel);

      subscriber.on('message', (ch: string, message: string) => {
        if (ch === channel) {
          callback({
            channel: ch,
            message,
            timestamp: new Date(),
          });
        }
      });

      this.subscribers.set(channel, subscriber);
      this.logger.log(`Subscribed to channel: ${channel}`);
    });
  }

  async psubscribe(pattern: string, callback: (message: PubSubMessage) => void): Promise<void> {
    return this.executeOperation('psubscribe', pattern, async () => {
      if (this.patternSubscribers.has(pattern)) {
        this.logger.warn(`Already psubscribed to pattern: ${pattern}`);
        return;
      }

      const config = this.redisConfig.getConnectionOptions();
      if (!config) {
        this.logger.warn('Redis is disabled - cannot psubscribe to pattern');
        return;
      }

      const subscriber =
        this.pubSubClient instanceof Redis.Cluster
          ? new Redis.Cluster(this.redisConfig.getClusterNodes(), {
              redisOptions: config,
            })
          : new Redis(config);

      await subscriber.psubscribe(pattern);

      subscriber.on('pmessage', (p: string, ch: string, message: string) => {
        if (p === pattern) {
          callback({
            channel: ch,
            pattern: p,
            message,
            timestamp: new Date(),
          });
        }
      });

      this.patternSubscribers.set(pattern, subscriber);
      this.logger.log(`Psubscribed to pattern: ${pattern}`);
    });
  }

  async unsubscribe(channel: string): Promise<void> {
    return this.executeOperation('unsubscribe', channel, async () => {
      const subscriber = this.subscribers.get(channel);
      if (subscriber) {
        await subscriber.unsubscribe(channel);
        await subscriber.quit();
        this.subscribers.delete(channel);
        this.logger.log(`Unsubscribed from channel: ${channel}`);
      }
    });
  }

  async punsubscribe(pattern: string): Promise<void> {
    return this.executeOperation('punsubscribe', pattern, async () => {
      const subscriber = this.patternSubscribers.get(pattern);
      if (subscriber) {
        await subscriber.punsubscribe(pattern);
        await subscriber.quit();
        this.patternSubscribers.delete(pattern);
        this.logger.log(`Punsubscribed from pattern: ${pattern}`);
      }
    });
  }

  // Extended Operations (from api/redis.service.ts)
  async getAll(pattern: string): Promise<string[]> {
    return this.executeOperation('keys', pattern, async () => {
      const keys = await this.mainClient.keys(pattern);
      if (keys.length === 0) return [];

      const values = await this.mainClient.mget(...keys);
      return values.filter((value) => value !== null) as string[];
    });
  }

  async setWorkflowState(workflowId: string, state: any): Promise<void> {
    const key = `workflow:${workflowId}:state`;
    await this.set(key, JSON.stringify(state));
  }

  async getWorkflowState<T = any>(workflowId: string): Promise<T | null> {
    const key = `workflow:${workflowId}:state`;
    const state = await this.get(key);
    return state ? JSON.parse(state) : null;
  }

  // Queue Operations (rewritten from queue.service.ts)
  async enqueue<T>(queueName: string, task: QueueTask<T>, priority: number = 1): Promise<void> {
    const taskData: QueueTask<T> = {
      ...task,
      createdAt: new Date(),
      retryCount: task.retryCount || 0,
      maxRetries: task.maxRetries || 3,
    };

    const taskStr = JSON.stringify(taskData);
    await this.zadd(queueName, priority, taskStr);
  }

  async dequeue<T>(queueName: string): Promise<QueueTask<T> | null> {
    const result = await this.zpopmax(queueName);
    if (result.length === 0) return null;

    const taskStr = result[0];
    return JSON.parse(taskStr) as QueueTask<T>;
  }

  async requeueWithBackoff<T>(
    queueName: string,
    task: QueueTask<T>,
    retryPenalty: number = 2
  ): Promise<void> {
    const newPriority = (task.priority || 1) * Math.pow(retryPenalty, task.retryCount || 0);
    const updatedTask: QueueTask<T> = {
      ...task,
      retryCount: (task.retryCount || 0) + 1,
    };

    await this.enqueue(queueName, updatedTask, newPriority);
  }

  // Vector Operations (for vector database integration)
  async vectorSet(key: string, vector: number[], metadata?: Record<string, any>): Promise<void> {
    const data = {
      vector,
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    };
    await this.set(key, JSON.stringify(data));
  }

  async vectorGet(
    key: string
  ): Promise<{ vector: number[]; metadata?: Record<string, any> } | null> {
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async vectorSearch(searchVector: number[], limit: number = 10): Promise<SearchResult[]> {
    const pattern = 'vector:*';
    const keys = await this.mainClient.keys(pattern);
    const results: SearchResult[] = [];

    for (const key of keys.slice(0, limit)) {
      const data = await this.vectorGet(key);
      if (data) {
        const similarity = this.calculateCosineSimilarity(searchVector, data.vector);
        results.push({
          id: key,
          score: similarity,
          vector: data.vector,
          metadata: data.metadata,
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private calculateCosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    const dotProduct = a.reduce((sum, val, i) => sum + val * b[i], 0);
    const magnitudeA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
    const magnitudeB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));

    if (magnitudeA === 0 || magnitudeB === 0) return 0;
    return dotProduct / (magnitudeA * magnitudeB);
  }

  // Caching Layer (high-level abstraction)
  async cache<T>(key: string, factory: () => Promise<T>, options: CacheOptions = {}): Promise<T> {
    const cacheKey = options.namespace ? `${options.namespace}:${key}` : key;

    const cached = await this.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const result = await factory();
    const serialized = JSON.stringify(result);

    if (options.ttl) {
      await this.set(cacheKey, serialized, options.ttl);
    } else {
      await this.set(cacheKey, serialized);
    }

    if (options.tags) {
      for (const tag of options.tags) {
        await this.lpush(`cache:tags:${tag}`, cacheKey);
      }
    }

    return result;
  }

  async invalidateByTag(tag: string): Promise<void> {
    const tagKey = `cache:tags:${tag}`;
    const keys = await this.lrange(tagKey, 0, -1);

    if (keys.length > 0) {
      await Promise.all(keys.map((key) => this.del(key)));
      await this.del(tagKey);
    }
  }

  // Utility Methods
  async ping(): Promise<string> {
    return this.executeOperation('ping', undefined, async () => {
      if (this.upstashClient) {
        return this.upstashClient.ping();
      }
      return this.mainClient.ping();
    });
  }

  async flushdb(): Promise<void> {
    await this.executeOperation('flushdb', undefined, async () => {
      if (this.upstashClient) {
        await this.upstashClient.flushdb();
      } else {
        await this.mainClient.flushdb();
      }
      this.logger.log('Redis database flushed');
    });
  }

  async keys(pattern: string): Promise<string[]> {
    return this.executeOperation('keys', pattern, async () => {
      if (this.upstashClient) {
        return this.upstashClient.keys(pattern);
      }
      return this.mainClient.keys(pattern);
    });
  }

  async scan(cursor: string, match?: string, count?: number): Promise<[string, string[]]> {
    return this.executeOperation('scan', undefined, async () => {
      if (this.upstashClient) {
        const result = await this.upstashClient.scan(Number(cursor), { match, count });
        return [String(result[0]), result[1]];
      }
      return this.mainClient.scan(cursor, 'MATCH', match || '*', 'COUNT', count || 10);
    });
  }

  async eval(script: string, keys: string[], args: any[]): Promise<any> {
    return this.executeOperation('eval', undefined, async () => {
      if (this.upstashClient) {
        return this.upstashClient.eval(script, keys, args);
      }
      return this.mainClient.eval(script, keys.length, ...keys, ...args);
    });
  }

  async pipeline(): Promise<any> {
    return this.executeOperation('pipeline', undefined, async () => {
      if (this.upstashClient) {
        return this.upstashClient.pipeline();
      }
      return this.mainClient.pipeline();
    });
  }

  /**
   * Get the underlying Redis client.
   * WARNING: Bypasses the UnifiedRedisService abstraction. Use only when absolutely necessary (e.g. BullMQ).
   */
  getClient(): Redis | Cluster {
    return this.mainClient;
  }

  // Health and Monitoring
  async getHealth(): Promise<RedisHealth> {
    try {
      const startTime = Date.now();
      await this.ping();
      const latency = Date.now() - startTime;

      const info = await this.mainClient.info();
      const lines = info.split('\r\n');

      let memoryUsage = 0;
      let connectedClients = 0;
      let uptime = 0;

      for (const line of lines) {
        if (line.startsWith('used_memory:')) {
          memoryUsage = parseInt(line.split(':')[1]);
        } else if (line.startsWith('connected_clients:')) {
          connectedClients = parseInt(line.split(':')[1]);
        } else if (line.startsWith('uptime_in_seconds:')) {
          uptime = parseInt(line.split(':')[1]);
        }
      }

      return {
        status: 'healthy',
        latency,
        memoryUsage,
        connectedClients,
        uptime,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: -1,
        memoryUsage: 0,
        connectedClients: 0,
        uptime: 0,
        lastError: error instanceof Error ? error.message : String(error),
      };
    }
  }

  getMetrics(): RedisMetrics {
    return { ...this.metrics };
  }

  getOperationLogs(limit: number = 100): RedisOperationLog[] {
    return this.operationLogs.slice(-limit);
  }

  private async closeAllConnections(): Promise<void> {
    try {
      for (const subscriber of this.subscribers.values()) {
        await subscriber.quit();
      }
      this.subscribers.clear();

      for (const patternSubscriber of this.patternSubscribers.values()) {
        await patternSubscriber.quit();
      }
      this.patternSubscribers.clear();

      await this.mainClient.quit();
      await this.pubSubClient.quit();

      this.logger.log('All Redis connections closed');
    } catch (error) {
      this.logger.error('Error closing Redis connections', error);
    }
  }
}
