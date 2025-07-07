import { createClient, RedisClientType } from 'redis';
import { Pool, Client, PoolClient } from 'pg';
import { Logger } from 'winston';
import { setupLogging } from './logging_config.js';
import { EventEmitter } from 'events';

const logger: Logger = setupLogging('database');

interface ShardConfig {
  uri: string;
  poolSize?: number;
  maxOverflow?: number;
  poolTimeout?: number;
  poolRecycle?: number;
}

interface ShardInfo {
  uri: string;
  config: Partial<ShardConfig>;
  pool: Pool;
}

interface DatabaseMetrics {
  connections: Record<string, number>;
  queries: Record<string, number>;
  errors: Record<string, number>;
  latency: Record<string, number[]>;
}

interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  metrics?: {
    connections: number;
    queries: number;
    errors: number;
    avgLatency: number;
  };
  error?: string;
}

export class DatabaseConfig extends EventEmitter {
  private shardMap: Record<string, ShardInfo> = {};
  private redisClient: RedisClientType | null = null;
  private metrics: DatabaseMetrics = {
    connections: {},
    queries: {},
    errors: {},
    latency: {}
  };

  private readonly defaultPoolSize: number;
  private readonly defaultMaxOverflow: number;
  private readonly defaultPoolTimeout: number;
  private readonly defaultPoolRecycle: number;

  constructor() {
    super();
    this.defaultPoolSize = Number(process.env.DB_POOL_SIZE || 20);
    this.defaultMaxOverflow = Number(process.env.DB_MAX_OVERFLOW || 10);
    this.defaultPoolTimeout = Number(process.env.DB_POOL_TIMEOUT || 30);
    this.defaultPoolRecycle = Number(process.env.DB_POOL_RECYCLE || 3600);
    this.initializeRedis();
  }

  private async initializeRedis(): Promise<void> {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({
        url: redisUrl,
        socket: {
          timeout: Number(process.env.REDIS_SOCKET_TIMEOUT || 5000),
          reconnectStrategy: (retries: number) => {
            if (retries > 10) return new Error('Max reconnection attempts reached');
            return Math.min(retries * 100, 3000);
          }
        }
      });

      await this.redisClient.connect();
      logger.info('Redis connection initialized successfully');
    } catch (err) {
      logger.error('Failed to initialize Redis:', err);
      this.redisClient = null;
    }
  }

  public async initShards(shardConfigs: Record<string, ShardConfig>): Promise<void> {
    for (const [shardName, config] of Object.entries(shardConfigs)) {
      await this.addShard(shardName, config);
    }
  }

  public async addShard(shardName: string, config: ShardConfig): Promise<void> {
    try {
      const pool = new Pool({
        connectionString: config.uri,
        max: config.poolSize || this.defaultPoolSize,
        idleTimeoutMillis: (config.poolTimeout || this.defaultPoolTimeout) * 1000,
        connectionTimeoutMillis: 5000
      });

      // Initialize metrics for this shard
      this.metrics.connections[shardName] = 0;
      this.metrics.queries[shardName] = 0;
      this.metrics.errors[shardName] = 0;
      this.metrics.latency[shardName] = [];

      // Set up event listeners
      pool.on('connect', () => {
        this.metrics.connections[shardName]++;
        this.redisClient?.hIncrBy(`db:metrics:${shardName}`, 'connections', 1);
        logger.debug(`Connection created on shard ${shardName}`);
      });

      pool.on('remove', () => {
        this.metrics.connections[shardName]--;
        this.redisClient?.hIncrBy(`db:metrics:${shardName}`, 'connections', -1);
        logger.debug(`Connection removed from shard ${shardName}`);
      });

      pool.on('error', (err: Error) => {
        this.metrics.errors[shardName]++;
        this.redisClient?.hIncrBy(`db:metrics:${shardName}`, 'errors', 1);
        logger.error(`Database error on shard ${shardName}:`, err);
      });

      this.shardMap[shardName] = {
        uri: config.uri,
        config,
        pool
      };

      logger.info(`Successfully added shard: ${shardName}`);
    } catch (err) {
      this.metrics.errors[shardName] = (this.metrics.errors[shardName] || 0) + 1;
      this.redisClient?.hIncrBy(`db:metrics:${shardName}`, 'errors', 1);
      logger.error(`Failed to add shard ${shardName}:`, err);
      throw err;
    }
  }

  public async getClient(shardName?: string): Promise<PoolClient> {
    const shard = this.getShardInfo(shardName);
    const startTime = Date.now();

    try {
      const client = await shard.pool.connect();
      const duration = (Date.now() - startTime) / 1000;
      this.metrics.latency[shardName || 'default'].push(duration);
      this.metrics.queries[shardName || 'default']++;

      if (this.redisClient) {
        await Promise.all([
          this.redisClient.hIncrBy(`db:metrics:${shardName}`, 'queries', 1),
          this.redisClient.lPush(`db:latency:${shardName}`, duration.toString()),
          this.redisClient.lTrim(`db:latency:${shardName}`, 0, 999)
        ]);
      }

      return client;
    } catch (err) {
      this.metrics.errors[shardName || 'default']++;
      if (this.redisClient) {
        await this.redisClient.hIncrBy(`db:metrics:${shardName}`, 'errors', 1);
      }
      throw err;
    }
  }

  public async getHealthStatus(): Promise<Record<string, HealthStatus>> {
    const status: Record<string, HealthStatus> = {};

    for (const [shardName, shard] of Object.entries(this.shardMap)) {
      try {
        const client = await shard.pool.connect();
        await client.query('SELECT 1');
        client.release();

        const latencyArray = this.metrics.latency[shardName] || [0];
        const avgLatency = latencyArray.reduce((a, b) => a + b, 0) / latencyArray.length;

        status[shardName] = {
          status: 'healthy',
          metrics: {
            connections: this.metrics.connections[shardName] || 0,
            queries: this.metrics.queries[shardName] || 0,
            errors: this.metrics.errors[shardName] || 0,
            avgLatency
          }
        };
      } catch (err) {
        status[shardName] = {
          status: 'unhealthy',
          error: err instanceof Error ? err.message : String(err)
        };
      }
    }

    return status;
  }

  public getMetrics(): DatabaseMetrics {
    return this.metrics;
  }

  private getShardInfo(shardName?: string): ShardInfo {
    if (!shardName) {
      shardName = Object.keys(this.shardMap)[0];
    }

    const shard = this.shardMap[shardName];
    if (!shard) {
      throw new Error(`Unknown shard: ${shardName}`);
    }

    return shard;
  }

  public async dispose(): Promise<void> {
    await Promise.all([
      ...Object.values(this.shardMap).map(shard => shard.pool.end()),
      this.redisClient?.quit()
    ]);
  }
}

// Create global database configuration instance
export const dbConfig = new DatabaseConfig();

export async function initDb(): Promise<void> {
  // Load shard configurations from environment or config file
  const shardConfigs: Record<string, ShardConfig> = {
    default: {
      uri: process.env.DATABASE_URL || 'postgres://localhost:5432/dashboard',
      poolSize: 20,
      maxOverflow: 10
    },
    analytics: {
      uri: process.env.ANALYTICS_DATABASE_URL || 'postgres://localhost:5432/analytics',
      poolSize: 10,
      maxOverflow: 5
    }
  };

  await dbConfig.initShards(shardConfigs);
  logger.info('Database configuration initialized successfully');
}

export function getDb(): DatabaseConfig {
  return dbConfig;
}
