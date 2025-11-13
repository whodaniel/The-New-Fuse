"use strict";
/**
 * Integration tests for MCPClient
 *
 * These tests verify client-server communication and end-to-end functionality
 */
Object.defineProperty(exports, "__esModule", { value: true });
const MCPClient_1 = require("./MCPClient");
const MCPServer_1 = require("../server/MCPServer");
// Test resource handler
class TestResourceHandler {
    resources = new Map();
    constructor() {
        // Add some test resources
        this.resources.set('test://file1.txt', {
            uri: 'test://file1.txt',
            mimeType: 'text/plain',
            content: 'Hello, World!'
        });
        this.resources.set('test://file2.json', {
            uri: 'test://file2.json',
            mimeType: 'application/json',
            content: JSON.stringify({ message: 'Test JSON content' })
        });
    }
    async read(uri) {
        const resource = this.resources.get(uri);
        if (!resource) {
            throw new Error(`Resource not found: ${uri});
    }
    return resource;
  }

  async list(pattern?: string): Promise<MCPResource[]> {
    const resources: MCPResource[] = [];
    
    for (const [uri, content] of this.resources) {
      if (!pattern || uri.includes(pattern)) {
        resources.push({
          uri,
          name: uri.split('/').pop() || uri,`, description, `Test resource: ${uri}`, mimeType, content.mimeType, handler, this);
        }
        ;
    }
}
return resources;
// Test tool handler
class TestToolHandler {
    async execute(params) {
        if (params.action === 'echo') {
            return {
                success: true,
                result: { echo: params.message || 'Hello from tool!'
                }, else: , if(params) { }, : .action === 'calculate'
            };
            {
                const { a, b, operation } = params;
                let result;
                switch (operation) {
                    case 'add':
                        result = a + b;
                        break;
                    case 'subtract':
                        result = a - b;
                        break;
                    case 'multiply':
                        result = a * b;
                        break;
                    case 'divide':
                        result = b !== 0 ? a / b : NaN;
                        break;
                    default:
                        throw new Error(Unknown, operation, $, { operation });
                }
                return {
                    success: true,
                    result: { calculation: result }
                };
            }
            if (params.action === 'error') {
                return {
                    success: false,
                    error: 'Simulated tool error'
                };
            }
            `
    throw new Error(Unknown action: ${params.action}`;
            ;
        }
        async;
        validate(params, any);
        Promise < { valid: boolean, errors: string[] } > {
            const: errors, string, []:  = [],
            if(params) { }, : .action === 'calculate'
        };
        {
            if (typeof params.a !== 'number')
                errors.push('Parameter "a" must be a number');
            if (typeof params.b !== 'number')
                errors.push('Parameter "b" must be a number');
            if (!['add', 'subtract', 'multiply', 'divide'].includes(params.operation)) {
                errors.push('Parameter "operation" must be one of: add, subtract, multiply, divide');
            }
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined
        };
    }
}
describe('MCPClient Integration Tests', () => {
    let server;
    let client;
    let serverConfig;
    let clientConfig;
    let serverPort;
    beforeAll(async () => {
        // Find an available port
        serverPort = 8080 + Math.floor(Math.random() * 1000);
        serverConfig = {
            name: 'test-server',
            version: '1.0.0',
            port: serverPort,
            host: 'localhost',
            maxConnections: 10,
            timeout: 30000,
            enableAuth: false,
            enableTLS: false,
            logLevel: 'info'
        };
        clientConfig = {
            name: 'test-client',
            version: '1.0.0',
            timeout: 10000,
            retryPolicy: {
                maxAttempts: 3,
                baseDelay: 1000,
                maxDelay: 5000
            },
            options: {
                enableCaching: true,
                cacheTTL: 60000
            }
        };
    });
    beforeEach(async () => {
        // Create and start server
        server = new MCPServer_1.MCPServer(serverConfig);
        // Register test resources
        const resourceHandler = new TestResourceHandler();
        const resources = await resourceHandler.list();
        for (const resource of resources) {
            server.registerResource(resource);
        }
        // Register test tools
        const toolHandler = new TestToolHandler();
        const echoTool = {
            name: 'echo',
            description: 'Echo back a message',
            inputSchema: {
                type: 'object',
                properties: {
                    action: { type: 'string', const: 'echo' },
                    message: { type: 'string',
                        required: ['action']
                    },
                    handler: toolHandler
                },
                const: calcTool, MCPTool: IMCPTool_1.MCPTool = {
                    name: 'calculator',
                    description: 'Perform basic calculations',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            action: { type: 'string', const: 'calculate' },
                            a: { type: 'number' },
                            b: { type: 'number' },
                            operation: { type: 'string', enum: ['add', 'subtract', 'multiply', 'divide'] }
                        },
                        required: ['action', 'a', 'b', 'operation']
                    },
                    handler: toolHandler
                },
                server, : .registerTool(echoTool),
                server, : .registerTool(calcTool),
                await: server.start(),
                // Create client
                client = new MCPClient_1.MCPClient(clientConfig)
            }
        };
    });
    afterEach(async () => {
        if (client) {
            await client.cleanup();
        }
        if (server) {
            await server.stop();
        }
    });
    describe('Connection and Initialization', () => {
        test('should connect to server and initialize', async () => {
            const endpoint = ws, //localhost:${serverPort};
            await, client, connect;
            (endpoint);
            expect(client.isConnected()).toBe(true);
            expect(client.getEndpoint()).toBe(endpoint);
            // Should be able to get server capabilities
            const capabilities = await client.getServerCapabilities();
            expect(Array.isArray(capabilities)).toBe(true);
        });
        `
`;
        test('should handle connection to non-existent server', async () => {
            const endpoint = ws, //localhost:${serverPort + 1000}`;
            await, expect;
            (client.connect(endpoint)).rejects.toThrow();
            expect(client.isConnected()).toBe(false);
        });
        test('should reconnect after disconnection', async () => {
            const endpoint = ws, //localhost:${serverPort};
            await, client, connect;
            (endpoint);
            expect(client.isConnected()).toBe(true);
            await client.disconnect();
            expect(client.isConnected()).toBe(false);
            await client.connect(endpoint);
            expect(client.isConnected()).toBe(true);
        });
    });
    `
  describe('Resource Operations', () => {`;
    beforeEach(async () => {
        await client.connect(ws); //localhost:${serverPort}`);
    });
    test('should list all resources', async () => {
        const resources = await client.listResources();
        expect(Array.isArray(resources)).toBe(true);
        expect(resources.length).toBe(2);
        const uris = resources.map(r => r.uri);
        expect(uris).toContain('test://file1.txt');
        expect(uris).toContain('test://file2.json');
    });
    test('should list resources with pattern filter', async () => {
        const resources = await client.listResources('*.txt');
        expect(Array.isArray(resources)).toBe(true);
        expect(resources.length).toBe(1);
        expect(resources[0].uri).toBe('test://file1.txt');
    });
    test('should read resource content', async () => {
        const content = await client.readResource('test://file1.txt');
        expect(content.uri).toBe('test://file1.txt');
        expect(content.mimeType).toBe('text/plain');
        expect(content.content).toBe('Hello, World!');
    });
    test('should read JSON resource content', async () => {
        const content = await client.readResource('test://file2.json');
        expect(content.uri).toBe('test://file2.json');
        expect(content.mimeType).toBe('application/json');
        const jsonData = JSON.parse(content.content);
        expect(jsonData.message).toBe('Test JSON content');
    });
    test('should handle non-existent resource', async () => {
        await expect(client.readResource('test://nonexistent.txt')).rejects.toThrow();
    });
    test('should cache resource content', async () => {
        const uri = 'test://file1.txt';
        // First read
        const startTime1 = Date.now();
        const content1 = await client.readResource(uri);
        const duration1 = Date.now() - startTime1;
        // Second read (should be cached)
        const startTime2 = Date.now();
        const content2 = await client.readResource(uri);
        const duration2 = Date.now() - startTime2;
        expect(content1).toEqual(content2);
        expect(duration2).toBeLessThan(duration1); // Cached read should be faster
    });
});
describe('Tool Operations', () => {
    beforeEach(async () => {
        await client.connect(ws); //localhost:${serverPort});
    });
    test('should call echo tool successfully', async () => {
        const result = await client.callTool('echo', {
            action: 'echo',
            message: 'Hello from integration test!'
        });
        expect(result.success).toBe(true);
        expect(result.result).toEqual({
            echo: 'Hello from integration test!'
        });
    });
    test('should call calculator tool for addition', async () => {
        const result = await client.callTool('calculator', {
            action: 'calculate',
            a: 10,
            b: 5,
            operation: 'add'
        });
        expect(result.success).toBe(true);
        expect(result.result).toEqual({
            calculation: 15
        });
    });
    test('should call calculator tool for division', async () => {
        const result = await client.callTool('calculator', {
            action: 'calculate',
            a: 20,
            b: 4,
            operation: 'divide'
        });
        expect(result.success).toBe(true);
        expect(result.result).toEqual({
            calculation: 5
        });
    });
    test('should handle tool execution error', async () => {
        const result = await client.callTool('echo', {
            action: 'error'
        });
        expect(result.success).toBe(false);
        expect(result.error).toBe('Simulated tool error');
    });
    test('should handle non-existent tool', async () => {
        await expect(client.callTool('nonexistent-tool', {})).rejects.toThrow();
    });
    test('should cache tool results', async () => {
        const toolName = 'calculator';
        const params = {
            action: 'calculate',
            a: 7,
            b: 3,
            operation: 'multiply'
        };
        // First call
        const startTime1 = Date.now();
        const result1 = await client.callTool(toolName, params);
        const duration1 = Date.now() - startTime1;
        // Second call (should be cached)
        const startTime2 = Date.now();
        const result2 = await client.callTool(toolName, params);
        const duration2 = Date.now() - startTime2;
        expect(result1).toEqual(result2);
        expect(result2.result).toEqual({ calculation: 21 });
        expect(duration2).toBeLessThan(duration1); // Cached call should be faster
    });
});
`
  describe('Notifications', () => {`;
beforeEach(async () => {
    await client.connect(ws); //localhost:${serverPort}`);
});
test('should send notification to server', async () => {
    const notification = {
        jsonrpc: '2.0',
        method: 'client/notification',
        params: {
            message: 'Test notification from client',
            await: expect(client.sendNotification(notification)).resolves.not.toThrow()
        }
    };
});
test('should receive notifications from server', (done) => {
    const callback = jest.fn((notification) => {
        expect(notification.method).toBe('server/notification');
        expect(notification.params).toEqual({
            message: 'Test notification from server'
        });
        done();
    });
    client.subscribeToNotifications(callback);
    // Simulate server sending a notification
    setTimeout(() => {
        // This would normally be sent by the server
        client.emit('notification', {
            jsonrpc: '2.0',
            method: 'server/notification',
            params: {
                message: 'Test notification from server'
            }
        });
    }, 100);
});
;
describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
        await client.connect(ws); //localhost:${serverPort}`);
    });
    test('should handle server shutdown gracefully', async () => {
        expect(client.isConnected()).toBe(true);
        // Stop the server
        await server.stop();
        // Wait a bit for the connection to be detected as closed
        await new Promise(resolve => setTimeout(resolve, 100));
        // Client should detect disconnection
        expect(client.isConnected()).toBe(false);
    });
    test('should handle request timeout', async () => {
        // Create a client with very short timeout
        const shortTimeoutClient = new MCPClient_1.MCPClient({
            ...clientConfig,
            timeout: 100
        });
        await shortTimeoutClient.connect(ws, //localhost:${serverPort});
        // This request should timeout (assuming server takes longer than 100ms)
        await expect(shortTimeoutClient.sendRequest({
            jsonrpc: '2.0',
            id: 'timeout-test',
            method: 'slow-operation',
            params: {}
        })).rejects.toThrow());
        await shortTimeoutClient.cleanup();
    });
});
describe('Performance and Statistics', () => {
    beforeEach(async () => {
        await client.connect(ws); //localhost:${serverPort});
    });
    test('should track request statistics', async () => {
        const initialStats = client.getStatistics();
        // Make several requests
        await client.listResources();
        await client.readResource('test://file1.txt');
        await client.callTool('echo', { action: 'echo', message: 'test' });
        const finalStats = client.getStatistics();
        expect(finalStats.totalRequests).toBeGreaterThan(initialStats.totalRequests);
        expect(finalStats.successfulRequests).toBeGreaterThan(initialStats.successfulRequests);
        expect(finalStats.averageResponseTime).toBeGreaterThan(0);
    });
    test('should track cache statistics', async () => {
        // Make requests that will be cached
        await client.readResource('test://file1.txt');
        await client.readResource('test://file1.txt'); // Should hit cache
        const cacheStats = client.getCacheStatistics();
        expect(cacheStats.totalEntries).toBeGreaterThan(0);
        expect(cacheStats.hitCount).toBeGreaterThan(0);
        expect(cacheStats.hitRate).toBeGreaterThan(0);
    });
    test('should provide client status', async () => {
        const status = client.getStatus();
        expect(status.name).toBe(clientConfig.name);
        `
      expect(status.connectionStatus).toBe('connected');`;
        expect(status.endpoint).toBe(ws, //localhost:${serverPort}`);
        expect(status.statistics).toBeDefined());
    });
});
describe('Concurrent Operations', () => {
    beforeEach(async () => {
        await client.connect(ws); //localhost:${serverPort}`);
    });
    test('should handle concurrent resource reads', async () => {
        const promises = [
            client.readResource('test://file1.txt'),
            client.readResource('test://file2.json'),
            client.readResource('test://file1.txt'), // Duplicate
            client.readResource('test://file2.json') // Duplicate
        ];
        const results = await Promise.all(promises);
        expect(results).toHaveLength(4);
        expect(results[0].uri).toBe('test://file1.txt');
        expect(results[1].uri).toBe('test://file2.json');
        expect(results[2]).toEqual(results[0]); // Should be same content
        expect(results[3]).toEqual(results[1]); // Should be same content
    });
    test('should handle concurrent tool calls', async () => {
        const promises = [
            client.callTool('calculator', { action: 'calculate', a: 1, b: 2, operation: 'add' }),
            client.callTool('calculator', { action: 'calculate', a: 3, b: 4, operation: 'multiply' }),
            client.callTool('echo', { action: 'echo', message: 'concurrent test 1' }),
            client.callTool('echo', { action: 'echo', message: 'concurrent test 2' })
        ];
        const results = await Promise.all(promises);
        expect(results).toHaveLength(4);
        expect(results[0].result).toEqual({ calculation: 3 });
        expect(results[1].result).toEqual({ calculation: 12 });
        expect(results[2].result).toEqual({ echo: 'concurrent test 1' });
        expect(results[3].result).toEqual({ echo: 'concurrent test 2' });
    });
});
;
//# sourceMappingURL=MCPClient.integration.test.js.map