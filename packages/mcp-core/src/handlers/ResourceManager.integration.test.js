"use strict";
/**
 * Integration tests for ResourceManager - focusing on resource access and security
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const ResourceManager_1 = require("./ResourceManager");
const ResourceHandler_1 = require("./ResourceHandler");
// Mock resource handler for integration testing
class MockIntegrationResourceHandler {
    content = new Map();
    constructor() {
        // Pre-populate with test data
        this.content.set('public.txt', 'Public content');
        this.content.set('private.txt', 'Private content');
        this.content.set('admin.json', '{"admin": true}');
        this.content.set('cached.txt', 'Cached content');
        this.content.set('log_2024_01.txt', 'January logs');
        this.content.set('log_2024_02.txt', 'February logs');
        this.content.set('config.json', '{"env": "prod"}');
        this.content.set('secret.key', 'secret-key-content');
        this.content.set('monitored.txt', 'Monitored content');
        this.content.set('restricted.txt', 'Restricted content');
        this.content.set('large.txt', 'Large content '.repeat(1000));
        this.content.set('short-ttl.txt', 'Original');
    }
    async read(uri, params) {
        const url = new URL(uri);
        // For mock:// scheme, use hostname as filename
        const filename = url.hostname;
        const content = this.content.get(filename);
        if (!content) {
            throw new Error(`File not found: ${filename}`);
        }
        return {
            uri,
            mimeType: filename.endsWith('.json') ? 'application/json' : 'text/plain',
            content,
            size: Buffer.byteLength(content, 'utf8'),
            lastModified: new Date(),
            encoding: 'utf8'
        };
    }
    async list(pattern) {
        return [];
    }
    updateContent(filename, newContent) {
        this.content.set(filename, newContent);
    }
}
(0, vitest_1.describe)('ResourceManager Integration Tests', () => {
    let manager;
    let mockHandler;
    let dbHandler;
    (0, vitest_1.beforeEach)(() => {
        manager = new ResourceManager_1.ResourceManager();
        mockHandler = new MockIntegrationResourceHandler();
        dbHandler = new ResourceHandler_1.DatabaseResourceHandler('db://test', 'DB Handler', 'test://db', 'users');
    });
    (0, vitest_1.describe)('Multi-Resource Discovery and Access Control', () => {
        (0, vitest_1.beforeEach)(() => {
            // Register resources with different access levels
            manager.registerResource({
                uri: 'mock://public.txt',
                name: 'Public File',
                description: 'Publicly accessible file',
                mimeType: 'text/plain',
                handler: mockHandler,
                permissions: {
                    read: true,
                    write: false,
                    subscribe: false
                }
            });
            manager.registerResource({
                uri: 'mock://private.txt',
                name: 'Private File',
                description: 'User-restricted file',
                mimeType: 'text/plain',
                handler: mockHandler,
                permissions: {
                    read: true,
                    write: false,
                    subscribe: false,
                    requiredRoles: ['user']
                }
            });
            manager.registerResource({
                uri: 'mock://admin.json',
                name: 'Admin Config',
                description: 'Admin-only configuration',
                mimeType: 'application/json',
                handler: mockHandler,
                permissions: {
                    read: true,
                    write: true,
                    subscribe: false,
                    requiredRoles: ['admin']
                }
            });
            manager.registerResource({
                uri: 'db://users/profile',
                name: 'User Profile',
                description: 'Database user profile',
                mimeType: 'application/json',
                handler: dbHandler,
                permissions: {
                    read: true,
                    write: false,
                    subscribe: false,
                    acl: [
                        {
                            principal: 'user123',
                            permissions: ['read'],
                            type: 'allow'
                        },
                        {
                            principal: 'role:admin',
                            permissions: ['*'],
                            type: 'allow'
                        },
                        {
                            principal: '*',
                            permissions: ['read'],
                            type: 'deny'
                        }
                    ]
                }
            });
        });
        (0, vitest_1.it)('should discover resources based on user access level', async () => {
            // Guest user - should only see public resources
            const guestContext = {
                principal: 'guest123',
                roles: ['guest'],
                permissions: ['read']
            };
            const guestResources = await manager.discoverResources({}, guestContext);
            (0, vitest_1.expect)(guestResources).toHaveLength(1);
            (0, vitest_1.expect)(guestResources[0].name).toBe('Public File');
            // Regular user - should see public and user resources
            const userContext = {
                principal: 'user123',
                roles: ['user'],
                permissions: ['read']
            };
            const userResources = await manager.discoverResources({}, userContext);
            (0, vitest_1.expect)(userResources).toHaveLength(3); // public, private, and ACL-allowed profile
            (0, vitest_1.expect)(userResources.map(r => r.name)).toContain('Private File');
            (0, vitest_1.expect)(userResources.map(r => r.name)).toContain('User Profile');
            // Admin user - should see all resources
            const adminContext = {
                principal: 'admin123',
                roles: ['admin', 'user'], // Admin should have user role too
                permissions: ['read', 'write']
            };
            const adminResources = await manager.discoverResources({}, adminContext);
            (0, vitest_1.expect)(adminResources).toHaveLength(4); // All resources (public, private, admin, db profile)
            (0, vitest_1.expect)(adminResources.map(r => r.name)).toContain('Admin Config');
        });
        (0, vitest_1.it)('should enforce access control during resource reading', async () => {
            const userContext = {
                principal: 'user123',
                roles: ['user'],
                permissions: ['read']
            };
            const guestContext = {
                principal: 'guest123',
                roles: ['guest'],
                permissions: ['read']
            };
            // User should be able to read private file
            const privateContent = await manager.readResource('mock://private.txt', userContext);
            (0, vitest_1.expect)(privateContent.content).toBe('Private content');
            // Guest should not be able to read private file
            await (0, vitest_1.expect)(manager.readResource('mock://private.txt', guestContext)).rejects.toThrow('Access denied');
            // Neither should be able to read admin file
            await (0, vitest_1.expect)(manager.readResource('mock://admin.json', userContext)).rejects.toThrow('Access denied');
            await (0, vitest_1.expect)(manager.readResource('mock://admin.json', guestContext)).rejects.toThrow('Access denied');
        });
        (0, vitest_1.it)('should handle ACL-based access control correctly', async () => {
            const user123Context = {
                principal: 'user123',
                roles: ['user'],
                permissions: ['read']
            };
            const user456Context = {
                principal: 'user456',
                roles: ['user'],
                permissions: ['read']
            };
            const adminContext = {
                principal: 'admin123',
                roles: ['admin'],
                permissions: ['read', 'write']
            };
            // user123 should have access (explicit allow in ACL)
            const profileContent = await manager.readResource('db://users/profile', user123Context);
            (0, vitest_1.expect)(profileContent.content).toContain('Sample database content');
            // user456 should be denied (wildcard deny in ACL)
            await (0, vitest_1.expect)(manager.readResource('db://users/profile', user456Context)).rejects.toThrow('Access denied');
            // admin should have access (role-based allow in ACL)
            const adminProfileContent = await manager.readResource('db://users/profile', adminContext);
            (0, vitest_1.expect)(adminProfileContent.content).toContain('Sample database content');
        });
    });
    (0, vitest_1.describe)('Resource Caching with Security', () => {
        (0, vitest_1.beforeEach)(() => {
            manager.registerResource({
                uri: 'mock://cached.txt',
                name: 'Cached File',
                handler: mockHandler,
                permissions: {
                    read: true,
                    requiredRoles: ['user']
                },
                caching: {
                    enabled: true,
                    ttl: 60 // 1 minute
                }
            });
        });
        (0, vitest_1.it)('should cache resources per user context', async () => {
            const user1Context = {
                principal: 'user1',
                roles: ['user'],
                permissions: ['read']
            };
            const user2Context = {
                principal: 'user2',
                roles: ['user'],
                permissions: ['read']
            };
            // Set initial content in mock handler
            mockHandler.updateContent('cached.txt', 'Original content');
            // First read by user1
            const content1 = await manager.readResource('mock://cached.txt', user1Context);
            (0, vitest_1.expect)(content1.content).toBe('Original content');
            // Modify the content in mock handler
            mockHandler.updateContent('cached.txt', 'Modified content');
            // Second read by user1 should return cached content
            const content2 = await manager.readResource('mock://cached.txt', user1Context);
            (0, vitest_1.expect)(content2.content).toBe('Original content'); // Still cached
            // Read by user2 should get fresh content (different cache key)
            const content3 = await manager.readResource('mock://cached.txt', user2Context);
            (0, vitest_1.expect)(content3.content).toBe('Modified content'); // Fresh read
        });
        (0, vitest_1.it)('should not cache resources for unauthorized users', async () => {
            const guestContext = {
                principal: 'guest',
                roles: ['guest'],
                permissions: ['read']
            };
            // Guest should not be able to access the resource at all
            await (0, vitest_1.expect)(manager.readResource('mock://cached.txt', guestContext)).rejects.toThrow('Access denied');
            // Cache should remain empty
            const cacheStats = manager.getCacheStatistics();
            (0, vitest_1.expect)(cacheStats.totalEntries).toBe(0);
        });
    });
    (0, vitest_1.describe)('Complex Discovery Scenarios', () => {
        (0, vitest_1.beforeEach)(() => {
            // Register resources with metadata and different access levels
            manager.registerResource({
                uri: 'mock://log_2024_01.txt',
                name: 'January Logs',
                handler: mockHandler,
                metadata: { type: 'log', month: 'january', year: 2024 },
                permissions: { read: true, requiredRoles: ['user'] }
            });
            manager.registerResource({
                uri: 'mock://log_2024_02.txt',
                name: 'February Logs',
                handler: mockHandler,
                metadata: { type: 'log', month: 'february', year: 2024 },
                permissions: { read: true, requiredRoles: ['user'] }
            });
            manager.registerResource({
                uri: 'mock://config.json',
                name: 'Production Config',
                handler: mockHandler,
                metadata: { type: 'config', environment: 'production' },
                permissions: { read: true, requiredRoles: ['admin'] }
            });
            manager.registerResource({
                uri: 'mock://secret.key',
                name: 'Secret Key',
                handler: mockHandler,
                metadata: { type: 'secret', classification: 'confidential' },
                permissions: { read: true, requiredRoles: ['admin'] }
            });
        });
        (0, vitest_1.it)('should discover resources with complex filtering', async () => {
            const userContext = {
                principal: 'user123',
                roles: ['user'],
                permissions: ['read']
            };
            // Find all log files
            const logResources = await manager.discoverResources({
                metadata: { type: 'log', userContext }
            });
            (0, vitest_1.expect)(logResources).toHaveLength(2);
            (0, vitest_1.expect)(logResources.every(r => r.metadata?.type === 'log')).toBe(true);
            // Find resources from 2024
            const yearResources = await manager.discoverResources({
                metadata: { year: 2024 }
            }, userContext);
            (0, vitest_1.expect)(yearResources).toHaveLength(2);
            // Find January logs specifically
            const januaryResources = await manager.discoverResources({
                metadata: { type: 'log', month: 'january', userContext }
            });
            (0, vitest_1.expect)(januaryResources).toHaveLength(1);
            (0, vitest_1.expect)(januaryResources[0].name).toBe('January Logs');
        });
        (0, vitest_1.it)('should combine pattern matching with metadata filtering', async () => {
            const adminContext = {
                principal: 'admin123',
                roles: ['admin', 'user'], // Admin should have user role too
                permissions: ['read', 'write']
            };
            // Find all resources with URIs containing "2024" and type "log"
            const filteredResources = await manager.discoverResources({
                uriPattern: '*2024*',
                metadata: { type: 'log', adminContext }
            });
            (0, vitest_1.expect)(filteredResources).toHaveLength(2);
            (0, vitest_1.expect)(filteredResources.every(r => r.uri.includes('2024'))).toBe(true);
            (0, vitest_1.expect)(filteredResources.every(r => r.metadata?.type === 'log')).toBe(true);
        });
        (0, vitest_1.it)('should handle pagination with access control', async () => {
            const userContext = {
                principal: 'user123',
                roles: ['user'],
                permissions: ['read']
            };
            const adminContext = {
                principal: 'admin123',
                roles: ['admin', 'user'], // Admin should have user role too
                permissions: ['read', 'write']
            };
            // User should see 2 resources (logs only)
            const userPage1 = await manager.discoverResources({
                limit: 1,
                offset: 0,
                sortBy: 'name'
            }, userContext);
            (0, vitest_1.expect)(userPage1).toHaveLength(1);
            const userPage2 = await manager.discoverResources({
                limit: 1,
                offset: 1,
                sortBy: 'name'
            }, userContext);
            (0, vitest_1.expect)(userPage2).toHaveLength(1);
            // Admin should see all 4 resources
            const adminPage1 = await manager.discoverResources({
                limit: 2,
                offset: 0,
                sortBy: 'name'
            }, adminContext);
            (0, vitest_1.expect)(adminPage1).toHaveLength(2);
            const adminPage2 = await manager.discoverResources({
                limit: 2,
                offset: 2,
                sortBy: 'name'
            }, adminContext);
            (0, vitest_1.expect)(adminPage2).toHaveLength(2);
        });
    });
    (0, vitest_1.describe)('Access Logging and Monitoring', () => {
        (0, vitest_1.beforeEach)(() => {
            manager.registerResource({
                uri: 'mock://monitored.txt',
                name: 'Monitored File',
                handler: mockHandler,
                permissions: { read: true }
            });
            manager.registerResource({
                uri: 'mock://restricted.txt',
                name: 'Restricted File',
                handler: mockHandler,
                permissions: { read: true, requiredRoles: ['admin'] }
            });
        });
        (0, vitest_1.it)('should track access patterns across multiple users', async () => {
            const user1Context = {
                principal: 'user1',
                roles: ['user'],
                permissions: ['read']
            };
            const user2Context = {
                principal: 'user2',
                roles: ['user'],
                permissions: ['read']
            };
            const adminContext = {
                principal: 'admin',
                roles: ['admin'],
                permissions: ['read']
            };
            // Multiple successful accesses
            await manager.readResource('mock://monitored.txt', user1Context);
            await manager.readResource('mock://monitored.txt', user2Context);
            await manager.readResource('mock://monitored.txt', adminContext);
            // Failed access attempts
            try {
                await manager.readResource('mock://restricted.txt', user1Context);
            }
            catch {
                // Expected failure
            }
            try {
                await manager.readResource('mock://restricted.txt', user2Context);
            }
            catch {
                // Expected failure
            }
            // Check overall statistics
            const overallStats = manager.getAccessStatistics();
            (0, vitest_1.expect)(overallStats.totalAccesses).toBe(5);
            (0, vitest_1.expect)(overallStats.successfulAccesses).toBe(3);
            (0, vitest_1.expect)(overallStats.failedAccesses).toBe(2);
            (0, vitest_1.expect)(overallStats.uniquePrincipals).toBe(3);
            // Check resource-specific statistics
            const monitoredStats = manager.getAccessStatistics('mock://monitored.txt');
            (0, vitest_1.expect)(monitoredStats.totalAccesses).toBe(3);
            (0, vitest_1.expect)(monitoredStats.successfulAccesses).toBe(3);
            (0, vitest_1.expect)(monitoredStats.failedAccesses).toBe(0);
            const restrictedStats = manager.getAccessStatistics('mock://restricted.txt');
            (0, vitest_1.expect)(restrictedStats.totalAccesses).toBe(2);
            (0, vitest_1.expect)(restrictedStats.successfulAccesses).toBe(0);
            (0, vitest_1.expect)(restrictedStats.failedAccesses).toBe(2);
            (0, vitest_1.expect)(restrictedStats.mostCommonError).toBe('Access denied');
        });
    });
    (0, vitest_1.describe)('Performance and Caching Integration', () => {
        (0, vitest_1.beforeEach)(() => {
            manager.registerResource({
                uri: 'mock://large.txt',
                name: 'Large File',
                handler: mockHandler,
                permissions: { read: true },
                caching: {
                    enabled: true,
                    ttl: 30
                }
            });
        });
        (0, vitest_1.it)('should improve performance with caching', async () => {
            const userContext = {
                principal: 'user123',
                roles: ['user'],
                permissions: ['read']
            };
            // First read - should be slower (from disk)
            const start1 = Date.now();
            const content1 = await manager.readResource('mock://large.txt', userContext);
            const time1 = Date.now() - start1;
            // Second read - should be faster (from cache)
            const start2 = Date.now();
            const content2 = await manager.readResource('mock://large.txt', userContext);
            const time2 = Date.now() - start2;
            (0, vitest_1.expect)(content1.content).toBe(content2.content);
            // Cache should be faster or at least not significantly slower
            // Note: In fast environments, both might be 0ms, so we just check they're equal or cache is faster
            (0, vitest_1.expect)(time2).toBeLessThanOrEqual(time1);
            // Verify cache statistics
            const cacheStats = manager.getCacheStatistics();
            (0, vitest_1.expect)(cacheStats.totalEntries).toBe(1);
            (0, vitest_1.expect)(cacheStats.totalSize).toBeGreaterThan(0);
        });
        (0, vitest_1.it)('should handle cache expiration correctly', async () => {
            const userContext = {
                principal: 'user123',
                roles: ['user'],
                permissions: ['read']
            };
            // Register resource with very short TTL
            manager.registerResource({
                uri: 'mock://short-ttl.txt',
                name: 'Short TTL File',
                handler: mockHandler,
                permissions: { read: true },
                caching: {
                    enabled: true,
                    ttl: 0.1 // 100ms
                }
            });
            // First read
            const content1 = await manager.readResource('mock://short-ttl.txt', userContext);
            (0, vitest_1.expect)(content1.content).toBe('Original');
            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 150));
            // Modify content in mock handler
            mockHandler.updateContent('short-ttl.txt', 'Modified');
            // Second read should get fresh content
            const content2 = await manager.readResource('mock://short-ttl.txt', userContext);
            (0, vitest_1.expect)(content2.content).toBe('Modified');
        });
    });
});
//# sourceMappingURL=ResourceManager.integration.test.js.map