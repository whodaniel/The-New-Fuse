import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter } from 'events';
import { PrismaClient, SyncConflict, AuthEvent } from '@the-new-fuse/database/generated/prisma';
import { BaseErrorHandler, ErrorSeverity, ErrorCategory } from '@the-new-fuse/core-error-handling';
import { SyncDatabaseService } from '../database/SyncDatabaseService';
import { 
  SyncConflictData, 
  ConflictResolution, 
  ConflictResolutionStrategy,
  SyncResourceType,
  TenantSyncContext 
} from '../types';

/**
 * Conflict-specific error interface
 */
interface ConflictError {
  code: number;
  message: string;
  timestamp: Date;
  correlationId?: string;
  retryable: boolean;
  severity: ErrorSeverity;
  category: ErrorCategory;
  resourceType: string;
  resourceId: string;
  tenantId?: string;
  conflictType: string;
  metadata?: Record<string, any>;
}

/**
 * Conflict resolution context
 */
interface ConflictResolutionContext {
  correlationId?: string;
  component: string;
  operation: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  requestId?: string;
  serviceId?: string;
}

/**
 * ConflictManager handles synchronization conflicts using existing database transaction patterns
 * Integrates with existing Prisma database infrastructure and audit logging
 */
@Injectable()
export class ConflictManager extends EventEmitter {
  private readonly logger = new Logger(ConflictManager.name);
  private errorHandler: BaseErrorHandler<ConflictError, ConflictResolutionContext>;

  constructor(
    private readonly prisma: PrismaClient,
    private readonly syncDb: SyncDatabaseService
  ) {
    super();
    this.errorHandler = new BaseErrorHandler<ConflictError, ConflictResolutionContext>({
      enableAutoRecovery: true,
      maxRecoveryAttempts: 3,
      statisticsInterval: 60000,
      enableLogging: true,
      logLevel: 'error'
    });
    this.initializeErrorHandling();
  }

  private initializeErrorHandling() {
    // We need to bind the methods to the errorHandler instance
    this.initializeDefaultRecoveryStrategies = this.initializeDefaultRecoveryStrategies.bind(this.errorHandler);
    this.initializeDefaultErrorHandlers = this.initializeDefaultErrorHandlers.bind(this.errorHandler);

    this.initializeDefaultRecoveryStrategies();
    this.initializeDefaultErrorHandlers();
  }

  /**
   * Detect conflicts for a resource
   */
  async detectConflict(
    resourceType: SyncResourceType,
    resourceId: string,
    localVersion: any,
    remoteVersion: any,
    tenantId?: string
  ): Promise<SyncConflict | null> {
    try {
      // Get current sync state
      const currentState = await this.syncDb.getSyncState(resourceType, resourceId, tenantId);
      
      if (!currentState) {
        // No existing state, no conflict
        return null;
      }

      // Detect conflict types
      const conflictType = this.determineConflictType(currentState, localVersion, remoteVersion);
      
      if (!conflictType) {
        // No conflict detected
        return null;
      }

      // Create conflict record using database transaction
      return await this.prisma.$transaction(async (tx) => {
        const conflict = await tx.syncConflict.create({
          data: {
            resourceType,
            resourceId,
            tenantId: tenantId || null,
            conflictType,
            localVersion: localVersion || {},
            remoteVersion: remoteVersion || {},
          },
        });

        // Log audit event
        await this.logAuditEvent(tx, {
          type: 'SYNC_CONFLICT_DETECTED',
          details: {
            conflictId: conflict.id,
            resourceType,
            resourceId,
            tenantId,
            conflictType,
          },
          tenantId,
        });

        this.logger.warn(`Conflict detected for ${resourceType}:${resourceId}`, {
          conflictId: conflict.id,
          conflictType,
          tenantId,
        });

        this.emit('conflict_detected', {
          agentId: tenantId,
          conflict,
          tenantId,
        });

        return conflict;
      });

    } catch (error) {
      const conflictError: ConflictError = {
        code: 5001,
        message: `Failed to detect conflict for ${resourceType}:${resourceId}`,
        timestamp: new Date(),
        retryable: true,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SYSTEM,
        resourceType,
        resourceId,
        tenantId,
        conflictType: 'detection_error',
        metadata: { originalError: error }
      };

      await this.errorHandler.handleError(conflictError, {
        component: 'ConflictManager',
        operation: 'detectConflict',
        tenantId,
        metadata: { resourceType, resourceId }
      });

      throw error;
    }
  }

  /**
   * Resolve a conflict using specified strategy
   */
  async resolveConflict(
    conflictId: string,
    strategy: ConflictResolutionStrategy,
    resolvedBy: string,
    context?: TenantSyncContext
  ): Promise<ConflictResolution> {
    try {
      return await this.prisma.$transaction(async (tx) => {
        // Get the conflict
        const conflict = await tx.syncConflict.findUnique({
          where: { id: conflictId },
        });

        if (!conflict) {
          throw new Error(`Conflict ${conflictId} not found`);
        }

        if (conflict.resolvedAt) {
          throw new Error(`Conflict ${conflictId} already resolved`);
        }

        // Apply resolution strategy
        const resolution = await this.applyResolutionStrategy(
          strategy,
          conflict,
          context
        );

        // Update conflict record
        const resolvedConflict = await tx.syncConflict.update({
          where: { id: conflictId },
          data: {
            resolvedAt: new Date(),
            resolvedBy,
            resolution: resolution.resolvedData,
          },
        });

        // Update sync state with resolved data
        await this.syncDb.upsertSyncState({
          resourceType: conflict.resourceType,
          resourceId: conflict.resourceId,
          tenantId: conflict.tenantId || undefined,
          version: (resolution.resolvedData as any)?.version || 1,
          checksum: this.calculateChecksum(resolution.resolvedData),
          lastSync: new Date(),
          syncedBy: resolvedBy,
          metadata: resolution.metadata,
        });

        // Log audit event
        await this.logAuditEvent(tx, {
          type: 'SYNC_CONFLICT_RESOLVED',
          details: {
            conflictId,
            strategy,
            resolvedBy,
            resourceType: conflict.resourceType,
            resourceId: conflict.resourceId,
            tenantId: conflict.tenantId,
            resolution: resolution.strategy,
          },
          tenantId: conflict.tenantId,
        });

        this.logger.log(`Conflict resolved: ${conflictId}`, {
          strategy,
          resolvedBy,
          resourceType: conflict.resourceType,
          resourceId: conflict.resourceId,
          tenantId: conflict.tenantId,
        });

        this.emit('conflict_resolved', {
          agentId: conflict.tenantId,
          conflict,
          tenantId: conflict.tenantId,
        });

        return resolution;
      });

    } catch (error) {
      const conflictError: ConflictError = {
        code: 5002,
        message: `Failed to resolve conflict ${conflictId}`,
        timestamp: new Date(),
        retryable: true,
        severity: ErrorSeverity.HIGH,
        category: ErrorCategory.SYSTEM,
        resourceType: 'unknown',
        resourceId: 'unknown',
        conflictType: 'resolution_error',
        metadata: { conflictId, strategy, originalError: error }
      };

      await this.errorHandler.handleError(conflictError, {
        component: 'ConflictManager',
        operation: 'resolveConflict',
        metadata: { conflictId, strategy }
      });

      throw error;
    }
  }

  /**
   * Get pending conflicts for a tenant
   */
  async getPendingConflicts(tenantId?: string): Promise<SyncConflict[]> {
    try {
      return await this.syncDb.getPendingConflicts(tenantId);
    } catch (error) {
      this.logger.error('Failed to get pending conflicts', { tenantId, error });
      throw error;
    }
  }

  /**
   * Get conflicts for a specific resource
   */
  async getResourceConflicts(
    resourceType: SyncResourceType,
    resourceId: string,
    tenantId?: string
  ): Promise<SyncConflict[]> {
    try {
      return await this.syncDb.getResourceConflicts(resourceType, resourceId, tenantId);
    } catch (error) {
      this.logger.error('Failed to get resource conflicts', { 
        resourceType, 
        resourceId, 
        tenantId, 
        error 
      });
      throw error;
    }
  }

  /**
   * Auto-resolve conflicts based on predefined rules
   */
  async autoResolveConflicts(tenantId?: string): Promise<number> {
    let resolvedCount = 0;

    try {
      const pendingConflicts = await this.getPendingConflicts(tenantId);

      for (const conflict of pendingConflicts) {
        try {
          const autoStrategy = this.determineAutoResolutionStrategy(conflict);
          
          if (autoStrategy) {
            await this.resolveConflict(
              conflict.id,
              autoStrategy,
              'system-auto-resolver',
              tenantId ? { tenantId, permissions: [], isolationLevel: 'strict' } : undefined
            );
            resolvedCount++;
          }
        } catch (error) {
          this.logger.warn(`Failed to auto-resolve conflict ${conflict.id}`, error);
        }
      }

      this.logger.log(`Auto-resolved ${resolvedCount} conflicts`, { tenantId });
      return resolvedCount;

    } catch (error) {
      this.logger.error('Failed to auto-resolve conflicts', { tenantId, error });
      throw error;
    }
  }

  /**
   * Clean up old resolved conflicts
   */
  async cleanupResolvedConflicts(olderThanDays: number = 30): Promise<number> {
    try {
      return await this.syncDb.cleanupResolvedConflicts(olderThanDays);
    } catch (error) {
      this.logger.error('Failed to cleanup resolved conflicts', { olderThanDays, error });
      throw error;
    }
  }

  /**
   * Get conflict statistics
   */
  async getConflictStatistics(tenantId?: string) {
    try {
      return await this.syncDb.getSyncStatistics(tenantId);
    } catch (error) {
      this.logger.error('Failed to get conflict statistics', { tenantId, error });
      throw error;
    }
  }

  /**
   * Initialize default recovery strategies
   */
  protected initializeDefaultRecoveryStrategies(): void {
    // Retry strategy for transient database errors
    this.errorHandler.registerRecoveryStrategy({
      name: 'database-retry',
      applicableErrorCodes: [5001, 5002, 5003],
      maxAttempts: 3,
      delay: 1000,
      recover: async (error, context) => {
        this.logger.debug(`Retrying database operation for error ${error.code}`);
        // Simple retry - the operation will be retried by the caller
        return true;
      }
    });

    // Conflict resolution fallback strategy
    this.errorHandler.registerRecoveryStrategy({
      name: 'conflict-fallback',
      applicableErrorCodes: [5002],
      maxAttempts: 1,
      delay: 0,
      recover: async (error, context) => {
        this.logger.warn(`Applying fallback resolution for conflict error`);
        // Could implement a safe fallback resolution here
        return false; // Let manual intervention handle it
      }
    });
  }

  /**
   * Initialize default error handlers
   */
  protected initializeDefaultErrorHandlers(): void {
    // Database connection error handler
    this.errorHandler.registerErrorHandler(5001, {
      name: 'database-connection-handler',
      canHandle: (error) => error.code === 5001,
      handle: async (error, context) => {
        this.logger.error('Database connection error in conflict detection', {
          error: error.message,
          context
        });
        // Could implement database health check here
      }
    });

    // Conflict resolution error handler
    this.errorHandler.registerErrorHandler(5002, {
      name: 'conflict-resolution-handler',
      canHandle: (error) => error.code === 5002,
      handle: async (error, context) => {
        this.logger.error('Conflict resolution error', {
          error: error.message,
          context
        });
        // Could implement escalation to manual resolution here
      }
    });
  }

  /**
   * Determine conflict type based on versions
   */
  private determineConflictType(
    currentState: any,
    localVersion: any,
    remoteVersion: any
  ): string | null {
    // Version conflict
    if (localVersion?.version && remoteVersion?.version) {
      if (localVersion.version !== remoteVersion.version) {
        return 'version';
      }
    }

    // Checksum conflict
    const localChecksum = this.calculateChecksum(localVersion);
    const remoteChecksum = this.calculateChecksum(remoteVersion);
    const currentChecksum = currentState.checksum;

    if (localChecksum !== currentChecksum && remoteChecksum !== currentChecksum) {
      return 'concurrent';
    }

    if (localChecksum !== remoteChecksum) {
      return 'checksum';
    }

    return null;
  }

  /**
   * Apply resolution strategy
   */
  private async applyResolutionStrategy(
    strategy: ConflictResolutionStrategy,
    conflict: SyncConflict,
    context?: TenantSyncContext
  ): Promise<ConflictResolution> {
    switch (strategy) {
      case 'latest_wins':
        return {
          strategy,
          resolvedData: conflict.remoteVersion,
          metadata: { 
            resolvedAt: new Date(),
            strategy: 'latest_wins',
            reason: 'Remote version selected as latest'
          }
        };

      case 'merge':
        return {
          strategy,
          resolvedData: this.mergeVersions(conflict.localVersion, conflict.remoteVersion),
          metadata: { 
            resolvedAt: new Date(),
            strategy: 'merge',
            reason: 'Versions merged automatically'
          }
        };

      case 'rollback':
        return {
          strategy,
          resolvedData: conflict.localVersion,
          metadata: { 
            resolvedAt: new Date(),
            strategy: 'rollback',
            reason: 'Rolled back to local version'
          }
        };

      case 'manual':
        throw new Error('Manual resolution strategy requires human intervention');

      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }
  }

  /**
   * Determine auto-resolution strategy for a conflict
   */
  private determineAutoResolutionStrategy(conflict: SyncConflict): ConflictResolutionStrategy | null {
    // Simple rules for auto-resolution
    switch (conflict.conflictType) {
      case 'version':
        // For version conflicts, prefer latest
        return 'latest_wins';
      
      case 'checksum':
        // For checksum conflicts, try merge if possible
        return this.canMerge(conflict.localVersion, conflict.remoteVersion) ? 'merge' : null;
      
      case 'concurrent':
        // Concurrent modifications require manual intervention
        return null;
      
      default:
        return null;
    }
  }

  /**
   * Check if versions can be merged automatically
   */
  private canMerge(localVersion: any, remoteVersion: any): boolean {
    // Simple merge compatibility check
    if (!localVersion || !remoteVersion) {
      return false;
    }

    // If both are objects, check for conflicting keys
    if (typeof localVersion === 'object' && typeof remoteVersion === 'object') {
      const localKeys = Object.keys(localVersion);
      const remoteKeys = Object.keys(remoteVersion);
      const commonKeys = localKeys.filter(key => remoteKeys.includes(key));
      
      // Check if common keys have different values
      for (const key of commonKeys) {
        if (JSON.stringify(localVersion[key]) !== JSON.stringify(remoteVersion[key])) {
          return false; // Conflicting values, can't auto-merge
        }
      }
      
      return true; // No conflicts, can merge
    }

    return false;
  }

  /**
   * Merge two versions
   */
  private mergeVersions(localVersion: any, remoteVersion: any): any {
    if (!localVersion) return remoteVersion;
    if (!remoteVersion) return localVersion;

    if (typeof localVersion === 'object' && typeof remoteVersion === 'object') {
      return {
        ...localVersion,
        ...remoteVersion,
        _mergedAt: new Date(),
        _mergeStrategy: 'auto'
      };
    }

    // For non-objects, prefer remote version
    return remoteVersion;
  }

  /**
   * Calculate checksum for data
   */
  private calculateChecksum(data: any): string {
    const crypto = require('crypto');
    const serialized = JSON.stringify(data, Object.keys(data || {}).sort());
    return crypto.createHash('sha256').update(serialized).digest('hex');
  }

  /**
   * Log audit event using existing AuthEvent table
   */
  private async logAuditEvent(
    tx: any,
    event: {
      type: string;
      details: any;
      tenantId?: string | null;
    }
  ): Promise<void> {
    try {
      // For system events, we'll use a system user ID or create a system event
      // Since we need a userId for AuthEvent, we'll use a system identifier
      const systemUserId = 'system-sync-manager';
      
      // Try to find or create a system user for audit logging
      let systemUser = await tx.user.findFirst({
        where: { username: systemUserId }
      });

      if (!systemUser) {
        // Create a system user for audit logging if it doesn't exist
        systemUser = await tx.user.create({
          data: {
            email: 'system-sync@thenewfuse.com',
            username: systemUserId,
            name: 'System Sync Manager',
            hashedPassword: 'system-account-no-login',
            role: 'ADMIN',
            isActive: false, // System account, not for login
          }
        });
      }

      await tx.authEvent.create({
        data: {
          userId: systemUser.id,
          type: event.type,
          details: {
            ...event.details,
            tenantId: event.tenantId,
            timestamp: new Date(),
            source: 'ConflictManager'
          }
        }
      });
    } catch (error) {
      // Don't fail the main operation if audit logging fails
      this.logger.warn('Failed to log audit event', { event, error });
    }
  }
}