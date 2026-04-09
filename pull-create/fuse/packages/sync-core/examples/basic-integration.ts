/**
 * Basic Integration Example
 *
 * Shows how to integrate sync-core into a NestJS service
 * for basic synchronization operations.
 */

import { Injectable, OnModuleInit } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    private readonly syncOrchestrator: SyncOrchestrator,
  ) {}

  async onModuleInit() {
    // Subscribe to user data changes
    this.syncOrchestrator.subscribe('user', this.handleUserSync.bind(this));
  }

  /**
   * Update user data with automatic sync
   */
  async updateUser(userId: string, data: any, tenantId: string) {
    // 1. Update in local database
    const updatedUser = await this.database.users.update({
      where: { id: userId },
      data,
    });

    // 2. Sync across all instances
    await this.syncOrchestrator.syncTenantData(
      tenantId,
      'user',
      {
        id: userId,
        ...data,
        version: updatedUser.version,
        updatedAt: updatedUser.updatedAt,
      }
    );

    return updatedUser;
  }

  /**
   * Handle incoming sync events
   */
  private handleUserSync(event: any) {
    console.log('User sync event received:', event);

    // Update local cache, trigger UI refresh, etc.
    this.cache.set(`user:${event.resourceId}`, event.data);
    this.websocket.broadcast('user:updated', event.data);
  }

  /**
   * Bulk update with batching
   */
  async bulkUpdateUsers(updates: Array<{id: string, data: any}>, tenantId: string) {
    // Update database
    const results = await Promise.all(
      updates.map(({id, data}) =>
        this.database.users.update({ where: { id }, data })
      )
    );

    // Batch sync operations
    await Promise.all(
      results.map(user =>
        this.syncOrchestrator.syncTenantData(
          tenantId,
          'user',
          { id: user.id, ...user }
        )
      )
    );

    return results;
  }
}
