"use strict";
/**
 * Tests for ResourceManager
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ResourceManager_1 = require("./ResourceManager");
// Mock resource handler for testing
class MockResourceHandler {
    content;
    constructor(content = 'mock content') {
        this.content = content;
    }
    async read(uri, params) {
        return {
            uri,
            mimeType: 'text/plain',
            content: this.content,
            size: Buffer.byteLength(this.content, 'utf8'),
            lastModified: new Date(),
            encoding: 'utf8'
        };
    }
    async list(pattern) {
        return [];
    }
}
(0, vitest_1.describe)('ResourceManager', () => {
    let manager;
    let mockHandler;
    let testResource;
    let testContext;
    (0, vitest_1.beforeEach)(() => {
        manager = new ResourceManager_1.ResourceManager();
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
    (0, vitest_1.describe)('Resource Registration', () => {
        (0, vitest_1.it)('should register a resource successfully', () => {
            (0, vitest_1.expect)(() => manager.registerResource(testResource)).not.toThrow();
        });
        (0, vitest_1.it)('should throw error for invalid resource', () => {
            const invalidResource = {
                uri: '',
                name: '',
                handler: mockHandler
            };
            (0, vitest_1.expect)(() => manager.registerResource(invalidResource)).toThrow();
        });
        (0, vitest_1.it)('should unregister a resource successfully', () => {
            manager.registerResource(testResource);
            const result = manager.unregisterResource(testResource.uri);
            (0, vitest_1.expect)(result).toBe(true);
        });
        (0, vitest_1.it)('should return false when unregistering non-existent resource', () => {
            const result = manager.unregisterResource('non-existent://resource');
            (0, vitest_1.expect)(result).toBe(false);
        });
    });
    (0, vitest_1.describe)('Resource Discovery', () => {
        (0, vitest_1.beforeEach)(() => {
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
        (0, vitest_1.it)('should discover all resources without filters', async () => {
            const resources = await manager.discoverResources();
            (0, vitest_1.expect)(resources).toHaveLength(2);
        });
        (0, vitest_1.it)('should filter resources by URI pattern', async () => {
            const query = {
                uriPattern: '*resource1'
            };
            const resources = await manager.discoverResources(query);
            (0, vitest_1.expect)(resources).toHaveLength(1);
            (0, vitest_1.expect)(resources[0].uri).toBe('test://example/resource1');
        });
        (0, vitest_1.it)('should filter resources by name pattern', async () => {
            const query = {
                namePattern: '*Resource 2'
            };
            const resources = await manager.discoverResources(query);
            (0, vitest_1.expect)(resources).toHaveLength(1);
            (0, vitest_1.expect)(resources[0].name).toBe('Test Resource 2');
        });
        (0, vitest_1.it)('should filter resources by MIME type', async () => {
            const query = {
                mimeType: 'application/json'
            };
            const resources = await manager.discoverResources(query);
            (0, vitest_1.expect)(resources).toHaveLength(1);
            (0, vitest_1.expect)(resources[0].mimeType).toBe('application/json');
        });
        (0, vitest_1.it)('should apply pagination', async () => {
            const query = {
                limit: 1,
                offset: 0
            };
            const resources = await manager.discoverResources(query);
            (0, vitest_1.expect)(resources).toHaveLength(1);
        });
        (0, vitest_1.it)('should sort resources by name', async () => {
            const query = {
                sortBy: 'name',
                sortOrder: 'asc'
            };
            const resources = await manager.discoverResources(query);
            (0, vitest_1.expect)(resources[0].name).toBe('Test Resource 1');
            (0, vitest_1.expect)(resources[1].name).toBe('Test Resource 2');
        });
        (0, vitest_1.it)('should filter by access context', async () => {
            const restrictedContext = {
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
            (0, vitest_1.expect)(resources).toHaveLength(2); // Should not include admin resource
            (0, vitest_1.expect)(resources.find(r => r.name === 'Admin Resource')).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('Resource Access Control', () => {
        (0, vitest_1.beforeEach)(() => {
            manager.registerResource(testResource);
        });
        (0, vitest_1.it)('should allow access with proper permissions', () => {
            const hasAccess = manager.checkResourceAccess(testResource, 'read', testContext);
            (0, vitest_1.expect)(hasAccess).toBe(true);
        });
        (0, vitest_1.it)('should deny access without proper permissions', () => {
            const restrictedContext = {
                principal: 'user123',
                roles: ['guest'],
                permissions: []
            };
            const restrictedResource = {
                ...testResource,
                permissions: {
                    read: true,
                    requiredRoles: ['admin']
                }
            };
            const hasAccess = manager.checkResourceAccess(restrictedResource, 'read', restrictedContext);
            (0, vitest_1.expect)(hasAccess).toBe(false);
        });
        (0, vitest_1.it)('should evaluate ACL entries correctly', () => {
            const aclResource = {
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
            (0, vitest_1.expect)(hasAccess).toBe(true);
            const deniedContext = {
                principal: 'user456',
                roles: ['user'],
                permissions: ['read']
            };
            const deniedAccess = manager.checkResourceAccess(aclResource, 'read', deniedContext);
            (0, vitest_1.expect)(deniedAccess).toBe(false);
        });
        (0, vitest_1.it)('should handle role-based ACL entries', () => {
            const roleBasedResource = {
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
            const adminContext = {
                principal: 'admin123',
                roles: ['admin'],
                permissions: ['read', 'write']
            };
            const hasAccess = manager.checkResourceAccess(roleBasedResource, 'read', adminContext);
            (0, vitest_1.expect)(hasAccess).toBe(true);
        });
    });
    (0, vitest_1.describe)('Resource Reading with Caching', () => {
        (0, vitest_1.beforeEach)(() => {
            manager.registerResource(testResource);
        });
        (0, vitest_1.it)('should read resource content successfully', async () => {
            const content = await manager.readResource(testResource.uri, testContext);
            (0, vitest_1.expect)(content.uri).toBe(testResource.uri);
            (0, vitest_1.expect)(content.content).toBe('mock content');
        });
        (0, vitest_1.it)('should throw error for non-existent resource', async () => {
            await (0, vitest_1.expect)(manager.readResource('non-existent://resource', testContext)).rejects.toThrow();
        });
        (0, vitest_1.it)('should throw error for access denied', async () => {
            const restrictedContext = {
                principal: 'user123',
                roles: ['guest'],
                permissions: []
            };
            const restrictedResource = {
                ...testResource,
                permissions: {
                    read: true,
                    requiredRoles: ['admin']
                }
            };
            manager.registerResource(restrictedResource);
            await (0, vitest_1.expect)(manager.readResource(restrictedResource.uri, restrictedContext)).rejects.toThrow();
        });
        (0, vitest_1.it)('should cache resource content when caching is enabled', async () => {
            const cachedResource = {
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
            (0, vitest_1.expect)(content1.content).toBe(content2.content);
        });
        (0, vitest_1.it)('should not cache when caching is disabled', async () => {
            const nonCachedResource = {
                ...testResource,
                caching: {
                    enabled: false
                }
            };
            manager.registerResource(nonCachedResource);
            const content = await manager.readResource(nonCachedResource.uri, testContext);
            (0, vitest_1.expect)(content.content).toBe('mock content');
        });
    });
    (0, vitest_1.describe)('Access Statistics', () => {
        (0, vitest_1.beforeEach)(() => {
            manager.registerResource(testResource);
        });
        (0, vitest_1.it)('should track access statistics', async () => {
            await manager.readResource(testResource.uri, testContext);
            const stats = manager.getAccessStatistics(testResource.uri);
            (0, vitest_1.expect)(stats.totalAccesses).toBe(1);
            (0, vitest_1.expect)(stats.successfulAccesses).toBe(1);
            (0, vitest_1.expect)(stats.failedAccesses).toBe(0);
            (0, vitest_1.expect)(stats.uniquePrincipals).toBe(1);
        });
        (0, vitest_1.it)('should track failed access attempts', async () => {
            try {
                await manager.readResource('non-existent://resource', testContext);
            }
            catch {
                // Expected to fail
            }
            const stats = manager.getAccessStatistics();
            (0, vitest_1.expect)(stats.totalAccesses).toBe(1);
            (0, vitest_1.expect)(stats.successfulAccesses).toBe(0);
            (0, vitest_1.expect)(stats.failedAccesses).toBe(1);
        });
        (0, vitest_1.it)('should track most common errors', async () => {
            // Generate multiple failed attempts
            for (let i = 0; i < 3; i++) {
                try {
                    await manager.readResource('non-existent://resource', testContext);
                }
                catch {
                    // Expected to fail
                }
            }
            const stats = manager.getAccessStatistics();
            (0, vitest_1.expect)(stats.mostCommonError).toBe('Resource not found');
        });
    });
    (0, vitest_1.describe)('Cache Management', () => {
        (0, vitest_1.beforeEach)(() => {
            const cachedResource = {
                ...testResource,
                caching: {
                    enabled: true,
                    ttl: 300
                }
            };
            manager.registerResource(cachedResource);
        });
        (0, vitest_1.it)('should provide cache statistics', async () => {
            await manager.readResource(testResource.uri, testContext);
            const stats = manager.getCacheStatistics();
            (0, vitest_1.expect)(stats.totalEntries).toBe(1);
            (0, vitest_1.expect)(stats.totalSize).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should clear cache for specific resource', async () => {
            await manager.readResource(testResource.uri, testContext);
            manager.clearCache(testResource.uri);
            const stats = manager.getCacheStatistics();
            (0, vitest_1.expect)(stats.totalEntries).toBe(0);
        });
        (0, vitest_1.it)('should clear all cache entries', async () => {
            await manager.readResource(testResource.uri, testContext);
            manager.clearCache();
            const stats = manager.getCacheStatistics();
            (0, vitest_1.expect)(stats.totalEntries).toBe(0);
        });
    });
    (0, vitest_1.describe)('List Resources', () => {
        (0, vitest_1.beforeEach)(() => {
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
        (0, vitest_1.it)('should list all resources without pattern', async () => {
            const resources = await manager.listResources(undefined, testContext);
            (0, vitest_1.expect)(resources).toHaveLength(2);
        });
        (0, vitest_1.it)('should list resources with pattern', async () => {
            const resources = await manager.listResources('*Resource 1', testContext);
            (0, vitest_1.expect)(resources).toHaveLength(1);
            (0, vitest_1.expect)(resources[0].name).toBe('Test Resource 1');
        });
        (0, vitest_1.it)('should respect access control when listing', async () => {
            const restrictedContext = {
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
            (0, vitest_1.expect)(resources).toHaveLength(2); // Should not include secret resource
            (0, vitest_1.expect)(resources.find(r => r.name === 'Secret Resource')).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('Error Handling', () => {
        (0, vitest_1.it)('should handle discovery errors gracefully', async () => {
            // Mock the discoverResources method to throw an error
            const originalMethod = manager.discoverResources;
            manager.discoverResources = vitest_1.vi.fn().mockRejectedValue(new Error('Discovery failed'));
            await (0, vitest_1.expect)(manager.discoverResources({})).rejects.toThrow('Discovery failed');
            // Restore original method
            manager.discoverResources = originalMethod;
        });
        (0, vitest_1.it)('should handle resource handler errors', async () => {
            const errorHandler = {
                async read() {
                    throw new Error('Handler error');
                }
            };
            const errorResource = {
                uri: 'test://error/resource',
                name: 'Error Resource',
                handler: errorHandler,
                permissions: { read: true }
            };
            manager.registerResource(errorResource);
            await (0, vitest_1.expect)(manager.readResource(errorResource.uri, testContext)).rejects.toThrow('Handler error');
        });
    });
});
//# sourceMappingURL=ResourceManager.test.js.map