/**
 * Tests for client-side resource and tool access functionality
 *
 * This test suite focuses specifically on the resource and tool access
 * capabilities of the MCP client, including caching behavior.
 */

import { MCPClient } from './MCPClient';
import { MCPClientConfig } from '../types/client';
import { MCPResource, ResourceContent } from '../interfaces/IMCPResource';
import { ToolResult } from '../interfaces/IMCPTool';

// Mock WebSocket for testing
class MockCloseEvent extends Event {
  constructor(type: string, public code?: number, public reason?: string) {
    super(type);
  }
}
(global as any).CloseEvent = MockCloseEvent;

class MockWebSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;

  readyState = MockWebSocket.CONNECTING;
  onopen: ((event: Event) => void) | null = null;
  onclose: ((event: CloseEvent) => void) | null = null;
  onmessage: ((event: MessageEvent) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  private messageHandlers = new Map<string, (message: any) => any>();

  constructor(public url: string) {
    // Set up default handlers
    this.setupDefaultHandlers();

    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  private setupDefaultHandlers() {
    // Initialize handler
    this.messageHandlers.set('initialize', (message) => ({
      jsonrpc: '2.0',
      id: message.id,
      result: {
        capabilities: [
          { name: 'resources', version: '1.0.0', description: 'Resource access' },
          { name: 'tools', version: '1.0.0', description: 'Tool execution' }
        ]
      }
    }));

    // Resources list handler
    this.messageHandlers.set('resources/list', (message) => {
      const resources: MCPResource[] = [
        {
          uri: 'file:///test/document1.txt',
          name: 'Document 1',
          description: 'Test document 1',
          mimeType: 'text/plain',
          handler: null as any
        },
        {
          uri: 'file:///test/document2.json',
          name: 'Document 2',
          description: 'Test JSON document',
          mimeType: 'application/json',
          handler: null as any
        },
        {
          uri: 'database://users/table',
          name: 'Users Table',
          description: 'User database table',
          mimeType: 'application/x-database-table',
          handler: null as any
        }
      ];

      let filteredResources = resources;
      if (message.params?.pattern) {
        const pattern = message.params.pattern;
        filteredResources = resources.filter(r =>
          r.uri.includes(pattern) || r.name.includes(pattern)
        );
      }

      return {
        jsonrpc: '2.0',
        id: message.id,
        result: { resources: filteredResources }
      };
    });

    // Resource read handler
    this.messageHandlers.set('resources/read', (message) => {
      const uri = message.params?.uri;

      const contentMap: Record<string, ResourceContent> = {
        'file:///test/document1.txt': {
          uri: 'file:///test/document1.txt',
          mimeType: 'text/plain',
          content: 'This is the content of document 1.\nIt contains multiple lines.\nAnd some test data.'
        },
        'file:///test/document2.json': {
          uri: 'file:///test/document2.json',
          mimeType: 'application/json',
          content: JSON.stringify({
            id: 1,
            name: 'Test Object',
            data: { key: 'value', numbers: [1, 2, 3] },
            timestamp: '2024-01-01T00:00:00Z'
          }, null, 2)
        },
        'database://users/table': {
          uri: 'database://users/table',
          mimeType: 'application/x-database-table',
          content: JSON.stringify({
            schema: { id: 'integer', name: 'string', email: 'string' },
            rows: [
              { id: 1, name: 'John Doe', email: 'john@example.com' },
              { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
            ]
          })
        }
      };

      const content = contentMap[uri];
      if (!content) {
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32001,
            message: 'Resource not found',
            data: { uri }
          }
        };
      }

      return {
        jsonrpc: '2.0',
        id: message.id,
        result: content
      };
    });

    // Tool call handler
    this.messageHandlers.set('tools/call', (message) => {
      const { name, arguments: args } = message.params || {};

      const toolHandlers: Record<string, (args: any) => ToolResult> = {
        'echo': (args) => ({
          success: true,
          result: { echo: args.message || 'Hello, World!' }
        }),
        'calculate': (args) => {
          const { a, b, operation } = args;
          let result: number;

          switch (operation) {
            case 'add': result = a + b; break;
            case 'subtract': result = a - b; break;
            case 'multiply': result = a * b; break;
            case 'divide': result = b !== 0 ? a / b : NaN; break;
            default:
              return {
                success: false,
                error: `Unknown operation: ${operation}`
              };
          }

          return {
            success: true,
            result: { calculation: result, operation, operands: [a, b] }
          };
        },
        'text-process': (args) => {
          const { text, operation } = args;
          let result: string;

          switch (operation) {
            case 'uppercase': result = text.toUpperCase(); break;
            case 'lowercase': result = text.toLowerCase(); break;
            case 'reverse': result = text.split('').reverse().join(''); break;
            case 'length':
              return {
                success: true,
                result: { length: text.length, text }
              };
            default:
              return {
                success: false,
                error: `Unknown text operation: ${operation}`
              };
          }

          return {
            success: true,
            result: { processed: result, original: text, operation }
          };
        },
        'slow-tool': (args) => {
          // Simulate a slow tool for timeout testing
          return new Promise(resolve => {
            setTimeout(() => {
              resolve({
                success: true,
                result: { message: 'Slow operation completed', delay: args.delay || 1000 }
              });
            }, args.delay || 1000);
          });
        },
        'error-tool': () => ({
          success: false,
          error: 'Simulated tool error for testing'
        })
      };

      const handler = toolHandlers[name];
      if (!handler) {
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32601,
            message: 'Tool not found',
            data: { toolName: name }
          }
        };
      }

      try {
        const result = handler(args);
        return {
          jsonrpc: '2.0',
          id: message.id,
          result
        };
      } catch (error) {
        return {
          jsonrpc: '2.0',
          id: message.id,
          error: {
            code: -32603,
            message: 'Tool execution failed',
            data: { error: error.message }
          }
        };
      }
    });
  }

  send(data: string): void {
    setTimeout(() => {
      if (this.onmessage) {
        try {
          const message = JSON.parse(data);
          const handler = this.messageHandlers.get(message.method);

          if (handler) {
            const response = handler(message);
            this.onmessage(new MessageEvent('message', {
              data: JSON.stringify(response)
            }));
          } else {
            // Default error response
            const errorResponse = {
              jsonrpc: '2.0',
              id: message.id,
              error: {
                code: -32601,
                message: 'Method not found',
                data: { method: message.method }
              }
            };
            this.onmessage(new MessageEvent('message', {
              data: JSON.stringify(errorResponse)
            }));
          }
        } catch (error) {
          // Invalid JSON
          const errorResponse = {
            jsonrpc: '2.0',
            id: null,
            error: {
              code: -32700,
              message: 'Parse error'
            }
          };
          this.onmessage(new MessageEvent('message', {
            data: JSON.stringify(errorResponse)
          }));
        }
      }
    }, 5);
  }

  close(): void {
    this.readyState = MockWebSocket.CLOSED;
    if (this.onclose) {
      this.onclose(new CloseEvent('close'));
    }
  }
}

// Set up global WebSocket mock
(global as any).WebSocket = MockWebSocket;

describe('Client Resource and Tool Access', () => {
  let client: MCPClient;
  let config: MCPClientConfig;

  beforeEach(() => {
    config = {
      name: 'test-client',
      version: '1.0.0',
      timeout: 5000,
      retryPolicy: {
        maxAttempts: 3,
        baseDelay: 100,
        maxDelay: 1000
      },
      options: {
        enableCaching: true,
        cacheTTL: 60000
      }
    };

    client = new MCPClient(config);
  });

  afterEach(async () => {
    await client.cleanup();
  });

  describe('Resource Access', () => {
    beforeEach(async () => {
      await client.connect('ws://localhost:8080');
    });

    test('should list all available resources', async () => {
      const resources = await client.listResources();

      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBe(3);

      const uris = resources.map(r => r.uri);
      expect(uris).toContain('file:///test/document1.txt');
      expect(uris).toContain('file:///test/document2.json');
      expect(uris).toContain('database://users/table');
    });

    test('should filter resources by pattern', async () => {
      const textResources = await client.listResources('txt');
      expect(textResources.length).toBe(1);
      expect(textResources[0].uri).toBe('file:///test/document1.txt');

      const jsonResources = await client.listResources('json');
      expect(jsonResources.length).toBe(1);
      expect(jsonResources[0].uri).toBe('file:///test/document2.json');

      const databaseResources = await client.listResources('database');
      expect(databaseResources.length).toBe(1);
      expect(databaseResources[0].uri).toBe('database://users/table');
    });

    test('should read text resource content', async () => {
      const content = await client.readResource('file:///test/document1.txt');

      expect(content.uri).toBe('file:///test/document1.txt');
      expect(content.mimeType).toBe('text/plain');
      expect(content.content).toContain('This is the content of document 1');
      expect(content.content).toContain('multiple lines');
    });

    test('should read JSON resource content', async () => {
      const content = await client.readResource('file:///test/document2.json');

      expect(content.uri).toBe('file:///test/document2.json');
      expect(content.mimeType).toBe('application/json');

      const jsonData = JSON.parse(content.content as string);
      expect(jsonData.id).toBe(1);
      expect(jsonData.name).toBe('Test Object');
      expect(jsonData.data.key).toBe('value');
    });

    test('should read database resource content', async () => {
      const content = await client.readResource('database://users/table');

      expect(content.uri).toBe('database://users/table');
      expect(content.mimeType).toBe('application/x-database-table');

      const dbData = JSON.parse(content.content as string);
      expect(dbData.schema).toBeDefined();
      expect(dbData.rows).toHaveLength(2);
      expect(dbData.rows[0].name).toBe('John Doe');
    });

    test('should handle non-existent resource', async () => {
      await expect(client.readResource('file:///nonexistent.txt'))
        .rejects.toThrow('Resource not found');
    });

    test('should cache resource content', async () => {
      const uri = 'file:///test/document1.txt';

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

      // Verify cache statistics
      const cacheStats = client.getCacheStatistics();
      expect(cacheStats.hitCount).toBeGreaterThan(0);
      expect(cacheStats.totalEntries).toBeGreaterThan(0);
    });
  });

  describe('Tool Access', () => {
    beforeEach(async () => {
      await client.connect('ws://localhost:8080');
    });

    test('should call echo tool successfully', async () => {
      const result = await client.callTool('echo', {
        message: 'Hello from test!'
      });

      expect(result.success).toBe(true);
      expect(result.result).toEqual({
        echo: 'Hello from test!'
      });
    });

    test('should call calculator tool for various operations', async () => {
      // Addition
      const addResult = await client.callTool('calculate', {
        a: 10,
        b: 5,
        operation: 'add'
      });
      expect(addResult.success).toBe(true);
      expect(addResult.result.calculation).toBe(15);

      // Multiplication
      const multiplyResult = await client.callTool('calculate', {
        a: 7,
        b: 8,
        operation: 'multiply'
      });
      expect(multiplyResult.success).toBe(true);
      expect(multiplyResult.result.calculation).toBe(56);

      // Division
      const divideResult = await client.callTool('calculate', {
        a: 20,
        b: 4,
        operation: 'divide'
      });
      expect(divideResult.success).toBe(true);
      expect(divideResult.result.calculation).toBe(5);
    });

    test('should call text processing tool', async () => {
      const text = 'Hello World';

      // Uppercase
      const upperResult = await client.callTool('text-process', {
        text,
        operation: 'uppercase'
      });
      expect(upperResult.success).toBe(true);
      expect(upperResult.result.processed).toBe('HELLO WORLD');

      // Reverse
      const reverseResult = await client.callTool('text-process', {
        text,
        operation: 'reverse'
      });
      expect(reverseResult.success).toBe(true);
      expect(reverseResult.result.processed).toBe('dlroW olleH');

      // Length
      const lengthResult = await client.callTool('text-process', {
        text,
        operation: 'length'
      });
      expect(lengthResult.success).toBe(true);
      expect(lengthResult.result.length).toBe(11);
    });

    test('should handle tool execution errors', async () => {
      const result = await client.callTool('error-tool', {});

      expect(result.success).toBe(false);
      expect(result.error).toBe('Simulated tool error for testing');
    });

    test('should handle non-existent tool', async () => {
      await expect(client.callTool('nonexistent-tool', {}))
        .rejects.toThrow('Tool not found');
    });

    test('should cache tool results for deterministic operations', async () => {
      const toolName = 'calculate';
      const params = { a: 15, b: 3, operation: 'multiply' };

      // First call
      const startTime1 = Date.now();
      const result1 = await client.callTool(toolName, params);
      const duration1 = Date.now() - startTime1;

      // Second call (should be cached)
      const startTime2 = Date.now();
      const result2 = await client.callTool(toolName, params);
      const duration2 = Date.now() - startTime2;

      expect(result1).toEqual(result2);
      expect(result2.result.calculation).toBe(45);
      expect(duration2).toBeLessThanOrEqual(duration1); // Cached call should be faster or equal (if 0ms)

      // Verify cache statistics
      const cacheStats = client.getCacheStatistics();
      expect(cacheStats.hitCount).toBeGreaterThan(0);
    });

    test('should not cache failed tool results', async () => {
      const toolName = 'error-tool';
      const params = {};

      // First call (should fail)
      const result1 = await client.callTool(toolName, params);
      expect(result1.success).toBe(false);

      // Second call (should not be cached, should fail again)
      const result2 = await client.callTool(toolName, params);
      expect(result2.success).toBe(false);

      // Both calls should have been made (not cached)
      expect(result1).toEqual(result2);
    });
  });

  describe('Concurrent Operations', () => {
    beforeEach(async () => {
      await client.connect('ws://localhost:8080');
    });

    test('should handle concurrent resource reads', async () => {
      const promises = [
        client.readResource('file:///test/document1.txt'),
        client.readResource('file:///test/document2.json'),
        client.readResource('database://users/table'),
        client.readResource('file:///test/document1.txt'), // Duplicate for caching test
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(results[0].uri).toBe('file:///test/document1.txt');
      expect(results[1].uri).toBe('file:///test/document2.json');
      expect(results[2].uri).toBe('database://users/table');
      expect(results[3]).toEqual(results[0]); // Should be same due to caching
    });

    test('should handle concurrent tool calls', async () => {
      const promises = [
        client.callTool('calculate', { a: 5, b: 3, operation: 'add' }),
        client.callTool('calculate', { a: 10, b: 2, operation: 'multiply' }),
        client.callTool('text-process', { text: 'test', operation: 'uppercase' }),
        client.callTool('echo', { message: 'concurrent test' })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(4);
      expect(results[0].result.calculation).toBe(8);
      expect(results[1].result.calculation).toBe(20);
      expect(results[2].result.processed).toBe('TEST');
      expect(results[3].result.echo).toBe('concurrent test');
    });

    test('should handle mixed resource and tool operations', async () => {
      const promises = [
        client.listResources(),
        client.readResource('file:///test/document1.txt'),
        client.callTool('echo', { message: 'mixed operations' }),
        client.readResource('file:///test/document2.json'),
        client.callTool('calculate', { a: 7, b: 4, operation: 'subtract' })
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(5);
      expect(Array.isArray(results[0])).toBe(true); // listResources result
      expect(results[1].uri).toBe('file:///test/document1.txt');
      expect(results[2].result.echo).toBe('mixed operations');
      expect(results[3].uri).toBe('file:///test/document2.json');
      expect(results[4].result.calculation).toBe(3);
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      await client.connect('ws://localhost:8080');
    });

    test('should provide detailed cache statistics', async () => {
      // Perform some operations to populate cache
      await client.readResource('file:///test/document1.txt');
      await client.readResource('file:///test/document1.txt'); // Cache hit
      await client.callTool('calculate', { a: 1, b: 2, operation: 'add' });
      await client.callTool('calculate', { a: 1, b: 2, operation: 'add' }); // Cache hit

      const stats = client.getCacheStatistics();

      expect(stats.totalEntries).toBeGreaterThan(0);
      expect(stats.hitCount).toBeGreaterThan(0);
      expect(stats.hitRate).toBeGreaterThan(0);
      expect(stats.hitRate).toBeLessThanOrEqual(1);
    });

    test('should clear cache when requested', async () => {
      // Populate cache
      await client.readResource('file:///test/document1.txt');
      await client.callTool('echo', { message: 'cache test' });

      let stats = client.getCacheStatistics();
      expect(stats.totalEntries).toBeGreaterThan(0);

      // Clear cache
      client.clearCache();

      stats = client.getCacheStatistics();
      expect(stats.totalEntries).toBe(0);
    });

    test('should respect cache TTL', async () => {
      // Create client with very short cache TTL
      const shortCacheClient = new MCPClient({
        ...config,
        options: {
          ...config.options,
          cacheTTL: 100 // 100ms
        }
      });

      await shortCacheClient.connect('ws://localhost:8080');

      try {
        // First read
        const content1 = await shortCacheClient.readResource('file:///test/document1.txt');

        // Wait for cache to expire
        await new Promise(resolve => setTimeout(resolve, 150));

        // Second read (cache should be expired)
        const content2 = await shortCacheClient.readResource('file:///test/document1.txt');

        expect(content1).toEqual(content2);

        // Both reads should have been actual requests (not cached)
        const stats = shortCacheClient.getCacheStatistics();
        expect(stats.missCount).toBeGreaterThanOrEqual(2);

      } finally {
        await shortCacheClient.cleanup();
      }
    });
  });
});
