"use strict";
/**
 * MCPSystemFactory Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MCPSystemFactory_1 = require("./MCPSystemFactory");
const common_1 = require("../types/common");
(0, vitest_1.describe)('MCPSystemFactory', () => {
    let system;
    (0, vitest_1.afterEach)(async () => {
        if (system && system.server.isRunning()) {
            await system.stop();
        }
    });
    (0, vitest_1.describe)('Factory Methods', () => {
        (0, vitest_1.it)('should create production system with correct defaults', () => {
            system = MCPSystemFactory_1.MCPSystemFactory.createProductionSystem();
            (0, vitest_1.expect)(system).toBeDefined();
            (0, vitest_1.expect)(system.config.server.name).toBe('the-new-fuse-mcp-server');
            (0, vitest_1.expect)(system.config.server.port).toBe(3000);
            (0, vitest_1.expect)(system.config.server.enableAuth).toBe(true);
            (0, vitest_1.expect)(system.config.server.logLevel).toBe(common_1.LogLevel.INFO);
            (0, vitest_1.expect)(system.config.relay?.enabled).toBe(true);
            (0, vitest_1.expect)(system.config.workflow?.enabled).toBe(true);
            (0, vitest_1.expect)(system.config.development?.debugMode).toBe(false);
        });
        (0, vitest_1.it)('should create development system with correct defaults', () => {
            system = MCPSystemFactory_1.MCPSystemFactory.createDevelopmentSystem();
            (0, vitest_1.expect)(system).toBeDefined();
            (0, vitest_1.expect)(system.config.server.name).toBe('the-new-fuse-mcp-dev-server');
            (0, vitest_1.expect)(system.config.server.port).toBe(3001);
            (0, vitest_1.expect)(system.config.server.enableAuth).toBe(false);
            (0, vitest_1.expect)(system.config.server.logLevel).toBe(common_1.LogLevel.DEBUG);
            (0, vitest_1.expect)(system.config.theia?.enabled).toBe(true);
            (0, vitest_1.expect)(system.config.development?.debugMode).toBe(true);
            (0, vitest_1.expect)(system.config.development?.hotReload).toBe(true);
        });
        (0, vitest_1.it)('should create testing system with correct defaults', () => {
            system = MCPSystemFactory_1.MCPSystemFactory.createTestingSystem();
            (0, vitest_1.expect)(system).toBeDefined();
            (0, vitest_1.expect)(system.config.server.name).toBe('the-new-fuse-mcp-test-server');
            (0, vitest_1.expect)(system.config.server.port).toBe(3999); // Test port
            (0, vitest_1.expect)(system.config.server.enableAuth).toBe(false);
            (0, vitest_1.expect)(system.config.server.logLevel).toBe(common_1.LogLevel.ERROR);
            (0, vitest_1.expect)(system.config.relay?.enabled).toBe(false);
            (0, vitest_1.expect)(system.config.workflow?.enabled).toBe(false);
            (0, vitest_1.expect)(system.config.theia?.enabled).toBe(false);
        });
        (0, vitest_1.it)('should create custom system with provided configuration', () => {
            const customConfig = {
                server: {
                    name: 'custom-test-server',
                    version: '2.0.0',
                    port: 5000,
                    host: '127.0.0.1',
                    maxConnections: 500,
                    timeout: 45000,
                    enableAuth: true,
                    enableTLS: true,
                    logLevel: common_1.LogLevel.WARN
                },
                relay: {
                    enabled: false
                },
                workflow: {
                    enabled: false
                },
                development: {
                    hotReload: false,
                    debugMode: false,
                    mockServices: true
                }
            };
            system = MCPSystemFactory_1.MCPSystemFactory.createCustomSystem(customConfig);
            (0, vitest_1.expect)(system).toBeDefined();
            (0, vitest_1.expect)(system.config.server.name).toBe('custom-test-server');
            (0, vitest_1.expect)(system.config.server.port).toBe(5000);
            (0, vitest_1.expect)(system.config.server.enableTLS).toBe(true);
            (0, vitest_1.expect)(system.config.relay?.enabled).toBe(false);
        });
        (0, vitest_1.it)('should merge custom configuration with defaults', () => {
            const customConfig = {
                server: {
                    name: 'merged-server',
                    port: 4000
                },
                relay: {
                    enabled: false
                }
            };
            system = MCPSystemFactory_1.MCPSystemFactory.createProductionSystem(customConfig);
            (0, vitest_1.expect)(system.config.server.name).toBe('merged-server');
            (0, vitest_1.expect)(system.config.server.port).toBe(4000);
            (0, vitest_1.expect)(system.config.server.enableAuth).toBe(true); // From default
            (0, vitest_1.expect)(system.config.relay?.enabled).toBe(false); // From custom
            (0, vitest_1.expect)(system.config.workflow?.enabled).toBe(true); // From default
        });
    });
    (0, vitest_1.describe)('System Lifecycle', () => {
        (0, vitest_1.beforeEach)(() => {
            system = MCPSystemFactory_1.MCPSystemFactory.createTestingSystem({
                server: {
                    name: 'test-lifecycle-server',
                    version: '1.0.0',
                    port: 3999,
                    host: 'localhost',
                    maxConnections: 10,
                    timeout: 5000,
                    enableAuth: false,
                    enableTLS: false,
                    logLevel: common_1.LogLevel.ERROR
                }
            });
        });
        (0, vitest_1.it)('should start and stop system successfully', async () => {
            (0, vitest_1.expect)(system.server.isRunning()).toBe(false);
            await system.start();
            (0, vitest_1.expect)(system.server.isRunning()).toBe(true);
            await system.stop();
            (0, vitest_1.expect)(system.server.isRunning()).toBe(false);
        });
        (0, vitest_1.it)('should throw error when starting already running system', async () => {
            await system.start();
            await (0, vitest_1.expect)(system.start()).rejects.toThrow('MCP System is already running');
        });
        (0, vitest_1.it)('should handle stop gracefully when not running', async () => {
            (0, vitest_1.expect)(system.server.isRunning()).toBe(false);
            // Should not throw
            await system.stop();
            (0, vitest_1.expect)(system.server.isRunning()).toBe(false);
        });
    });
    (0, vitest_1.describe)('System Health and Metrics', () => {
        (0, vitest_1.beforeEach)(async () => {
            system = MCPSystemFactory_1.MCPSystemFactory.createTestingSystem();
            await system.start();
        });
        (0, vitest_1.it)('should provide system health information', async () => {
            const health = await system.getHealth();
            (0, vitest_1.expect)(health).toBeDefined();
            (0, vitest_1.expect)(health.status).toMatch(/healthy|degraded|unhealthy/);
            (0, vitest_1.expect)(health.components).toBeDefined();
            (0, vitest_1.expect)(health.components.server).toBe('up');
            (0, vitest_1.expect)(health.timestamp).toBeInstanceOf(Date);
            (0, vitest_1.expect)(health.uptime).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should provide system metrics', async () => {
            const metrics = await system.getMetrics();
            (0, vitest_1.expect)(metrics).toBeDefined();
            (0, vitest_1.expect)(metrics.requests).toBeDefined();
            (0, vitest_1.expect)(metrics.resources).toBeDefined();
            (0, vitest_1.expect)(metrics.tools).toBeDefined();
            (0, vitest_1.expect)(metrics.connections).toBeDefined();
            (0, vitest_1.expect)(metrics.timestamp).toBeInstanceOf(Date);
            (0, vitest_1.expect)(typeof metrics.requests.total).toBe('number');
            (0, vitest_1.expect)(typeof metrics.resources.registered).toBe('number');
            (0, vitest_1.expect)(typeof metrics.tools.registered).toBe('number');
            (0, vitest_1.expect)(typeof metrics.connections.active).toBe('number');
        });
    });
    (0, vitest_1.describe)('Resource and Tool Registration', () => {
        (0, vitest_1.beforeEach)(async () => {
            system = MCPSystemFactory_1.MCPSystemFactory.createTestingSystem();
            await system.start();
        });
        (0, vitest_1.it)('should register resources successfully', async () => {
            const resource = {
                uri: 'test://resource',
                name: 'Test Resource',
                handler: {
                    read: () => Promise.resolve({
                        uri: 'test://resource',
                        mimeType: 'text/plain',
                        content: 'test content'
                    })
                }
            };
            await system.registerResource(resource);
            const resources = system.server.getRegisteredResources();
            (0, vitest_1.expect)(resources.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(resources.some((r) => r.name === 'Test Resource')).toBe(true);
        });
        (0, vitest_1.it)('should register tools successfully', async () => {
            const tool = {
                name: 'test-tool',
                description: 'A test tool',
                inputSchema: { type: 'object' },
                handler: {
                    execute: () => Promise.resolve({ success: true, result: 'test result' })
                }
            };
            await system.registerTool(tool);
            const tools = system.server.getRegisteredTools();
            (0, vitest_1.expect)(tools.length).toBeGreaterThan(0);
            (0, vitest_1.expect)(tools.some((t) => t.name === 'test-tool')).toBe(true);
        });
    });
    (0, vitest_1.describe)('System Components', () => {
        (0, vitest_1.beforeEach)(async () => {
            system = MCPSystemFactory_1.MCPSystemFactory.createTestingSystem();
            await system.start();
        });
        (0, vitest_1.it)('should provide access to system components', () => {
            const components = system.getComponents();
            (0, vitest_1.expect)(components).toBeDefined();
            (0, vitest_1.expect)(components.server).toBeDefined();
            (0, vitest_1.expect)(components.server).toBe(system.server);
        });
        (0, vitest_1.it)('should include database component when configured', () => {
            // This would be tested with actual Prisma client
            const components = system.getComponents();
            // For now, database is not configured in test system
            (0, vitest_1.expect)(components.database).toBeUndefined();
        });
    });
    (0, vitest_1.describe)('Default Resources and Tools', () => {
        (0, vitest_1.beforeEach)(async () => {
            system = MCPSystemFactory_1.MCPSystemFactory.createTestingSystem();
            await system.start();
        });
        (0, vitest_1.it)('should register default system resources', () => {
            const resources = system.server.getRegisteredResources();
            (0, vitest_1.expect)(resources.some((r) => r.uri === 'system://info')).toBe(true);
            (0, vitest_1.expect)(resources.some((r) => r.uri === 'system://config')).toBe(true);
        });
        (0, vitest_1.it)('should register default system tools', () => {
            const tools = system.server.getRegisteredTools();
            (0, vitest_1.expect)(tools.some((t) => t.name === 'system-health')).toBe(true);
            (0, vitest_1.expect)(tools.some((t) => t.name === 'system-restart')).toBe(true);
        });
        (0, vitest_1.it)('should execute system health tool', async () => {
            const response = await system.server.handleRequest({
                jsonrpc: '2.0',
                id: 1,
                method: 'tools/call',
                params: { name: 'system-health', arguments: {} }
            });
            (0, vitest_1.expect)(response.result?.success).toBe(true);
            (0, vitest_1.expect)(response.result?.result).toBeDefined();
            (0, vitest_1.expect)(response.result?.result.status).toMatch(/healthy|degraded|unhealthy/);
        });
    });
});
//# sourceMappingURL=MCPSystemFactory.test.js.map