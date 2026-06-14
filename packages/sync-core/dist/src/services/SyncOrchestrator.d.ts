import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { DrizzleService } from '@the-new-fuse/database';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { PromptTemplateServiceImpl } from '@the-new-fuse/prompt-templating';
import { EventEmitter } from 'events';
import { ConflictResolution, SyncConflictData, SyncMetrics, SyncOperation, SyncResourceType, TenantSyncContext } from '../types';
export interface AgentState {
    id: string;
    status: string;
    metadata?: Record<string, any>;
    lastUpdate: Date;
}
export interface WebSocketMessage {
    id: string;
    type: string;
    payload: any;
    timestamp: number;
    userId?: string;
    agentId?: string;
    priority?: number;
    requiresAck?: boolean;
}
export interface IWebSocketService {
    sendMessage(userId: string, message: WebSocketMessage): Promise<boolean>;
    broadcastToAllUsers(message: WebSocketMessage): Promise<number>;
}
export interface SyncOrchestratorConfig {
    syncChannelPrefix: string;
    conflictChannelPrefix: string;
    batchSize: number;
    syncTimeout: number;
    retryAttempts: number;
    tenantIsolationEnabled: boolean;
}
export declare class SyncOrchestrator extends EventEmitter implements OnModuleInit, OnModuleDestroy {
    private readonly redisService;
    private readonly wsService;
    private readonly dbService;
    private readonly promptTemplateService;
    private readonly logger;
    private readonly config;
    private metrics;
    private activeSyncOperations;
    private tenantContexts;
    constructor(redisService: UnifiedRedisService, wsService: IWebSocketService, dbService: DrizzleService, promptTemplateService: PromptTemplateServiceImpl);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    /**
     * Initialize Redis channel subscriptions for sync operations
     */
    private initializeChannelSubscriptions;
    /**
     * Load tenant contexts from database
     */
    private loadTenantContexts;
    /**
     * Sync tenant-specific data across all instances
     */
    syncTenantData(tenantId: string, dataType: SyncResourceType, data: any): Promise<void>;
    /**
     * Sync global data across all tenants
     */
    syncGlobalData(dataType: SyncResourceType, data: any): Promise<void>;
    /**
     * Sync agent state via existing AgentWebSocketService
     */
    syncAgentState(agentId: string, state: AgentState): Promise<void>;
    /**
     * Sync prompt templates using existing PromptTemplateServiceImpl
     */
    syncPromptTemplates(templates: any[]): Promise<void>;
    /**
     * Resolve synchronization conflicts
     */
    resolveConflict(conflict: SyncConflictData): Promise<ConflictResolution>;
    /**
     * Handle incoming sync messages from Redis
     */
    private handleSyncMessage;
    /**
     * Handle incoming conflict messages from Redis
     */
    private handleConflictMessage;
    /**
     * Process sync operation
     */
    private processSyncOperation;
    /**
     * Update sync state in database
     */
    private updateSyncState;
    /**
     * Get sync state from database
     */
    private getSyncState;
    /**
     * Broadcast sync update via WebSocket
     */
    private broadcastSyncUpdate;
    /**
     * Utility methods
     */
    private getUserPermissions;
    private getSyncPriority;
    private determineResolutionStrategy;
    private resolveLatestWins;
    private resolveMerge;
    private resolveRollback;
    private queueManualResolution;
    private updateConflictResolution;
    private hasConflict;
    private createConflict;
    private applySyncOperation;
    private applyAgentSync;
    private applyTemplateSync;
    private applyTaskSync;
    private applyWorkflowSync;
    private retrySyncOperation;
    private calculateChecksum;
    private generateOperationId;
    private generateResourceId;
    private generateMessageId;
    private updateSyncMetrics;
    private startMetricsCollection;
    private collectMetrics;
    private cleanup;
    /**
     * Public API methods for monitoring and management
     */
    getMetrics(): SyncMetrics;
    getActiveTenants(): string[];
    getActiveOperations(): Promise<SyncOperation[]>;
    getTenantContext(tenantId: string): Promise<TenantSyncContext | null>;
}
//# sourceMappingURL=SyncOrchestrator.d.ts.map