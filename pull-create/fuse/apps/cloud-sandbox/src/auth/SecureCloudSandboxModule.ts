/**
 * Secure Cloud Sandbox Module
 *
 * Integrates all security components for the cloud sandbox:
 * - Authentication (JWT + API keys)
 * - Authorization (RBAC + capability-based)
 * - Tenant isolation (quotas + rate limiting)
 * - Audit logging
 *
 * This module provides a secure wrapper around MCP tool execution.
 */

import { AuditLogger } from './AuditLogger';
import {
  AuthenticatedUser,
  AuthenticationResult,
  CloudSandboxAuthGuard,
} from './CloudSandboxAuthGuard';
import { QuotaCheckResult, TenantIsolationService } from './TenantIsolationService';
import { PermissionCheckResult, ToolPermissionChecker } from './ToolPermissionChecker';

export interface SecuredToolExecutionContext {
  user: AuthenticatedUser;
  toolName: string;
  params: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface SecuredToolExecutionResult {
  success: boolean;
  result?: unknown;
  error?: string;
  executionTime?: number;
  quotaRemaining?: {
    executions: number;
    browserSessions: number;
    storage: number;
  };
}

/**
 * Secure Cloud Sandbox Module
 *
 * Main entry point for secure MCP tool execution.
 */
export class SecureCloudSandboxModule {
  private readonly authGuard: CloudSandboxAuthGuard;
  private readonly permissionChecker: ToolPermissionChecker;
  private readonly tenantIsolation: TenantIsolationService;
  private readonly auditLogger: AuditLogger;

  constructor(auditLogger?: AuditLogger) {
    this.authGuard = new CloudSandboxAuthGuard();
    this.permissionChecker = new ToolPermissionChecker();
    this.tenantIsolation = new TenantIsolationService();
    this.auditLogger = auditLogger || new AuditLogger();

    console.log('Secure Cloud Sandbox Module initialized');
  }

  /**
   * Authenticate WebSocket connection
   *
   * @param headers Connection headers
   * @returns Authentication result
   */
  async authenticateConnection(headers: Record<string, string>): Promise<AuthenticationResult> {
    const result = await this.authGuard.authenticateConnection(headers);

    // Log authentication attempt
    if (result.user) {
      await this.auditLogger.logAuthentication(
        result.user.id,
        result.user.type,
        'success',
        undefined,
        { tenantId: result.user.tenantId, role: result.user.role }
      );
    } else {
      await this.auditLogger.logAuthentication('unknown', 'human', 'failure', result.error);
    }

    return result;
  }

  /**
   * Execute tool with full security checks
   *
   * This is the main method that should be called for all tool executions.
   */
  async executeSecuredTool(
    context: SecuredToolExecutionContext,
    toolHandler: (params: Record<string, unknown>) => Promise<unknown>
  ): Promise<SecuredToolExecutionResult> {
    const { user, toolName, params, metadata } = context;
    const startTime = Date.now();

    try {
      // Step 1: Check permissions
      const permissionCheck = this.permissionChecker.checkPermission(toolName, user, params);

      if (!permissionCheck.allowed) {
        await this.auditLogger.logAccessDenied(
          user,
          toolName,
          (params.path as string) || (params.url as string) || toolName,
          permissionCheck.reason || 'Permission denied'
        );

        return {
          success: false,
          error: permissionCheck.reason || 'Permission denied',
        };
      }

      // Step 2: Check tenant quota
      const quotaCheck = await this.tenantIsolation.checkQuota(user, 'execution');

      if (!quotaCheck.allowed) {
        await this.auditLogger.logAccessDenied(
          user,
          toolName,
          'tenant-quota',
          quotaCheck.reason || 'Quota exceeded'
        );

        return {
          success: false,
          error: quotaCheck.reason || 'Quota exceeded',
        };
      }

      // Step 3: Record execution start
      await this.tenantIsolation.recordExecutionStart(user.tenantId);

      try {
        // Step 4: Execute tool
        const result = await toolHandler(params);
        const executionTime = Date.now() - startTime;

        // Step 5: Log successful execution
        await this.auditLogger.logToolExecution(user, toolName, params, 'success', undefined, {
          ...metadata,
          executionTime,
        });

        // Step 6: Calculate remaining quota
        const usage = this.tenantIsolation.getTenantUsage(user.tenantId);
        const quota = this.tenantIsolation.getTenantQuota(user.tenantId);

        return {
          success: true,
          result,
          executionTime,
          quotaRemaining:
            usage && quota
              ? {
                  executions: quota.maxConcurrentExecutions - usage.currentExecutions,
                  browserSessions: quota.maxBrowserSessions - usage.currentBrowserSessions,
                  storage: quota.maxTotalStorage - usage.currentStorage,
                }
              : undefined,
        };
      } finally {
        // Always record execution end
        await this.tenantIsolation.recordExecutionEnd(user.tenantId);
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log failed execution
      await this.auditLogger.logToolExecution(user, toolName, params, 'failure', errorMessage, {
        ...metadata,
        executionTime,
      });

      return {
        success: false,
        error: errorMessage,
        executionTime,
      };
    }
  }

  /**
   * Get available tools for a user
   */
  getAvailableTools(user: AuthenticatedUser): string[] {
    return this.permissionChecker.getAvailableTools(user);
  }

  /**
   * Check if user can access a specific tool
   */
  canUserAccessTool(
    user: AuthenticatedUser,
    toolName: string,
    params?: Record<string, unknown>
  ): PermissionCheckResult {
    return this.permissionChecker.checkPermission(toolName, user, params);
  }

  /**
   * Check tenant quota status
   */
  async checkTenantQuota(
    user: AuthenticatedUser,
    operationType: 'execution' | 'browser' | 'storage'
  ): Promise<QuotaCheckResult> {
    return await this.tenantIsolation.checkQuota(user, operationType);
  }

  /**
   * Get tenant usage report
   */
  getTenantUsage(tenantId: string) {
    return {
      usage: this.tenantIsolation.getTenantUsage(tenantId),
      quota: this.tenantIsolation.getTenantQuota(tenantId),
    };
  }

  /**
   * Get audit logs for a tenant
   */
  async getAuditLogs(tenantId: string, limit = 100) {
    return await this.auditLogger.getTenantActivity(tenantId, limit);
  }

  /**
   * Get security alerts
   */
  async getSecurityAlerts(limit = 50) {
    return await this.auditLogger.getSecurityAlerts(limit);
  }

  /**
   * Validate tenant isolation for cross-tenant access
   */
  validateTenantAccess(user: AuthenticatedUser, resourceTenantId: string): boolean {
    return this.permissionChecker.validateTenantAccess(user.tenantId, resourceTenantId, user.role);
  }

  /**
   * Record browser session lifecycle
   */
  async recordBrowserSession(user: AuthenticatedUser, action: 'start' | 'end'): Promise<void> {
    if (action === 'start') {
      // Check quota before starting
      const quotaCheck = await this.tenantIsolation.checkQuota(user, 'browser');
      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.reason || 'Browser session quota exceeded');
      }
      await this.tenantIsolation.recordBrowserSessionStart(user.tenantId);
    } else {
      await this.tenantIsolation.recordBrowserSessionEnd(user.tenantId);
    }
  }

  /**
   * Update storage usage for file operations
   */
  async updateStorageUsage(user: AuthenticatedUser, delta: number): Promise<void> {
    // Check quota if adding storage
    if (delta > 0) {
      const quotaCheck = await this.tenantIsolation.checkQuota(user, 'storage', delta);
      if (!quotaCheck.allowed) {
        throw new Error(quotaCheck.reason || 'Storage quota exceeded');
      }
    }

    await this.tenantIsolation.updateStorageUsage(user.tenantId, delta);
  }

  /**
   * Admin: Reset tenant quota
   */
  async resetTenantUsage(adminUser: AuthenticatedUser, tenantId: string): Promise<void> {
    // Only SUPER_ADMIN can reset quotas
    if (adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Only SUPER_ADMIN can reset tenant quotas');
    }

    this.tenantIsolation.resetTenantUsage(tenantId);

    await this.auditLogger.logToolExecution(
      adminUser,
      'admin:reset_quota',
      { tenantId },
      'success'
    );
  }

  /**
   * Admin: Update tenant quota
   */
  async updateTenantQuota(
    adminUser: AuthenticatedUser,
    tenantId: string,
    quota: Record<string, unknown>
  ): Promise<void> {
    // Only SUPER_ADMIN can update quotas
    if (adminUser.role !== 'SUPER_ADMIN') {
      throw new Error('Only SUPER_ADMIN can update tenant quotas');
    }

    this.tenantIsolation.updateTenantQuota(tenantId, quota as any);

    await this.auditLogger.logToolExecution(
      adminUser,
      'admin:update_quota',
      { tenantId, quota },
      'success'
    );
  }
}
