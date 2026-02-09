import { DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const isProduction = process.env.NODE_ENV === 'production';

const config: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_DATABASE || 'fuse_ai',
  entities: ['src/models/**/*.ts'],
  migrations: ['src/migrations/**/*.ts'],
  subscribers: ['src/subscribers/**/*.ts'],
  synchronize: !isProduction, // Disable in production
  logging: ['error', 'warn', 'schema', 'migration'],
  logger: 'advanced-console',
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  // Enhanced connection pool settings
  extra: {
    max: parseInt(process.env.DB_POOL_MAX || '20'),
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000')
  },
  cache: {
    type: 'redis',
    options: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      db: parseInt(process.env.REDIS_DB || '0'),
      ttl: parseInt(process.env.CACHE_TTL || '3600'),
      maxRetriesPerRequest: 3
    },
    duration: 60000 // 1 minute cache duration
  },
  // Add monitoring
  maxQueryExecutionTime: 1000, // Log slow queries (>1s)
};

export default config;
