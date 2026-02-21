/**
 * Redis Client Factory
 *
 * This module provides a unified interface for connecting to Redis,
 * supporting both local Docker development and Redis Cloud production environments.
 */
import { RedisClientType } from 'redis';
/**
 * Environment types for Redis connections
 */
export type RedisEnvironment = 'development' | 'production' | 'test';
/**
 * Redis connection configuration
 */
export interface RedisConfig {
    host: string;
    port: number;
    username?: string;
    password?: string;
    db?: number;
    tls?: boolean;
    connectTimeout?: number;
    reconnectStrategy?: number | ((retries: number) => number);
}
/**
 * Get Redis configuration based on environment variables or defaults
 */
export declare function getRedisConfig(env?: RedisEnvironment): RedisConfig;
/**
 * Create a Redis client based on the provided configuration or environment
 */
export declare function createRedisClient(configOrEnv?: RedisConfig | RedisEnvironment): Promise<RedisClientType>;
/**
 * Get a Redis URL from configuration
 */
export declare function getRedisUrl(config?: RedisConfig): string;
/**
 * Create a Redis client from a URL
 */
export declare function createRedisClientFromUrl(url: string): Promise<RedisClientType>;
//# sourceMappingURL=redis-client.d.ts.map