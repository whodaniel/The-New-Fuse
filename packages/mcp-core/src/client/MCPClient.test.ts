/**
 * Unit tests for MCPClient
 */

import { MCPClient } from './MCPClient';
import { MCPClientConfig } from '../types/client';
import { ConnectionStatus } from '../interfaces/IMCPConnection';
import { MCPErrorCode } from '../types/error';

// Mock WebSocket
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

  constructor(public url: string) {
    // Simulate connection after a short delay
    setTimeout(() => {
      this.readyState = MockWebSocket.OPEN;
      if (this.onopen) {
        this.onopen(new Event('open'));
      }
    }, 10);
  }

  send(data: string): void {
    // Echo back a response for testing
    setTimeout(() => {
      if (this.onmessage) {
        const message = JSON.parse(data);
        let response;

        if (message.method === 'initialize') {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              capabilities: [
                { name: 'resources', version: '1.0' },
                { name: 'tools', version: '1.0' }
              ]
            }
          };
        } else if (message.method === 'resources/list') {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              resources: [
                { uri: 'test://resource1', name: 'Resource 1' },
                { uri: 'test://resource2', name: 'Resource 2' }
              ]
            }
          };
        } else if (message.method === 'resources/read') {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              uri: message.params.uri,
              mimeType: 'text/plain',
              content: 'Test content'
            }
          };
        } else if (message.method === 'tools/call') {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: {
              success: true,
              result: { output: 'Tool executed successfully' }
            }
          };
        } else if (message.method === 'ping') {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            result: { status: 'pong' }
          };
        } else {
          response = {
            jsonrpc: '2.0',
            id: message.id,
            error: {
              code: -32601,
              message: 'Method not found'
            }
          };
        }

        this.onmessage(new MessageEvent('message', { data: JSON.stringify(response) }));
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

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('MCPClient', () => {
  let client: MCPClient;
  let config: MCPClientConfig;

  beforeEach(() => {
    config = {
      name: 'test-client',
      version: '1.0.0',
      timeout: 5000,
      retryPolicy: {
        maxAttempts: 3,
        baseDelay: 1000,
        maxDelay: 10000
      },
      options: {
        enableCaching: true,
        cacheTTL: 300000
      }
    };

    client = new MCPClient(config);
  });

  afterEach(async () => {
    await client.cleanup();
  });

  describe('Connection Management', () => {
    test('should connect to server successfully', async () => {
      const endpoint = 'ws://localhost:8080';

      await client.connect(endpoint);

      expect(client.isConnected()).toBe(true);
      expect(client.getEndpoint()).toBe(endpoint);
    });

    test('should disconnect from server', async () => {
      const endpoint = 'ws://localhost:8080';

      await client.connect(endpoint);
      expect(client.isConnected()).toBe(true);

      await client.disconnect();
      expect(client.isConnected()).toBe(false);
      expect(client.getEndpoint()).toBe(null);
    });

    test('should handle connection errors', async () => {
      // Mock WebSocket that fails to connect
      const OriginalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          setTimeout(() => {
            if (this.onerror) {
              this.onerror(new Event('error'));
            }
          }, 10);
        }
      };

      const endpoint = 'ws://invalid:8080';

      await expect(client.connect(endpoint)).rejects.toThrow();
      expect(client.isConnected()).toBe(false);

      // Restore original WebSocket
      (global as any).WebSocket = OriginalWebSocket;
    });

    test('should reuse existing connection', async () => {
      const endpoint = 'ws://localhost:8080';

      await client.connect(endpoint);
      const firstConnection = client.getEndpoint();

      await client.connect(endpoint); // Should reuse connection
      const secondConnection = client.getEndpoint();

      expect(firstConnection).toBe(secondConnection);
    });
  });

  describe('Request Handling', () => {
    beforeEach(async () => {
      await client.connect('ws://localhost:8080');
    });

    test('should send request and receive response', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 'test-1',
        method: 'initialize',
        params: {}
      };

      const response = await client.sendRequest(request);

      expect(response.jsonrpc).toBe('2.0');
      expect(response.id).toBe('test-1');
      expect(response.result).toBeDefined();
    });

    test('should handle request errors', async () => {
      const request = {
        jsonrpc: '2.0' as const,
        id: 'test-error',
        method: 'nonexistent-method',
        params: {}
      };

      await expect(client.sendRequest(request)).rejects.toThrow();
    });

    test('should throw error when not connected', async () => {
      await client.disconnect();

      const request = {
        jsonrpc: '2.0' as const,
        id: 'test-disconnected',
        method: 'test',
        params: {}
      };

      await expect(client.sendRequest(request)).rejects.toThrow();
    });
  });

  describe('Resource Operations', () => {
    beforeEach(async () => {
      await client.connect('ws://localhost:8080');
    });

    test('should list resources', async () => {
      const resources = await client.listResources();

      expect(Array.isArray(resources)).toBe(true);
      expect(resources.length).toBeGreaterThan(0);
      expect(resources[0]).toHaveProperty('uri');
      expect(resources[0]).toHaveProperty('name');
    });

    test('should list resources with pattern', async () => {
      const resources = await client.listResources('test://*');

      expect(Array.isArray(resources)).toBe(true);
    });

    test('should read resource content', async () => {
      const uri = 'test://resource1';
      const content = await client.readResource(uri);

      expect(content).toHaveProperty('uri', uri);
      expect(content).toHaveProperty('mimeType');
      expect(content).toHaveProperty('content');
    });

    test('should cache resource content', async () => {
      const uri = 'test://resource1';

      // First read
      const content1 = await client.readResource(uri);

      // Second read should be from cache
      const content2 = await client.readResource(uri);

      expect(content1).toEqual(content2);
    });
  });

  describe('Tool Operations', () => {
    beforeEach(async () => {
      await client.connect('ws://localhost:8080');
    });

    test('should call tool successfully', async () => {
      const result = await client.callTool('test-tool', { param1: 'value1' });

      expect(result).toHaveProperty('success', true);
      expect(result).toHaveProperty('result');
    });

    test('should cache tool results', async () => {
      const toolName = 'test-tool';
      const params = { param1: 'value1' };

      // First call
      const result1 = await client.callTool(toolName, params);

      // Second call should be from cache
      const result2 = await client.callTool(toolName, params);

      expect(result1).toEqual(result2);
    });
  });

  describe('Server Capabilities', () => {
    beforeEach(async () => {
      await client.connect('ws://localhost:8080');
    });

    test('should get server capabilities', async () => {
      const capabilities = await client.getServerCapabilities();

      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
      expect(capabilities[0]).toHaveProperty('name');
      expect(capabilities[0]).toHaveProperty('version');
    });

    test('should cache server capabilities', async () => {
      // First call
      const capabilities1 = await client.getServerCapabilities();

      // Second call should be from cache
      const capabilities2 = await client.getServerCapabilities();

      expect(capabilities1).toEqual(capabilities2);
    });
  });

  describe('Notifications', () => {
    beforeEach(async () => {
      await client.connect('ws://localhost:8080');
    });

    test('should send notification', async () => {
      const notification = {
        jsonrpc: '2.0' as const,
        method: 'test-notification',
        params: { data: 'test' }
      };

      await expect(client.sendNotification(notification)).resolves.not.toThrow();
    });

    test('should subscribe to notifications', (done) => {
      const callback = jest.fn((notification) => {
        expect(notification.method).toBe('test-notification');
        done();
      });

      client.subscribeToNotifications(callback);

      // Simulate incoming notification
      setTimeout(() => {
        client.emit('notification', {
          jsonrpc: '2.0',
          method: 'test-notification',
          params: {}
        });
      }, 10);
    });

    test('should subscribe to specific method', (done) => {
      const callback = jest.fn((notification) => {
        expect(notification.method).toBe('specific-method');
        done();
      });

      client.subscribeToMethod('specific-method', callback);

      // Simulate incoming notification
      setTimeout(() => {
        client.emit('notification', {
          jsonrpc: '2.0',
          method: 'specific-method',
          params: {}
        });
      }, 10);
    });
  });

  describe('Statistics and Status', () => {
    test('should track statistics', async () => {
      await client.connect('ws://localhost:8080');

      const initialStats = client.getStatistics();
      expect(initialStats.totalConnections).toBe(1);

      await client.sendRequest({
        jsonrpc: '2.0',
        id: 'stats-test',
        method: 'initialize',
        params: {}
      });

      const updatedStats = client.getStatistics();
      expect(updatedStats.totalRequests).toBeGreaterThan(initialStats.totalRequests);
    });

    test('should provide client status', async () => {
      const status = client.getStatus();

      expect(status.name).toBe(config.name);
      expect(status.connectionStatus).toBe(ConnectionStatus.DISCONNECTED);
      expect(status.statistics).toBeDefined();
    });

    test('should provide cache statistics', () => {
      const cacheStats = client.getCacheStatistics();

      expect(cacheStats).toHaveProperty('totalEntries');
      expect(cacheStats).toHaveProperty('hitCount');
      expect(cacheStats).toHaveProperty('missCount');
    });
  });

  describe('Error Handling', () => {
    test('should handle connection timeout', async () => {
      // Mock WebSocket that never connects
      const OriginalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = class extends MockWebSocket {
        constructor(url: string) {
          super(url);
          // Never call onopen
        }
      };

      const shortTimeoutConfig = {
        ...config,
        timeout: 100
      };
      const timeoutClient = new MCPClient(shortTimeoutConfig);

      await expect(timeoutClient.connect('ws://timeout:8080')).rejects.toThrow();

      // Restore original WebSocket
      (global as any).WebSocket = OriginalWebSocket;
      await timeoutClient.cleanup();
    });

    test('should handle request timeout', async () => {
      // Mock WebSocket that doesn't respond
      const OriginalWebSocket = (global as any).WebSocket;
      (global as any).WebSocket = class extends MockWebSocket {
        send(data: string): void {
          // Don't send any response
        }
      };

      const timeoutClient = new MCPClient({
        ...config,
        timeout: 100
      });

      await timeoutClient.connect('ws://localhost:8080');

      const request = {
        jsonrpc: '2.0' as const,
        id: 'timeout-test',
        method: 'test',
        params: {}
      };

      await expect(timeoutClient.sendRequest(request)).rejects.toThrow();

      // Restore original WebSocket
      (global as any).WebSocket = OriginalWebSocket;
      await timeoutClient.cleanup();
    });
  });

  describe('Cleanup', () => {
    test('should cleanup resources properly', async () => {
      await client.connect('ws://localhost:8080');
      expect(client.isConnected()).toBe(true);

      await client.cleanup();

      expect(client.isConnected()).toBe(false);
      expect(client.getEndpoint()).toBe(null);
    });

    test('should clear cache', async () => {
      await client.connect('ws://localhost:8080');

      // Add some cached data
      await client.readResource('test://resource1');

      let cacheStats = client.getCacheStatistics();
      expect(cacheStats.totalEntries).toBeGreaterThan(0);

      client.clearCache();

      cacheStats = client.getCacheStatistics();
      expect(cacheStats.totalEntries).toBe(0);
    });
  });
});
