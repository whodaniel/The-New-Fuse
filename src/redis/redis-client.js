"use strict";
/**
 * Redis Client Factory
 *
 * This module provides a unified interface for connecting to Redis,
 * supporting both local Docker development and Redis Cloud production environments.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConfig = getRedisConfig;
exports.createRedisClient = createRedisClient;
exports.getRedisUrl = getRedisUrl;
exports.createRedisClientFromUrl = createRedisClientFromUrl;
const redis_1 = require("redis");
const logger_1 = require("./logger");
/**
 * Default Redis configurations for different environments
 */
const DEFAULT_CONFIGS = {
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
function getRedisConfig(env) {
    // Determine environment
    const environment = env ||
        process.env.NODE_ENV ||
        'development';
    logger_1.redisClientLogger.debug(`Getting Redis configuration for environment: ${environment}`);
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
    logger_1.redisClientLogger.debug(`Redis configuration: ${JSON.stringify({
        ...config,
        password: config.password ? '******' : undefined
    })}`);
    return config;
}
/**
 * Convert RedisConfig to RedisClientOptions
 */
function configToOptions(config) {
    const options = {
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
async function createRedisClient(configOrEnv) {
    // Determine configuration
    let config;
    if (typeof configOrEnv === 'string') {
        // If a string is provided, treat it as an environment logger.info(`Creating Redis client for environment: ${configOrEnv}`);
        config = getRedisConfig(configOrEnv);
    }
    else if (configOrEnv) {
        // If an object is provided, use it as the configuration logger.info(`Creating Redis client with custom configuration`);
        config = configOrEnv;
    }
    else {
        // Otherwise, get configuration from environment logger.info(`Creating Redis client with environment-based configuration`);
        config = getRedisConfig();
    }
    // Create Redis client
    const options = configToOptions(config);
    const client = (0, redis_1.createClient)(options);
    // Set up event handlers
    client.on('error', (err) => {
        logger_1.redisClientLogger.error(`Redis client error: ${err.message}`, { error: err });
    });
    client.on('connect', () => {
        logger_1.redisClientLogger.info(`Redis client connected to ${config.host}:${config.port}`);
    });
    client.on('reconnecting', () => {
        logger_1.redisClientLogger.warn(`Redis client reconnecting to ${config.host}:${config.port}`);
    });
    client.on('ready', () => {
        logger_1.redisClientLogger.info(`Redis client ready`);
    });
    client.on('end', () => {
        logger_1.redisClientLogger.info(`Redis client connection closed`);
    });
    // Connect to Redis
    try {
        logger_1.redisClientLogger.debug(`Connecting to Redis at ${config.host}:${config.port}`);
        await client.connect();
        logger_1.redisClientLogger.info(`Successfully connected to Redis at ${config.host}:${config.port}`);
    }
    catch (error) {
        logger_1.redisClientLogger.error(`Failed to connect to Redis at ${config.host}:${config.port}`, { error });
        throw error;
    }
    return client;
}
/**
 * Get a Redis URL from configuration
 */
function getRedisUrl(config) {
    const conf = config || getRedisConfig();
    const protocol = conf.tls ? 'rediss' : 'redis';
    const auth = conf.password ? `${conf.username ? conf.username + ':' : ''}${conf.password}@` :
        '';
    return `${protocol}://${auth}${conf.host}:${conf.port}${conf.db !== undefined ? '/' + conf.db : ''}`;
}
/**
 * Create a Redis client from a URL
 */
async function createRedisClientFromUrl(url) {
    // Mask password in URL for logging
    const maskedUrl = url.replace(/\/\/([^:]+):([^@]+)@/, '//\\1:******@');
    logger_1.redisClientLogger.info(`Creating Redis client from URL: ${maskedUrl}`);
    const client = (0, redis_1.createClient)({ url });
    // Set up event handlers
    client.on('error', (err) => {
        logger_1.redisClientLogger.error(`Redis client error: ${err.message}`, { error: err });
    });
    client.on('connect', () => {
        logger_1.redisClientLogger.info(`Redis client connected via URL`);
    });
    client.on('reconnecting', () => {
        logger_1.redisClientLogger.warn(`Redis client reconnecting via URL`);
    });
    client.on('ready', () => {
        logger_1.redisClientLogger.info(`Redis client ready`);
    });
    client.on('end', () => {
        logger_1.redisClientLogger.info(`Redis client connection closed`);
    });
    // Connect to Redis
    try {
        logger_1.redisClientLogger.debug(`Connecting to Redis via URL`);
        await client.connect();
        logger_1.redisClientLogger.info(`Successfully connected to Redis via URL`);
    }
    catch (error) {
        logger_1.redisClientLogger.error(`Failed to connect to Redis via URL`, { error });
        throw error;
    }
    return client;
}
//# sourceMappingURL=redis-client.js.map