import { z } from 'zod';
import { DataSourceOptions } from 'typeorm';

// Zod schema for runtime validation
export const DatabaseConfigSchema = z.object({
  type: z.enum(['postgres']),
  host: z.string(),
  port: z.number(),
  username: z.string(),
  password: z.string(),
  database: z.string(),
  schema: z.string().default('public'),
  ssl: z.boolean().default(false),
  poolSize: z.number().min(1).max(100).default(20),
  maxRetries: z.number().min(0).max(10).default(3),
  retryDelay: z.number().min(100).max(5000).default(1000),
  timeout: z.number().min(1000).max(30000).default(5000),
  logging: z.boolean().default(false),
  metricsEnabled: z.boolean().default(true),
  metricsInterval: z.number().min(1000).max(60000).default(10000),
  cache: z.object({
    type: z.enum(['redis']),
    host: z.string(),
    port: z.number(),
    password: z.string().optional(),
    ttl: z.number().min(0).default(300),
  }).optional(),
  vector: z.object({
    indexType: z.enum(['ivfflat', 'hnsw']),
    dimensions: z.number().min(1),
    metric: z.enum(['euclidean', 'cosine', 'inner_product']),
  }).optional(),
});

export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

// Convert to TypeORM config
export function toTypeOrmConfig(config: DatabaseConfig): DataSourceOptions {
  return {
    type: config.type,
    host: config.host,
    port: config.port,
    username: config.username,
    password: config.password,
    database: config.database,
    schema: config.schema,
    ssl: config.ssl,
    logging: config.logging,
    poolSize: config.poolSize,
    extra: {
      max: config.poolSize,
      connectionTimeoutMillis: config.timeout,
    },
    cache: config.cache ? {
      type: config.cache.type,
      options: {
        host: config.cache.host,
        port: config.cache.port,
        password: config.cache.password,
        ttl: config.cache.ttl * 1000,
      },
    } : undefined,
  };
}

// Default configuration
export const DEFAULT_CONFIG: DatabaseConfig = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'fuse',
  schema: process.env.DB_SCHEMA || 'public',
  ssl: process.env.DB_SSL === 'true',
  poolSize: parseInt(process.env.DB_POOL_SIZE || '20', 10),
  maxRetries: parseInt(process.env.DB_MAX_RETRIES || '3', 10),
  retryDelay: parseInt(process.env.DB_RETRY_DELAY || '1000', 10),
  timeout: parseInt(process.env.DB_TIMEOUT || '5000', 10),
  logging: process.env.DB_LOGGING === 'true',
  metricsEnabled: process.env.DB_METRICS_ENABLED !== 'false',
  metricsInterval: parseInt(process.env.DB_METRICS_INTERVAL || '10000', 10),
  cache: process.env.REDIS_HOST ? {
    type: 'redis',
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
    ttl: parseInt(process.env.REDIS_TTL || '300', 10),
  } : undefined,
  vector: {
    indexType: (process.env.VECTOR_INDEX_TYPE || 'hnsw') as 'ivfflat' | 'hnsw',
    dimensions: parseInt(process.env.VECTOR_DIMENSIONS || '1536', 10),
    metric: (process.env.VECTOR_METRIC || 'cosine') as 'euclidean' | 'cosine' | 'inner_product',
  },
};