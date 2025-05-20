/**
 * System monitoring and analytics for the chat system.
 * Tracks performance metrics, agent interactions, and system health.
 */
import { RedisCore } from '../redis_core/redis_client.js';
export declare class SystemMonitor {
    private readonly redis;
    private readonly metricPrefixes;
    constructor(redis: RedisCore);
    recordResponseTime(): Promise<void>;
}
