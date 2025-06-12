/**
 * Redis Client Factory
 * 
 * This file provides a factory function to create Redis clients.
 * It supports both standard Redis clients and MCP Redis clients.
 */

import { RedisService } from '../types/redis/service.tsx';
import { RedisServiceImpl, createRedisService } from './redis.service.tsx';
import { RedisConnectionOptions } from '../utils/redis/connection.tsx';
import { MCPRedisClient, MCPRedisConfig, createMCPRedisClient } from '../mcp/redis-client.js';

export type RedisClientType = 'standard' | 'mcp';

export interface RedisFactoryOptions {
  type: RedisClientType;
  config: RedisConnectionOptions | MCPRedisConfig | string;
}

/**
 * Create a Redis client based on the specified type and configuration
 * 
 * @param options The Redis client options
 * @returns A Redis service instance
 */
export function createRedisClient(options: RedisFactoryOptions): RedisService {
  const { type, config } = options;

  switch (type) {
    case 'standard':
      return createRedisService(config as RedisConnectionOptions | string);
    case 'mcp':
      return createMCPRedisClient(config as MCPRedisConfig);
    default:
      throw new Error(`Unsupported Redis client type: ${type}`);
  }
}
