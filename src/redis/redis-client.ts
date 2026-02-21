/**
 * Redis Client Factory
 *
 * This module provides a unified interface for connecting to Redis,
 * supporting both local Docker development and Redis Cloud production environments.
 */

import { createClient, RedisClientOptions, RedisClientType } from 'redis';
import { redisClientLogger as logger } from './logger.js';

/**
 * Environment types for Redis connections
 */
export type RedisEnvironment = 'development' | 'production' | 'test';

/**
 * Redis connection configuration
 */
export interface RedisConfig {
  // Basic connection parameters
  host: string;
  port: number;
  username?: string;
  password?: string;
  db?: number;

  // TLS/SSL configuration
  tls?: boolean;

  // Connection options
  connectTimeout?: number;
  reconnectStrategy?: number | ((retries: number) => number);
}

/**
 * Default Redis configurations for different environments
 */
const DEFAULT_CONFIGS: Record<RedisEnvironment, RedisConfig> = {
  development: {
    host: 'localhost',
    port: 6379,
    username: '',
    password: '',
    db: 0,
    tls: false
  },
  production: {
    host: 'redis-11337.c93.us-east-1-3.ec2.redns.redis-cloud.com',
    port: 11337,
    username: 'default',
    password: 'CxXMZw3qW3zYXq1JYy7bCuqwRrL7tH0d',
    db: 0,
    tls: false
  },
  test: {
    host: 'localhost',
    port: 6379,
    username: '',
    password: '',
    db: 1, // Use a different DB for testing
    tls: false
  }
};

/**
 * Get Redis configuration based on environment variables or defaults
 */
export function getRedisConfig(env?: RedisEnvironment): RedisConfig {
  // Determine environment
  const environment = env ||
    (process.env.NODE_ENV as RedisEnvironment) ||
    'development';

  logger.debug(`Getting Redis configuration for environment: ${environment}`);

  // Get default config for environment
  const defaultConfig = DEFAULT_CONFIGS[environment] || DEFAULT_CONFIGS.development;

  // Override with environment variables if provided
  const config = {
    host: process.env.REDIS_HOST || defaultConfig.host,
    port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT) : defaultConfig.port,
    username: process.env.REDIS_USERNAME || defaultConfig.username,
    password: process.env.REDIS_PASSWORD || defaultConfig.password,
    db: process.env.REDIS_DB ? parseInt(process.env.REDIS_DB) : defaultConfig.db,
    tls: process.env.REDIS_TLS === 'true' || defaultConfig.tls,
    connectTimeout: process.env.REDIS_CONNECT_TIMEOUT ?
      parseInt(process.env.REDIS_CONNECT_TIMEOUT) :
      undefined,
    reconnectStrategy: defaultConfig.reconnectStrategy
  };

  logger.debug(`Redis configuration: ${JSON.stringify({
    ...config,
    password: config.password ? '******' : undefined
  })}`);

  return config;
}

/**
 * Convert RedisConfig to RedisClientOptions
 */
function configToOptions(config: RedisConfig): RedisClientOptions {
  const options: RedisClientOptions = {
    socket: {
      host: config.host,
      port: config.port,
      connectTimeout: config.connectTimeout,
      tls: config.tls
    }
  };

  if (config.username) {
    options.username = config.username;
  }

  if (config.password) {
    options.password = config.password;
  }

  if (config.db !== undefined) {
    options.database = config.db;
  }

  if (config.reconnectStrategy) {
    options.socket.reconnectStrategy = config.reconnectStrategy;
  }

  return options;
}

/**
 * Create a Redis client based on the provided configuration or environment
 */
export async function createRedisClient(
  configOrEnv?: RedisConfig | RedisEnvironment
): Promise<RedisClientType> {
  // Determine configuration
  let config: RedisConfig;

  if (typeof configOrEnv === 'string') {
    // If a string is provided, treat it as an environment
    logger.info(`Creating Redis client for environment: ${configOrEnv}`);
    config = getRedisConfig(configOrEnv);
  } else if (configOrEnv) {
    // If an object is provided, use it as the configuration
    logger.info(`Creating Redis client with custom configuration`);
    config = configOrEnv;
  } else {
    // Otherwise, get configuration from environment
    logger.info(`Creating Redis client with environment-based configuration`);
    config = getRedisConfig();
  }

  // Create Redis client
  const options = configToOptions(config);
  const client = createClient(options);

  // Set up event handlers
  client.on('error', (err) => {
    logger.error(`Redis client error: ${err.message}`, { error: err });
  });

  client.on('connect', () => {
    logger.info(`Redis client connected to ${config.host}:${config.port}`);
  });

  client.on('reconnecting', () => {
    logger.warn(`Redis client reconnecting to ${config.host}:${config.port}`);
  });

  client.on('ready', () => {
    logger.info(`Redis client ready`);
  });

  client.on('end', () => {
    logger.info(`Redis client connection closed`);
  });

  // Connect to Redis
  try {
    logger.debug(`Connecting to Redis at ${config.host}:${config.port}`);
    await client.connect();
    logger.info(`Successfully connected to Redis at ${config.host}:${config.port}`);
  } catch (error) {
    logger.error(`Failed to connect to Redis at ${config.host}:${config.port}`, { error });
    throw error;
  }

  return client;
}

/**
 * Get a Redis URL from configuration
 */
export function getRedisUrl(config?: RedisConfig): string {
  const conf = config || getRedisConfig();
  const protocol = conf.tls ? 'rediss' : 'redis';
  const auth = conf.password ?
    `${conf.username ? conf.username + ':' : ''}${conf.password}@` :
    '';

  return `${protocol}://${auth}${conf.host}:${conf.port}${conf.db !== undefined ? '/' + conf.db : ''}`;
}

/**
 * Create a Redis client from a URL
 */
export async function createRedisClientFromUrl(url: string): Promise<RedisClientType> {
  // Mask password in URL for logging
  const maskedUrl = url.replace(/\/\/([^:]+):([^@]+)@/, '//\\1:******@');
  logger.info(`Creating Redis client from URL: ${maskedUrl}`);

  const client = createClient({ url });

  // Set up event handlers
  client.on('error', (err) => {
    logger.error(`Redis client error: ${err.message}`, { error: err });
  });

  client.on('connect', () => {
    logger.info(`Redis client connected via URL`);
  });

  client.on('reconnecting', () => {
    logger.warn(`Redis client reconnecting via URL`);
  });

  client.on('ready', () => {
    logger.info(`Redis client ready`);
  });

  client.on('end', () => {
    logger.info(`Redis client connection closed`);
  });

  // Connect to Redis
  try {
    logger.debug(`Connecting to Redis via URL`);
    await client.connect();
    logger.info(`Successfully connected to Redis via URL`);
  } catch (error) {
    logger.error(`Failed to connect to Redis via URL`, { error });
    throw error;
  }

  return client;
}
