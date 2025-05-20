/**
 * System monitoring and analytics for the chat system.
 * Tracks performance metrics, agent interactions, and system health.
 */
import { RedisCore } from '../redis/redisCore.js';
export declare class SystemMonitor {
    private redis;
    private readonly metricPrefixes;
    constructor(redis: RedisCore);
    recordResponseTime(): Promise<void>;
}
