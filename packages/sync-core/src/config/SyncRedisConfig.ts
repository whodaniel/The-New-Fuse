import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Redis keyspace patterns for tenant-isolated sync operations
 * Integrates with existing Redis infrastructure while providing sync-specific patterns
 */
@Injectable()
export class SyncRedisConfig {
    constructor(private readonly configService: ConfigService) { }

    /**
     * Get Redis keyspace patterns for tenant-isolated sync operations
     */
    getKeyspatterns() {
        const prefix = this.configService.get<string>('REDIS_KEY_PREFIX', 'tnf');

        return {
            // Master clock synchronization
            masterClock: {
                timestamp: `${prefix}:sync:clock:timestamp`,
                drift: `${prefix}:sync:clock:drift`,
                instances: `${prefix}:sync:clock:instances`,
                heartbeat: (instanceId: string) => `${prefix}:sync:clock:heartbeat:${instanceId}`,
            },

            // Tenant-specific sync state
            tenantSync: {
                state: (tenantId: string, resourceType: string, resourceId: string) =>
                    `${prefix}:sync:tenant:${tenantId}:${resourceType}:${resourceId}:state`,
                version: (tenantId: string, resourceType: string, resourceId: string) =>
                    `${prefix}:sync:tenant:${tenantId}:${resourceType}:${resourceId}:version`,
                lock: (tenantId: string, resourceType: string, resourceId: string) =>
                    `${prefix}:sync:tenant:${tenantId}:${resourceType}:${resourceId}:lock`,
                queue: (tenantId: string) => `${prefix}:sync:tenant:${tenantId}:queue`,
                conflicts: (tenantId: string) => `${prefix}:sync:tenant:${tenantId}:conflicts`,
            },

            // Global sync operations (cross-tenant)
            globalSync: {
                state: (resourceType: string, resourceId: string) =>
                    `${prefix}:sync:global:${resourceType}:${resourceId}:state`,
                version: (resourceType: string, resourceId: string) =>
                    `${prefix}:sync:global:${resourceType}:${resourceId}:version`,
                lock: (resourceType: string, resourceId: string) =>
                    `${prefix}:sync:global:${resourceType}:${resourceId}:lock`,
                queue: `${prefix}:sync:global:queue`,
                conflicts: `${prefix}:sync:global:conflicts`,
            },

            // File system change tracking
            fileSync: {
                changes: (tenantId?: string) =>
                    tenantId ? `${prefix}:sync:files:tenant:${tenantId}:changes` : `${prefix}:sync:files:global:changes`,
                checksums: (tenantId?: string) =>
                    tenantId ? `${prefix}:sync:files:tenant:${tenantId}:checksums` : `${prefix}:sync:files:global:checksums`,
                watchers: `${prefix}:sync:files:watchers`,
                conflicts: (tenantId?: string) =>
                    tenantId ? `${prefix}:sync:files:tenant:${tenantId}:conflicts` : `${prefix}:sync:files:global:conflicts`,
            },

            // Agent state synchronization
            agentSync: {
                state: (tenantId: string, agentId: string) =>
                    `${prefix}:sync:agent:tenant:${tenantId}:${agentId}:state`,
                metadata: (tenantId: string, agentId: string) =>
                    `${prefix}:sync:agent:tenant:${tenantId}:${agentId}:metadata`,
                config: (tenantId: string, agentId: string) =>
                    `${prefix}:sync:agent:tenant:${tenantId}:${agentId}:config`,
                heartbeat: (tenantId: string, agentId: string) =>
                    `${prefix}:sync:agent:tenant:${tenantId}:${agentId}:heartbeat`,
            },

            // Prompt template synchronization
            templateSync: {
                template: (templateId: string) => `${prefix}:sync:template:${templateId}`,
                version: (templateId: string) => `${prefix}:sync:template:${templateId}:version`,
                dependencies: (templateId: string) => `${prefix}:sync:template:${templateId}:deps`,
                usage: (templateId: string) => `${prefix}:sync:template:${templateId}:usage`,
            },

            // Task management synchronization
            taskSync: {
                state: (tenantId: string, taskId: string) =>
                    `${prefix}:sync:task:tenant:${tenantId}:${taskId}:state`,
                dependencies: (tenantId: string, taskId: string) =>
                    `${prefix}:sync:task:tenant:${tenantId}:${taskId}:deps`,
                assignments: (tenantId: string, taskId: string) =>
                    `${prefix}:sync:task:tenant:${tenantId}:${taskId}:assignments`,
                progress: (tenantId: string, taskId: string) =>
                    `${prefix}:sync:task:tenant:${tenantId}:${taskId}:progress`,
            },

            // Workflow synchronization
            workflowSync: {
                state: (tenantId: string, workflowId: string) =>
                    `${prefix}:sync:workflow:tenant:${tenantId}:${workflowId}:state`,
                execution: (tenantId: string, workflowId: string, executionId: string) =>
                    `${prefix}:sync:workflow:tenant:${tenantId}:${workflowId}:exec:${executionId}`,
                steps: (tenantId: string, workflowId: string) =>
                    `${prefix}:sync:workflow:tenant:${tenantId}:${workflowId}:steps`,
            },

            // Pub/Sub channels for real-time synchronization
            channels: {
                // Master clock synchronization
                clockSync: `${prefix}:sync:channel:clock`,
                clockDrift: `${prefix}:sync:channel:clock:drift`,

                // Tenant-specific channels
                tenantSync: (tenantId: string) => `${prefix}:sync:channel:tenant:${tenantId}`,
                tenantAgents: (tenantId: string) => `${prefix}:sync:channel:tenant:${tenantId}:agents`,
                tenantTasks: (tenantId: string) => `${prefix}:sync:channel:tenant:${tenantId}:tasks`,
                tenantWorkflows: (tenantId: string) => `${prefix}:sync:channel:tenant:${tenantId}:workflows`,

                // Global channels
                globalSync: `${prefix}:sync:channel:global`,
                templateSync: `${prefix}:sync:channel:templates`,
                fileSync: `${prefix}:sync:channel:files`,

                // Conflict resolution
                conflicts: `${prefix}:sync:channel:conflicts`,
                conflictResolution: `${prefix}:sync:channel:conflicts:resolution`,

                // Health and monitoring
                health: `${prefix}:sync:channel:health`,
                metrics: `${prefix}:sync:channel:metrics`,
            },

            // Pattern subscriptions for wildcard matching
            patterns: {
                tenantAll: (tenantId: string) => `${prefix}:sync:tenant:${tenantId}:*`,
                agentAll: (tenantId: string) => `${prefix}:sync:agent:tenant:${tenantId}:*`,
                taskAll: (tenantId: string) => `${prefix}:sync:task:tenant:${tenantId}:*`,
                workflowAll: (tenantId: string) => `${prefix}:sync:workflow:tenant:${tenantId}:*`,
                filesAll: `${prefix}:sync:files:*`,
                templatesAll: `${prefix}:sync:template:*`,
                globalAll: `${prefix}:sync:global:*`,
                clockAll: `${prefix}:sync:clock:*`,
                channelAll: `${prefix}:sync:channel:*`,
            },

            // Lock patterns for distributed synchronization
            locks: {
                sync: (resourceType: string, resourceId: string, tenantId?: string) =>
                    tenantId
                        ? `${prefix}:lock:sync:tenant:${tenantId}:${resourceType}:${resourceId}`
                        : `${prefix}:lock:sync:global:${resourceType}:${resourceId}`,
                conflict: (conflictId: string) => `${prefix}:lock:conflict:${conflictId}`,
                clock: `${prefix}:lock:clock`,
                fileWatcher: (path: string) => `${prefix}:lock:filewatcher:${Buffer.from(path).toString('base64')}`,
            },

            // Queue patterns for async operations
            queues: {
                syncOperations: (tenantId?: string) =>
                    tenantId ? `${prefix}:queue:sync:tenant:${tenantId}` : `${prefix}:queue:sync:global`,
                conflictResolution: `${prefix}:queue:conflicts`,
                fileChanges: (tenantId?: string) =>
                    tenantId ? `${prefix}:queue:files:tenant:${tenantId}` : `${prefix}:queue:files:global`,
                retries: `${prefix}:queue:retries`,
                deadLetter: `${prefix}:queue:deadletter`,
            },
        };
    }

    /**
     * Get TTL values for different types of sync data
     */
    getTTLConfig() {
        return {
            // Short-lived data (seconds)
            locks: this.configService.get<number>('SYNC_LOCK_TTL', 30),
            heartbeat: this.configService.get<number>('SYNC_HEARTBEAT_TTL', 60),
            clockDrift: this.configService.get<number>('SYNC_CLOCK_DRIFT_TTL', 300),

            // Medium-lived data (minutes)
            fileChecksums: this.configService.get<number>('SYNC_FILE_CHECKSUM_TTL', 3600),
            agentState: this.configService.get<number>('SYNC_AGENT_STATE_TTL', 1800),
            taskProgress: this.configService.get<number>('SYNC_TASK_PROGRESS_TTL', 3600),

            // Long-lived data (hours)
            templateCache: this.configService.get<number>('SYNC_TEMPLATE_CACHE_TTL', 86400),
            workflowState: this.configService.get<number>('SYNC_WORKFLOW_STATE_TTL', 43200),

            // Persistent data (no TTL, manual cleanup)
            syncState: null, // Stored in database, not Redis
            conflicts: null, // Stored in database, not Redis
            auditLogs: null, // Stored in database, not Redis
        };
    }

    /**
     * Get Redis configuration specific to sync operations
     */
    getSyncRedisConfig() {
        return {
            keyPrefix: this.configService.get<string>('REDIS_KEY_PREFIX', 'tnf'),
            maxRetries: this.configService.get<number>('SYNC_REDIS_MAX_RETRIES', 3),
            retryDelay: this.configService.get<number>('SYNC_REDIS_RETRY_DELAY', 1000),
            lockTimeout: this.configService.get<number>('SYNC_LOCK_TIMEOUT', 30000),
            pubSubReconnectDelay: this.configService.get<number>('SYNC_PUBSUB_RECONNECT_DELAY', 5000),
            batchSize: this.configService.get<number>('SYNC_BATCH_SIZE', 100),
            maxQueueSize: this.configService.get<number>('SYNC_MAX_QUEUE_SIZE', 10000),
        };
    }

    /**
     * Validate tenant ID format for keyspace isolation
     */
    validateTenantId(tenantId: string): boolean {
        // Ensure tenant ID is safe for Redis keys (no special characters)
        const tenantIdRegex = /^[a-zA-Z0-9_-]+$/;
        return tenantIdRegex.test(tenantId) && tenantId.length <= 64;
    }

    /**
     * Sanitize resource identifiers for Redis keys
     */
    sanitizeResourceId(resourceId: string): string {
        // Replace unsafe characters with safe alternatives
        return resourceId
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 128); // Limit length
    }
}