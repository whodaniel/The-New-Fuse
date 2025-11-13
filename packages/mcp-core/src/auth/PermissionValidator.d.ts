/**
 * Permission Validator for MCP operations
 *
 * Provides validation of permissions for specific MCP operations,
 * including resource access, tool execution, and server administration.
 */
import { AuthContext } from './AuthenticationManager';
import { RBACManager, AccessControlResult } from './RBACManager';
/**
 * MCP operation types
 */
export declare enum MCPOperation {
    RESOURCE_READ = "resource.read",
    RESOURCE_WRITE = "resource.write",
    RESOURCE_DELETE = "resource.delete",
    RESOURCE_LIST = "resource.list",
    RESOURCE_SUBSCRIBE = "resource.subscribe",
    TOOL_EXECUTE = "tool.execute",
    TOOL_LIST = "tool.list",
    TOOL_DESCRIBE = "tool.describe",
    SERVER_INFO = "server.info",
    SERVER_CAPABILITIES = "server.capabilities",
    SERVER_CONFIGURE = "server.configure",
    SERVER_RESTART = "server.restart",
    SERVER_SHUTDOWN = "server.shutdown",
    BROKER_REGISTER = "broker.register",
    BROKER_UNREGISTER = "broker.unregister",
    BROKER_DISCOVER = "broker.discover",
    BROKER_ROUTE = "broker.route",
    ADMIN_USER_MANAGE = "admin.user.manage",
    ADMIN_ROLE_MANAGE = "admin.role.manage",
    ADMIN_POLICY_MANAGE = "admin.policy.manage",
    ADMIN_AUDIT_VIEW = "admin.audit.view"
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
export declare enum MCPResourceType {
    FILE = "file",
    DATABASE = "database",
    API = "api",
    SERVICE = "service",
    TOOL = "tool",
    WORKFLOW = "workflow",
    AGENT = "agent"
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
export declare class PermissionValidator {
    private rbacManager;
    private operationPermissionMap;
    constructor(rbacManager: RBACManager);
    /**
     * Validate permission for MCP operation
     */
    validateOperation(context: ValidationContext): Promise<PermissionValidationResult>;
    /**
     * Validate resource access
     */
    validateResourceAccess(context: AuthContext, resourceUri: string, operation: MCPOperation): Promise<PermissionValidationResult>;
    /**
     * Validate tool execution
     */
    validateToolExecution(context: AuthContext, toolName: string, parameters?: Record<string, any>): Promise<PermissionValidationResult>;
    /**
     * Validate server administration operation
     */
    validateServerAdmin(context: AuthContext, operation: MCPOperation): Promise<PermissionValidationResult>;
    /**
     * Validate broker operation
     */
    validateBrokerOperation(context: AuthContext, operation: MCPOperation, serviceId?: string): Promise<PermissionValidationResult>;
    /**
     * Check if user can perform operation on resource type
     */
    canPerformOperation(userId: string, operation: MCPOperation, resourceType?: MCPResourceType): Promise<boolean>;
    /**
     * Get all operations a user can perform
     */
    getUserAllowedOperations(userId: string): MCPOperation[];
    /**
     * Get required permissions for operation
     */
    getRequiredPermissions(operation: MCPOperation): string[];
    /**
     * Initialize operation to permission mappings
     */
    private initializeOperationPermissions;
    /**
     * Build resource URI from context
     */
    private buildResourceUri;
    /**
     * Get operation action for RBAC evaluation
     */
    private getOperationAction;
    /**
     * Check if operation is a server operation
     */
    private isServerOperation;
    /**
     * Check if operation is a broker operation
     */
    private isBrokerOperation;
}
//# sourceMappingURL=PermissionValidator.d.ts.map