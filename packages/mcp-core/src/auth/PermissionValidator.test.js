"use strict";
/**
 * Unit tests for PermissionValidator
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
const PermissionValidator_1 = require("./PermissionValidator");
const RBACManager_1 = require("./RBACManager");
(0, globals_1.describe)('PermissionValidator', () => {
    let rbacManager;
    let permissionValidator;
    (0, globals_1.beforeEach)(() => {
        rbacManager = new RBACManager_1.RBACManager({
            enableRoleHierarchy: true,
            defaultDeny: false,
            enableAuditLogging: false // Disable for unit tests
        });
        permissionValidator = new PermissionValidator_1.PermissionValidator(rbacManager);
        // Set up test data
        setupTestData();
    });
    (0, globals_1.describe)('Operation Permission Mapping', () => {
        (0, globals_1.it)('should return correct required permissions for resource operations', () => {
            const readPermissions = permissionValidator.getRequiredPermissions(PermissionValidator_1.MCPOperation.RESOURCE_READ);
            (0, globals_1.expect)(readPermissions).toEqual(['mcp.resource.read']);
            const writePermissions = permissionValidator.getRequiredPermissions(PermissionValidator_1.MCPOperation.RESOURCE_WRITE);
            (0, globals_1.expect)(writePermissions).toEqual(['mcp.resource.write']);
            const deletePermissions = permissionValidator.getRequiredPermissions(PermissionValidator_1.MCPOperation.RESOURCE_DELETE);
            (0, globals_1.expect)(deletePermissions).toEqual(['mcp.resource.write']);
        });
        (0, globals_1.it)('should return correct required permissions for tool operations', () => {
            const executePermissions = permissionValidator.getRequiredPermissions(PermissionValidator_1.MCPOperation.TOOL_EXECUTE);
            (0, globals_1.expect)(executePermissions).toEqual(['mcp.tool.execute']);
            const listPermissions = permissionValidator.getRequiredPermissions(PermissionValidator_1.MCPOperation.TOOL_LIST);
            (0, globals_1.expect)(listPermissions).toEqual(['mcp.tool.execute']);
        });
        (0, globals_1.it)('should return correct required permissions for server operations', () => {
            const infoPermissions = permissionValidator.getRequiredPermissions(PermissionValidator_1.MCPOperation.SERVER_INFO);
            (0, globals_1.expect)(infoPermissions).toEqual([]);
            const configPermissions = permissionValidator.getRequiredPermissions(PermissionValidator_1.MCPOperation.SERVER_CONFIGURE);
            (0, globals_1.expect)(configPermissions).toEqual(['mcp.server.admin']);
        });
        (0, globals_1.it)('should return correct required permissions for admin operations', () => {
            const userManagePermissions = permissionValidator.getRequiredPermissions(PermissionValidator_1.MCPOperation.ADMIN_USER_MANAGE);
            (0, globals_1.expect)(userManagePermissions).toEqual(['mcp.admin.user']);
            const auditViewPermissions = permissionValidator.getRequiredPermissions(PermissionValidator_1.MCPOperation.ADMIN_AUDIT_VIEW);
            (0, globals_1.expect)(auditViewPermissions).toEqual(['mcp.admin.audit']);
        });
    });
    (0, globals_1.describe)('Operation Validation', () => {
        (0, globals_1.it)('should validate operations with sufficient permissions', async () => {
            rbacManager.assignRolesToUser('developer', ['mcp.developer']);
            const validationContext = {
                userId: 'developer',
                roles: rbacManager.getUserRoles('developer'),
                permissions: rbacManager.getUserPermissions('developer').map(p => p.name),
                operation: PermissionValidator_1.MCPOperation.RESOURCE_READ,
                resourceUri: 'file:document.txt'
            };
            const result = await permissionValidator.validateOperation(validationContext);
            (0, globals_1.expect)(result.valid).toBe(true);
            (0, globals_1.expect)(result.error).toBeUndefined();
        });
        (0, globals_1.it)('should reject operations with insufficient permissions', async () => {
            rbacManager.assignRolesToUser('user', ['mcp.user']);
            const validationContext = {
                userId: 'user',
                roles: rbacManager.getUserRoles('user'),
                permissions: rbacManager.getUserPermissions('user').map(p => p.name),
                operation: PermissionValidator_1.MCPOperation.TOOL_EXECUTE,
                resourceUri: 'tool:data-processor'
            };
            const result = await permissionValidator.validateOperation(validationContext);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Missing required permissions');
            (0, globals_1.expect)(result.missingPermissions).toContain('mcp.tool.execute');
        });
        (0, globals_1.it)('should allow operations with no specific permission requirements', async () => {
            rbacManager.assignRolesToUser('user', ['mcp.user']);
            const validationContext = {
                userId: 'user',
                roles: rbacManager.getUserRoles('user'),
                permissions: rbacManager.getUserPermissions('user').map(p => p.name),
                operation: PermissionValidator_1.MCPOperation.SERVER_INFO
            };
            const result = await permissionValidator.validateOperation(validationContext);
            (0, globals_1.expect)(result.valid).toBe(true);
        });
    });
    (0, globals_1.describe)('Resource Access Validation', () => {
        (0, globals_1.it)('should validate resource access with proper permissions', async () => {
            rbacManager.assignRolesToUser('developer', ['mcp.developer']);
            const authContext = {
                userId: 'developer',
                roles: rbacManager.getUserRoles('developer'),
                permissions: rbacManager.getUserPermissions('developer').map(p => p.name)
            };
            const result = await permissionValidator.validateResourceAccess(authContext, 'file:project/source.ts', PermissionValidator_1.MCPOperation.RESOURCE_READ);
            (0, globals_1.expect)(result.valid).toBe(true);
        });
        (0, globals_1.it)('should reject resource access without proper permissions', async () => {
            rbacManager.assignRolesToUser('user', ['mcp.user']);
            const authContext = {
                userId: 'user',
                roles: rbacManager.getUserRoles('user'),
                permissions: rbacManager.getUserPermissions('user').map(p => p.name)
            };
            const result = await permissionValidator.validateResourceAccess(authContext, 'file:project/source.ts', PermissionValidator_1.MCPOperation.RESOURCE_WRITE);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.missingPermissions).toContain('mcp.resource.write');
        });
    });
    (0, globals_1.describe)('Tool Execution Validation', () => {
        (0, globals_1.it)('should validate tool execution with proper permissions', async () => {
            rbacManager.assignRolesToUser('developer', ['mcp.developer']);
            const authContext = {
                userId: 'developer',
                roles: rbacManager.getUserRoles('developer'),
                permissions: rbacManager.getUserPermissions('developer').map(p => p.name)
            };
            const result = await permissionValidator.validateToolExecution(authContext, 'file-processor', { inputFile: 'test.txt' });
            (0, globals_1.expect)(result.valid).toBe(true);
        });
        (0, globals_1.it)('should reject tool execution without proper permissions', async () => {
            rbacManager.assignRolesToUser('user', ['mcp.user']);
            const authContext = {
                userId: 'user',
                roles: rbacManager.getUserRoles('user'),
                permissions: rbacManager.getUserPermissions('user').map(p => p.name)
            };
            const result = await permissionValidator.validateToolExecution(authContext, 'file-processor', { inputFile: 'test.txt' });
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.missingPermissions).toContain('mcp.tool.execute');
        });
    });
    (0, globals_1.describe)('Server Administration Validation', () => {
        (0, globals_1.it)('should validate server admin operations with proper permissions', async () => {
            rbacManager.assignRolesToUser('admin', ['mcp.admin']);
            const authContext = {
                userId: 'admin',
                roles: rbacManager.getUserRoles('admin'),
                permissions: rbacManager.getUserPermissions('admin').map(p => p.name)
            };
            const result = await permissionValidator.validateServerAdmin(authContext, PermissionValidator_1.MCPOperation.SERVER_CONFIGURE);
            (0, globals_1.expect)(result.valid).toBe(true);
        });
        (0, globals_1.it)('should reject server admin operations without proper permissions', async () => {
            rbacManager.assignRolesToUser('user', ['mcp.user']);
            const authContext = {
                userId: 'user',
                roles: rbacManager.getUserRoles('user'),
                permissions: rbacManager.getUserPermissions('user').map(p => p.name)
            };
            const result = await permissionValidator.validateServerAdmin(authContext, PermissionValidator_1.MCPOperation.SERVER_CONFIGURE);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.missingPermissions).toContain('mcp.server.admin');
        });
        (0, globals_1.it)('should reject invalid server operations', async () => {
            rbacManager.assignRolesToUser('admin', ['mcp.admin']);
            const authContext = {
                userId: 'admin',
                roles: rbacManager.getUserRoles('admin'),
                permissions: rbacManager.getUserPermissions('admin').map(p => p.name)
            };
            const result = await permissionValidator.validateServerAdmin(authContext, PermissionValidator_1.MCPOperation.RESOURCE_READ // Not a server operation
            );
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Invalid server operation');
        });
    });
    (0, globals_1.describe)('Broker Operation Validation', () => {
        (0, globals_1.beforeEach)(() => {
            // Add broker permissions
            const brokerPermissions = [
                {
                    name: 'mcp.broker.register',
                    description: 'Register services with broker',
                    resourceType: 'broker',
                    operations: ['register', 'unregister']
                },
                {
                    name: 'mcp.broker.discover',
                    description: 'Discover services',
                    resourceType: 'broker',
                    operations: ['discover']
                }
            ];
            brokerPermissions.forEach(p => rbacManager.createPermission(p));
            const brokerRole = {
                name: 'mcp.broker-operator',
                description: 'Broker Operator',
                permissions: ['mcp.broker.register', 'mcp.broker.discover'],
                createdAt: new Date(),
                updatedAt: new Date()
            };
            rbacManager.createRole(brokerRole);
        });
        (0, globals_1.it)('should validate broker operations with proper permissions', async () => {
            rbacManager.assignRolesToUser('broker-operator', ['mcp.broker-operator']);
            const authContext = {
                userId: 'broker-operator',
                roles: rbacManager.getUserRoles('broker-operator'),
                permissions: rbacManager.getUserPermissions('broker-operator').map(p => p.name)
            };
            const result = await permissionValidator.validateBrokerOperation(authContext, PermissionValidator_1.MCPOperation.BROKER_REGISTER, 'test-service');
            (0, globals_1.expect)(result.valid).toBe(true);
        });
        (0, globals_1.it)('should reject broker operations without proper permissions', async () => {
            rbacManager.assignRolesToUser('user', ['mcp.user']);
            const authContext = {
                userId: 'user',
                roles: rbacManager.getUserRoles('user'),
                permissions: rbacManager.getUserPermissions('user').map(p => p.name)
            };
            const result = await permissionValidator.validateBrokerOperation(authContext, PermissionValidator_1.MCPOperation.BROKER_REGISTER, 'test-service');
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.missingPermissions).toContain('mcp.broker.register');
        });
        (0, globals_1.it)('should reject invalid broker operations', async () => {
            rbacManager.assignRolesToUser('broker-operator', ['mcp.broker-operator']);
            const authContext = {
                userId: 'broker-operator',
                roles: rbacManager.getUserRoles('broker-operator'),
                permissions: rbacManager.getUserPermissions('broker-operator').map(p => p.name)
            };
            const result = await permissionValidator.validateBrokerOperation(authContext, PermissionValidator_1.MCPOperation.RESOURCE_READ // Not a broker operation
            );
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.error).toContain('Invalid broker operation');
        });
    });
    (0, globals_1.describe)('User Operation Capabilities', () => {
        (0, globals_1.it)('should check if user can perform specific operations', async () => {
            rbacManager.assignRolesToUser('developer', ['mcp.developer']);
            const canRead = await permissionValidator.canPerformOperation('developer', PermissionValidator_1.MCPOperation.RESOURCE_READ);
            const canExecuteTool = await permissionValidator.canPerformOperation('developer', PermissionValidator_1.MCPOperation.TOOL_EXECUTE);
            const canConfigureServer = await permissionValidator.canPerformOperation('developer', PermissionValidator_1.MCPOperation.SERVER_CONFIGURE);
            (0, globals_1.expect)(canRead).toBe(true);
            (0, globals_1.expect)(canExecuteTool).toBe(true);
            (0, globals_1.expect)(canConfigureServer).toBe(false);
        });
        (0, globals_1.it)('should get all allowed operations for user', () => {
            rbacManager.assignRolesToUser('developer', ['mcp.developer']);
            const allowedOperations = permissionValidator.getUserAllowedOperations('developer');
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.RESOURCE_READ);
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.RESOURCE_WRITE);
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.TOOL_EXECUTE);
            (0, globals_1.expect)(allowedOperations).not.toContain(PermissionValidator_1.MCPOperation.SERVER_CONFIGURE);
        });
        (0, globals_1.it)('should return limited operations for basic user', () => {
            rbacManager.assignRolesToUser('user', ['mcp.user']);
            const allowedOperations = permissionValidator.getUserAllowedOperations('user');
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.RESOURCE_READ);
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.SERVER_INFO);
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.SERVER_CAPABILITIES);
            (0, globals_1.expect)(allowedOperations).not.toContain(PermissionValidator_1.MCPOperation.RESOURCE_WRITE);
            (0, globals_1.expect)(allowedOperations).not.toContain(PermissionValidator_1.MCPOperation.TOOL_EXECUTE);
        });
        (0, globals_1.it)('should return all operations for admin user', () => {
            rbacManager.assignRolesToUser('admin', ['mcp.admin']);
            const allowedOperations = permissionValidator.getUserAllowedOperations('admin');
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.RESOURCE_READ);
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.RESOURCE_WRITE);
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.TOOL_EXECUTE);
            (0, globals_1.expect)(allowedOperations).toContain(PermissionValidator_1.MCPOperation.SERVER_CONFIGURE);
        });
    });
    (0, globals_1.describe)('Resource URI Building', () => {
        (0, globals_1.it)('should build correct resource URIs from context', async () => {
            rbacManager.assignRolesToUser('developer', ['mcp.developer']);
            // Test with resourceId
            const contextWithId = {
                userId: 'developer',
                roles: rbacManager.getUserRoles('developer'),
                permissions: rbacManager.getUserPermissions('developer').map(p => p.name),
                operation: PermissionValidator_1.MCPOperation.RESOURCE_READ,
                resourceType: PermissionValidator_1.MCPResourceType.FILE,
                resourceId: 'document.txt'
            };
            const resultWithId = await permissionValidator.validateOperation(contextWithId);
            (0, globals_1.expect)(resultWithId.valid).toBe(true);
            // Test with toolName
            const contextWithTool = {
                userId: 'developer',
                roles: rbacManager.getUserRoles('developer'),
                permissions: rbacManager.getUserPermissions('developer').map(p => p.name),
                operation: PermissionValidator_1.MCPOperation.TOOL_EXECUTE,
                toolName: 'file-processor'
            };
            const resultWithTool = await permissionValidator.validateOperation(contextWithTool);
            (0, globals_1.expect)(resultWithTool.valid).toBe(true);
        });
    });
    (0, globals_1.describe)('Error Handling', () => {
        (0, globals_1.it)('should handle validation errors gracefully', async () => {
            // Create context with invalid user
            const invalidContext = {
                userId: 'nonexistent-user',
                roles: [],
                permissions: [],
                operation: PermissionValidator_1.MCPOperation.RESOURCE_READ,
                resourceUri: 'file:test.txt'
            };
            const result = await permissionValidator.validateOperation(invalidContext);
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.error).toBeDefined();
        });
        (0, globals_1.it)('should handle missing RBAC manager gracefully', async () => {
            // This test ensures the validator handles edge cases
            const context = {
                userId: 'testuser',
                roles: ['mcp.user'],
                permissions: ['mcp.resource.read'],
                operation: PermissionValidator_1.MCPOperation.RESOURCE_READ,
                resourceUri: 'file:test.txt'
            };
            const result = await permissionValidator.validateOperation(context);
            // The validator checks against the RBAC manager, so without proper setup it should fail
            (0, globals_1.expect)(result.valid).toBe(false);
            (0, globals_1.expect)(result.error).toBeDefined();
        });
    });
    /**
     * Set up test data for permission validator tests
     */
    function setupTestData() {
        // Additional permissions for testing
        const additionalPermissions = [
            {
                name: 'mcp.admin.user',
                description: 'Manage users',
                resourceType: 'admin',
                operations: ['create', 'read', 'update', 'delete']
            },
            {
                name: 'mcp.admin.audit',
                description: 'View audit logs',
                resourceType: 'admin',
                operations: ['read', 'query']
            }
        ];
        additionalPermissions.forEach(p => rbacManager.createPermission(p));
        // Additional roles for testing
        const additionalRoles = [
            {
                name: 'mcp.super-admin',
                description: 'Super Administrator',
                permissions: [
                    'mcp.resource.read', 'mcp.resource.write', 'mcp.tool.execute',
                    'mcp.server.admin', 'mcp.admin.user', 'mcp.admin.audit'
                ],
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        additionalRoles.forEach(r => rbacManager.createRole(r));
    }
});
//# sourceMappingURL=PermissionValidator.test.js.map