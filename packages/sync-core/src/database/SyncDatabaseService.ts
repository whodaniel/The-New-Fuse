import { Injectable, Logger } from '@nestjs/common';
import {
  and,
  DatabaseService,
  desc,
  eq,
  gte,
  isNotNull,
  isNull,
  lt,
  sql,
  syncConflicts,
  syncStates,
  type SyncConflict,
  type SyncState,
} from '@the-new-fuse/database';
import { SyncConflictData, SyncResourceType, SyncStateData } from '../types';

/**
 * Database service for sync operations
 * Integrates with the Drizzle database layer
 */
@Injectable()
export class SyncDatabaseService {
  private readonly logger = new Logger(SyncDatabaseService.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Create or update sync state for a resource
   */
  async upsertSyncState(data: Omit<SyncStateData, 'id'>): Promise<SyncState> {
    try {
      const tenantClause = data.tenantId
        ? eq(syncStates.tenantId, data.tenantId)
        : isNull(syncStates.tenantId);

      const [existing] = await this.db.client
        .select()
        .from(syncStates)
        .where(
          and(
            eq(syncStates.resourceType, data.resourceType),
            eq(syncStates.resourceId, data.resourceId),
            tenantClause
          )
        )
        .limit(1);

      if (existing) {
        const [updated] = await this.db.client
          .update(syncStates)
          .set({
            version: data.version,
            checksum: data.checksum,
            lastSync: data.lastSync,
            syncedBy: data.syncedBy,
            metadata: (data.metadata ?? {}) as any,
          })
          .where(eq(syncStates.id, existing.id))
          .returning();
        return updated;
      }

      const [created] = await this.db.client
        .insert(syncStates)
        .values({
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          tenantId: data.tenantId || null,
          version: data.version,
          checksum: data.checksum,
          lastSync: data.lastSync,
          syncedBy: data.syncedBy,
          metadata: (data.metadata ?? {}) as any,
        })
        .returning();
      return created;
    } catch (error) {
      this.logger.error('Failed to upsert sync state', { data, error });
      throw error;
    }
  }

  /**
   * Get sync state for a resource
   */
  async getSyncState(
    resourceType: string,
    resourceId: string,
    tenantId?: string
  ): Promise<SyncState | null> {
    try {
      const tenantClause = tenantId ? eq(syncStates.tenantId, tenantId) : isNull(syncStates.tenantId);
      const [state] = await this.db.client
        .select()
        .from(syncStates)
        .where(and(eq(syncStates.resourceType, resourceType), eq(syncStates.resourceId, resourceId), tenantClause))
        .limit(1);
      return state ?? null;
    } catch (error) {
      this.logger.error('Failed to get sync state', { resourceType, resourceId, tenantId, error });
      throw error;
    }
  }

  /**
   * Get all sync states for a tenant
   */
  async getTenantSyncStates(tenantId: string): Promise<SyncState[]> {
    try {
      return await this.db.client
        .select()
        .from(syncStates)
        .where(eq(syncStates.tenantId, tenantId))
        .orderBy(desc(syncStates.lastSync));
    } catch (error) {
      this.logger.error('Failed to get tenant sync states', { tenantId, error });
      throw error;
    }
  }

  /**
   * Get sync states by resource type
   */
  async getSyncStatesByType(
    resourceType: SyncResourceType,
    tenantId?: string
  ): Promise<SyncState[]> {
    try {
      const whereClause = tenantId
        ? and(eq(syncStates.resourceType, resourceType), eq(syncStates.tenantId, tenantId))
        : eq(syncStates.resourceType, resourceType);

      return await this.db.client.select().from(syncStates).where(whereClause).orderBy(desc(syncStates.lastSync));
    } catch (error) {
      this.logger.error('Failed to get sync states by type', { resourceType, tenantId, error });
      throw error;
    }
  }

  /**
   * Delete sync state
   */
  async deleteSyncState(
    resourceType: string,
    resourceId: string,
    tenantId?: string
  ): Promise<void> {
    try {
      const tenantClause = tenantId ? eq(syncStates.tenantId, tenantId) : isNull(syncStates.tenantId);
      await this.db.client
        .delete(syncStates)
        .where(and(eq(syncStates.resourceType, resourceType), eq(syncStates.resourceId, resourceId), tenantClause));
    } catch (error) {
      this.logger.error('Failed to delete sync state', {
        resourceType,
        resourceId,
        tenantId,
        error,
      });
      throw error;
    }
  }

  /**
   * Create a sync conflict record
   */
  async createSyncConflict(
    data: Omit<SyncConflictData, 'id' | 'createdAt'>
  ): Promise<SyncConflict> {
    try {
      const [created] = await this.db.client
        .insert(syncConflicts)
        .values({
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          tenantId: data.tenantId || null,
          conflictType: data.conflictType,
          localVersion: data.localVersion,
          remoteVersion: data.remoteVersion,
          resolvedAt: data.resolvedAt || null,
          resolvedBy: data.resolvedBy || null,
          resolution: data.resolution || null,
        })
        .returning();
      return created;
    } catch (error) {
      this.logger.error('Failed to create sync conflict', { data, error });
      throw error;
    }
  }

  /**
   * Resolve a sync conflict
   */
  async resolveSyncConflict(
    conflictId: string,
    resolvedBy: string,
    resolution: any
  ): Promise<SyncConflict> {
    try {
      const [updated] = await this.db.client
        .update(syncConflicts)
        .set({
          resolvedAt: new Date(),
          resolvedBy,
          resolution,
        })
        .where(eq(syncConflicts.id, conflictId))
        .returning();
      return updated;
    } catch (error) {
      this.logger.error('Failed to resolve sync conflict', { conflictId, resolvedBy, error });
      throw error;
    }
  }

  /**
   * Get pending conflicts for a tenant
   */
  async getPendingConflicts(tenantId?: string): Promise<SyncConflict[]> {
    try {
      const whereClause = tenantId
        ? and(isNull(syncConflicts.resolvedAt), eq(syncConflicts.tenantId, tenantId))
        : isNull(syncConflicts.resolvedAt);

      return await this.db.client
        .select()
        .from(syncConflicts)
        .where(whereClause)
        .orderBy(desc(syncConflicts.createdAt));
    } catch (error) {
      this.logger.error('Failed to get pending conflicts', { tenantId, error });
      throw error;
    }
  }

  /**
   * Get conflicts by resource
   */
  async getResourceConflicts(
    resourceType: string,
    resourceId: string,
    tenantId?: string
  ): Promise<SyncConflict[]> {
    try {
      const whereClause = tenantId
        ? and(
            eq(syncConflicts.resourceType, resourceType),
            eq(syncConflicts.resourceId, resourceId),
            eq(syncConflicts.tenantId, tenantId)
          )
        : and(eq(syncConflicts.resourceType, resourceType), eq(syncConflicts.resourceId, resourceId));

      return await this.db.client
        .select()
        .from(syncConflicts)
        .where(whereClause)
        .orderBy(desc(syncConflicts.createdAt));
    } catch (error) {
      this.logger.error('Failed to get resource conflicts', {
        resourceType,
        resourceId,
        tenantId,
        error,
      });
      throw error;
    }
  }

  /**
   * Clean up old resolved conflicts
   */
  async cleanupResolvedConflicts(olderThanDays: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

      const deleted = await this.db.client
        .delete(syncConflicts)
        .where(and(isNotNull(syncConflicts.resolvedAt), lt(syncConflicts.resolvedAt, cutoffDate)))
        .returning({ id: syncConflicts.id });

      const deletedCount = deleted.length;
      this.logger.log(`Cleaned up ${deletedCount} resolved conflicts older than ${olderThanDays} days`);
      return deletedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup resolved conflicts', { olderThanDays, error });
      throw error;
    }
  }

  /**
   * Get sync statistics
   */
  async getSyncStatistics(tenantId?: string) {
    try {
      const syncStateWhere = tenantId ? eq(syncStates.tenantId, tenantId) : undefined;
      const conflictTenantWhere = tenantId ? eq(syncConflicts.tenantId, tenantId) : undefined;

      const [totalSyncStates, pendingConflicts, resolvedConflicts, recentSyncs] = await Promise.all([
        this.db.client
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(syncStates)
          .where(syncStateWhere)
          .then((rows) => rows[0]?.count ?? 0),
        this.db.client
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(syncConflicts)
          .where(conflictTenantWhere ? and(isNull(syncConflicts.resolvedAt), conflictTenantWhere) : isNull(syncConflicts.resolvedAt))
          .then((rows) => rows[0]?.count ?? 0),
        this.db.client
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(syncConflicts)
          .where(conflictTenantWhere ? and(isNotNull(syncConflicts.resolvedAt), conflictTenantWhere) : isNotNull(syncConflicts.resolvedAt))
          .then((rows) => rows[0]?.count ?? 0),
        this.db.client
          .select({ count: sql<number>`cast(count(*) as integer)` })
          .from(syncStates)
          .where(
            syncStateWhere
              ? and(syncStateWhere, gte(syncStates.lastSync, new Date(Date.now() - 24 * 60 * 60 * 1000)))
              : gte(syncStates.lastSync, new Date(Date.now() - 24 * 60 * 60 * 1000))
          )
          .then((rows) => rows[0]?.count ?? 0),
      ]);

      return {
        totalSyncStates,
        pendingConflicts,
        resolvedConflicts,
        recentSyncs,
        conflictRate:
          totalSyncStates > 0 ? (pendingConflicts + resolvedConflicts) / totalSyncStates : 0,
      };
    } catch (error) {
      this.logger.error('Failed to get sync statistics', { tenantId, error });
      throw error;
    }
  }

  /**
   * Health check for database connectivity
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; latency: number }> {
    const startTime = Date.now();
    try {
      await this.db.client.execute(sql`SELECT 1`);
      const latency = Date.now() - startTime;
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error('Database health check failed', error);
      return { status: 'unhealthy', latency };
    }
  }
}
