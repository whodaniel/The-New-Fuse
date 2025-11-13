/**
 * Permission Validator for MCP operations
 *
 * Provides validation of permissions for specific MCP operations,
 * including resource access, tool execution, and server administration.
 */
/**
 * MCP operation types
 */
export var MCPOperation;
(function (MCPOperation) {
    // Resource operations
    MCPOperation["RESOURCE_READ"] = "resource.read";
    MCPOperation["RESOURCE_WRITE"] = "resource.write";
    MCPOperation["RESOURCE_DELETE"] = "resource.delete";
    MCPOperation["RESOURCE_LIST"] = "resource.list";
    MCPOperation["RESOURCE_SUBSCRIBE"] = "resource.subscribe";
    // Tool operations
    MCPOperation["TOOL_EXECUTE"] = "tool.execute";
    MCPOperation["TOOL_LIST"] = "tool.list";
    MCPOperation["TOOL_DESCRIBE"] = "tool.describe";
    // Server operations
    MCPOperation["SERVER_INFO"] = "server.info";
    MCPOperation["SERVER_CAPABILITIES"] = "server.capabilities";
    MCPOperation["SERVER_CONFIGURE"] = "server.configure";
    MCPOperation["SERVER_RESTART"] = "server.restart";
    MCPOperation["SERVER_SHUTDOWN"] = "server.shutdown";
    // Broker operations
    MCPOperation["BROKER_REGISTER"] = "broker.register";
    MCPOperation["BROKER_UNREGISTER"] = "broker.unregister";
    MCPOperation["BROKER_DISCOVER"] = "broker.discover";
    MCPOperation["BROKER_ROUTE"] = "broker.route";
    // Admin operations
    MCPOperation["ADMIN_USER_MANAGE"] = "admin.user.manage";
    MCPOperation["ADMIN_ROLE_MANAGE"] = "admin.role.manage";
    MCPOperation["ADMIN_POLICY_MANAGE"] = "admin.policy.manage";
    MCPOperation["ADMIN_AUDIT_VIEW"] = "admin.audit.view";
})(MCPOperation || (MCPOperation = {}));
/**
 * MCP resource types
 */
export var MCPResourceType;
(function (MCPResourceType) {
    MCPResourceType["FILE"] = "file";
    MCPResourceType["DATABASE"] = "database";
    MCPResourceType["API"] = "api";
    MCPResourceType["SERVICE"] = "service";
    MCPResourceType["TOOL"] = "tool";
    MCPResourceType["WORKFLOW"] = "workflow";
    MCPResourceType["AGENT"] = "agent";
})(MCPResourceType || (MCPResourceType = {}));
/**
 * Permission Validator class
 */
export class PermissionValidator {
    rbacManager;
    operationPermissionMap;
    constructor(rbacManager) {
        this.rbacManager = rbacManager;
        this.operationPermissionMap = new Map();
        this.initializeOperationPermissions();
    }
    /**
     * Validate permission for MCP operation
     */
    async validateOperation(context) {
        try {
            // Get required permissions for the operation
            const requiredPermissions = this.getRequiredPermissions(context.operation);
            if (requiredPermissions.length === 0) {
                // No specific permissions required, allow operation
                return { valid: true };
            }
            // Check if user has required permissions
            const missingPermissions = [];
            for (const permission of requiredPermissions) {
                if (!this.rbacManager.hasPermission(context.userId, permission)) {
                    missingPermissions.push(permission);
                }
            }
            if (missingPermissions.length > 0) {
                return {
                    valid: false,
                    error: `Missing required permissions: ${missingPermissions.join(', ')}`,
                    missingPermissions
                };
            }
            // If resource is specified, check resource-level access
            if (context.resourceUri || context.resourceId) {
                const resourceUri = context.resourceUri || this.buildResourceUri(context);
                const accessResult = await this.rbacManager.checkAccess(context, resourceUri, this.getOperationAction(context.operation));
                if (!accessResult.granted) {
                    return {
                        valid: false,
                        error: accessResult.reason,
                        accessResult
                    };
                }
                return {
                    valid: true,
                    accessResult
                };
            }
            return { valid: true };
        }
        catch (error) {
            return {
                valid: false,
                error: `Permission validation failed: ${error.message}`
            };
        }
    }
    /**
     * Validate resource access
     */
    async validateResourceAccess(context, resourceUri, operation) {
        const validationContext = {
            ...context,
            operation,
            resourceUri
        };
        return this.validateOperation(validationContext);
    }
    /**
     * Validate tool execution
     */
    async validateToolExecution(context, toolName, parameters) {
        const validationContext = {
            ...context,
            operation: MCPOperation.TOOL_EXECUTE,
            toolName,
            parameters,
            resourceUri: `tool:${toolName}`
        };
        return this.validateOperation(validationContext);
    }
    /**
     * Validate server administration operation
     */
    async validateServerAdmin(context, operation) {
        if (!this.isServerOperation(operation)) {
            return {
                valid: false,
                error: `Invalid server operation: ${operation}`
            };
        }
        const validationContext = {
            ...context,
            operation,
            resourceUri: 'server:admin'
        };
        return this.validateOperation(validationContext);
    }
    /**
     * Validate broker operation
     */
    async validateBrokerOperation(context, operation, serviceId) {
        if (!this.isBrokerOperation(operation)) {
            return {
                valid: false,
                error: `Invalid broker operation: ${operation}`
            };
        }
        const validationContext = {
            ...context,
            operation,
            resourceUri: serviceId ? `broker:service:${serviceId}` : 'broker:*'
        };
        return this.validateOperation(validationContext);
    }
    /**
     * Check if user can perform operation on resource type
     */
    async canPerformOperation(userId, operation, resourceType) {
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
    getUserAllowedOperations(userId) {
        const allowedOperations = [];
        for (const operation of Object.values(MCPOperation)) {
            const requiredPermissions = this.getRequiredPermissions(operation);
            const hasAllPermissions = requiredPermissions.every(permission => this.rbacManager.hasPermission(userId, permission));
            if (hasAllPermissions) {
                allowedOperations.push(operation);
            }
        }
        return allowedOperations;
    }
    /**
     * Get required permissions for operation
     */
    getRequiredPermissions(operation) {
        return this.operationPermissionMap.get(operation) || [];
    }
    /**
     * Initialize operation to permission mappings
     */
    initializeOperationPermissions() {
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
    buildResourceUri(context) {
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
    getOperationAction(operation) {
        const actionMap = {
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
            [MCPOperation.ADMIN_AUDIT_VIEW]: 'view'
        };
        return actionMap[operation] || 'access';
    }
    /**
     * Check if operation is a server operation
     */
    isServerOperation(operation) {
        return operation.startsWith('server.');
    }
    /**
     * Check if operation is a broker operation
     */
    isBrokerOperation(operation) {
        return operation.startsWith('broker.');
    }
}
//# sourceMappingURL=PermissionValidator.js.map