import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import Redis, { Cluster } from 'ioredis';
import { RedisConfig } from './RedisConfig';
import { 
  QueueTask, 
  SearchResult, 
  CacheOptions, 
  PubSubMessage, 
  RedisHealth, 
  RedisMetrics,
  RedisOperationType,
  RedisOperationLog 
} from './types';

@Injectable()
export class UnifiedRedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(UnifiedRedisService.name);
  
  private mainClient!: Redis | Cluster;
  private pubSubClient!: Redis | Cluster;
  private subscribers: Map<string, Redis | Cluster> = new Map();
  private patternSubscribers: Map<string, Redis | Cluster> = new Map();
  
  private metrics: RedisMetrics = {
    operations: {
      get: 0, set: 0, del: 0, hget: 0, hset: 0,
      lpush: 0, rpop: 0, publish: 0
    },
    performance: {
      avgLatency: 0, maxLatency: 0, errorRate: 0
    },
    memory: {
      used: 0, peak: 0, fragmentation: 0
    },
    connections: {
      active: 0, total: 0, rejected: 0
    }
  };

  private operationLogs: RedisOperationLog[] = [];
  private readonly MAX_LOG_SIZE = 1000;

  constructor(private readonly redisConfig: RedisConfig) {}

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
    
    try {
      if (this.redisConfig.isClusterMode()) {
        const nodes = this.redisConfig.getClusterNodes();
        this.mainClient = new Redis.Cluster(nodes, {
          redisOptions: config,
          ...this.redisConfig.getConfiguration().cluster
        });
        this.pubSubClient = new Redis.Cluster(nodes, {
          redisOptions: config,
          ...this.redisConfig.getConfiguration().cluster
        });
      } else {
        this.mainClient = new Redis(config);
        this.pubSubClient = new Redis(config);
      }

      this.setupEventHandlers();
      
      await this.mainClient.ping();
      await this.pubSubClient.ping();
      
      this.logger.log('Redis connections established successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Redis connections', error);
      throw error;
    }
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
      this.logOperation(operation, key, duration, false, error instanceof Error ? error.message : String(error));
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
      timestamp: new Date()
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
    this.metrics.performance.avgLatency = totalOps > 0 
      ? (this.metrics.performance.avgLatency * (totalOps - 1) + duration) / totalOps
      : duration;
  }

  // Core Redis Operations
  async get(key: string): Promise<string | null> {
    return this.executeOperation('get', key, () => this.mainClient.get(key));
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    await this.executeOperation('set', key, async () => {
      if (ttl) {
        await this.mainClient.set(key, value, 'EX', ttl);
      } else {
        await this.mainClient.set(key, value);
      }
    });
  }

  async del(key: string): Promise<number> {
    return this.executeOperation('del', key, () => this.mainClient.del(key));
  }

  async exists(key: string): Promise<boolean> {
    return this.executeOperation('exists', key, async () => {
      const result = await this.mainClient.exists(key);
      return result === 1;
    });
  }

  async expire(key: string, ttl: number): Promise<boolean> {
    return this.executeOperation('expire', key, async () => {
      const result = await this.mainClient.expire(key, ttl);
      return result === 1;
    });
  }

  // Hash Operations
  async hset(key: string, field: string, value: string): Promise<void>;
  async hset(key: string, data: Record<string, string>): Promise<void>;
  async hset(key: string, fieldOrData: string | Record<string, string>, value?: string): Promise<void> {
    await this.executeOperation('hset', key, async () => {
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
    return this.executeOperation('hget', key, () => this.mainClient.hget(key, field));
  }

  async hgetall(key: string): Promise<Record<string, string>> {
    return this.executeOperation('hgetall', key, () => this.mainClient.hgetall(key));
  }

  async hdel(key: string, field: string): Promise<number> {
    return this.executeOperation('hdel', key, () => this.mainClient.hdel(key, field));
  }

  // List Operations
  async lpush(key: string, ...values: string[]): Promise<number> {
    return this.executeOperation('lpush', key, () => this.mainClient.lpush(key, ...values));
  }

  async rpop(key: string): Promise<string | null> {
    return this.executeOperation('rpop', key, () => this.mainClient.rpop(key));
  }

  async llen(key: string): Promise<number> {
    return this.executeOperation('llen', key, () => this.mainClient.llen(key));
  }

  async lrange(key: string, start: number, stop: number): Promise<string[]> {
    return this.executeOperation('lrange', key, () => this.mainClient.lrange(key, start, stop));
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
      return (await this.mainClient.sismember(key, member)) === 1;
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
    return this.executeOperation('publish', channel, () => {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      return this.mainClient.publish(channel, messageStr);
    });
  }

  async subscribe(channel: string, callback: (message: PubSubMessage) => void): Promise<void> {
    return this.executeOperation('subscribe', channel, async () => {
      if (this.subscribers.has(channel)) {
        this.logger.warn(`Already subscribed to channel: ${channel}`);
        return;
      }

      const subscriber = this.pubSubClient instanceof Redis.Cluster 
        ? new Redis.Cluster(this.redisConfig.getClusterNodes(), {
            redisOptions: this.redisConfig.getConnectionOptions()
          })
        : new Redis(this.redisConfig.getConnectionOptions());

      await subscriber.subscribe(channel);
      
      subscriber.on('message', (ch: string, message: string) => {
        if (ch === channel) {
          callback({
            channel: ch,
            message,
            timestamp: new Date()
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

      const subscriber = this.pubSubClient instanceof Redis.Cluster 
        ? new Redis.Cluster(this.redisConfig.getClusterNodes(), {
            redisOptions: this.redisConfig.getConnectionOptions()
          })
        : new Redis(this.redisConfig.getConnectionOptions());

      await subscriber.psubscribe(pattern);
      
      subscriber.on('pmessage', (p: string, ch: string, message: string) => {
        if (p === pattern) {
          callback({
            channel: ch,
            pattern: p,
            message,
            timestamp: new Date()
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
    return this.set(key, JSON.stringify(state));
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
      retryCount: (task.retryCount || 0) + 1
    };
    
    await this.enqueue(queueName, updatedTask, newPriority);
  }

  // Vector Operations (for vector database integration)
  async vectorSet(key: string, vector: number[], metadata?: Record<string, any>): Promise<void> {
    const data = {
      vector,
      metadata: metadata || {},
      timestamp: new Date().toISOString()
    };
    await this.set(key, JSON.stringify(data));
  }

  async vectorGet(key: string): Promise<{ vector: number[]; metadata?: Record<string, any> } | null> {
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
          metadata: data.metadata
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
  async cache<T>(
    key: string, 
    factory: () => Promise<T>, 
    options: CacheOptions = {}
  ): Promise<T> {
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
      await Promise.all(keys.map(key => this.del(key)));
      await this.del(tagKey);
    }
  }

  // Utility Methods
  async ping(): Promise<string> {
    return this.executeOperation('ping', undefined, () => this.mainClient.ping());
  }

  async flushdb(): Promise<void> {
    await this.executeOperation('flushdb', undefined, async () => {
      await this.mainClient.flushdb();
      this.logger.log('Redis database flushed');
    });
  }

  async keys(pattern: string): Promise<string[]> {
    return this.executeOperation('keys', pattern, () => this.mainClient.keys(pattern));
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
        uptime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        latency: -1,
        memoryUsage: 0,
        connectedClients: 0,
        uptime: 0,
        lastError: error instanceof Error ? error.message : String(error)
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