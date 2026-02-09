/**
 * Unit tests for PermissionValidator
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { PermissionValidator, MCPOperation, MCPResourceType } from './PermissionValidator';
import { RBACManager, Permission, Role } from './RBACManager';
import { AuthContext } from './AuthenticationManager';

describe('PermissionValidator', () => {
  let rbacManager: RBACManager;
  let permissionValidator: PermissionValidator;

  beforeEach(() => {
    rbacManager = new RBACManager({
      enableRoleHierarchy: true,
      defaultDeny: false,
      enableAuditLogging: false // Disable for unit tests
    });

    permissionValidator = new PermissionValidator(rbacManager);

    // Set up test data
    setupTestData();
  });

  describe('Operation Permission Mapping', () => {
    it('should return correct required permissions for resource operations', () => {
      const readPermissions = permissionValidator.getRequiredPermissions(MCPOperation.RESOURCE_READ);
      expect(readPermissions).toEqual(['mcp.resource.read']);

      const writePermissions = permissionValidator.getRequiredPermissions(MCPOperation.RESOURCE_WRITE);
      expect(writePermissions).toEqual(['mcp.resource.write']);

      const deletePermissions = permissionValidator.getRequiredPermissions(MCPOperation.RESOURCE_DELETE);
      expect(deletePermissions).toEqual(['mcp.resource.write']);
    });

    it('should return correct required permissions for tool operations', () => {
      const executePermissions = permissionValidator.getRequiredPermissions(MCPOperation.TOOL_EXECUTE);
      expect(executePermissions).toEqual(['mcp.tool.execute']);

      const listPermissions = permissionValidator.getRequiredPermissions(MCPOperation.TOOL_LIST);
      expect(listPermissions).toEqual(['mcp.tool.execute']);
    });

    it('should return correct required permissions for server operations', () => {
      const infoPermissions = permissionValidator.getRequiredPermissions(MCPOperation.SERVER_INFO);
      expect(infoPermissions).toEqual([]);

      const configPermissions = permissionValidator.getRequiredPermissions(MCPOperation.SERVER_CONFIGURE);
      expect(configPermissions).toEqual(['mcp.server.admin']);
    });

    it('should return correct required permissions for admin operations', () => {
      const userManagePermissions = permissionValidator.getRequiredPermissions(MCPOperation.ADMIN_USER_MANAGE);
      expect(userManagePermissions).toEqual(['mcp.admin.user']);

      const auditViewPermissions = permissionValidator.getRequiredPermissions(MCPOperation.ADMIN_AUDIT_VIEW);
      expect(auditViewPermissions).toEqual(['mcp.admin.audit']);
    });
  });

  describe('Operation Validation', () => {
    it('should validate operations with sufficient permissions', async () => {
      rbacManager.assignRolesToUser('developer', ['mcp.developer']);

      const validationContext = {
        userId: 'developer',
        roles: rbacManager.getUserRoles('developer'),
        permissions: rbacManager.getUserPermissions('developer').map(p => p.name),
        operation: MCPOperation.RESOURCE_READ,
        resourceUri: 'file:document.txt'
      };

      const result = await permissionValidator.validateOperation(validationContext);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject operations with insufficient permissions', async () => {
      rbacManager.assignRolesToUser('user', ['mcp.user']);

      const validationContext = {
        userId: 'user',
        roles: rbacManager.getUserRoles('user'),
        permissions: rbacManager.getUserPermissions('user').map(p => p.name),
        operation: MCPOperation.TOOL_EXECUTE,
        resourceUri: 'tool:data-processor'
      };

      const result = await permissionValidator.validateOperation(validationContext);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Missing required permissions');
      expect(result.missingPermissions).toContain('mcp.tool.execute');
    });

    it('should allow operations with no specific permission requirements', async () => {
      rbacManager.assignRolesToUser('user', ['mcp.user']);

      const validationContext = {
        userId: 'user',
        roles: rbacManager.getUserRoles('user'),
        permissions: rbacManager.getUserPermissions('user').map(p => p.name),
        operation: MCPOperation.SERVER_INFO
      };

      const result = await permissionValidator.validateOperation(validationContext);

      expect(result.valid).toBe(true);
    });
  });

  describe('Resource Access Validation', () => {
    it('should validate resource access with proper permissions', async () => {
      rbacManager.assignRolesToUser('developer', ['mcp.developer']);

      const authContext: AuthContext = {
        userId: 'developer',
        roles: rbacManager.getUserRoles('developer'),
        permissions: rbacManager.getUserPermissions('developer').map(p => p.name)
      };

      const result = await permissionValidator.validateResourceAccess(
        authContext,
        'file:project/source.ts',
        MCPOperation.RESOURCE_READ
      );

      expect(result.valid).toBe(true);
    });

    it('should reject resource access without proper permissions', async () => {
      rbacManager.assignRolesToUser('user', ['mcp.user']);

      const authContext: AuthContext = {
        userId: 'user',
        roles: rbacManager.getUserRoles('user'),
        permissions: rbacManager.getUserPermissions('user').map(p => p.name)
      };

      const result = await permissionValidator.validateResourceAccess(
        authContext,
        'file:project/source.ts',
        MCPOperation.RESOURCE_WRITE
      );

      expect(result.valid).toBe(false);
      expect(result.missingPermissions).toContain('mcp.resource.write');
    });
  });

  describe('Tool Execution Validation', () => {
    it('should validate tool execution with proper permissions', async () => {
      rbacManager.assignRolesToUser('developer', ['mcp.developer']);

      const authContext: AuthContext = {
        userId: 'developer',
        roles: rbacManager.getUserRoles('developer'),
        permissions: rbacManager.getUserPermissions('developer').map(p => p.name)
      };

      const result = await permissionValidator.validateToolExecution(
        authContext,
        'file-processor',
        { inputFile: 'test.txt' }
      );

      expect(result.valid).toBe(true);
    });

    it('should reject tool execution without proper permissions', async () => {
      rbacManager.assignRolesToUser('user', ['mcp.user']);

      const authContext: AuthContext = {
        userId: 'user',
        roles: rbacManager.getUserRoles('user'),
        permissions: rbacManager.getUserPermissions('user').map(p => p.name)
      };

      const result = await permissionValidator.validateToolExecution(
        authContext,
        'file-processor',
        { inputFile: 'test.txt' }
      );

      expect(result.valid).toBe(false);
      expect(result.missingPermissions).toContain('mcp.tool.execute');
    });
  });

  describe('Server Administration Validation', () => {
    it('should validate server admin operations with proper permissions', async () => {
      rbacManager.assignRolesToUser('admin', ['mcp.admin']);

      const authContext: AuthContext = {
        userId: 'admin',
        roles: rbacManager.getUserRoles('admin'),
        permissions: rbacManager.getUserPermissions('admin').map(p => p.name)
      };

      const result = await permissionValidator.validateServerAdmin(
        authContext,
        MCPOperation.SERVER_CONFIGURE
      );

      expect(result.valid).toBe(true);
    });

    it('should reject server admin operations without proper permissions', async () => {
      rbacManager.assignRolesToUser('user', ['mcp.user']);

      const authContext: AuthContext = {
        userId: 'user',
        roles: rbacManager.getUserRoles('user'),
        permissions: rbacManager.getUserPermissions('user').map(p => p.name)
      };

      const result = await permissionValidator.validateServerAdmin(
        authContext,
        MCPOperation.SERVER_CONFIGURE
      );

      expect(result.valid).toBe(false);
      expect(result.missingPermissions).toContain('mcp.server.admin');
    });

    it('should reject invalid server operations', async () => {
      rbacManager.assignRolesToUser('admin', ['mcp.admin']);

      const authContext: AuthContext = {
        userId: 'admin',
        roles: rbacManager.getUserRoles('admin'),
        permissions: rbacManager.getUserPermissions('admin').map(p => p.name)
      };

      const result = await permissionValidator.validateServerAdmin(
        authContext,
        MCPOperation.RESOURCE_READ // Not a server operation
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid server operation');
    });
  });

  describe('Broker Operation Validation', () => {
    beforeEach(() => {
      // Add broker permissions
      const brokerPermissions: Permission[] = [
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

      const brokerRole: Role = {
        name: 'mcp.broker-operator',
        description: 'Broker Operator',
        permissions: ['mcp.broker.register', 'mcp.broker.discover'],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      rbacManager.createRole(brokerRole);
    });

    it('should validate broker operations with proper permissions', async () => {
      rbacManager.assignRolesToUser('broker-operator', ['mcp.broker-operator']);

      const authContext: AuthContext = {
        userId: 'broker-operator',
        roles: rbacManager.getUserRoles('broker-operator'),
        permissions: rbacManager.getUserPermissions('broker-operator').map(p => p.name)
      };

      const result = await permissionValidator.validateBrokerOperation(
        authContext,
        MCPOperation.BROKER_REGISTER,
        'test-service'
      );

      expect(result.valid).toBe(true);
    });

    it('should reject broker operations without proper permissions', async () => {
      rbacManager.assignRolesToUser('user', ['mcp.user']);

      const authContext: AuthContext = {
        userId: 'user',
        roles: rbacManager.getUserRoles('user'),
        permissions: rbacManager.getUserPermissions('user').map(p => p.name)
      };

      const result = await permissionValidator.validateBrokerOperation(
        authContext,
        MCPOperation.BROKER_REGISTER,
        'test-service'
      );

      expect(result.valid).toBe(false);
      expect(result.missingPermissions).toContain('mcp.broker.register');
    });

    it('should reject invalid broker operations', async () => {
      rbacManager.assignRolesToUser('broker-operator', ['mcp.broker-operator']);

      const authContext: AuthContext = {
        userId: 'broker-operator',
        roles: rbacManager.getUserRoles('broker-operator'),
        permissions: rbacManager.getUserPermissions('broker-operator').map(p => p.name)
      };

      const result = await permissionValidator.validateBrokerOperation(
        authContext,
        MCPOperation.RESOURCE_READ // Not a broker operation
      );

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid broker operation');
    });
  });

  describe('User Operation Capabilities', () => {
    it('should check if user can perform specific operations', async () => {
      rbacManager.assignRolesToUser('developer', ['mcp.developer']);

      const canRead = await permissionValidator.canPerformOperation(
        'developer',
        MCPOperation.RESOURCE_READ
      );

      const canExecuteTool = await permissionValidator.canPerformOperation(
        'developer',
        MCPOperation.TOOL_EXECUTE
      );

      const canConfigureServer = await permissionValidator.canPerformOperation(
        'developer',
        MCPOperation.SERVER_CONFIGURE
      );

      expect(canRead).toBe(true);
      expect(canExecuteTool).toBe(true);
      expect(canConfigureServer).toBe(false);
    });

    it('should get all allowed operations for user', () => {
      rbacManager.assignRolesToUser('developer', ['mcp.developer']);

      const allowedOperations = permissionValidator.getUserAllowedOperations('developer');

      expect(allowedOperations).toContain(MCPOperation.RESOURCE_READ);
      expect(allowedOperations).toContain(MCPOperation.RESOURCE_WRITE);
      expect(allowedOperations).toContain(MCPOperation.TOOL_EXECUTE);
      expect(allowedOperations).not.toContain(MCPOperation.SERVER_CONFIGURE);
    });

    it('should return limited operations for basic user', () => {
      rbacManager.assignRolesToUser('user', ['mcp.user']);

      const allowedOperations = permissionValidator.getUserAllowedOperations('user');

      expect(allowedOperations).toContain(MCPOperation.RESOURCE_READ);
      expect(allowedOperations).toContain(MCPOperation.SERVER_INFO);
      expect(allowedOperations).toContain(MCPOperation.SERVER_CAPABILITIES);
      expect(allowedOperations).not.toContain(MCPOperation.RESOURCE_WRITE);
      expect(allowedOperations).not.toContain(MCPOperation.TOOL_EXECUTE);
    });

    it('should return all operations for admin user', () => {
      rbacManager.assignRolesToUser('admin', ['mcp.admin']);

      const allowedOperations = permissionValidator.getUserAllowedOperations('admin');

      expect(allowedOperations).toContain(MCPOperation.RESOURCE_READ);
      expect(allowedOperations).toContain(MCPOperation.RESOURCE_WRITE);
      expect(allowedOperations).toContain(MCPOperation.TOOL_EXECUTE);
      expect(allowedOperations).toContain(MCPOperation.SERVER_CONFIGURE);
    });
  });

  describe('Resource URI Building', () => {
    it('should build correct resource URIs from context', async () => {
      rbacManager.assignRolesToUser('developer', ['mcp.developer']);

      // Test with resourceId
      const contextWithId = {
        userId: 'developer',
        roles: rbacManager.getUserRoles('developer'),
        permissions: rbacManager.getUserPermissions('developer').map(p => p.name),
        operation: MCPOperation.RESOURCE_READ,
        resourceType: MCPResourceType.FILE,
        resourceId: 'document.txt'
      };

      const resultWithId = await permissionValidator.validateOperation(contextWithId);
      expect(resultWithId.valid).toBe(true);

      // Test with toolName
      const contextWithTool = {
        userId: 'developer',
        roles: rbacManager.getUserRoles('developer'),
        permissions: rbacManager.getUserPermissions('developer').map(p => p.name),
        operation: MCPOperation.TOOL_EXECUTE,
        toolName: 'file-processor'
      };

      const resultWithTool = await permissionValidator.validateOperation(contextWithTool);
      expect(resultWithTool.valid).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      // Create context with invalid user
      const invalidContext = {
        userId: 'nonexistent-user',
        roles: [],
        permissions: [],
        operation: MCPOperation.RESOURCE_READ,
        resourceUri: 'file:test.txt'
      };

      const result = await permissionValidator.validateOperation(invalidContext);

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle missing RBAC manager gracefully', async () => {
      // This test ensures the validator handles edge cases
      const context = {
        userId: 'testuser',
        roles: ['mcp.user'],
        permissions: ['mcp.resource.read'],
        operation: MCPOperation.RESOURCE_READ,
        resourceUri: 'file:test.txt'
      };

      const result = await permissionValidator.validateOperation(context);

      // The validator checks against the RBAC manager, so without proper setup it should fail
      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });
  });

  /**
   * Set up test data for permission validator tests
   */
  function setupTestData(): void {
    // Additional permissions for testing
    const additionalPermissions: Permission[] = [
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
    const additionalRoles: Role[] = [
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