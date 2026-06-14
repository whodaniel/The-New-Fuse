import { DrizzleClient, SyncConflict } from '@the-new-fuse/database/generated/drizzle';
import { EventEmitter } from 'events';
import { SyncDatabaseService } from '../database/SyncDatabaseService';
import { ConflictResolution, ConflictResolutionStrategy, SyncResourceType, TenantSyncContext } from '../types';
/**
 * ConflictManager handles synchronization conflicts using existing database transaction patterns
 * Integrates with existing Drizzle database infrastructure and audit logging
 */
export declare class ConflictManager extends EventEmitter {
    private readonly drizzle;
    private readonly syncDb;
    private readonly logger;
    private errorHandler;
    constructor(drizzle: DrizzleClient, syncDb: SyncDatabaseService);
    private initializeErrorHandling;
    /**
     * Detect conflicts for a resource
     */
    detectConflict(resourceType: SyncResourceType, resourceId: string, localVersion: any, remoteVersion: any, tenantId?: string): Promise<SyncConflict | null>;
    /**
     * Resolve a conflict using specified strategy
     */
    resolveConflict(conflictId: string, strategy: ConflictResolutionStrategy, resolvedBy: string, context?: TenantSyncContext): Promise<ConflictResolution>;
    /**
     * Get pending conflicts for a tenant
     */
    getPendingConflicts(tenantId?: string): Promise<SyncConflict[]>;
    /**
     * Get conflicts for a specific resource
     */
    getResourceConflicts(resourceType: SyncResourceType, resourceId: string, tenantId?: string): Promise<SyncConflict[]>;
    /**
     * Auto-resolve conflicts based on predefined rules
     */
    autoResolveConflicts(tenantId?: string): Promise<number>;
    /**
     * Clean up old resolved conflicts
     */
    cleanupResolvedConflicts(olderThanDays?: number): Promise<number>;
    /**
     * Get conflict statistics
     */
    getConflictStatistics(tenantId?: string): Promise<{
        totalSyncStates: any;
        pendingConflicts: any;
        resolvedConflicts: any;
        recentSyncs: any;
        conflictRate: number;
    }>;
    /**
     * Initialize default recovery strategies
     */
    protected initializeDefaultRecoveryStrategies(): void;
    /**
     * Initialize default error handlers
     */
    protected initializeDefaultErrorHandlers(): void;
    /**
     * Determine conflict type based on versions
     */
    private determineConflictType;
    /**
     * Apply resolution strategy
     */
    private applyResolutionStrategy;
    /**
     * Determine auto-resolution strategy for a conflict
     */
    private determineAutoResolutionStrategy;
    /**
     * Check if versions can be merged automatically
     */
    private canMerge;
    /**
     * Merge two versions
     */
    private mergeVersions;
    /**
     * Calculate checksum for data
     */
    private calculateChecksum;
    /**
     * Log audit event using existing AuthEvent table
     */
    private logAuditEvent;
}
//# sourceMappingURL=ConflictManager.d.ts.map