import { RedisManager } from '../redis/redisManager.js';
import { MetricsCollector } from './metricsCollector.js';
import { EventEmitter } from 'events';
export interface RedisStats {
    timestamp: number;
    memory: {
        used: number;
        peak: number;
        fragmentation: number;
    };
    cpu: {
        sys: number;
        user: number;
        children: number;
    };
    clients: {
        connected: number;
        blocked: number;
        tracking: number;
        maxClients: number;
    };
    keys: {
        total: number;
        expires: number;
        evicted: number;
    };
    persistence: {
        loading: boolean;
        rdbChangesSinceLastSave: number;
        rdbLastSaveTime: number;
        rdbLastBgsaveStatus: string;
        aofEnabled: boolean;
        aofLastRewriteTime: number;
        aofCurrentSize: number;
        aofBufferLength: number;
    };
    stats: {
        totalConnections: number;
        totalCommands: number;
        opsPerSec: number;
        netInputBytes: number;
        netOutputBytes: number;
        rejectedConnections: number;
        syncFull: number;
        syncPartial: number;
    };
    replication: {
        role: string;
        connected: number;
        offset: number;
        backlogSize: number;
        backlogOffset: number;
    };
}
export interface RedisAlert {
    timestamp: number;
    type: string;
    severity: info' | 'warning' | 'error' | 'critical';
    message: string;
    stats: Partial<RedisStats>;
}
export interface MonitorConfig {
    interval: number;
    thresholds: {
        memory: {
            maxUsage: number;
            maxFragmentation: number;
        };
        clients: {
            maxConnected: number;
            maxBlocked: number;
        };
        performance: {
            minOpsPerSec: number;
            maxLatency: number;
        };
    };
}
export declare class RedisMonitor extends EventEmitter {
    private readonly redis;
    private readonly metricsCollector;
    private readonly config;
    private monitorInterval;
    private lastStats;
    constructor(redis: RedisManager, metricsCollector: MetricsCollector, config?: Partial<MonitorConfig>);
    start(): Promise<void>;
}
