/**
 * Role-Based Access Control (RBAC) Manager for MCP resources
 * 
 * Provides comprehensive role and permission management for MCP resources,
 * including role definitions, permission assignments, and access control
 * policy enforcement.
 */

import { EventEmitter } from 'events';
import { MCPErrorClass, MCPErrorCode } from '../types/error';
import { AuthContext, AuthAuditEvent } from './AuthenticationManager';

/**
 * Permission interface
 */
export interface Permission {
  /** Permission name */
  name: string;
  /** Permission description */
  description: string;
  /** Resource type this permission applies to */
  resourceType?: string;
  /** Operations this permission allows */
  operations: string[];
  /** Resource patterns this permission applies to */
  resourcePatterns?: string[];
  /** Additional constraints */
  constraints?: Record<string, any>;
}

/**
 * Role interface
 */
export interface Role {
  /** Role name */
  name: string;
  /** Role description */
  description: string;
  /** Permissions assigned to this role */
  permissions: string[];
  /** Parent roles (for role hierarchy) */
  parentRoles?: string[];
  /** Role metadata */
  metadata?: Record<string, any>;
  /** Role creation timestamp */
  createdAt: Date;
  /** Role last modified timestamp */
  updatedAt: Date;
}

/**
 * Resource access policy interface
 */
export interface ResourceAccessPolicy {
  /** Policy ID */
  id: string;
  /** Policy name */
  name: string;
  /** Resource URI pattern */
  resourcePattern: string;
  /** Required permissions */
  requiredPermissions: string[];
  /** Required roles */
  requiredRoles?: string[];
  /** Policy conditions */
  conditions?: PolicyCondition[];
  /** Policy effect (allow/deny) */
  effect: 'allow' | 'deny';
  /** Policy priority (higher number = higher priority) */
  priority: number;
  /** Policy metadata */
  metadata?: Record<string, any>;
}

/**
 * Policy condition interface
 */
export interface PolicyCondition {
  /** Condition type */
  type: 'time' | 'ip' | 'user_attribute' | 'resource_attribute' | 'custom';
  /** Condition operator */
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'matches' | 'in' | 'not_in';
  /** Condition field */
  field: string;
  /** Condition value */
  value: any;
  /** Custom evaluation function for 'custom' type */
  evaluate?: (context: AuthContext, resource?: string) => Promise<boolean>;
}

/**
 * Access control result interface
 */
export interface AccessControlResult {
  /** Access granted status */
  granted: boolean;
  /** Reason for access decision */
  reason: string;
  /** Applied policies */
  appliedPolicies: string[];
  /** Required permissions that were missing */
  missingPermissions?: string[];
  /** Required roles that were missing */
  missingRoles?: string[];
  /** Policy violations */
  violations?: string[];
}

/**
 * RBAC configuration interface
 */
export interface RBACConfig {
  /** Enable role hierarchy */
  enableRoleHierarchy: boolean;
  /** Default deny policy */
  defaultDeny: boolean;
  /** Enable audit logging */
  enableAuditLogging: boolean;
  /** Cache TTL for access decisions (seconds) */
  cacheTTL: number;
  /** Maximum role hierarchy depth */
  maxHierarchyDepth: number;
}

/**
 * Role-Based Access Control Manager
 */
export class RBACManager extends EventEmitter {
  private config: RBACConfig;
  private permissions = new Map<string, Permission>();
  private roles = new Map<string, Role>();
  private policies = new Map<string, ResourceAccessPolicy>();
  private userRoles = new Map<string, string[]>();
  private accessCache = new Map<string, { result: AccessControlResult; expiresAt: Date }>();
  private auditEvents: AuthAuditEvent[] = [];

  constructor(config: Partial<RBACConfig> = {}) {
    super();
    
    this.config = {
      enableRoleHierarchy: true,
      defaultDeny: false,
      enableAuditLogging: true,
      cacheTTL: 300, // 5 minutes
      maxHierarchyDepth: 10,
      ...config
    };

    // Initialize default permissions and roles
    this.initializeDefaults();

    // Start cache cleanup interval
    setInterval(() => this.cleanupCache(), 60000); // Every minute
  }

  /**
   * Create a new permission
   */
  createPermission(permission: Omit<Permission, 'name'> & { name: string }): void {
    if (this.permissions.has(permission.name)) {
      throw new MCPErrorClass(
        MCPErrorCode.INVALID_PARAMS,
        `Permission '${permission.name}' already exists`
      );
    }

    this.permissions.set(permission.name, permission);
    this.emit('permissionCreated', permission);
  }

  /**
   * Create a new role
   */
  createRole(role: Omit<Role, 'createdAt' | 'updatedAt'> & { name: string }): void {
    if (this.roles.has(role.name)) {
      throw new MCPErrorClass(
        MCPErrorCode.INVALID_PARAMS,
        `Role '${role.name}' already exists`
      );
    }

    // Validate permissions exist
    for (const permissionName of role.permissions) {
      if (!this.permissions.has(permissionName)) {
        throw new MCPErrorClass(
          MCPErrorCode.INVALID_PARAMS,
          `Permission '${permissionName}' does not exist`
        );
      }
    }

    // Validate parent roles exist (if role hierarchy is enabled)
    if (this.config.enableRoleHierarchy && role.parentRoles) {
      for (const parentRole of role.parentRoles) {
        if (!this.roles.has(parentRole)) {
          throw new MCPErrorClass(
            MCPErrorCode.INVALID_PARAMS,
            `Parent role '${parentRole}' does not exist`
          );
        }
      }

      // Check for circular dependencies
      if (this.hasCircularDependency(role.name, role.parentRoles)) {
        throw new MCPErrorClass(
          MCPErrorCode.INVALID_PARAMS,
          'Circular role dependency detected'
        );
      }
    }

    const now = new Date();
    const fullRole: Role = {
      ...role,
      createdAt: now,
      updatedAt: now
    };

    this.roles.set(role.name, fullRole);
    this.emit('roleCreated', fullRole);
  }

  /**
   * Create a resource access policy
   */
  createPolicy(policy: ResourceAccessPolicy): void {
    if (this.policies.has(policy.id)) {
      throw new MCPErrorClass(
        MCPErrorCode.INVALID_PARAMS,
        `Policy '${policy.id}' already exists`
      );
    }

    // Validate required permissions exist
    if (policy.requiredPermissions && policy.requiredPermissions.length > 0) {
      for (const permissionName of policy.requiredPermissions) {
        if (!this.permissions.has(permissionName)) {
          throw new MCPErrorClass(
            MCPErrorCode.INVALID_PARAMS,
            `Permission '${permissionName}' does not exist`
          );
        }
      }
    }

    // Validate required roles exist
    if (policy.requiredRoles) {
      for (const roleName of policy.requiredRoles) {
        if (!this.roles.has(roleName)) {
          throw new MCPErrorClass(
            MCPErrorCode.INVALID_PARAMS,
            `Role '${roleName}' does not exist`
          );
        }
      }
    }

    this.policies.set(policy.id, policy);
    this.emit('policyCreated', policy);
  }

  /**
   * Assign roles to a user
   */
  assignRolesToUser(userId: string, roleNames: string[]): void {
    // Validate roles exist
    for (const roleName of roleNames) {
      if (!this.roles.has(roleName)) {
        throw new MCPErrorClass(
          MCPErrorCode.INVALID_PARAMS,
          `Role '${roleName}' does not exist`
        );
      }
    }

    this.userRoles.set(userId, roleNames);
    this.clearUserCache(userId);
    this.emit('userRolesAssigned', userId, roleNames);
  }

  /**
   * Get user roles (including inherited roles from hierarchy)
   */
  getUserRoles(userId: string): string[] {
    const directRoles = this.userRoles.get(userId) || [];
    
    if (!this.config.enableRoleHierarchy) {
      return directRoles;
    }

    const allRoles = new Set<string>();
    const visited = new Set<string>();

    const addRoleHierarchy = (roleName: string, depth: number = 0) => {
      if (depth > this.config.maxHierarchyDepth || visited.has(roleName)) {
        return;
      }

      visited.add(roleName);
      allRoles.add(roleName);

      const role = this.roles.get(roleName);
      if (role && role.parentRoles) {
        for (const parentRole of role.parentRoles) {
          addRoleHierarchy(parentRole, depth + 1);
        }
      }
    };

    for (const roleName of directRoles) {
      addRoleHierarchy(roleName);
    }

    return Array.from(allRoles);
  }

  /**
   * Get user permissions (from all assigned roles)
   */
  getUserPermissions(userId: string): Permission[] {
    const userRoles = this.getUserRoles(userId);
    const userPermissions = new Map<string, Permission>();

    for (const roleName of userRoles) {
      const role = this.roles.get(roleName);
      if (role) {
        for (const permissionName of role.permissions) {
          const permission = this.permissions.get(permissionName);
          if (permission) {
            userPermissions.set(permissionName, permission);
          }
        }
      }
    }

    return Array.from(userPermissions.values());
  }

  /**
   * Check if user has specific permission
   */
  hasPermission(userId: string, permissionName: string): boolean {
    const userPermissions = this.getUserPermissions(userId);
    return userPermissions.some(p => p.name === permissionName);
  }

  /**
   * Check if user has specific role
   */
  hasRole(userId: string, roleName: string): boolean {
    const userRoles = this.getUserRoles(userId);
    return userRoles.includes(roleName);
  }

  /**
   * Check access to a resource
   */
  async checkAccess(
    context: AuthContext,
    resource: string,
    operation: string
  ): Promise<AccessControlResult> {
    const cacheKey = `${context.userId}:${resource}:${operation}`;
    const cached = this.accessCache.get(cacheKey);
    
    if (cached && cached.expiresAt > new Date()) {
      return cached.result;
    }

    const result = await this.evaluateAccess(context, resource, operation);
    
    // Cache the result
    this.accessCache.set(cacheKey, {
      result,
      expiresAt: new Date(Date.now() + this.config.cacheTTL * 1000)
    });

    // Audit the access check
    this.auditAccessCheck(context, resource, operation, result);

    return result;
  }

  /**
   * Get all permissions
   */
  getAllPermissions(): Permission[] {
    return Array.from(this.permissions.values());
  }

  /**
   * Get all roles
   */
  getAllRoles(): Role[] {
    return Array.from(this.roles.values());
  }

  /**
   * Get all policies
   */
  getAllPolicies(): ResourceAccessPolicy[] {
    return Array.from(this.policies.values());
  }

  /**
   * Delete permission
   */
  deletePermission(permissionName: string): void {
    if (!this.permissions.has(permissionName)) {
      throw new MCPErrorClass(
        MCPErrorCode.INVALID_PARAMS,
        `Permission '${permissionName}' does not exist`
      );
    }

    // Check if permission is used by any role
    for (const role of this.roles.values()) {
      if (role.permissions.includes(permissionName)) {
        throw new MCPErrorClass(
          MCPErrorCode.INVALID_PARAMS,
          `Permission '${permissionName}' is used by role '${role.name}'`
        );
      }
    }

    this.permissions.delete(permissionName);
    this.clearAllCache();
    this.emit('permissionDeleted', permissionName);
  }

  /**
   * Delete role
   */
  deleteRole(roleName: string): void {
    if (!this.roles.has(roleName)) {
      throw new MCPErrorClass(
        MCPErrorCode.INVALID_PARAMS,
        `Role '${roleName}' does not exist`
      );
    }

    // Check if role is used by any user
    for (const [userId, userRoles] of this.userRoles) {
      if (userRoles.includes(roleName)) {
        throw new MCPErrorClass(
          MCPErrorCode.INVALID_PARAMS,
          `Role '${roleName}' is assigned to user '${userId}'`
        );
      }
    }

    // Check if role is used as parent role
    for (const role of this.roles.values()) {
      if (role.parentRoles && role.parentRoles.includes(roleName)) {
        throw new MCPErrorClass(
          MCPErrorCode.INVALID_PARAMS,
          `Role '${roleName}' is used as parent role by '${role.name}'`
        );
      }
    }

    this.roles.delete(roleName);
    this.clearAllCache();
    this.emit('roleDeleted', roleName);
  }

  /**
   * Delete policy
   */
  deletePolicy(policyId: string): void {
    if (!this.policies.has(policyId)) {
      throw new MCPErrorClass(
        MCPErrorCode.INVALID_PARAMS,
        `Policy '${policyId}' does not exist`
      );
    }

    this.policies.delete(policyId);
    this.clearAllCache();
    this.emit('policyDeleted', policyId);
  }

  /**
   * Get RBAC statistics
   */
  getRBACStatistics() {
    return {
      permissions: this.permissions.size,
      roles: this.roles.size,
      policies: this.policies.size,
      users: this.userRoles.size,
      cacheSize: this.accessCache.size,
      auditEvents: this.auditEvents.length
    };
  }

  /**
   * Get audit events
   */
  getAuditEvents(limit?: number): AuthAuditEvent[] {
    const events = [...this.auditEvents].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    return limit ? events.slice(0, limit) : events;
  }

  /**
   * Initialize default permissions and roles
   */
  private initializeDefaults(): void {
    // Default permissions
    const defaultPermissions: Permission[] = [
      {
        name: 'mcp.resource.read',
        description: 'Read MCP resources',
        resourceType: 'resource',
        operations: ['read', 'list']
      },
      {
        name: 'mcp.resource.write',
        description: 'Write MCP resources',
        resourceType: 'resource',
        operations: ['create', 'update', 'delete']
      },
      {
        name: 'mcp.tool.execute',
        description: 'Execute MCP tools',
        resourceType: 'tool',
        operations: ['execute']
      },
      {
        name: 'mcp.server.admin',
        description: 'Administer MCP server',
        resourceType: 'server',
        operations: ['configure', 'monitor', 'restart']
      }
    ];

    for (const permission of defaultPermissions) {
      this.permissions.set(permission.name, permission);
    }

    // Default roles
    const now = new Date();
    const defaultRoles: Role[] = [
      {
        name: 'mcp.user',
        description: 'Basic MCP user',
        permissions: ['mcp.resource.read'],
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'mcp.developer',
        description: 'MCP developer',
        permissions: ['mcp.resource.read', 'mcp.resource.write', 'mcp.tool.execute'],
        createdAt: now,
        updatedAt: now
      },
      {
        name: 'mcp.admin',
        description: 'MCP administrator',
        permissions: ['mcp.resource.read', 'mcp.resource.write', 'mcp.tool.execute', 'mcp.server.admin'],
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const role of defaultRoles) {
      this.roles.set(role.name, role);
    }
  }

  /**
   * Evaluate access to a resource
   */
  private async evaluateAccess(
    context: AuthContext,
    resource: string,
    operation: string
  ): Promise<AccessControlResult> {
    const userRoles = this.getUserRoles(context.userId);
    const userPermissions = this.getUserPermissions(context.userId);
    const appliedPolicies: string[] = [];
    const violations: string[] = [];

    // Get applicable policies sorted by priority (highest first)
    const applicablePolicies = Array.from(this.policies.values())
      .filter(policy => this.isResourceMatched(resource, policy.resourcePattern))
      .sort((a, b) => b.priority - a.priority);

    let finalDecision = !this.config.defaultDeny; // Default allow if defaultDeny is false

    for (const policy of applicablePolicies) {
      appliedPolicies.push(policy.id);

      // Check if policy conditions are met
      const conditionsMet = await this.evaluatePolicyConditions(policy, context, resource);
      if (!conditionsMet) {
        continue;
      }

      // Check required permissions
      const hasRequiredPermissions = !policy.requiredPermissions || policy.requiredPermissions.length === 0 ||
        policy.requiredPermissions.every(permissionName =>
          userPermissions.some(p => p.name === permissionName && p.operations.includes(operation))
        );

      // Check required roles
      const hasRequiredRoles = !policy.requiredRoles || 
        policy.requiredRoles.some(roleName => userRoles.includes(roleName));

      if (hasRequiredPermissions && hasRequiredRoles) {
        if (policy.effect === 'allow') {
          finalDecision = true;
        } else if (policy.effect === 'deny') {
          finalDecision = false;
          violations.push(`Policy '${policy.name}' explicitly denies access`);
          break; // Deny policies are final
        }
      } else {
        if (policy.effect === 'deny') {
          // If deny policy requirements are not met, it doesn't apply
          continue;
        }
        
        // Track missing requirements for allow policies
        if (!hasRequiredPermissions && policy.requiredPermissions && policy.requiredPermissions.length > 0) {
          const missingPerms = policy.requiredPermissions.filter(permissionName =>
            !userPermissions.some(p => p.name === permissionName && p.operations.includes(operation))
          );
          violations.push(`Missing permissions: ${missingPerms.join(', ')}`);
        }

        if (!hasRequiredRoles && policy.requiredRoles) {
          const missingRoles = policy.requiredRoles.filter(roleName => 
            !userRoles.includes(roleName)
          );
          violations.push(`Missing roles: ${missingRoles.join(', ')}`);
        }
      }
    }

    const result: AccessControlResult = {
      granted: finalDecision,
      reason: finalDecision 
        ? 'Access granted by policy evaluation'
        : violations.length > 0 
          ? violations.join('; ')
          : 'Access denied by default policy',
      appliedPolicies,
      violations: violations.length > 0 ? violations : undefined
    };

    return result;
  }

  /**
   * Check if resource matches pattern
   */
  private isResourceMatched(resource: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    
    return new RegExp(`^${regexPattern}$`).test(resource);
  }

  /**
   * Evaluate policy conditions
   */
  private async evaluatePolicyConditions(
    policy: ResourceAccessPolicy,
    context: AuthContext,
    resource: string
  ): Promise<boolean> {
    if (!policy.conditions || policy.conditions.length === 0) {
      return true;
    }

    for (const condition of policy.conditions) {
      const conditionMet = await this.evaluateCondition(condition, context, resource);
      if (!conditionMet) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluate individual condition
   */
  private async evaluateCondition(
    condition: PolicyCondition,
    context: AuthContext,
    resource: string
  ): Promise<boolean> {
    let fieldValue: any;

    switch (condition.type) {
      case 'time':
        fieldValue = new Date();
        break;
      case 'ip':
        fieldValue = context.clientIp;
        break;
      case 'user_attribute':
        fieldValue = (context as any)[condition.field];
        break;
      case 'resource_attribute':
        // In a real implementation, this would extract attributes from the resource
        fieldValue = resource;
        break;
      case 'custom':
        if (condition.evaluate) {
          return await condition.evaluate(context, resource);
        }
        return true;
      default:
        return true;
    }

    return this.evaluateConditionOperator(condition.operator, fieldValue, condition.value);
  }

  /**
   * Evaluate condition operator
   */
  private evaluateConditionOperator(operator: string, fieldValue: any, conditionValue: any): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).includes(String(conditionValue));
      case 'not_contains':
        return !String(fieldValue).includes(String(conditionValue));
      case 'matches':
        return new RegExp(conditionValue).test(String(fieldValue));
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default:
        return true;
    }
  }

  /**
   * Check for circular role dependencies
   */
  private hasCircularDependency(roleName: string, parentRoles: string[], visited = new Set<string>()): boolean {
    if (visited.has(roleName)) {
      return true;
    }

    visited.add(roleName);

    for (const parentRole of parentRoles) {
      const parent = this.roles.get(parentRole);
      if (parent && parent.parentRoles) {
        if (this.hasCircularDependency(parentRole, parent.parentRoles, new Set(visited))) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Clear cache for specific user
   */
  private clearUserCache(userId: string): void {
    const keysToDelete: string[] = [];
    
    for (const key of this.accessCache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      this.accessCache.delete(key);
    }
  }

  /**
   * Clear all cache
   */
  private clearAllCache(): void {
    this.accessCache.clear();
  }

  /**
   * Clean up expired cache entries
   */
  private cleanupCache(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.accessCache) {
      if (cached.expiresAt <= now) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      this.accessCache.delete(key);
    }
  }

  /**
   * Audit access check
   */
  private auditAccessCheck(
    context: AuthContext,
    resource: string,
    operation: string,
    result: AccessControlResult
  ): void {
    if (!this.config.enableAuditLogging) return;

    const auditEvent: AuthAuditEvent = {
      type: result.granted ? 'login' : 'access_denied',
      userId: context.userId,
      resource,
      operation,
      success: result.granted,
      error: result.granted ? undefined : result.reason,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
      timestamp: new Date(),
      metadata: {
        appliedPolicies: result.appliedPolicies,
        violations: result.violations
      }
    };

    this.auditEvents.push(auditEvent);
    
    // Keep only last 10000 events to prevent memory issues
    if (this.auditEvents.length > 10000) {
      this.auditEvents = this.auditEvents.slice(-5000);
    }

    this.emit('accessAudit', auditEvent);
  }
}