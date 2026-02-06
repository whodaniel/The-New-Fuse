/**
 * Authentication module exports
 */

export { AuthenticationManager } from './AuthenticationManager';
export type {
  AuthAuditEvent,
  AuthContext,
  AuthManagerConfig,
  AuthPolicy,
  AuthResult,
  TokenInfo,
} from './AuthenticationManager';

export { RBACManager } from './RBACManager';
export type {
  AccessControlResult,
  Permission,
  PolicyCondition,
  RBACConfig,
  ResourceAccessPolicy,
  Role,
} from './RBACManager';

export { MCPOperation, MCPResourceType, PermissionValidator } from './PermissionValidator';
export type { PermissionValidationResult, ValidationContext } from './PermissionValidator';

export { AuditCategory, AuditLogger, AuditSeverity, FileAuditStorage } from './AuditLogger';
export type {
  AuditLoggerConfig,
  AuditQueryFilter,
  AuditStorageBackend,
  AuditStorageStats,
  EnhancedAuditEvent,
} from './AuditLogger';
