import { RedisManager } from '../redis/redisManager.js';
export interface SystemMetrics {
    timestamp: number;
    cpu: {
        usage: number;
        count: number;
        load: number[];
    };
    memory: {
        total: number;
        used: number;
        free: number;
        cached: number;
    };
    disk: {
        total: number;
        used: number;
        free: number;
    };
    network: {
        bytesIn: number;
        bytesOut: number;
        packetsIn: number;
        packetsOut: number;
    };
}
export interface ApplicationMetrics {
    timestamp: number;
    requests: {
        total: number;
        success: number;
        failed: number;
        latency: number;
    };
    connections: {
        active: number;
        idle: number;
        closed: number;
    };
    tasks: {
        pending: number;
        running: number;
        completed: number;
        failed: number;
    };
    cache: {
        hits: number;
        misses: number;
        size: number;
    };
}
export interface AgentMetrics {
    timestamp: number;
    agentId: string;
    status: ACTIVE' | 'IDLE' | 'ERROR';
    performance: {
        tasksCompleted: number;
        avgProcessingTime: number;
        errorRate: number;
        successRate: number;
    };
    resources: {
        memoryUsage: number;
        cpuUsage: number;
        threadCount: number;
    };
    queue: {
        length: number;
        oldestItem: number;
        processingRate: number;
    };
}
export declare class MetricsCollector {
    private readonly redisManager;
    private readonly metricsPrefix;
    private readonly retentionPeriod;
    private collectionInterval;
    constructor(redisManager: RedisManager, options?: {
        metricsPrefix?: string;
        retentionPeriod?: number;
    });
    startCollection(): Promise<void>;
}
