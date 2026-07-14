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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var SyncOrchestrator_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncOrchestrator = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@the-new-fuse/database");
const infrastructure_1 = require("@the-new-fuse/infrastructure");
const prompt_templating_1 = require("@the-new-fuse/prompt-templating");
const ConflictManager_1 = require("./ConflictManager"); // Import ConflictManager
const events_1 = require("events");
let SyncOrchestrator = SyncOrchestrator_1 = class SyncOrchestrator extends events_1.EventEmitter {
    constructor(redisService, wsService, dbService, promptTemplateService, conflictManager // Inject ConflictManager
    ) {
        super();
        this.redisService = redisService;
        this.wsService = wsService;
        this.dbService = dbService;
        this.promptTemplateService = promptTemplateService;
        this.conflictManager = conflictManager;
        this.logger = new common_1.Logger(SyncOrchestrator_1.name);
        this.config = {
            syncChannelPrefix: 'sync:',
            conflictChannelPrefix: 'conflict:',
            batchSize: 50,
            syncTimeout: 30000,
            retryAttempts: 3,
            tenantIsolationEnabled: true,
        };
        this.metrics = {
            operations: {
                sync: 0,
                conflicts: 0,
                fileChanges: 0,
                clockSync: 0,
            },
            performance: {
                avgSyncLatency: 0,
                maxSyncLatency: 0,
                conflictRate: 0,
                successRate: 0,
            },
            resources: {
                activeTenants: 0,
                watchedFiles: 0,
                syncedResources: 0,
                pendingOperations: 0,
            },
        };
        this.activeSyncOperations = new Map();
        this.tenantContexts = new Map();
    }
    async onModuleInit() {
        await this.initializeChannelSubscriptions();
        await this.loadTenantContexts();
        this.startMetricsCollection();
        this.logger.log('SyncOrchestrator initialized');
    }
    async onModuleDestroy() {
        await this.cleanup();
        this.logger.log('SyncOrchestrator destroyed');
    }
    /**
     * Initialize Redis channel subscriptions for sync operations
     */
    async initializeChannelSubscriptions() {
        // Subscribe to sync events
        await this.redisService.psubscribe(`${this.config.syncChannelPrefix}*`, async (message) => {
            await this.handleSyncMessage(message);
        });
        // Subscribe to conflict events
        await this.redisService.psubscribe(`${this.config.conflictChannelPrefix}*`, async (message) => {
            await this.handleConflictMessage(message);
        });
        this.logger.log('Channel subscriptions initialized');
    }
    /**
     * Load tenant contexts from database
     */
    async loadTenantContexts() {
        try {
            // Load tenant information from existing User table with tenant patterns
            const users = await this.dbService.user.findMany({
                select: {
                    id: true,
                    role: true,
                    // Add tenant-related fields as they exist in your schema
                },
            });
            for (const user of users) {
                const tenantId = user.id; // Using user ID as tenant ID for now
                const context = {
                    tenantId,
                    userId: user.id,
                    permissions: this.getUserPermissions(user.role),
                    isolationLevel: 'strict',
                };
                this.tenantContexts.set(tenantId, context);
            }
            this.metrics.resources.activeTenants = this.tenantContexts.size;
            this.logger.log(`Loaded ${this.tenantContexts.size} tenant contexts`);
        }
        catch (error) {
            this.logger.error('Failed to load tenant contexts:', error);
        }
    }
    /**
     * Sync tenant-specific data across all instances
     */
    async syncTenantData(tenantId, dataType, data) {
        const startTime = Date.now();
        try {
            // Validate tenant context
            const context = this.tenantContexts.get(tenantId);
            if (!context) {
                throw new Error(`Tenant context not found: ${tenantId}`);
            }
            // Create sync operation
            const operation = {
                id: this.generateOperationId(),
                type: 'sync',
                resourceType: dataType,
                resourceId: data.id || this.generateResourceId(),
                tenantId,
                data,
                priority: this.getSyncPriority(dataType),
                retryCount: 0,
                maxRetries: this.config.retryAttempts,
                createdAt: new Date(),
            };
            // Store operation state
            this.activeSyncOperations.set(operation.id, operation);
            // Create or update sync state in database
            await this.updateSyncState(operation);
            // Publish sync event to Redis
            const channel = `${this.config.syncChannelPrefix}${tenantId}:${dataType}`;
            await this.redisService.publish(channel, {
                operation,
                timestamp: Date.now(),
            });
            // Send real-time updates via WebSocket
            await this.broadcastSyncUpdate(tenantId, operation);
            // Update metrics
            this.updateSyncMetrics(startTime, true);
            this.metrics.operations.sync++;
            this.emit('sync_operation_completed', {
                agentId: tenantId,
                operation: { type: dataType },
                duration: Date.now() - startTime,
                tenantId,
            });
            this.logger.debug(`Synced ${dataType} for tenant ${tenantId}`);
        }
        catch (error) {
            this.updateSyncMetrics(startTime, false);
            this.emit('sync_operation_failed', {
                agentId: tenantId,
                operation: { type: dataType },
                error,
                tenantId,
            });
            this.logger.error(`Failed to sync tenant data:`, error);
            throw error;
        }
    }
    /**
     * Sync global data across all tenants
     */
    async syncGlobalData(dataType, data) {
        const startTime = Date.now();
        try {
            const operation = {
                id: this.generateOperationId(),
                type: 'sync',
                resourceType: dataType,
                resourceId: data.id || this.generateResourceId(),
                data,
                priority: this.getSyncPriority(dataType),
                retryCount: 0,
                maxRetries: this.config.retryAttempts,
                createdAt: new Date(),
            };
            // Store operation state
            this.activeSyncOperations.set(operation.id, operation);
            // Update sync state in database
            await this.updateSyncState(operation);
            // Publish to global sync channel
            const channel = `${this.config.syncChannelPrefix}global:${dataType}`;
            await this.redisService.publish(channel, {
                operation,
                timestamp: Date.now(),
            });
            // Broadcast to all connected users
            try {
                await this.wsService.broadcastToAllUsers({
                    id: this.generateMessageId(),
                    type: 'sync_update',
                    payload: {
                        operation,
                        dataType,
                        global: true,
                    },
                    timestamp: Date.now(),
                    priority: 2, // HIGH priority
                });
            }
            catch (error) {
                // Log WebSocket errors but don't fail the sync operation
                this.logger.warn('Failed to broadcast global sync update via WebSocket:', error);
            }
            this.updateSyncMetrics(startTime, true);
            this.metrics.operations.sync++;
            this.logger.debug(`Synced global ${dataType}`);
        }
        catch (error) {
            this.updateSyncMetrics(startTime, false);
            this.logger.error(`Failed to sync global data:`, error);
            throw error;
        }
    }
    /**
     * Sync agent state via existing AgentWebSocketService
     */
    async syncAgentState(agentId, state) {
        try {
            // Update agent in database using existing patterns
            const updatedAgent = await this.dbService.agent.update({
                where: { id: agentId },
                data: {
                    status: state.status, // Cast to match your AgentStatus enum
                    metadata: state.metadata,
                    updatedAt: new Date(),
                },
            });
            // Determine tenant ID from agent (assuming agent has user relationship)
            const tenantId = updatedAgent.userId || 'global';
            // Sync via tenant-aware method
            const { id, ...restOfState } = state;
            await this.syncTenantData(tenantId, 'agent', {
                ...restOfState,
                updatedAgent,
            });
            this.logger.debug(`Synced agent state for agent ${agentId}`);
        }
        catch (error) {
            this.logger.error(`Failed to sync agent state:`, error);
            throw error;
        }
    }
    /**
     * Sync prompt templates using existing PromptTemplateServiceImpl
     */
    async syncPromptTemplates(templates) {
        try {
            for (const template of templates) {
                // Update template using existing service
                if (template.id) {
                    await this.promptTemplateService.updateTemplate(template.id, template);
                }
                else {
                    await this.promptTemplateService.createTemplate(template);
                }
                // Sync template data
                await this.syncGlobalData('template', template);
            }
            this.logger.debug(`Synced ${templates.length} prompt templates`);
        }
        catch (error) {
            this.logger.error(`Failed to sync prompt templates:`, error);
            throw error;
        }
    }
    /**
     * Resolve synchronization conflicts
     */
    async resolveConflict(conflict) {
        try {
            const strategy = this.determineResolutionStrategy(conflict);
            let resolvedData;
            switch (strategy) {
                case 'latest_wins':
                    resolvedData = this.resolveLatestWins(conflict);
                    break;
                case 'merge':
                    resolvedData = await this.resolveMerge(conflict);
                    break;
                case 'manual':
                    // Queue for manual resolution
                    await this.queueManualResolution(conflict);
                    return { strategy, resolvedData: null };
                case 'rollback':
                    resolvedData = await this.resolveRollback(conflict);
                    break;
                default:
                    throw new Error(`Unknown resolution strategy: ${strategy}`);
            }
            // Update conflict in database
            await this.updateConflictResolution(conflict.id, {
                resolution: resolvedData,
                resolvedAt: new Date(),
                resolvedBy: 'system',
            });
            // Sync resolved data
            if (conflict.tenantId) {
                await this.syncTenantData(conflict.tenantId, conflict.resourceType, resolvedData);
            }
            else {
                await this.syncGlobalData(conflict.resourceType, resolvedData);
            }
            this.metrics.operations.conflicts++;
            this.logger.debug(`Resolved conflict ${conflict.id} using ${strategy}`);
            return { strategy, resolvedData };
        }
        catch (error) {
            this.logger.error(`Failed to resolve conflict:`, error);
            throw error;
        }
    }
    /**
     * Handle incoming sync messages from Redis
     */
    async handleSyncMessage(message) {
        try {
            const { operation } = JSON.parse(message.message);
            // Process sync operation
            await this.processSyncOperation(operation);
        }
        catch (error) {
            this.logger.error('Error handling sync message:', error);
        }
    }
    /**
     * Handle incoming conflict messages from Redis
     */
    async handleConflictMessage(message) {
        try {
            const conflict = JSON.parse(message.message);
            // Auto-resolve if possible, otherwise queue for manual resolution
            await this.resolveConflict(conflict);
        }
        catch (error) {
            this.logger.error('Error handling conflict message:', error);
        }
    }
    /**
     * Process sync operation
     */
    async processSyncOperation(operation) {
        try {
            // Check for conflicts
            const existingState = await this.getSyncState(operation.resourceType, operation.resourceId, operation.tenantId);
            if (existingState) {
                // Determine the actual conflict type using ConflictManager's logic
                const conflictType = this.conflictManager.determineConflictType(existingState, existingState.metadata, // localVersion is the existing state's metadata
                operation.data // remoteVersion is the incoming operation data
                );
                if (conflictType) {
                    await this.createConflict(operation, existingState, conflictType);
                    return;
                }
            }
            // Apply sync operation
            await this.applySyncOperation(operation);
            // Clean up
            this.activeSyncOperations.delete(operation.id);
        }
        catch (error) {
            this.logger.error('Error processing sync operation:', error);
            await this.retrySyncOperation(operation);
        }
    }
    /**
     * Update sync state in database
     */
    async updateSyncState(operation) {
        const checksum = this.calculateChecksum(operation.data);
        await this.dbService.syncState.upsert({
            where: {
                resourceType_resourceId_tenantId: {
                    resourceType: operation.resourceType,
                    resourceId: operation.resourceId,
                    tenantId: (operation.tenantId ?? null),
                },
            },
            create: {
                id: operation.id,
                resourceType: operation.resourceType,
                resourceId: operation.resourceId,
                tenantId: (operation.tenantId ?? null),
                version: 1,
                checksum,
                lastSync: new Date(),
                syncedBy: 'sync-orchestrator',
                metadata: operation.data,
            },
            update: {
                version: {
                    increment: 1,
                },
                checksum,
                lastSync: new Date(),
                syncedBy: 'sync-orchestrator',
                metadata: operation.data,
            },
        });
    }
    /**
     * Get sync state from database
     */
    async getSyncState(resourceType, resourceId, tenantId) {
        return this.dbService.syncState.findUnique({
            where: {
                resourceType_resourceId_tenantId: {
                    resourceType,
                    resourceId,
                    tenantId: (tenantId || null),
                },
            },
        });
    }
    /**
     * Broadcast sync update via WebSocket
     */
    async broadcastSyncUpdate(tenantId, operation) {
        try {
            const context = this.tenantContexts.get(tenantId);
            if (!context)
                return;
            // Send to specific user if tenant context has userId
            if (context.userId) {
                await this.wsService.sendMessage(context.userId, {
                    id: this.generateMessageId(),
                    type: 'sync_update',
                    payload: {
                        operation,
                        tenantId,
                        resourceType: operation.resourceType,
                    },
                    timestamp: Date.now(),
                    priority: 2, // HIGH priority
                });
            }
        }
        catch (error) {
            // Log WebSocket errors but don't fail the sync operation
            this.logger.warn('Failed to broadcast sync update via WebSocket:', error);
        }
    }
    /**
     * Utility methods
     */
    getUserPermissions(role) {
        // Map user roles to permissions based on your existing UserRole enum
        const rolePermissions = {
            ADMIN: ['read', 'write', 'delete', 'sync'],
            USER: ['read', 'write', 'sync'],
            VIEWER: ['read'],
        };
        return rolePermissions[role] || ['read'];
    }
    getSyncPriority(dataType) {
        const priorities = {
            agent: 1, // Highest priority
            task: 2,
            workflow: 2,
            template: 3,
            config: 3,
            user: 4,
            file: 5, // Lowest priority
            // CMS and other resource types default to priority 10
        };
        return priorities[dataType] || 10;
    }
    determineResolutionStrategy(conflict) {
        // Simple strategy determination - can be enhanced with more sophisticated logic
        switch (conflict.conflictType) {
            case 'version':
                return 'latest_wins';
            case 'checksum':
                return 'merge';
            case 'concurrent':
                // TNF Resonance Fix: Changed concurrent modifications from manual intervention to latest_wins
                // to address Turbo concurrency collisions. This can be made configurable if needed.
                return 'latest_wins';
            default:
                return 'latest_wins';
        }
    }
    resolveLatestWins(conflict) {
        // Return the version with the latest timestamp
        const localTime = new Date(conflict.localVersion.timestamp || 0);
        const remoteTime = new Date(conflict.remoteVersion.timestamp || 0);
        return localTime > remoteTime ? conflict.localVersion : conflict.remoteVersion;
    }
    async resolveMerge(conflict) {
        // Simple merge strategy - can be enhanced with more sophisticated merging
        return {
            ...conflict.localVersion,
            ...conflict.remoteVersion,
            mergedAt: new Date(),
            mergeStrategy: 'simple_merge',
        };
    }
    async resolveRollback(conflict) {
        // Rollback to a previous known good state
        const syncState = await this.getSyncState(conflict.resourceType, conflict.resourceId, conflict.tenantId);
        return syncState?.metadata || conflict.localVersion;
    }
    async queueManualResolution(conflict) {
        // Queue conflict for manual resolution
        await this.redisService.lpush('manual_conflicts', JSON.stringify(conflict));
    }
    async updateConflictResolution(conflictId, resolution) {
        await this.dbService.syncConflict.update({
            where: { id: conflictId },
            data: {
                resolvedAt: resolution.resolvedAt,
                resolvedBy: resolution.resolvedBy,
                resolution: resolution,
            },
        });
    }
    hasConflict(operation, existingState) {
        const operationChecksum = this.calculateChecksum(operation.data);
        return existingState.checksum !== operationChecksum;
    }
    async createConflict(operation, existingState, conflictType // Pass the determined conflict type
    ) {
        const conflict = {
            id: this.generateOperationId(),
            resourceType: operation.resourceType,
            resourceId: operation.resourceId,
            tenantId: operation.tenantId,
            conflictType: conflictType, // Use the determined conflict type
            localVersion: existingState.metadata,
            remoteVersion: operation.data,
            createdAt: new Date(),
        };
        // Store conflict in database
        await this.dbService.syncConflict.create({
            data: {
                id: conflict.id,
                resourceType: conflict.resourceType,
                resourceId: conflict.resourceId,
                tenantId: conflict.tenantId,
                conflictType: conflict.conflictType,
                localVersion: conflict.localVersion,
                remoteVersion: conflict.remoteVersion,
                createdAt: conflict.createdAt,
            },
        });
        // Publish conflict event
        const channel = `${this.config.conflictChannelPrefix}${operation.tenantId || 'global'}`;
        await this.redisService.publish(channel, conflict);
    }
    async applySyncOperation(operation) {
        // Apply the sync operation based on resource type
        switch (operation.resourceType) {
            case 'agent':
                await this.applyAgentSync(operation);
                break;
            case 'template':
                await this.applyTemplateSync(operation);
                break;
            case 'task':
                await this.applyTaskSync(operation);
                break;
            case 'workflow':
                await this.applyWorkflowSync(operation);
                break;
            default:
                this.logger.warn(`Unknown resource type for sync: ${operation.resourceType}`);
        }
    }
    async applyAgentSync(operation) {
        // Update agent using existing database patterns
        await this.dbService.agent.upsert({
            where: { id: operation.resourceId },
            update: {
                ...operation.data,
                updatedAt: new Date(),
            },
            create: {
                id: operation.resourceId,
                ...operation.data,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
    async applyTemplateSync(operation) {
        // Update template using existing service
        if (operation.data.id) {
            await this.promptTemplateService.updateTemplate(operation.data.id, operation.data);
        }
        else {
            await this.promptTemplateService.createTemplate(operation.data);
        }
    }
    async applyTaskSync(operation) {
        // Update task using existing database patterns
        await this.dbService.task.upsert({
            where: { id: operation.resourceId },
            update: {
                ...operation.data,
                updatedAt: new Date(),
            },
            create: {
                id: operation.resourceId,
                ...operation.data,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
    async applyWorkflowSync(operation) {
        // Update workflow using existing database patterns
        await this.dbService.workflow.upsert({
            where: { id: operation.resourceId },
            update: {
                ...operation.data,
                updatedAt: new Date(),
            },
            create: {
                id: operation.resourceId,
                ...operation.data,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        });
    }
    async retrySyncOperation(operation) {
        if (operation.retryCount >= operation.maxRetries) {
            this.logger.error(`Max retries exceeded for operation ${operation.id}`);
            this.activeSyncOperations.delete(operation.id);
            return;
        }
        operation.retryCount++;
        operation.scheduledAt = new Date(Date.now() + operation.retryCount * 1000);
        // Re-queue operation
        setTimeout(async () => {
            await this.processSyncOperation(operation);
        }, operation.retryCount * 1000);
    }
    calculateChecksum(data) {
        // Simple checksum calculation - can be enhanced with more sophisticated hashing
        const str = JSON.stringify(data);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString(16);
    }
    generateOperationId() {
        return `sync_op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateResourceId() {
        return `resource_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateMessageId() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    updateSyncMetrics(startTime, success) {
        const latency = Date.now() - startTime;
        this.metrics.performance.maxSyncLatency = Math.max(this.metrics.performance.maxSyncLatency, latency);
        // Update average latency
        const totalOps = this.metrics.operations.sync + this.metrics.operations.conflicts;
        this.metrics.performance.avgSyncLatency =
            totalOps > 0
                ? (this.metrics.performance.avgSyncLatency * (totalOps - 1) + latency) / totalOps
                : latency;
        // Update success rate
        if (success) {
            this.metrics.performance.successRate =
                (this.metrics.performance.successRate * (totalOps - 1) + 100) / totalOps;
        }
        else {
            this.metrics.performance.successRate =
                (this.metrics.performance.successRate * (totalOps - 1)) / totalOps;
        }
    }
    startMetricsCollection() {
        setInterval(() => {
            this.collectMetrics();
        }, 60000); // Collect metrics every minute
    }
    collectMetrics() {
        this.metrics.resources.pendingOperations = this.activeSyncOperations.size;
        this.metrics.resources.syncedResources = this.activeSyncOperations.size;
        // Log metrics periodically
        this.logger.debug('Sync metrics:', this.metrics);
    }
    async cleanup() {
        // Clean up active operations
        this.activeSyncOperations.clear();
        // Unsubscribe from Redis channels
        await this.redisService.punsubscribe(`${this.config.syncChannelPrefix}*`);
        await this.redisService.punsubscribe(`${this.config.conflictChannelPrefix}*`);
    }
    /**
     * Public API methods for monitoring and management
     */
    getMetrics() {
        return { ...this.metrics };
    }
    getActiveTenants() {
        return Array.from(this.tenantContexts.keys());
    }
    async getActiveOperations() {
        return Array.from(this.activeSyncOperations.values());
    }
    async getTenantContext(tenantId) {
        return this.tenantContexts.get(tenantId) || null;
    }
};
exports.SyncOrchestrator = SyncOrchestrator;
exports.SyncOrchestrator = SyncOrchestrator = SyncOrchestrator_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)('IWebSocketService')),
    __metadata("design:paramtypes", [infrastructure_1.UnifiedRedisService, Object, database_1.DrizzleService,
        prompt_templating_1.PromptTemplateServiceImpl,
        ConflictManager_1.ConflictManager // Inject ConflictManager
    ])
], SyncOrchestrator);
//# sourceMappingURL=SyncOrchestrator.js.map