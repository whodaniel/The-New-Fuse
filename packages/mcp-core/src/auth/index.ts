/**
 * Authentication module exports
 */

export { AuthenticationManager } from './AuthenticationManager.js';
export type {
  AuthResult,
  AuthContext,
  TokenInfo,
  AuthPolicy,
  AuthManagerConfig,
  AuthAuditEvent
} from './AuthenticationManager.js';

export { RBACManager } from './RBACManager.js';
export type {
  Permission,
  Role,
  ResourceAccessPolicy,
  PolicyCondition,
  AccessControlResult,
  RBACConfig
} from './RBACManager.js';

export { PermissionValidator, MCPOperation, MCPResourceType } from './PermissionValidator.js';
export type {
  PermissionValidationResult,
  ValidationContext
} from './PermissionValidator.js';

export { AuditLogger, FileAuditStorage, AuditSeverity, AuditCategory } from './AuditLogger.js';
export type {
  EnhancedAuditEvent,
  AuditStorageBackend,
  AuditQueryFilter,
  AuditStorageStats,
  AuditLoggerConfig
} from './AuditLogger.js';