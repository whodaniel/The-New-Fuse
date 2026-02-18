"use strict";
/**
 * Redis Client Factory
 *
 * This file provides a factory function to create Redis clients.
 * It supports both standard Redis clients and MCP Redis clients.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = createRedisClient;
const redis_service_tsx_1 = require("./redis.service.tsx");
const redis_client_js_1 = require("../mcp/redis-client.js");
/**
 * Create a Redis client based on the specified type and configuration
 *
 * @param options The Redis client options
 * @returns A Redis service instance
 */
function createRedisClient(options) {
    const { type, config } = options;
    switch (type) {
        case 'standard':
            return (0, redis_service_tsx_1.createRedisService)(config);
        case 'mcp':
            return (0, redis_client_js_1.createMCPRedisClient)(config);
        default:
            throw new Error(`Unsupported Redis client type: ${type}`);
    }
}
//# sourceMappingURL=redis-factory.js.map