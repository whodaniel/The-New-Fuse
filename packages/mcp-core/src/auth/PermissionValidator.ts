/**
 * Permission Validator for MCP operations
 *
 * Provides validation of permissions for specific MCP operations,
 * including resource access, tool execution, and server administration.
 */

import { AuthContext } from './AuthenticationManager.js';
import { AccessControlResult, RBACManager } from './RBACManager.js';

/**
 * MCP operation types
 */
export enum MCPOperation {
  // Resource operations
  RESOURCE_READ = 'resource.read',
  RESOURCE_WRITE = 'resource.write',
  RESOURCE_DELETE = 'resource.delete',
  RESOURCE_LIST = 'resource.list',
  RESOURCE_SUBSCRIBE = 'resource.subscribe',

  // Tool operations
  TOOL_EXECUTE = 'tool.execute',
  TOOL_LIST = 'tool.list',
  TOOL_DESCRIBE = 'tool.describe',

  // Server operations
  SERVER_INFO = 'server.info',
  SERVER_CAPABILITIES = 'server.capabilities',
  SERVER_CONFIGURE = 'server.configure',
  SERVER_RESTART = 'server.restart',
  SERVER_SHUTDOWN = 'server.shutdown',

  // Broker operations
  BROKER_REGISTER = 'broker.register',
  BROKER_UNREGISTER = 'broker.unregister',
  BROKER_DISCOVER = 'broker.discover',
  BROKER_ROUTE = 'broker.route',

  // Admin operations
  ADMIN_USER_MANAGE = 'admin.user.manage',
  ADMIN_ROLE_MANAGE = 'admin.role.manage',
  ADMIN_POLICY_MANAGE = 'admin.policy.manage',
  ADMIN_AUDIT_VIEW = 'admin.audit.view',
}

/**
 * Permission validation result
 */
export interface PermissionValidationResult {
  /** Validation success status */
  valid: boolean;
  /** Validation error message */
  error?: string;
  /** Required permissions that were missing */
  missingPermissions?: string[];
  /** Access control result details */
  accessResult?: AccessControlResult;
}

/**
 * MCP resource types
 */
export enum MCPResourceType {
  FILE = 'file',
  DATABASE = 'database',
  API = 'api',
  SERVICE = 'service',
  TOOL = 'tool',
  WORKFLOW = 'workflow',
  AGENT = 'agent',
}

/**
 * Permission validation context
 */
export interface ValidationContext extends AuthContext {
  /** MCP operation being performed */
  operation: MCPOperation;
  /** Resource type */
  resourceType?: MCPResourceType;
  /** Specific resource identifier */
  resourceId?: string;
  /** Tool name (for tool operations) */
  toolName?: string;
  /** Additional operation parameters */
  parameters?: Record<string, any>;
}

/**
 * Permission Validator class
 */
export class PermissionValidator {
  private rbacManager: RBACManager;
  private operationPermissionMap: Map<MCPOperation, string[]>;

  constructor(rbacManager: RBACManager) {
    this.rbacManager = rbacManager;
    this.operationPermissionMap = new Map();
    this.initializeOperationPermissions();
  }

  /**
   * Validate permission for MCP operation
   */
  async validateOperation(context: ValidationContext): Promise<PermissionValidationResult> {
    try {
      // Get required permissions for the operation
      const requiredPermissions = this.getRequiredPermissions(context.operation);

      if (requiredPermissions.length === 0) {
        // No specific permissions required, allow operation
        return { valid: true };
      }

      // Check if user has required permissions
      const missingPermissions: string[] = [];
      for (const permission of requiredPermissions) {
        if (!this.rbacManager.hasPermission(context.userId, permission)) {
          missingPermissions.push(permission);
        }
      }

      if (missingPermissions.length > 0) {
        return {
          valid: false,
          error: `Missing required permissions: ${missingPermissions.join(', ')}`,
          missingPermissions,
        };
      }

      // If resource is specified, check resource-level access
      if (context.resourceUri || context.resourceId) {
        const resourceUri = context.resourceUri || this.buildResourceUri(context);
        const accessResult = await this.rbacManager.checkAccess(
          context,
          resourceUri,
          this.getOperationAction(context.operation)
        );

        if (!accessResult.granted) {
          return {
            valid: false,
            error: accessResult.reason,
            accessResult,
          };
        }

        return {
          valid: true,
          accessResult,
        };
      }

      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: `Permission validation failed: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Validate resource access
   */
  async validateResourceAccess(
    context: AuthContext,
    resourceUri: string,
    operation: MCPOperation
  ): Promise<PermissionValidationResult> {
    const validationContext: ValidationContext = {
      ...context,
      operation,
      resourceUri,
    };

    return this.validateOperation(validationContext);
  }

  /**
   * Validate tool execution
   */
  async validateToolExecution(
    context: AuthContext,
    toolName: string,
    parameters?: Record<string, any>
  ): Promise<PermissionValidationResult> {
    const validationContext: ValidationContext = {
      ...context,
      operation: MCPOperation.TOOL_EXECUTE,
      toolName,
      parameters,
      resourceUri: `tool:${toolName}`,
    };

    return this.validateOperation(validationContext);
  }

  /**
   * Validate server administration operation
   */
  async validateServerAdmin(
    context: AuthContext,
    operation: MCPOperation
  ): Promise<PermissionValidationResult> {
    if (!this.isServerOperation(operation)) {
      return {
        valid: false,
        error: `Invalid server operation: ${operation}`,
      };
    }

    const validationContext: ValidationContext = {
      ...context,
      operation,
      resourceUri: 'server:admin',
    };

    return this.validateOperation(validationContext);
  }

  /**
   * Validate broker operation
   */
  async validateBrokerOperation(
    context: AuthContext,
    operation: MCPOperation,
    serviceId?: string
  ): Promise<PermissionValidationResult> {
    if (!this.isBrokerOperation(operation)) {
      return {
        valid: false,
        error: `Invalid broker operation: ${operation}`,
      };
    }

    const validationContext: ValidationContext = {
      ...context,
      operation,
      resourceUri: serviceId ? `broker:service:${serviceId}` : 'broker:*',
    };

    return this.validateOperation(validationContext);
  }

  /**
   * Check if user can perform operation on resource type
   */
  async canPerformOperation(
    userId: string,
    operation: MCPOperation,
    _resourceType?: MCPResourceType
  ): Promise<boolean> {
    const requiredPermissions = this.getRequiredPermissions(operation);

    for (const permission of requiredPermissions) {
      if (!this.rbacManager.hasPermission(userId, permission)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all operations a user can perform
   */
  getUserAllowedOperations(userId: string): MCPOperation[] {
    const allowedOperations: MCPOperation[] = [];

    for (const operation of Object.values(MCPOperation)) {
      const requiredPermissions = this.getRequiredPermissions(operation);
      const hasAllPermissions = requiredPermissions.every((permission) =>
        this.rbacManager.hasPermission(userId, permission)
      );

      if (hasAllPermissions) {
        allowedOperations.push(operation);
      }
    }

    return allowedOperations;
  }

  /**
   * Get required permissions for operation
   */
  getRequiredPermissions(operation: MCPOperation): string[] {
    return this.operationPermissionMap.get(operation) || [];
  }

  /**
   * Initialize operation to permission mappings
   */
  private initializeOperationPermissions(): void {
    // Resource operations
    this.operationPermissionMap.set(MCPOperation.RESOURCE_READ, ['mcp.resource.read']);
    this.operationPermissionMap.set(MCPOperation.RESOURCE_WRITE, ['mcp.resource.write']);
    this.operationPermissionMap.set(MCPOperation.RESOURCE_DELETE, ['mcp.resource.write']);
    this.operationPermissionMap.set(MCPOperation.RESOURCE_LIST, ['mcp.resource.read']);
    this.operationPermissionMap.set(MCPOperation.RESOURCE_SUBSCRIBE, ['mcp.resource.read']);

    // Tool operations
    this.operationPermissionMap.set(MCPOperation.TOOL_EXECUTE, ['mcp.tool.execute']);
    this.operationPermissionMap.set(MCPOperation.TOOL_LIST, ['mcp.tool.execute']);
    this.operationPermissionMap.set(MCPOperation.TOOL_DESCRIBE, ['mcp.tool.execute']);

    // Server operations
    this.operationPermissionMap.set(MCPOperation.SERVER_INFO, []);
    this.operationPermissionMap.set(MCPOperation.SERVER_CAPABILITIES, []);
    this.operationPermissionMap.set(MCPOperation.SERVER_CONFIGURE, ['mcp.server.admin']);
    this.operationPermissionMap.set(MCPOperation.SERVER_RESTART, ['mcp.server.admin']);
    this.operationPermissionMap.set(MCPOperation.SERVER_SHUTDOWN, ['mcp.server.admin']);

    // Broker operations
    this.operationPermissionMap.set(MCPOperation.BROKER_REGISTER, ['mcp.broker.register']);
    this.operationPermissionMap.set(MCPOperation.BROKER_UNREGISTER, ['mcp.broker.register']);
    this.operationPermissionMap.set(MCPOperation.BROKER_DISCOVER, ['mcp.broker.discover']);
    this.operationPermissionMap.set(MCPOperation.BROKER_ROUTE, ['mcp.broker.route']);

    // Admin operations
    this.operationPermissionMap.set(MCPOperation.ADMIN_USER_MANAGE, ['mcp.admin.user']);
    this.operationPermissionMap.set(MCPOperation.ADMIN_ROLE_MANAGE, ['mcp.admin.role']);
    this.operationPermissionMap.set(MCPOperation.ADMIN_POLICY_MANAGE, ['mcp.admin.policy']);
    this.operationPermissionMap.set(MCPOperation.ADMIN_AUDIT_VIEW, ['mcp.admin.audit']);
  }

  /**
   * Build resource URI from context
   */
  private buildResourceUri(context: ValidationContext): string {
    if (context.resourceId) {
      const type = context.resourceType || 'resource';
      return `${type}:${context.resourceId}`;
    }

    if (context.toolName) {
      return `tool:${context.toolName}`;
    }

    return 'resource:*';
  }

  /**
   * Get operation action for RBAC evaluation
   */
  private getOperationAction(operation: MCPOperation): string {
    const actionMap: Record<string, string> = {
      [MCPOperation.RESOURCE_READ]: 'read',
      [MCPOperation.RESOURCE_WRITE]: 'write',
      [MCPOperation.RESOURCE_DELETE]: 'delete',
      [MCPOperation.RESOURCE_LIST]: 'list',
      [MCPOperation.RESOURCE_SUBSCRIBE]: 'subscribe',
      [MCPOperation.TOOL_EXECUTE]: 'execute',
      [MCPOperation.TOOL_LIST]: 'list',
      [MCPOperation.TOOL_DESCRIBE]: 'describe',
      [MCPOperation.SERVER_INFO]: 'info',
      [MCPOperation.SERVER_CAPABILITIES]: 'capabilities',
      [MCPOperation.SERVER_CONFIGURE]: 'configure',
      [MCPOperation.SERVER_RESTART]: 'restart',
      [MCPOperation.SERVER_SHUTDOWN]: 'shutdown',
      [MCPOperation.BROKER_REGISTER]: 'register',
      [MCPOperation.BROKER_UNREGISTER]: 'unregister',
      [MCPOperation.BROKER_DISCOVER]: 'discover',
      [MCPOperation.BROKER_ROUTE]: 'route',
      [MCPOperation.ADMIN_USER_MANAGE]: 'manage',
      [MCPOperation.ADMIN_ROLE_MANAGE]: 'manage',
      [MCPOperation.ADMIN_POLICY_MANAGE]: 'manage',
      [MCPOperation.ADMIN_AUDIT_VIEW]: 'view',
    };

    return actionMap[operation] || 'access';
  }

  /**
   * Check if operation is a server operation
   */
  private isServerOperation(operation: MCPOperation): boolean {
    return operation.startsWith('server.');
  }

  /**
   * Check if operation is a broker operation
   */
  private isBrokerOperation(operation: MCPOperation): boolean {
    return operation.startsWith('broker.');
  }
}
