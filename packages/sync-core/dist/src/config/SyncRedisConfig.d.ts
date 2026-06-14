import { ConfigService } from '@nestjs/config';
/**
 * Generic Redis interface for compatibility across sync-core
 */
export interface RedisService {
    setex(key: string, seconds: number, value: string): Promise<string>;
    get(key: string): Promise<string | null>;
    sadd(key: string, member: string): Promise<number>;
    smembers(key: string): Promise<string[]>;
    srem(key: string, member: string): Promise<number>;
    del(key: string): Promise<number>;
    lpush(key: string, value: string): Promise<number>;
    lrange(key: string, start: number, stop: number): Promise<string[]>;
    publish(channel: string, message: string): Promise<number>;
    subscribe?(channel: string, callback: (channel: string, message: string) => void): Promise<void>;
    keys?(pattern: string): Promise<string[]>;
    set?(key: string, value: string): Promise<string>;
    expire?(key: string, seconds: number): Promise<number>;
    hset?(key: string, field: string, value: string): Promise<number>;
    hget?(key: string, field: string): Promise<string | null>;
    hgetall?(key: string): Promise<Record<string, string>>;
}
/**
 * Redis keyspace patterns for tenant-isolated sync operations
 * Integrates with existing Redis infrastructure while providing sync-specific patterns
 */
export declare class SyncRedisConfig {
    private readonly configService;
    constructor(configService: ConfigService);
    /**
     * Get Redis keyspace patterns for tenant-isolated sync operations
     */
    getKeyspatterns(): {
        masterClock: {
            timestamp: string;
            drift: string;
            instances: string;
            heartbeat: (instanceId: string) => string;
        };
        tenantSync: {
            state: (tenantId: string, resourceType: string, resourceId: string) => string;
            version: (tenantId: string, resourceType: string, resourceId: string) => string;
            lock: (tenantId: string, resourceType: string, resourceId: string) => string;
            queue: (tenantId: string) => string;
            conflicts: (tenantId: string) => string;
        };
        globalSync: {
            state: (resourceType: string, resourceId: string) => string;
            version: (resourceType: string, resourceId: string) => string;
            lock: (resourceType: string, resourceId: string) => string;
            queue: string;
            conflicts: string;
        };
        fileSync: {
            changes: (tenantId?: string) => string;
            checksums: (tenantId?: string) => string;
            watchers: string;
            conflicts: (tenantId?: string) => string;
        };
        agentSync: {
            state: (tenantId: string, agentId: string) => string;
            metadata: (tenantId: string, agentId: string) => string;
            config: (tenantId: string, agentId: string) => string;
            heartbeat: (tenantId: string, agentId: string) => string;
        };
        templateSync: {
            template: (templateId: string) => string;
            version: (templateId: string) => string;
            dependencies: (templateId: string) => string;
            usage: (templateId: string) => string;
        };
        taskSync: {
            state: (tenantId: string, taskId: string) => string;
            dependencies: (tenantId: string, taskId: string) => string;
            assignments: (tenantId: string, taskId: string) => string;
            progress: (tenantId: string, taskId: string) => string;
        };
        workflowSync: {
            state: (tenantId: string, workflowId: string) => string;
            execution: (tenantId: string, workflowId: string, executionId: string) => string;
            steps: (tenantId: string, workflowId: string) => string;
        };
        channels: {
            clockSync: string;
            clockDrift: string;
            tenantSync: (tenantId: string) => string;
            tenantAgents: (tenantId: string) => string;
            tenantTasks: (tenantId: string) => string;
            tenantWorkflows: (tenantId: string) => string;
            globalSync: string;
            templateSync: string;
            fileSync: string;
            conflicts: string;
            conflictResolution: string;
            health: string;
            metrics: string;
        };
        patterns: {
            tenantAll: (tenantId: string) => string;
            agentAll: (tenantId: string) => string;
            taskAll: (tenantId: string) => string;
            workflowAll: (tenantId: string) => string;
            filesAll: string;
            templatesAll: string;
            globalAll: string;
            clockAll: string;
            channelAll: string;
        };
        locks: {
            sync: (resourceType: string, resourceId: string, tenantId?: string) => string;
            conflict: (conflictId: string) => string;
            clock: string;
            fileWatcher: (path: string) => string;
        };
        queues: {
            syncOperations: (tenantId?: string) => string;
            conflictResolution: string;
            fileChanges: (tenantId?: string) => string;
            retries: string;
            deadLetter: string;
        };
    };
    /**
     * Get TTL values for different types of sync data
     */
    getTTLConfig(): {
        locks: number;
        heartbeat: number;
        clockDrift: number;
        fileChecksums: number;
        agentState: number;
        taskProgress: number;
        templateCache: number;
        workflowState: number;
        syncState: null;
        conflicts: null;
        auditLogs: null;
    };
    /**
     * Get Redis configuration specific to sync operations
     */
    getSyncRedisConfig(): {
        keyPrefix: string;
        maxRetries: number;
        retryDelay: number;
        lockTimeout: number;
        pubSubReconnectDelay: number;
        batchSize: number;
        maxQueueSize: number;
    };
    /**
     * Validate tenant ID format for keyspace isolation
     */
    validateTenantId(tenantId: string): boolean;
    /**
     * Sanitize resource identifiers for Redis keys
     */
    sanitizeResourceId(resourceId: string): string;
}
//# sourceMappingURL=SyncRedisConfig.d.ts.map