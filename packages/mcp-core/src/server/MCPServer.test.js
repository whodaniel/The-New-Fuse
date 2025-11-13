"use strict";
/**
 * MCPServer Unit Tests
 */
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const MCPServer_1 = require("./MCPServer");
const error_1 = require("../types/error");
(0, vitest_1.describe)('MCPServer', () => {
    let server;
    let config;
    (0, vitest_1.beforeEach)(() => {
        server = new MCPServer_1.MCPServer();
        config = {
            name: 'test-server',
            version: '1.0.0',
            port: 3000,
            host: 'localhost',
            maxConnections: 100,
            timeout: 30000,
            enableAuth: false,
            enableTLS: false,
            logLevel: 'info'
        };
    });
    (0, vitest_1.afterEach)(async () => {
        if (server.isRunning()) {
            await server.stop();
        }
    });
    (0, vitest_1.describe)('Server Lifecycle', () => {
        (0, vitest_1.it)('should start server with valid configuration', async () => {
            (0, vitest_1.expect)(server.isRunning()).toBe(false);
            await server.start(config);
            (0, vitest_1.expect)(server.isRunning()).toBe(true);
            const info = server.getServerInfo();
            (0, vitest_1.expect)(info.name).toBe(config.name);
            (0, vitest_1.expect)(info.version).toBe(config.version);
            (0, vitest_1.expect)(info.status).toBe('running');
        });
        (0, vitest_1.it)('should stop server gracefully', async () => {
            await server.start(config);
            (0, vitest_1.expect)(server.isRunning()).toBe(true);
            await server.stop();
            (0, vitest_1.expect)(server.isRunning()).toBe(false);
            // Don't check server info after stop as config is cleared
        });
        (0, vitest_1.it)('should throw error when starting already running server', async () => {
            await server.start(config);
            await (0, vitest_1.expect)(server.start(config)).rejects.toThrow('Server is already running');
        });
        (0, vitest_1.it)('should validate configuration on start', async () => {
            const invalidConfig = { ...config, name: '' };
            await (0, vitest_1.expect)(server.start(invalidConfig)).rejects.toThrow('Server name is required');
        });
    });
    (0, vitest_1.describe)('Resource Registration', () => {
        (0, vitest_1.beforeEach)(async () => {
            await server.start(config);
        });
        (0, vitest_1.it)('should register resource successfully', () => {
            const resource = {
                uri: 'test://resource1',
                name: 'Test Resource',
                description: 'A test resource',
                handler: {
                    read: vitest_1.vi.fn().mockResolvedValue({ content: 'test content' })
                }
            };
            server.registerResource(resource);
            const resources = server.getRegisteredResources();
            (0, vitest_1.expect)(resources).toHaveLength(1);
            (0, vitest_1.expect)(resources[0].name).toBe('Test Resource');
        });
        (0, vitest_1.it)('should throw error for duplicate resource URI', () => {
            const resource1 = {
                uri: 'test://resource1',
                name: 'Test Resource 1',
                handler: { read: vitest_1.vi.fn() }
            };
            const resource2 = {
                uri: 'test://resource1',
                name: 'Test Resource 2',
                handler: { read: vitest_1.vi.fn() }
            };
            server.registerResource(resource1);
            (0, vitest_1.expect)(() => server.registerResource(resource2))
                .toThrow('Resource with URI "test://resource1" already registered');
        });
        (0, vitest_1.it)('should throw error for invalid resource', () => {
            const invalidResource = {
                uri: '',
                name: 'Test Resource',
                handler: { read: vitest_1.vi.fn() }
            };
            (0, vitest_1.expect)(() => server.registerResource(invalidResource))
                .toThrow('Resource must have uri and name');
        });
    });
    (0, vitest_1.describe)('Tool Registration', () => {
        (0, vitest_1.beforeEach)(async () => {
            await server.start(config);
        });
        (0, vitest_1.it)('should register tool successfully', () => {
            const tool = {
                name: 'test-tool',
                description: 'A test tool',
                inputSchema: { type: 'object' },
                handler: {
                    execute: vitest_1.vi.fn().mockResolvedValue({ success: true })
                }
            };
            server.registerTool(tool);
            const tools = server.getRegisteredTools();
            (0, vitest_1.expect)(tools).toHaveLength(1);
            (0, vitest_1.expect)(tools[0].name).toBe('test-tool');
        });
        (0, vitest_1.it)('should throw error for duplicate tool name', () => {
            const tool1 = {
                name: 'test-tool',
                description: 'Test Tool 1',
                inputSchema: { type: 'object' },
                handler: { execute: vitest_1.vi.fn() }
            };
            const tool2 = {
                name: 'test-tool',
                description: 'Test Tool 2',
                inputSchema: { type: 'object' },
                handler: { execute: vitest_1.vi.fn() }
            };
            server.registerTool(tool1);
            (0, vitest_1.expect)(() => server.registerTool(tool2))
                .toThrow('Tool with name "test-tool" already registered');
        });
    });
    (0, vitest_1.describe)('Capability Registration', () => {
        (0, vitest_1.beforeEach)(async () => {
            await server.start(config);
        });
        (0, vitest_1.it)('should register capability successfully', () => {
            const capability = {
                name: 'test-capability',
                version: '1.0.0',
                description: 'A test capability',
                methods: ['test/method'],
                experimental: false
            };
            server.registerCapability(capability);
            const capabilities = server.getRegisteredCapabilities();
            // Should have default capabilities plus the new one
            (0, vitest_1.expect)(capabilities.length).toBeGreaterThan(3);
            (0, vitest_1.expect)(capabilities.some(cap => cap.name === 'test-capability')).toBe(true);
        });
        (0, vitest_1.it)('should register default capabilities on start', () => {
            const capabilities = server.getRegisteredCapabilities();
            (0, vitest_1.expect)(capabilities.some(cap => cap.name === 'resources')).toBe(true);
            (0, vitest_1.expect)(capabilities.some(cap => cap.name === 'tools')).toBe(true);
            (0, vitest_1.expect)(capabilities.some(cap => cap.name === 'server')).toBe(true);
        });
    });
    (0, vitest_1.describe)('Request Handling', () => {
        (0, vitest_1.beforeEach)(async () => {
            await server.start(config);
        });
        (0, vitest_1.it)('should handle server info request', async () => {
            const request = {
                jsonrpc: '2.0',
                id: 1,
                method: 'server/info'
            };
            const response = await server.handleRequest(request);
            (0, vitest_1.expect)(response.jsonrpc).toBe('2.0');
            (0, vitest_1.expect)(response.id).toBe(1);
            (0, vitest_1.expect)(response.result).toBeDefined();
            (0, vitest_1.expect)(response.result.name).toBe(config.name);
        });
        (0, vitest_1.it)('should handle server ping request', async () => {
            const request = {
                jsonrpc: '2.0',
                id: 2,
                method: 'server/ping'
            };
            const response = await server.handleRequest(request);
            (0, vitest_1.expect)(response.result.status).toBe('ok');
            (0, vitest_1.expect)(response.result.timestamp).toBeDefined();
            (0, vitest_1.expect)(response.result.uptime).toBeGreaterThanOrEqual(0);
        });
        (0, vitest_1.it)('should handle resources list request', async () => {
            // Register a test resource
            const resource = {
                uri: 'test://resource1',
                name: 'Test Resource',
                handler: { read: vitest_1.vi.fn() }
            };
            server.registerResource(resource);
            const request = {
                jsonrpc: '2.0',
                id: 3,
                method: 'resources/list'
            };
            const response = await server.handleRequest(request);
            (0, vitest_1.expect)(Array.isArray(response.result)).toBe(true);
            (0, vitest_1.expect)(response.result).toHaveLength(1);
            (0, vitest_1.expect)(response.result[0].name).toBe('Test Resource');
        });
        (0, vitest_1.it)('should handle tools list request', async () => {
            // Register a test tool
            const tool = {
                name: 'test-tool',
                description: 'A test tool',
                inputSchema: { type: 'object' },
                handler: { execute: vitest_1.vi.fn() }
            };
            server.registerTool(tool);
            const request = {
                jsonrpc: '2.0',
                id: 4,
                method: 'tools/list'
            };
            const response = await server.handleRequest(request);
            (0, vitest_1.expect)(Array.isArray(response.result)).toBe(true);
            (0, vitest_1.expect)(response.result).toHaveLength(1);
            (0, vitest_1.expect)(response.result[0].name).toBe('test-tool');
        });
        (0, vitest_1.it)('should return error for unknown method', async () => {
            const request = {
                jsonrpc: '2.0',
                id: 5,
                method: 'unknown/method'
            };
            const response = await server.handleRequest(request);
            (0, vitest_1.expect)(response.error).toBeDefined();
            (0, vitest_1.expect)(response.error?.code).toBe(error_1.JSONRPCErrorCode.METHOD_NOT_FOUND);
            (0, vitest_1.expect)(response.error?.message).toContain('Method "unknown/method" not found');
        });
        (0, vitest_1.it)('should handle resource read request', async () => {
            const mockHandler = {
                read: vitest_1.vi.fn().mockResolvedValue({ content: 'test content', mimeType: 'text/plain' })
            };
            const resource = {
                uri: 'test://resource1',
                name: 'Test Resource',
                handler: mockHandler
            };
            server.registerResource(resource);
            const request = {
                jsonrpc: '2.0',
                id: 6,
                method: 'resources/read',
                params: { uri: 'test://resource1',
                    const: response = await server.handleRequest(request),
                    expect(response) { }, : .result.content }
            };
        }).toBe('test content');
        (0, vitest_1.expect)(mockHandler.read).toHaveBeenCalledWith('test://resource1', { uri: 'test://resource1' });
    });
    (0, vitest_1.it)('should handle tool call request', async () => {
        const mockHandler = {
            execute: vitest_1.vi.fn().mockResolvedValue({ success: true, result: 'tool executed' })
        };
        const tool = {
            name: 'test-tool',
            description: 'A test tool',
            inputSchema: { type: 'object' },
            handler: mockHandler
        };
        server.registerTool(tool);
        const request = {
            jsonrpc: '2.0',
            id: 7,
            method: 'tools/call',
            params: { name: 'test-tool', arguments: { param1: 'value1'
                },
                const: response = await server.handleRequest(request),
                expect(response) { }, : .result.success }
        };
    }).toBe(true);
    (0, vitest_1.expect)(response.result.result).toBe('tool executed');
    (0, vitest_1.expect)(mockHandler.execute).toHaveBeenCalledWith({ param1: 'value1' });
});
(0, vitest_1.it)('should return error when server is not running', async () => {
    await server.stop();
    const request = {
        jsonrpc: '2.0',
        id: 8,
        method: 'server/info'
    };
    const response = await server.handleRequest(request);
    (0, vitest_1.expect)(response.error).toBeDefined();
    (0, vitest_1.expect)(response.error?.code).toBe(error_1.MCPErrorCode.SERVICE_UNAVAILABLE);
});
;
(0, vitest_1.describe)('Server Information', () => {
    (0, vitest_1.beforeEach)(async () => {
        await server.start(config);
    });
    (0, vitest_1.it)('should provide accurate server information', () => {
        const info = server.getServerInfo();
        (0, vitest_1.expect)(info.name).toBe(config.name);
        (0, vitest_1.expect)(info.version).toBe(config.version);
        (0, vitest_1.expect)(info.status).toBe('running');
        (0, vitest_1.expect)(info.uptime).toBeGreaterThanOrEqual(0);
        (0, vitest_1.expect)(info.activeConnections).toBe(0);
        (0, vitest_1.expect)(info.capabilities).toContain('resources');
        (0, vitest_1.expect)(info.capabilities).toContain('tools');
        (0, vitest_1.expect)(info.capabilities).toContain('server');
    });
    (0, vitest_1.it)('should track request statistics', async () => {
        const request = {
            jsonrpc: '2.0',
            id: 1,
            method: 'server/ping'
        };
        await server.handleRequest(request);
        const info = server.getServerInfo();
        (0, vitest_1.expect)(info.health.details.requestCount).toBe(1);
        (0, vitest_1.expect)(info.health.details.successRate).toBe(100);
    });
});
;
//# sourceMappingURL=MCPServer.test.js.map