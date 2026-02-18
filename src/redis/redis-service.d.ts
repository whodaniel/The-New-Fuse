/**
 * Redis Service
 *
 * This module provides a high-level interface for Redis operations,
 * abstracting away the details of the Redis client implementation.
 */
import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis as RedisClient } from 'ioredis';
import { RedisConfig, RedisEnvironment } from './redis-client.js';
/**
 * Redis Service class
 */
export declare class RedisService implements OnModuleInit, OnModuleDestroy {
    private readonly configService?;
    private client;
    private isConnected;
    constructor(configService?: ConfigService | undefined);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Initialize the Redis service
     * @param configOrEnv Redis configuration or environment
     */
    initialize(configOrEnv?: RedisConfig | RedisEnvironment): Promise<void>;
    /**
     * Get the Redis client
     */
    getClient(): RedisClient;
    /**
     * Close the Redis connection
     */
    disconnect(): Promise<void>;
    /**
     * Ensure the Redis client is connected
     */
    private ensureConnected;
    /**
     * Set a key-value pair
     * @param key The key
     * @param value The value
     * @param ttl Time to live in seconds (optional)
     */
    set(key: string, value: string, ttl?: number): Promise<'OK'>;
    /**
     * Get a value by key
     * @param key The key
     */
    get(key: string): Promise<string | null>;
    /**
     * Delete a key
     * @param key The key
     */
    del(key: string): Promise<number>;
    /**
     * Check if a key exists
     * @param key The key
     */
    exists(key: string): Promise<number>;
    /**
     * Get keys by pattern
     * @param pattern The pattern
     */
    keys(pattern: string): Promise<string[]>;
    /**
     * Ping the Redis server
     */
    ping(): Promise<string>;
}
//# sourceMappingURL=redis-service.d.ts.map