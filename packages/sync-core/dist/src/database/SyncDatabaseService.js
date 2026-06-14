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
var SyncDatabaseService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncDatabaseService = void 0;
// @ts-nocheck
const common_1 = require("@nestjs/common");
const drizzle_1 = require("@the-new-fuse/database/generated/drizzle");
/**
 * Database service for sync operations
 * Integrates with existing Drizzle database infrastructure
 */
let SyncDatabaseService = SyncDatabaseService_1 = class SyncDatabaseService {
    constructor(drizzle) {
        this.drizzle = drizzle;
        this.logger = new common_1.Logger(SyncDatabaseService_1.name);
    }
    /**
     * Create or update sync state for a resource
     */
    async upsertSyncState(data) {
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
                        metadata: (data.metadata ?? drizzle_1.Drizzle.DbNull),
                    },
                });
            }
            else {
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
                        metadata: (data.metadata ?? drizzle_1.Drizzle.DbNull),
                    },
                });
            }
        }
        catch (error) {
            this.logger.error('Failed to upsert sync state', { data, error });
            throw error;
        }
    }
    /**
     * Get sync state for a resource
     */
    async getSyncState(resourceType, resourceId, tenantId) {
        try {
            return await this.drizzle.syncState.findFirst({
                where: {
                    resourceType,
                    resourceId,
                    tenantId: tenantId || null,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to get sync state', { resourceType, resourceId, tenantId, error });
            throw error;
        }
    }
    /**
     * Get all sync states for a tenant
     */
    async getTenantSyncStates(tenantId) {
        try {
            return await this.drizzle.syncState.findMany({
                where: { tenantId },
                orderBy: { lastSync: 'desc' },
            });
        }
        catch (error) {
            this.logger.error('Failed to get tenant sync states', { tenantId, error });
            throw error;
        }
    }
    /**
     * Get sync states by resource type
     */
    async getSyncStatesByType(resourceType, tenantId) {
        try {
            return await this.drizzle.syncState.findMany({
                where: {
                    resourceType,
                    ...(tenantId && { tenantId }),
                },
                orderBy: { lastSync: 'desc' },
            });
        }
        catch (error) {
            this.logger.error('Failed to get sync states by type', { resourceType, tenantId, error });
            throw error;
        }
    }
    /**
     * Delete sync state
     */
    async deleteSyncState(resourceType, resourceId, tenantId) {
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
        }
        catch (error) {
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
    async createSyncConflict(data) {
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
        }
        catch (error) {
            this.logger.error('Failed to create sync conflict', { data, error });
            throw error;
        }
    }
    /**
     * Resolve a sync conflict
     */
    async resolveSyncConflict(conflictId, resolvedBy, resolution) {
        try {
            return await this.drizzle.syncConflict.update({
                where: { id: conflictId },
                data: {
                    resolvedAt: new Date(),
                    resolvedBy,
                    resolution,
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to resolve sync conflict', { conflictId, resolvedBy, error });
            throw error;
        }
    }
    /**
     * Get pending conflicts for a tenant
     */
    async getPendingConflicts(tenantId) {
        try {
            return await this.drizzle.syncConflict.findMany({
                where: {
                    resolvedAt: null,
                    ...(tenantId && { tenantId }),
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch (error) {
            this.logger.error('Failed to get pending conflicts', { tenantId, error });
            throw error;
        }
    }
    /**
     * Get conflicts by resource
     */
    async getResourceConflicts(resourceType, resourceId, tenantId) {
        try {
            return await this.drizzle.syncConflict.findMany({
                where: {
                    resourceType,
                    resourceId,
                    ...(tenantId && { tenantId }),
                },
                orderBy: { createdAt: 'desc' },
            });
        }
        catch (error) {
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
    async cleanupResolvedConflicts(olderThanDays = 30) {
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
        }
        catch (error) {
            this.logger.error('Failed to cleanup resolved conflicts', { olderThanDays, error });
            throw error;
        }
    }
    /**
     * Get sync statistics
     */
    async getSyncStatistics(tenantId) {
        try {
            const [totalSyncStates, pendingConflicts, resolvedConflicts, recentSyncs] = await Promise.all([
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
        }
        catch (error) {
            this.logger.error('Failed to get sync statistics', { tenantId, error });
            throw error;
        }
    }
    /**
     * Health check for database connectivity
     */
    async healthCheck() {
        const startTime = Date.now();
        try {
            await this.drizzle.$queryRaw `SELECT 1`;
            const latency = Date.now() - startTime;
            return { status: 'healthy', latency };
        }
        catch (error) {
            const latency = Date.now() - startTime;
            this.logger.error('Database health check failed', error);
            return { status: 'unhealthy', latency };
        }
    }
};
exports.SyncDatabaseService = SyncDatabaseService;
exports.SyncDatabaseService = SyncDatabaseService = SyncDatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeof (_a = typeof drizzle_1.DrizzleClient !== "undefined" && drizzle_1.DrizzleClient) === "function" ? _a : Object])
], SyncDatabaseService);
//# sourceMappingURL=SyncDatabaseService.js.map