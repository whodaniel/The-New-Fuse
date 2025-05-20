/**
 * Redis Service
 *
 * This module provides a high-level interface for Redis operations,
 * abstracting away the details of the Redis client implementation.
 */

import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis as RedisClient } from 'ioredis';
import { redisServiceLogger as logger } from './logger';
import { createRedisClient, RedisConfig, RedisEnvironment } from './redis-client.js';

/**
 * Redis Service class
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClient | null = null;
  private isConnected: boolean = false;

  constructor(private readonly configService?: ConfigService) {
    logger.debug('Creating RedisService instance');
  }

  async onModuleInit(): Promise<void> {
    await this.initialize();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  /**
   * Initialize the Redis service
   * @param configOrEnv Redis configuration or environment
   */
  async initialize(configOrEnv?: RedisConfig | RedisEnvironment): Promise<void> {
    if (this.isConnected) {
      logger.debug('Redis service already initialized');
      return;
    }

    logger.info('Initializing Redis service');
    try {
      this.client = await createRedisClient(configOrEnv);
      this.isConnected = true;
      logger.info('Redis service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Redis service', { error });
      throw error;
    }
  }

  /**
   * Get the Redis client
   */
  getClient(): RedisClient {
    this.ensureConnected();
    return this.client!;
  }

  /**
   * Close the Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.client = null;
        this.isConnected = false;
        logger.info('Disconnected from Redis');
      } catch (error) {
        logger.error('Error disconnecting from Redis', { error });
        throw error;
      }
    }
  }

  /**
   * Ensure the Redis client is connected
   */
  private ensureConnected(): void {
    if (!this.isConnected || !this.client) {
      throw new Error('Redis service not initialized. Call initialize() first.');
    }
  }

  // Basic key-value operations

  /**
   * Set a key-value pair
   * @param key The key
   * @param value The value
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: string, ttl?: number): Promise<'OK'> {
    this.ensureConnected();
    try {
      if (ttl) {
        return await this.client!.set(key, value, 'EX', ttl);
      }
      return await this.client!.set(key, value);
    } catch (error) {
      logger.error('Error setting key in Redis', { key, error });
      throw error;
    }
  }

  /**
   * Get a value by key
   * @param key The key
   */
  async get(key: string): Promise<string | null> {
    this.ensureConnected();
    try {
      return await this.client!.get(key);
    } catch (error) {
      logger.error('Error getting key from Redis', { key, error });
      throw error;
    }
  }

  /**
   * Delete a key
   * @param key The key
   */
  async del(key: string): Promise<number> {
    this.ensureConnected();
    try {
      return await this.client!.del(key);
    } catch (error) {
      logger.error('Error deleting key from Redis', { key, error });
      throw error;
    }
  }

  /**
   * Check if a key exists
   * @param key The key
   */
  async exists(key: string): Promise<number> {
    this.ensureConnected();
    try {
      return await this.client!.exists(key);
    } catch (error) {
      logger.error('Error checking key existence in Redis', { key, error });
      throw error;
    }
  }

  /**
   * Get keys by pattern
   * @param pattern The pattern
   */
  async keys(pattern: string): Promise<string[]> {
    this.ensureConnected();
    try {
      return await this.client!.keys(pattern);
    } catch (error) {
      logger.error('Error getting keys from Redis', { pattern, error });
      throw error;
    }
  }

  /**
   * Ping the Redis server
   */
  async ping(): Promise<string> {
    this.ensureConnected();
    try {
      return await this.client!.ping();
    } catch (error) {
      logger.error('Error pinging Redis', { error });
      throw error;
    }
  }
}
