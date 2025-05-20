import { Redis } from 'ioredis';
import { Logger } from '@the-new-fuse/utils';
import { 
  MetricsCollectorOptions, 
  MetricsSnapshot, 
  DatabaseMetrics, 
  RedisMetrics,
  ShardMetrics,
  MetricsHistoryEntry
} from '@the-new-fuse/types';

const logger = new Logger('MetricsCollector');

interface MetricTags {
  [key: string]: string;
}

interface GaugeMetric {
  name: string;
  description: string;
  value: number;
  timestamp: number;
}

interface CounterMetric {
  name: string;
  value: number;
  tags: MetricTags;
  timestamp: number;
}

export class MetricsCollector {
  private redis: Redis;
  private readonly options: Required<MetricsCollectorOptions>;
  private metricsHistory: MetricsHistoryEntry[] = [];
  private collectionInterval: NodeJS.Timeout | null = null;
  private gauges: Map<string, GaugeMetric> = new Map();
  private counters: Map<string, CounterMetric> = new Map();

  constructor(redis: Redis, options: MetricsCollectorOptions = {}) {
    this.redis = redis;
    this.options = {
      metricsPrefix: options.metricsPrefix ?? 'metrics:',
      retentionPeriod: options.retentionPeriod ?? 86400,
      aggregationInterval: options.aggregationInterval ?? 60000,
      maxDataPoints: options.maxDataPoints ?? 1000
    };
  }

  async startCollection(): Promise<void> {
    if (this.collectionInterval) {
      throw new Error('Metrics collection already started');
    }

    try {
      await this.collectMetrics();
      this.collectionInterval = setInterval(() => {
        this.collectMetrics().catch(error => {
          logger.error('Error collecting metrics:', error);
        });
      }, this.options.aggregationInterval);
    } catch (error) {
      logger.error('Failed to start metrics collection:', error);
      throw error;
    }
  }

  async stopCollection(): Promise<void> {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }
  }

  private async collectMetrics(): Promise<void> {
    try {
      const snapshot = await this.getMetricsSnapshot();
      this.metricsHistory.push({
        timestamp: Date.now(),
        metrics: snapshot.database['main'] // Store main shard metrics for history
      });

      // Trim history if needed
      while (this.metricsHistory.length > this.options.maxDataPoints) {
        this.metricsHistory.shift();
      }

      // Store in Redis
      await this.storeMetricsInRedis(snapshot);

    } catch (error) {
      logger.error('Error collecting metrics:', error);
      throw error;
    }
  }

  private async getMetricsSnapshot(): Promise<MetricsSnapshot> {
    const [dbMetrics, redisMetrics] = await Promise.all([
      this.collectDatabaseMetrics(),
      this.collectRedisMetrics()
    ]);

    return {
      database: dbMetrics,
      redis: redisMetrics,
      timestamp: Date.now()
    };
  }

  private async collectDatabaseMetrics(): Promise<ShardMetrics> {
    // Implementation would collect metrics from all database shards
    return {};
  }

  private async collectRedisMetrics(): Promise<RedisMetrics | null> {
    try {
      const info = await this.redis.info();
      const metrics = this.parseRedisInfo(info);
      return metrics;
    } catch (error) {
      logger.error('Error collecting Redis metrics:', error);
      return null;
    }
  }

  private parseRedisInfo(info: string): RedisMetrics {
    const metrics: RedisMetrics = {
      connectedClients: 0,
      usedMemoryBytes: 0,
      totalCommandsProcessed: 0,
      keyspaceHits: 0,
      keyspaceMisses: 0,
      pubsubChannels: 0,
      pubsubPatterns: 0,
      totalConnectionsReceived: 0,
      rejectedConnections: 0,
      expiredKeys: 0,
      evictedKeys: 0,
      lastSaveTime: 0
    };

    const lines = info.split('\n');
    for (const line of lines) {
      if (line.includes('connected_clients:')) {
        metrics.connectedClients = parseInt(line.split(':')[1]);
      }
      if (line.includes('used_memory:')) {
        metrics.usedMemoryBytes = parseInt(line.split(':')[1]);
      }
      // Parse other metrics...
    }

    return metrics;
  }

  private async storeMetricsInRedis(snapshot: MetricsSnapshot): Promise<void> {
    const key = `${this.options.metricsPrefix}${snapshot.timestamp}`;
    await this.redis.setex(
      key,
      this.options.retentionPeriod,
      JSON.stringify(snapshot)
    );
  }

  async getMetricsHistory(): Promise<MetricsHistoryEntry[]> {
    return this.metricsHistory;
  }

  async getLatestMetrics(): Promise<MetricsSnapshot | null> {
    try {
      return await this.getMetricsSnapshot();
    } catch (error) {
      logger.error('Error getting latest metrics:', error);
      return null;
    }
  }

  async recordResponseTime(timeMs: number, tags: MetricTags): Promise<void> {
    const key = `${this.options.metricsPrefix}response_time`;
    try {
      await Promise.all([
        this.redis.lpush(`${key}:values`, timeMs),
        this.redis.hmset(`${key}:tags:${Date.now()}`, tags),
        this.redis.expire(`${key}:values`, this.options.retentionPeriod),
        this.redis.expire(`${key}:tags:${Date.now()}`, this.options.retentionPeriod)
      ]);
    } catch (error) {
      logger.error('Failed to record response time:', error);
    }
  }

  async recordRequestSize(bytes: number, tags: MetricTags): Promise<void> {
    const key = `${this.options.metricsPrefix}request_size`;
    try {
      await Promise.all([
        this.redis.lpush(`${key}:values`, bytes),
        this.redis.hmset(`${key}:tags:${Date.now()}`, tags),
        this.redis.expire(`${key}:values`, this.options.retentionPeriod),
        this.redis.expire(`${key}:tags:${Date.now()}`, this.options.retentionPeriod)
      ]);
    } catch (error) {
      logger.error('Failed to record request size:', error);
    }
  }

  async recordResponseSize(bytes: number, tags: MetricTags): Promise<void> {
    const key = `${this.options.metricsPrefix}response_size`;
    try {
      await Promise.all([
        this.redis.lpush(`${key}:values`, bytes),
        this.redis.hmset(`${key}:tags:${Date.now()}`, tags),
        this.redis.expire(`${key}:values`, this.options.retentionPeriod),
        this.redis.expire(`${key}:tags:${Date.now()}`, this.options.retentionPeriod)
      ]);
    } catch (error) {
      logger.error('Failed to record response size:', error);
    }
  }

  createGauge(name: string, description: string): void {
    this.gauges.set(name, {
      name,
      description,
      value: 0,
      timestamp: Date.now()
    });
  }

  setGauge(name: string, value: number): void {
    const gauge = this.gauges.get(name);
    if (!gauge) {
      logger.warn(`Attempted to set unknown gauge: ${name}`);
      return;
    }
    gauge.value = value;
    gauge.timestamp = Date.now();
    
    // Store in Redis
    this.storeGaugeValue(name, value).catch(error => {
      logger.error(`Failed to store gauge value: ${error}`);
    });
  }

  incrementCounter(name: string, tags: MetricTags): void {
    const counter = this.counters.get(name) ?? {
      name,
      value: 0,
      tags,
      timestamp: Date.now()
    };
    
    counter.value++;
    counter.timestamp = Date.now();
    this.counters.set(name, counter);
    
    // Store in Redis
    this.storeCounterValue(name, counter.value, tags).catch(error => {
      logger.error(`Failed to store counter value: ${error}`);
    });
  }

  recordValue(metric: string, value: number, tags: MetricTags): void {
    const key = `${this.options.metricsPrefix}${metric}`;
    const timestamp = Date.now();

    // Store both the value and its metadata
    Promise.all([
      this.redis.zadd(key, timestamp, value),
      this.redis.hmset(`${key}:tags:${timestamp}`, tags),
      this.redis.expire(key, this.options.retentionPeriod),
      this.redis.expire(`${key}:tags:${timestamp}`, this.options.retentionPeriod)
    ]).catch(error => {
      logger.error(`Failed to record metric value: ${error}`);
    });
  }

  private async storeGaugeValue(name: string, value: number): Promise<void> {
    const key = `${this.options.metricsPrefix}gauge:${name}`;
    await this.redis.zadd(key, Date.now(), value);
    await this.redis.expire(key, this.options.retentionPeriod);
  }

  private async storeCounterValue(name: string, value: number, tags: MetricTags): Promise<void> {
    const key = `${this.options.metricsPrefix}counter:${name}`;
    const timestamp = Date.now();
    await Promise.all([
      this.redis.zadd(key, timestamp, value),
      this.redis.hmset(`${key}:tags:${timestamp}`, tags),
      this.redis.expire(key, this.options.retentionPeriod),
      this.redis.expire(`${key}:tags:${timestamp}`, this.options.retentionPeriod)
    ]);
  }
}
