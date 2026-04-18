/**
 * Tests for ResourceManager
 */

// @ts-expect-error - Jest globals are available without import
import { ResourceManager, ResourceQuery, AccessContext } from './ResourceManager.js';
import { MCPResource, ResourceHandler, ResourceContent } from '../interfaces/IMCPResource.js';
import { MCPErrorCode } from '../types/error.js';

// Mock resource handler for testing
class MockResourceHandler implements ResourceHandler {
  private content: string;

  constructor(content: string = 'mock content') {
    this.content = content;
  }

  async read(uri: string, params?: any): Promise<ResourceContent> {
    return {
      uri,
      mimeType: 'text/plain',
      content: this.content,
      size: Buffer.byteLength(this.content, 'utf8'),
      lastModified: new Date(),
      encoding: 'utf8'
    };
  }

  async list(pattern?: string): Promise<MCPResource[]> {
    return [];
  }
}

describe('ResourceManager', () => {
  let manager: ResourceManager;
  let mockHandler: MockResourceHandler;
  let testResource: MCPResource;
  let testContext: AccessContext;

  beforeEach(() => {
    manager = new ResourceManager();
    mockHandler = new MockResourceHandler();
    testResource = {
      uri: 'test://example/resource1',
      name: 'Test Resource 1',
      description: 'A test resource',
      mimeType: 'text/plain',
      handler: mockHandler,
      permissions: {
        read: true,
        write: false,
        subscribe: false
      }
    };
    testContext = {
      principal: 'user123',
      roles: ['user'],
      permissions: ['read']
    };
  });

  describe('Resource Registration', () => {
    it('should register a resource successfully', () => {
      expect(() => manager.registerResource(testResource)).not.toThrow();
    });

    it('should throw error for invalid resource', () => {
      const invalidResource = {
        uri: '',
        name: '',
        handler: mockHandler
      } as MCPResource;

      expect(() => manager.registerResource(invalidResource)).toThrow();
    });

    it('should unregister a resource successfully', () => {
      manager.registerResource(testResource);
      const result = manager.unregisterResource(testResource.uri);
      expect(result).toBe(true);
    });

    it('should return false when unregistering non-existent resource', () => {
      const result = manager.unregisterResource('non-existent://resource');
      expect(result).toBe(false);
    });
  });

  describe('Resource Discovery', () => {
    beforeEach(() => {
      manager.registerResource(testResource);
      manager.registerResource({
        uri: 'test://example/resource2',
        name: 'Test Resource 2',
        description: 'Another test resource',
        mimeType: 'application/json',
        handler: mockHandler,
        permissions: {
          read: true,
          write: true,
          subscribe: false
        }
      });
    });

    it('should discover all resources without filters', async () => {
      const resources = await manager.discoverResources();
      expect(resources).toHaveLength(2);
    });

    it('should filter resources by URI pattern', async () => {
      const query: ResourceQuery = {
        uriPattern: '*resource1'
      };
      const resources = await manager.discoverResources(query);
      expect(resources).toHaveLength(1);
      expect(resources[0].uri).toBe('test://example/resource1');
    });

    it('should filter resources by name pattern', async () => {
      const query: ResourceQuery = {
        namePattern: '*Resource 2'
      };
      const resources = await manager.discoverResources(query);
      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('Test Resource 2');
    });

    it('should filter resources by MIME type', async () => {
      const query: ResourceQuery = {
        mimeType: 'application/json'
      };
      const resources = await manager.discoverResources(query);
      expect(resources).toHaveLength(1);
      expect(resources[0].mimeType).toBe('application/json');
    });

    it('should apply pagination', async () => {
      const query: ResourceQuery = {
        limit: 1,
        offset: 0
      };
      const resources = await manager.discoverResources(query);
      expect(resources).toHaveLength(1);
    });

    it('should sort resources by name', async () => {
      const query: ResourceQuery = {
        sortBy: 'name',
        sortOrder: 'asc'
      };
      const resources = await manager.discoverResources(query);
      expect(resources[0].name).toBe('Test Resource 1');
      expect(resources[1].name).toBe('Test Resource 2');
    });

    it('should filter by access context', async () => {
      const restrictedContext: AccessContext = {
        principal: 'user123',
        roles: ['guest'],
        permissions: []
      };
      
      // Add a resource that requires admin role
      manager.registerResource({
        uri: 'test://admin/resource',
        name: 'Admin Resource',
        handler: mockHandler,
        permissions: {
          read: true,
          requiredRoles: ['admin']
        }
      });

      const resources = await manager.discoverResources({}, restrictedContext);
      expect(resources).toHaveLength(2); // Should not include admin resource
      expect(resources.find(r => r.name === 'Admin Resource')).toBeUndefined();
    });
  });

  describe('Resource Access Control', () => {
    beforeEach(() => {
      manager.registerResource(testResource);
    });

    it('should allow access with proper permissions', () => {
      const hasAccess = manager.checkResourceAccess(testResource, 'read', testContext);
      expect(hasAccess).toBe(true);
    });

    it('should deny access without proper permissions', () => {
      const restrictedContext: AccessContext = {
        principal: 'user123',
        roles: ['guest'],
        permissions: []
      };
      
      const restrictedResource: MCPResource = {
        ...testResource,
        permissions: {
          read: true,
          requiredRoles: ['admin']
        }
      };

      const hasAccess = manager.checkResourceAccess(restrictedResource, 'read', restrictedContext);
      expect(hasAccess).toBe(false);
    });

    it('should evaluate ACL entries correctly', () => {
      const aclResource: MCPResource = {
        ...testResource,
        permissions: {
          read: true,
          acl: [
            {
              principal: 'user123',
              permissions: ['read'],
              type: 'allow'
            },
            {
              principal: 'user456',
              permissions: ['read'],
              type: 'deny'
            }
          ]
        }
      };

      const hasAccess = manager.checkResourceAccess(aclResource, 'read', testContext);
      expect(hasAccess).toBe(true);

      const deniedContext: AccessContext = {
        principal: 'user456',
        roles: ['user'],
        permissions: ['read']
      };
      const deniedAccess = manager.checkResourceAccess(aclResource, 'read', deniedContext);
      expect(deniedAccess).toBe(false);
    });

    it('should handle role-based ACL entries', () => {
      const roleBasedResource: MCPResource = {
        ...testResource,
        permissions: {
          read: true,
          acl: [
            {
              principal: 'role:admin',
              permissions: ['*'],
              type: 'allow'
            }
          ]
        }
      };

      const adminContext: AccessContext = {
        principal: 'admin123',
        roles: ['admin'],
        permissions: ['read', 'write']
      };

      const hasAccess = manager.checkResourceAccess(roleBasedResource, 'read', adminContext);
      expect(hasAccess).toBe(true);
    });
  });

  describe('Resource Reading with Caching', () => {
    beforeEach(() => {
      manager.registerResource(testResource);
    });

    it('should read resource content successfully', async () => {
      const content = await manager.readResource(testResource.uri, testContext);
      expect(content.uri).toBe(testResource.uri);
      expect(content.content).toBe('mock content');
    });

    it('should throw error for non-existent resource', async () => {
      await expect(
        manager.readResource('non-existent://resource', testContext)
      ).rejects.toThrow();
    });

    it('should throw error for access denied', async () => {
      const restrictedContext: AccessContext = {
        principal: 'user123',
        roles: ['guest'],
        permissions: []
      };

      const restrictedResource: MCPResource = {
        ...testResource,
        permissions: {
          read: true,
          requiredRoles: ['admin']
        }
      };

      manager.registerResource(restrictedResource);

      await expect(
        manager.readResource(restrictedResource.uri, restrictedContext)
      ).rejects.toThrow();
    });

    it('should cache resource content when caching is enabled', async () => {
      const cachedResource: MCPResource = {
        ...testResource,
        caching: {
          enabled: true,
          ttl: 300
        }
      };

      manager.registerResource(cachedResource);

      // First read - should cache
      const content1 = await manager.readResource(cachedResource.uri, testContext);
      
      // Second read - should use cache
      const content2 = await manager.readResource(cachedResource.uri, testContext);
      
      expect(content1.content).toBe(content2.content);
    });

    it('should not cache when caching is disabled', async () => {
      const nonCachedResource: MCPResource = {
        ...testResource,
        caching: {
          enabled: false
        }
      };

      manager.registerResource(nonCachedResource);

      const content = await manager.readResource(nonCachedResource.uri, testContext);
      expect(content.content).toBe('mock content');
    });
  });

  describe('Access Statistics', () => {
    beforeEach(() => {
      manager.registerResource(testResource);
    });

    it('should track access statistics', async () => {
      await manager.readResource(testResource.uri, testContext);
      
      const stats = manager.getAccessStatistics(testResource.uri);
      expect(stats.totalAccesses).toBe(1);
      expect(stats.successfulAccesses).toBe(1);
      expect(stats.failedAccesses).toBe(0);
      expect(stats.uniquePrincipals).toBe(1);
    });

    it('should track failed access attempts', async () => {
      try {
        await manager.readResource('non-existent://resource', testContext);
      } catch {
        // Expected to fail
      }
      
      const stats = manager.getAccessStatistics();
      expect(stats.totalAccesses).toBe(1);
      expect(stats.successfulAccesses).toBe(0);
      expect(stats.failedAccesses).toBe(1);
    });

    it('should track most common errors', async () => {
      // Generate multiple failed attempts
      for (let i = 0; i < 3; i++) {
        try {
          await manager.readResource('non-existent://resource', testContext);
        } catch {
          // Expected to fail
        }
      }
      
      const stats = manager.getAccessStatistics();
      expect(stats.mostCommonError).toBe('Resource not found');
    });
  });

  describe('Cache Management', () => {
    beforeEach(() => {
      const cachedResource: MCPResource = {
        ...testResource,
        caching: {
          enabled: true,
          ttl: 300
        }
      };
      manager.registerResource(cachedResource);
    });

    it('should provide cache statistics', async () => {
      await manager.readResource(testResource.uri, testContext);
      
      const stats = manager.getCacheStatistics();
      expect(stats.totalEntries).toBe(1);
      expect(stats.totalSize).toBeGreaterThan(0);
    });

    it('should clear cache for specific resource', async () => {
      await manager.readResource(testResource.uri, testContext);
      
      manager.clearCache(testResource.uri);
      
      const stats = manager.getCacheStatistics();
      expect(stats.totalEntries).toBe(0);
    });

    it('should clear all cache entries', async () => {
      await manager.readResource(testResource.uri, testContext);
      
      manager.clearCache();
      
      const stats = manager.getCacheStatistics();
      expect(stats.totalEntries).toBe(0);
    });
  });

  describe('List Resources', () => {
    beforeEach(() => {
      manager.registerResource(testResource);
      manager.registerResource({
        uri: 'test://example/resource2',
        name: 'Test Resource 2',
        handler: mockHandler,
        permissions: {
          read: true
        }
      });
    });

    it('should list all resources without pattern', async () => {
      const resources = await manager.listResources(undefined, testContext);
      expect(resources).toHaveLength(2);
    });

    it('should list resources with pattern', async () => {
      const resources = await manager.listResources('*Resource 1', testContext);
      expect(resources).toHaveLength(1);
      expect(resources[0].name).toBe('Test Resource 1');
    });

    it('should respect access control when listing', async () => {
      const restrictedContext: AccessContext = {
        principal: 'guest',
        roles: ['guest'],
        permissions: []
      };

      // Add a restricted resource
      manager.registerResource({
        uri: 'test://admin/secret',
        name: 'Secret Resource',
        handler: mockHandler,
        permissions: {
          read: true,
          requiredRoles: ['admin']
        }
      });

      const resources = await manager.listResources(undefined, restrictedContext);
      expect(resources).toHaveLength(2); // Should not include secret resource
      expect(resources.find(r => r.name === 'Secret Resource')).toBeUndefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle discovery errors gracefully', async () => {
      // Mock the discoverResources method to throw an error
      const originalMethod = manager.discoverResources;
      manager.discoverResources = jest.fn().mockRejectedValue(new Error('Discovery failed'));

      await expect(manager.discoverResources({})).rejects.toThrow('Discovery failed');
      
      // Restore original method
      manager.discoverResources = originalMethod;
    });

    it('should handle resource handler errors', async () => {
      const errorHandler = {
        async read() {
          throw new Error('Handler error');
        }
      } as ResourceHandler;

      const errorResource: MCPResource = {
        uri: 'test://error/resource',
        name: 'Error Resource',
        handler: errorHandler,
        permissions: { read: true }
      };

      manager.registerResource(errorResource);

      await expect(
        manager.readResource(errorResource.uri, testContext)
      ).rejects.toThrow('Handler error');
    });
  });
});