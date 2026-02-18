/**
 * Redis Client Factory
 *
 * This file provides a factory function to create Redis clients.
 * It supports both standard Redis clients and MCP Redis clients.
 */
import { RedisService } from '../types/redis/service.tsx';
import { RedisConnectionOptions } from '../utils/redis/connection.tsx';
import { MCPRedisConfig } from '../mcp/redis-client.js';
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
export declare function createRedisClient(options: RedisFactoryOptions): RedisService;
//# sourceMappingURL=redis-factory.d.ts.map