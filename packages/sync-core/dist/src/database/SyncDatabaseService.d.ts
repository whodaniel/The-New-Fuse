import { DrizzleClient, SyncConflict, SyncState } from '@the-new-fuse/database/generated/drizzle';
import { SyncConflictData, SyncResourceType, SyncStateData } from '../types';
/**
 * Database service for sync operations
 * Integrates with existing Drizzle database infrastructure
 */
export declare class SyncDatabaseService {
    private readonly drizzle;
    private readonly logger;
    constructor(drizzle: DrizzleClient);
    /**
     * Create or update sync state for a resource
     */
    upsertSyncState(data: Omit<SyncStateData, 'id'>): Promise<SyncState>;
    /**
     * Get sync state for a resource
     */
    getSyncState(resourceType: string, resourceId: string, tenantId?: string): Promise<SyncState | null>;
    /**
     * Get all sync states for a tenant
     */
    getTenantSyncStates(tenantId: string): Promise<SyncState[]>;
    /**
     * Get sync states by resource type
     */
    getSyncStatesByType(resourceType: SyncResourceType, tenantId?: string): Promise<SyncState[]>;
    /**
     * Delete sync state
     */
    deleteSyncState(resourceType: string, resourceId: string, tenantId?: string): Promise<void>;
    /**
     * Create a sync conflict record
     */
    createSyncConflict(data: Omit<SyncConflictData, 'id' | 'createdAt'>): Promise<SyncConflict>;
    /**
     * Resolve a sync conflict
     */
    resolveSyncConflict(conflictId: string, resolvedBy: string, resolution: any): Promise<SyncConflict>;
    /**
     * Get pending conflicts for a tenant
     */
    getPendingConflicts(tenantId?: string): Promise<SyncConflict[]>;
    /**
     * Get conflicts by resource
     */
    getResourceConflicts(resourceType: string, resourceId: string, tenantId?: string): Promise<SyncConflict[]>;
    /**
     * Clean up old resolved conflicts
     */
    cleanupResolvedConflicts(olderThanDays?: number): Promise<number>;
    /**
     * Get sync statistics
     */
    getSyncStatistics(tenantId?: string): Promise<{
        totalSyncStates: any;
        pendingConflicts: any;
        resolvedConflicts: any;
        recentSyncs: any;
        conflictRate: number;
    }>;
    /**
     * Health check for database connectivity
     */
    healthCheck(): Promise<{
        status: 'healthy' | 'unhealthy';
        latency: number;
    }>;
}
//# sourceMappingURL=SyncDatabaseService.d.ts.map