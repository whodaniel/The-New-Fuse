"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncRedisConfig = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
/**
 * Redis keyspace patterns for tenant-isolated sync operations
 * Integrates with existing Redis infrastructure while providing sync-specific patterns
 */
let SyncRedisConfig = class SyncRedisConfig {
    constructor(configService) {
        this.configService = configService;
    }
    /**
     * Get Redis keyspace patterns for tenant-isolated sync operations
     */
    getKeyspatterns() {
        const prefix = this.configService.get('REDIS_KEY_PREFIX', 'tnf');
        return {
            // Master clock synchronization
            masterClock: {
                timestamp: `${prefix}:sync:clock:timestamp`,
                drift: `${prefix}:sync:clock:drift`,
                instances: `${prefix}:sync:clock:instances`,
                heartbeat: (instanceId) => `${prefix}:sync:clock:heartbeat:${instanceId}`,
            },
            // Tenant-specific sync state
            tenantSync: {
                state: (tenantId, resourceType, resourceId) => `${prefix}:sync:tenant:${tenantId}:${resourceType}:${resourceId}:state`,
                version: (tenantId, resourceType, resourceId) => `${prefix}:sync:tenant:${tenantId}:${resourceType}:${resourceId}:version`,
                lock: (tenantId, resourceType, resourceId) => `${prefix}:sync:tenant:${tenantId}:${resourceType}:${resourceId}:lock`,
                queue: (tenantId) => `${prefix}:sync:tenant:${tenantId}:queue`,
                conflicts: (tenantId) => `${prefix}:sync:tenant:${tenantId}:conflicts`,
            },
            // Global sync operations (cross-tenant)
            globalSync: {
                state: (resourceType, resourceId) => `${prefix}:sync:global:${resourceType}:${resourceId}:state`,
                version: (resourceType, resourceId) => `${prefix}:sync:global:${resourceType}:${resourceId}:version`,
                lock: (resourceType, resourceId) => `${prefix}:sync:global:${resourceType}:${resourceId}:lock`,
                queue: `${prefix}:sync:global:queue`,
                conflicts: `${prefix}:sync:global:conflicts`,
            },
            // File system change tracking
            fileSync: {
                changes: (tenantId) => tenantId ? `${prefix}:sync:files:tenant:${tenantId}:changes` : `${prefix}:sync:files:global:changes`,
                checksums: (tenantId) => tenantId ? `${prefix}:sync:files:tenant:${tenantId}:checksums` : `${prefix}:sync:files:global:checksums`,
                watchers: `${prefix}:sync:files:watchers`,
                conflicts: (tenantId) => tenantId ? `${prefix}:sync:files:tenant:${tenantId}:conflicts` : `${prefix}:sync:files:global:conflicts`,
            },
            // Agent state synchronization
            agentSync: {
                state: (tenantId, agentId) => `${prefix}:sync:agent:tenant:${tenantId}:${agentId}:state`,
                metadata: (tenantId, agentId) => `${prefix}:sync:agent:tenant:${tenantId}:${agentId}:metadata`,
                config: (tenantId, agentId) => `${prefix}:sync:agent:tenant:${tenantId}:${agentId}:config`,
                heartbeat: (tenantId, agentId) => `${prefix}:sync:agent:tenant:${tenantId}:${agentId}:heartbeat`,
            },
            // Prompt template synchronization
            templateSync: {
                template: (templateId) => `${prefix}:sync:template:${templateId}`,
                version: (templateId) => `${prefix}:sync:template:${templateId}:version`,
                dependencies: (templateId) => `${prefix}:sync:template:${templateId}:deps`,
                usage: (templateId) => `${prefix}:sync:template:${templateId}:usage`,
            },
            // Task management synchronization
            taskSync: {
                state: (tenantId, taskId) => `${prefix}:sync:task:tenant:${tenantId}:${taskId}:state`,
                dependencies: (tenantId, taskId) => `${prefix}:sync:task:tenant:${tenantId}:${taskId}:deps`,
                assignments: (tenantId, taskId) => `${prefix}:sync:task:tenant:${tenantId}:${taskId}:assignments`,
                progress: (tenantId, taskId) => `${prefix}:sync:task:tenant:${tenantId}:${taskId}:progress`,
            },
            // Workflow synchronization
            workflowSync: {
                state: (tenantId, workflowId) => `${prefix}:sync:workflow:tenant:${tenantId}:${workflowId}:state`,
                execution: (tenantId, workflowId, executionId) => `${prefix}:sync:workflow:tenant:${tenantId}:${workflowId}:exec:${executionId}`,
                steps: (tenantId, workflowId) => `${prefix}:sync:workflow:tenant:${tenantId}:${workflowId}:steps`,
            },
            // Pub/Sub channels for real-time synchronization
            channels: {
                // Master clock synchronization
                clockSync: `${prefix}:sync:channel:clock`,
                clockDrift: `${prefix}:sync:channel:clock:drift`,
                // Tenant-specific channels
                tenantSync: (tenantId) => `${prefix}:sync:channel:tenant:${tenantId}`,
                tenantAgents: (tenantId) => `${prefix}:sync:channel:tenant:${tenantId}:agents`,
                tenantTasks: (tenantId) => `${prefix}:sync:channel:tenant:${tenantId}:tasks`,
                tenantWorkflows: (tenantId) => `${prefix}:sync:channel:tenant:${tenantId}:workflows`,
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
                tenantAll: (tenantId) => `${prefix}:sync:tenant:${tenantId}:*`,
                agentAll: (tenantId) => `${prefix}:sync:agent:tenant:${tenantId}:*`,
                taskAll: (tenantId) => `${prefix}:sync:task:tenant:${tenantId}:*`,
                workflowAll: (tenantId) => `${prefix}:sync:workflow:tenant:${tenantId}:*`,
                filesAll: `${prefix}:sync:files:*`,
                templatesAll: `${prefix}:sync:template:*`,
                globalAll: `${prefix}:sync:global:*`,
                clockAll: `${prefix}:sync:clock:*`,
                channelAll: `${prefix}:sync:channel:*`,
            },
            // Lock patterns for distributed synchronization
            locks: {
                sync: (resourceType, resourceId, tenantId) => tenantId
                    ? `${prefix}:lock:sync:tenant:${tenantId}:${resourceType}:${resourceId}`
                    : `${prefix}:lock:sync:global:${resourceType}:${resourceId}`,
                conflict: (conflictId) => `${prefix}:lock:conflict:${conflictId}`,
                clock: `${prefix}:lock:clock`,
                fileWatcher: (path) => `${prefix}:lock:filewatcher:${Buffer.from(path).toString('base64')}`,
            },
            // Queue patterns for async operations
            queues: {
                syncOperations: (tenantId) => tenantId ? `${prefix}:queue:sync:tenant:${tenantId}` : `${prefix}:queue:sync:global`,
                conflictResolution: `${prefix}:queue:conflicts`,
                fileChanges: (tenantId) => tenantId ? `${prefix}:queue:files:tenant:${tenantId}` : `${prefix}:queue:files:global`,
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
            locks: this.configService.get('SYNC_LOCK_TTL', 30),
            heartbeat: this.configService.get('SYNC_HEARTBEAT_TTL', 60),
            clockDrift: this.configService.get('SYNC_CLOCK_DRIFT_TTL', 300),
            // Medium-lived data (minutes)
            fileChecksums: this.configService.get('SYNC_FILE_CHECKSUM_TTL', 3600),
            agentState: this.configService.get('SYNC_AGENT_STATE_TTL', 1800),
            taskProgress: this.configService.get('SYNC_TASK_PROGRESS_TTL', 3600),
            // Long-lived data (hours)
            templateCache: this.configService.get('SYNC_TEMPLATE_CACHE_TTL', 86400),
            workflowState: this.configService.get('SYNC_WORKFLOW_STATE_TTL', 43200),
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
            keyPrefix: this.configService.get('REDIS_KEY_PREFIX', 'tnf'),
            maxRetries: this.configService.get('SYNC_REDIS_MAX_RETRIES', 3),
            retryDelay: this.configService.get('SYNC_REDIS_RETRY_DELAY', 1000),
            lockTimeout: this.configService.get('SYNC_LOCK_TIMEOUT', 30000),
            pubSubReconnectDelay: this.configService.get('SYNC_PUBSUB_RECONNECT_DELAY', 5000),
            batchSize: this.configService.get('SYNC_BATCH_SIZE', 100),
            maxQueueSize: this.configService.get('SYNC_MAX_QUEUE_SIZE', 10000),
        };
    }
    /**
     * Validate tenant ID format for keyspace isolation
     */
    validateTenantId(tenantId) {
        // Ensure tenant ID is safe for Redis keys (no special characters)
        const tenantIdRegex = /^[a-zA-Z0-9_-]+$/;
        return tenantIdRegex.test(tenantId) && tenantId.length <= 64;
    }
    /**
     * Sanitize resource identifiers for Redis keys
     */
    sanitizeResourceId(resourceId) {
        // Replace unsafe characters with safe alternatives
        return resourceId
            .replace(/[^a-zA-Z0-9_-]/g, '_')
            .substring(0, 128); // Limit length
    }
};
exports.SyncRedisConfig = SyncRedisConfig;
exports.SyncRedisConfig = SyncRedisConfig = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SyncRedisConfig);
//# sourceMappingURL=SyncRedisConfig.js.map