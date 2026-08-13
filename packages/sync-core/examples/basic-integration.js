/**
 * Basic Integration Example
 *
 * Shows how to integrate sync-core into a NestJS service
 * for basic synchronization operations.
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';
let UserService = class UserService {
    syncOrchestrator;
    constructor(syncOrchestrator) {
        this.syncOrchestrator = syncOrchestrator;
    }
    async onModuleInit() {
        // Subscribe to user data changes
        this.syncOrchestrator.subscribe('user', this.handleUserSync.bind(this));
    }
    /**
     * Update user data with automatic sync
     */
    async updateUser(userId, data, tenantId) {
        // 1. Update in local database
        const updatedUser = await this.database.users.update({
            where: { id: userId },
            data,
        });
        // 2. Sync across all instances
        await this.syncOrchestrator.syncTenantData(tenantId, 'user', {
            id: userId,
            ...data,
            version: updatedUser.version,
            updatedAt: updatedUser.updatedAt,
        });
        return updatedUser;
    }
    /**
     * Handle incoming sync events
     */
    handleUserSync(event) {
        console.log('User sync event received:', event);
        // Update local cache, trigger UI refresh, etc.
        this.cache.set(`user:${event.resourceId}`, event.data);
        this.websocket.broadcast('user:updated', event.data);
    }
    /**
     * Bulk update with batching
     */
    async bulkUpdateUsers(updates, tenantId) {
        // Update database
        const results = await Promise.all(updates.map(({ id, data }) => this.database.users.update({ where: { id }, data })));
        // Batch sync operations
        await Promise.all(results.map(user => this.syncOrchestrator.syncTenantData(tenantId, 'user', { id: user.id, ...user })));
        return results;
    }
};
UserService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [SyncOrchestrator])
], UserService);
export { UserService };
//# sourceMappingURL=basic-integration.js.map