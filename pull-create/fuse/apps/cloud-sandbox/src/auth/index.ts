/**
 * Cloud Sandbox Security Module
 *
 * Comprehensive RBAC and multi-tenant security for MCP tool execution.
 *
 * @packageDocumentation
 */

export { CloudSandboxAuthGuard } from './CloudSandboxAuthGuard';
export type { AuthenticatedUser, AuthenticationResult } from './CloudSandboxAuthGuard';

export { ToolPermissionChecker } from './ToolPermissionChecker';
export type { PermissionCheckResult, ToolPermissionConfig } from './ToolPermissionChecker';

export { TenantIsolationService } from './TenantIsolationService';
export type { QuotaCheckResult, TenantQuota, TenantUsage } from './TenantIsolationService';

export { AuditLogger } from './AuditLogger';
export type { AuditLog, AuditLogStorage } from './AuditLogger';

export { SecureCloudSandboxModule } from './SecureCloudSandboxModule';
export type {
  SecuredToolExecutionContext,
  SecuredToolExecutionResult,
} from './SecureCloudSandboxModule';
