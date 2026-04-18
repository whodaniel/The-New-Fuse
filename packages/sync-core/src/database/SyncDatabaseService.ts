import { Injectable, Logger } from '@nestjs/common';
import { Drizzle, DrizzleClient, SyncState, SyncConflict } from '@the-new-fuse/database/generated/drizzle';
import { SyncStateData, SyncConflictData, SyncResourceType } from '../types';

/**
 * Database service for sync operations
 * Integrates with existing Drizzle database infrastructure
 */
@Injectable()
export class SyncDatabaseService {
  private readonly logger = new Logger(SyncDatabaseService.name);

  constructor(private readonly drizzle: DrizzleClient) {}

  /**
   * Create or update sync state for a resource
   */
  async upsertSyncState(data: Omit<SyncStateData, 'id'>): Promise<SyncState> {
    try {
      // First try to find existing record
      const existing = await this.drizzle.syncState.findFirst({
        where: {
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          tenantId: data.tenantId || null,
        },
      });

      if (existing) {
        // Update existing record
        return await this.drizzle.syncState.update({
          where: { id: existing.id },
          data: {
            version: data.version,
            checksum: data.checksum,
            lastSync: data.lastSync,
            syncedBy: data.syncedBy,
            metadata: (data.metadata ?? Drizzle.DbNull) as any,
          },
        });
      } else {
        // Create new record
        return await this.drizzle.syncState.create({
          data: {
            resourceType: data.resourceType,
            resourceId: data.resourceId,
            tenantId: data.tenantId || null,
            version: data.version,
            checksum: data.checksum,
            lastSync: data.lastSync,
            syncedBy: data.syncedBy,
            metadata: (data.metadata ?? Drizzle.DbNull) as any,
          },
        });
      }
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
      return await this.drizzle.syncState.findFirst({
        where: {
          resourceType,
          resourceId,
          tenantId: tenantId || null,
        },
      });
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
      return await this.drizzle.syncState.findMany({
        where: { tenantId },
        orderBy: { lastSync: 'desc' },
      });
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
      return await this.drizzle.syncState.findMany({
        where: {
          resourceType,
          ...(tenantId && { tenantId }),
        },
        orderBy: { lastSync: 'desc' },
      });
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
      const existing = await this.drizzle.syncState.findFirst({
        where: {
          resourceType,
          resourceId,
          tenantId: tenantId || null,
        },
      });

      if (existing) {
        await this.drizzle.syncState.delete({
          where: { id: existing.id },
        });
      }
    } catch (error) {
      this.logger.error('Failed to delete sync state', { resourceType, resourceId, tenantId, error });
      throw error;
    }
  }

  /**
   * Create a sync conflict record
   */
  async createSyncConflict(data: Omit<SyncConflictData, 'id' | 'createdAt'>): Promise<SyncConflict> {
    try {
      return await this.drizzle.syncConflict.create({
        data: {
          resourceType: data.resourceType,
          resourceId: data.resourceId,
          tenantId: data.tenantId || null,
          conflictType: data.conflictType,
          localVersion: data.localVersion,
          remoteVersion: data.remoteVersion,
          resolvedAt: data.resolvedAt || null,
          resolvedBy: data.resolvedBy || null,
          resolution: data.resolution || null,
        },
      });
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
      return await this.drizzle.syncConflict.update({
        where: { id: conflictId },
        data: {
          resolvedAt: new Date(),
          resolvedBy,
          resolution,
        },
      });
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
      return await this.drizzle.syncConflict.findMany({
        where: {
          resolvedAt: null,
          ...(tenantId && { tenantId }),
        },
        orderBy: { createdAt: 'desc' },
      });
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
      return await this.drizzle.syncConflict.findMany({
        where: {
          resourceType,
          resourceId,
          ...(tenantId && { tenantId }),
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error('Failed to get resource conflicts', { resourceType, resourceId, tenantId, error });
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

      const result = await this.drizzle.syncConflict.deleteMany({
        where: {
          resolvedAt: {
            not: null,
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Cleaned up ${result.count} resolved conflicts older than ${olderThanDays} days`);
      return result.count;
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
      const [
        totalSyncStates,
        pendingConflicts,
        resolvedConflicts,
        recentSyncs,
      ] = await Promise.all([
        this.drizzle.syncState.count({
          where: tenantId ? { tenantId } : {},
        }),
        this.drizzle.syncConflict.count({
          where: {
            resolvedAt: null,
            ...(tenantId && { tenantId }),
          },
        }),
        this.drizzle.syncConflict.count({
          where: {
            resolvedAt: { not: null },
            ...(tenantId && { tenantId }),
          },
        }),
        this.drizzle.syncState.count({
          where: {
            lastSync: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
            ...(tenantId && { tenantId }),
          },
        }),
      ]);

      return {
        totalSyncStates,
        pendingConflicts,
        resolvedConflicts,
        recentSyncs,
        conflictRate: totalSyncStates > 0 ? (pendingConflicts + resolvedConflicts) / totalSyncStates : 0,
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
      await this.drizzle.$queryRaw`SELECT 1`;
      const latency = Date.now() - startTime;
      return { status: 'healthy', latency };
    } catch (error) {
      const latency = Date.now() - startTime;
      this.logger.error('Database health check failed', error);
      return { status: 'unhealthy', latency };
    }
  }
}