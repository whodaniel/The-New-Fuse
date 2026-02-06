/**
 * Basic Integration Example
 *
 * Shows how to integrate sync-core into a NestJS service
 * for basic synchronization operations.
 */
import { OnModuleInit } from '@nestjs/common';
import { SyncOrchestrator } from '../src/services/SyncOrchestrator';
export declare class UserService implements OnModuleInit {
  private readonly syncOrchestrator;
  constructor(syncOrchestrator: SyncOrchestrator);
  onModuleInit(): Promise<void>;
  /**
   * Update user data with automatic sync
   */
  updateUser(userId: string, data: any, tenantId: string): Promise<any>;
  /**
   * Handle incoming sync events
   */
  private handleUserSync;
  /**
   * Bulk update with batching
   */
  bulkUpdateUsers(
    updates: Array<{
      id: string;
      data: any;
    }>,
    tenantId: string
  ): Promise<any>;
}
//# sourceMappingURL=basic-integration.d.ts.map
