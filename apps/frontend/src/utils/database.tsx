export {}
exports.dbConfig = exports.DatabaseConfig = void 0;
exports.initDb = initDb;
exports.getDb = getDb;
import { createPool, Pool, PoolConfig } from 'mysql2/promise';
import { Redis } from 'ioredis';
import { Logger } from '@nestjs/common';
import { EventEmitter } from 'events';

const logger = new Logger('DatabaseConfig');

interface DatabaseMetrics {
  queries: number;
  errors: number;
  avgLatencyMs: number;
  connections: {
    active: number;
    idle: number;
    max: number;
  };
  cache: {
    hits: number;
    misses: number;
    size: number;
  };
}

export class DatabaseConfig extends EventEmitter {
  private shardMap: Record<string, Pool> = {};
  private redis: Redis | null = null;
  private metrics: DatabaseMetrics = {
    queries: 0,
    errors: 0,
    avgLatencyMs: 0,
    connections: {
      active: 0,
      idle: 0,
      max: 0
    },
    cache: {
      hits: 0,
      misses: 0,
      size: 0
    }
  };

  constructor() {
    super();
  }

  async initializeRedis(): Promise<void> {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        password: process.env.REDIS_PASSWORD
      });
    } catch (error) {
      logger.error('Failed to initialize Redis:', error);
      throw error;
    }
  }

  async initShards(shardConfigs: Record<string, any>): Promise<void> {
    for (const [name, config] of Object.entries(shardConfigs)) {
      await this.addShard(name, config);
    }
  }

  async addShard(shardName: string, config: any): Promise<void> {
    try {
      const pool = await Pool.createPool(config);
      
      pool.on('connection', () => {
        this.metrics.connections.active++;
        this.updateRedisMetrics(shardName, 'connections', 1).catch(logger.error);
        logger.debug(`Connection acquired on shard ${shardName}`);
      });

      pool.on('release', () => {
        this.metrics.connections.active--;
        this.updateRedisMetrics(shardName, 'connections', -1).catch(logger.error);
        logger.debug(`Connection released on shard ${shardName}`);
      });

      this.shardMap[shardName] = pool;
      logger.info(`Added shard ${shardName}`);
    } catch (error) {
      logger.error(`Failed to add shard ${shardName}:`, error);
      throw error;
    }
  }

  async updateRedisMetrics(shard: string, metric: string, value: number): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.hincrby(`db:metrics:${shard}`, metric, value);
      } catch (error) {
        logger.error('Failed to update Redis metrics:', error);
      }
    }
  }

  async getConnection(shard: string): Promise<Connection> {
    const pool = this.shardMap[shard];
    if (!pool) {
      throw new Error(`Shard ${shard} not found`);
    }

    try {
      const startTime = Date.now();
      const connection = await pool.getConnection();
      const duration = Date.now() - startTime;

      // Update metrics
      this.metrics.avgLatencyMs = 
        (this.metrics.avgLatencyMs * this.metrics.queries + duration) / 
        (this.metrics.queries + 1);
      this.metrics.queries++;

      await this.updateRedisMetrics(shard, 'latency', duration);
      await this.updateRedisMetrics(shard, 'queries', 1);

      return connection;
    } catch (error) {
      this.metrics.errors++;
      await this.updateRedisMetrics(shard, 'errors', 1);
      throw error;
    }
  }

  getMetrics(): DatabaseMetrics {
    return { ...this.metrics };
  }

  async close(): Promise<void> {
    await Promise.all(Object.entries(this.shardMap).map(async ([shard, pool]) => {
      try {
        await pool.end();
        logger.info(`Closed connection pool for shard ${shard}`);
      } catch (error) {
        logger.error(`Error closing pool for shard ${shard}:`, error);
      }
    }));

    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }
}

exports.DatabaseConfig = DatabaseConfig;
exports.dbConfig = new DatabaseConfig();

async function initDb(): any {
  const defaultShards = {
    main: {
      uri: process.env.DATABASE_URL || 'mysql://user:password@localhost:3306/main'
    }
  };
  await exports.dbConfig.initShards(defaultShards);
}

function getDb(): any {
  return exports.dbConfig;
}

export {};
//# sourceMappingURL=database.js.map