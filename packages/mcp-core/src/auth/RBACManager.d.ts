/**
 * Role-Based Access Control (RBAC) Manager for MCP resources
 *
 * Provides comprehensive role and permission management for MCP resources,
 * including role definitions, permission assignments, and access control
 * policy enforcement.
 */
import { EventEmitter } from 'events';
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
export declare class RBACManager extends EventEmitter {
    private config;
    private permissions;
    private roles;
    private policies;
    private userRoles;
    private accessCache;
    private auditEvents;
    constructor(config?: Partial<RBACConfig>);
    /**
     * Create a new permission
     */
    createPermission(permission: Omit<Permission, 'name'> & {
        name: string;
    }): void;
    /**
     * Create a new role
     */
    createRole(role: Omit<Role, 'createdAt' | 'updatedAt'> & {
        name: string;
    }): void;
    /**
     * Create a resource access policy
     */
    createPolicy(policy: ResourceAccessPolicy): void;
    /**
     * Assign roles to a user
     */
    assignRolesToUser(userId: string, roleNames: string[]): void;
    /**
     * Get user roles (including inherited roles from hierarchy)
     */
    getUserRoles(userId: string): string[];
    /**
     * Get user permissions (from all assigned roles)
     */
    getUserPermissions(userId: string): Permission[];
    /**
     * Check if user has specific permission
     */
    hasPermission(userId: string, permissionName: string): boolean;
    /**
     * Check if user has specific role
     */
    hasRole(userId: string, roleName: string): boolean;
    /**
     * Check access to a resource
     */
    checkAccess(context: AuthContext, resource: string, operation: string): Promise<AccessControlResult>;
    /**
     * Get all permissions
     */
    getAllPermissions(): Permission[];
    /**
     * Get all roles
     */
    getAllRoles(): Role[];
    /**
     * Get all policies
     */
    getAllPolicies(): ResourceAccessPolicy[];
    /**
     * Delete permission
     */
    deletePermission(permissionName: string): void;
    /**
     * Delete role
     */
    deleteRole(roleName: string): void;
    /**
     * Delete policy
     */
    deletePolicy(policyId: string): void;
    /**
     * Get RBAC statistics
     */
    getRBACStatistics(): {
        permissions: number;
        roles: number;
        policies: number;
        users: number;
        cacheSize: number;
        auditEvents: number;
    };
    /**
     * Get audit events
     */
    getAuditEvents(limit?: number): AuthAuditEvent[];
    /**
     * Initialize default permissions and roles
     */
    private initializeDefaults;
    /**
     * Evaluate access to a resource
     */
    private evaluateAccess;
    /**
     * Check if resource matches pattern
     */
    private isResourceMatched;
    /**
     * Evaluate policy conditions
     */
    private evaluatePolicyConditions;
    /**
     * Evaluate individual condition
     */
    private evaluateCondition;
    /**
     * Evaluate condition operator
     */
    private evaluateConditionOperator;
    /**
     * Check for circular role dependencies
     */
    private hasCircularDependency;
    /**
     * Clear cache for specific user
     */
    private clearUserCache;
    /**
     * Clear all cache
     */
    private clearAllCache;
    /**
     * Clean up expired cache entries
     */
    private cleanupCache;
    /**
     * Audit access check
     */
    private auditAccessCheck;
}
//# sourceMappingURL=RBACManager.d.ts.map