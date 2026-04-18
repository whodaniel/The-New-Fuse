/**
 * Unit tests for ConnectionManager
 */

import { EventEmitter } from 'events';
import { ConnectionManager } from './ConnectionManager.js';
import { ConnectionOptions, ConnectionStatus } from '../interfaces/IMCPConnection.js';
import { MCPErrorClass, MCPErrorCode } from '../types/error.js';

// Mock WebSocket
class MockWebSocket extends EventEmitter {
  public readyState: number = WebSocket.CONNECTING;
  public static CONNECTING = 0;
  public static OPEN = 1;
  public static CLOSING = 2;
  public static CLOSED = 3;

  constructor(public url: string) {
    super();
    // Simulate connection delay
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.emit('open');
    }, 10);
  }

  send(data: string): void {
    if (this.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket is not open');
    }
    // Echo back for ping responses
    if (data.includes('"method":"ping"')) {
      const message = JSON.parse(data);
      setTimeout(() => {
        this.emit('message', { 
          data: JSON.stringify({
            jsonrpc: '2.0',
            id: message.id,
            result: 'pong'
          })
        });
      }, 5);
    }
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    this.emit('close');
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockWebSocket;

describe('ConnectionManager', () => {
  let connectionManager: ConnectionManager;
  let defaultOptions: ConnectionOptions;

  beforeEach(() => {
    connectionManager = new ConnectionManager({
      maxConnections: 5,
      maxIdleTime: 1000,
      healthCheckInterval: 100,
      reconnectInterval: 50,
      maxReconnectAttempts: 3
    });

    defaultOptions = {
      timeout: 5000,
      retryAttempts: 2,
      retryDelay: 100,
      keepAlive: true
    };
  });

  afterEach(async () => {
    await connectionManager.closeAllConnections();
  });

  describe('Connection Creation', () => {
    it('should create a new connection successfully', async () => {
      const endpoint = 'ws://localhost:8080';
      const connection = await connectionManager.createConnection(endpoint, defaultOptions);

      expect(connection).toBeDefined();
      expect(connection.endpoint).toBe(endpoint);
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      expect(connectionManager.getConnection(endpoint)).toBe(connection);
    });

    it('should reuse existing active connection', async () => {
      const endpoint = 'ws://localhost:8080';
      const connection1 = await connectionManager.createConnection(endpoint, defaultOptions);
      const connection2 = await connectionManager.createConnection(endpoint, defaultOptions);

      expect(connection1).toBe(connection2);
    });

    it('should enforce connection pool limits', async () => {
      const promises = [];
      
      // Create connections up to the limit
      for (let i = 0; i < 5; i++) {
        promises.push(
          connectionManager.createConnection(`ws://localhost:808${i}`, defaultOptions)
        );
      }
      
      await Promise.all(promises);

      // Attempt to create one more connection should fail
      await expect(
        connectionManager.createConnection('ws://localhost:8085', defaultOptions)
      ).rejects.toThrow('Connection pool limit exceeded');
    });

    it('should handle connection timeout', async () => {
      // Mock WebSocket that never connects
      class TimeoutWebSocket extends EventEmitter {
        public readyState = WebSocket.CONNECTING;
        constructor(url: string) {
          super();
          // Never emit 'open' event to simulate timeout
        }
        send() {}
        close() {
          this.readyState = WebSocket.CLOSED;
          this.emit('close');
        }
      }

      (global as any).WebSocket = TimeoutWebSocket;

      const shortTimeoutOptions = { ...defaultOptions, timeout: 50 };
      
      await expect(
        connectionManager.createConnection('ws://localhost:8080', shortTimeoutOptions)
      ).rejects.toThrow('Connection timeout');

      // Restore mock
      (global as any).WebSocket = MockWebSocket;
    });
  });

  describe('Connection Management', () => {
    it('should close connection successfully', async () => {
      const endpoint = 'ws://localhost:8080';
      await connectionManager.createConnection(endpoint, defaultOptions);
      
      expect(connectionManager.getConnection(endpoint)).toBeDefined();
      
      await connectionManager.closeConnection(endpoint);
      
      expect(connectionManager.getConnection(endpoint)).toBeNull();
    });

    it('should get connection status correctly', async () => {
      const endpoint = 'ws://localhost:8080';
      
      expect(connectionManager.getConnectionStatus(endpoint)).toBe(ConnectionStatus.DISCONNECTED);
      
      await connectionManager.createConnection(endpoint, defaultOptions);
      
      expect(connectionManager.getConnectionStatus(endpoint)).toBe(ConnectionStatus.CONNECTED);
    });

    it('should list all connections', async () => {
      const endpoints = ['ws://localhost:8080', 'ws://localhost:8081'];
      
      for (const endpoint of endpoints) {
        await connectionManager.createConnection(endpoint, defaultOptions);
      }
      
      const connections = connectionManager.listConnections();
      expect(connections).toHaveLength(2);
      expect(connections.map(c => c.endpoint)).toEqual(expect.arrayContaining(endpoints));
    });

    it('should close all connections', async () => {
      const endpoints = ['ws://localhost:8080', 'ws://localhost:8081'];
      
      for (const endpoint of endpoints) {
        await connectionManager.createConnection(endpoint, defaultOptions);
      }
      
      expect(connectionManager.listConnections()).toHaveLength(2);
      
      await connectionManager.closeAllConnections();
      
      expect(connectionManager.listConnections()).toHaveLength(0);
    });
  });

  describe('Connection Retry Logic', () => {
    it('should retry connection with exponential backoff', async () => {
      let attemptCount = 0;
      
      // Mock WebSocket that fails first two attempts
      class RetryWebSocket extends EventEmitter {
        public readyState = WebSocket.CONNECTING;
        
        constructor(url: string) {
          super();
          attemptCount++;
          
          setTimeout(() => {
            if (attemptCount <= 2) {
              this.readyState = WebSocket.CLOSED;
              this.emit('error', new Error('Connection failed'));
            } else {
              this.readyState = WebSocket.OPEN;
              this.emit('open');
            }
          }, 10);
        }
        
        send() {}
        close() {
          this.readyState = WebSocket.CLOSED;
          this.emit('close');
        }
      }

      (global as any).WebSocket = RetryWebSocket;

      const connection = await connectionManager.createConnection('ws://localhost:8080', defaultOptions);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      expect(attemptCount).toBe(3);

      // Restore mock
      (global as any).WebSocket = MockWebSocket;
    });

    it('should fail after max retry attempts', async () => {
      // Mock WebSocket that always fails
      class FailingWebSocket extends EventEmitter {
        public readyState = WebSocket.CONNECTING;
        
        constructor(url: string) {
          super();
          setTimeout(() => {
            this.readyState = WebSocket.CLOSED;
            this.emit('error', new Error('Connection failed'));
          }, 10);
        }
        
        send() {}
        close() {
          this.readyState = WebSocket.CLOSED;
          this.emit('close');
        }
      }

      (global as any).WebSocket = FailingWebSocket;

      await expect(
        connectionManager.createConnection('ws://localhost:8080', defaultOptions)
      ).rejects.toThrow('Connection failed');

      // Restore mock
      (global as any).WebSocket = MockWebSocket;
    });
  });

  describe('Health Monitoring', () => {
    it('should track connection health', async () => {
      const endpoint = 'ws://localhost:8080';
      await connectionManager.createConnection(endpoint, defaultOptions);
      
      const health = connectionManager.getConnectionHealth(endpoint);
      
      expect(health).toBeDefined();
      expect(health!.endpoint).toBe(endpoint);
      expect(health!.isHealthy).toBe(true);
      expect(health!.consecutiveFailures).toBe(0);
    });

    it('should perform health checks', async () => {
      const endpoint = 'ws://localhost:8080';
      await connectionManager.createConnection(endpoint, defaultOptions);
      
      const isHealthy = await connectionManager.checkConnectionHealth(endpoint);
      
      expect(isHealthy).toBe(true);
      
      const health = connectionManager.getConnectionHealth(endpoint);
      expect(health!.isHealthy).toBe(true);
    });

    it('should detect unhealthy connections', async () => {
      const endpoint = 'ws://localhost:8080';
      const connection = await connectionManager.createConnection(endpoint, defaultOptions);
      
      // Simulate connection failure
      await connection.close();
      
      const isHealthy = await connectionManager.checkConnectionHealth(endpoint);
      
      expect(isHealthy).toBe(false);
      
      const health = connectionManager.getConnectionHealth(endpoint);
      expect(health!.isHealthy).toBe(false);
      expect(health!.consecutiveFailures).toBeGreaterThan(0);
    });
  });

  describe('Automatic Reconnection', () => {
    it('should attempt automatic reconnection on disconnect', (done) => {
      const endpoint = 'ws://localhost:8080';
      
      connectionManager.on('reconnectionScheduled', (reconnectEndpoint, delay) => {
        expect(reconnectEndpoint).toBe(endpoint);
        expect(delay).toBeGreaterThan(0);
        done();
      });
      
      connectionManager.createConnection(endpoint, defaultOptions).then((connection) => {
        // Simulate disconnection
        (connection as any).ws.emit('close');
      });
    });

    it('should abandon reconnection after max attempts', (done) => {
      const endpoint = 'ws://localhost:8080';
      
      connectionManager.on('reconnectionAbandoned', (reconnectEndpoint, attempts) => {
        expect(reconnectEndpoint).toBe(endpoint);
        expect(attempts).toBeGreaterThanOrEqual(3);
        done();
      });
      
      connectionManager.createConnection(endpoint, defaultOptions).then((connection) => {
        const health = connectionManager.getConnectionHealth(endpoint);
        if (health) {
          health.consecutiveFailures = 5; // Exceed max attempts
        }
        
        // Simulate disconnection
        (connection as any).ws.emit('close');
      });
    });
  });

  describe('Connection Pool Statistics', () => {
    it('should provide pool statistics', async () => {
      const endpoints = ['ws://localhost:8080', 'ws://localhost:8081'];
      
      for (const endpoint of endpoints) {
        await connectionManager.createConnection(endpoint, defaultOptions);
      }
      
      const stats = connectionManager.getPoolStatistics();
      
      expect(stats.totalConnections).toBe(2);
      expect(stats.activeConnections).toBe(2);
      expect(stats.healthyConnections).toBe(2);
      expect(stats.endpoints).toEqual(expect.arrayContaining(endpoints));
    });

    it('should provide detailed statistics', async () => {
      const endpoint = 'ws://localhost:8080';
      await connectionManager.createConnection(endpoint, defaultOptions);
      
      const stats = connectionManager.getDetailedStatistics();
      
      expect(stats.pool.totalConnections).toBe(1);
      expect(stats.pool.activeConnections).toBe(1);
      expect(stats.pool.utilizationPercentage).toBe(20); // 1/5 * 100
      expect(stats.health.healthyPercentage).toBe(100);
    });
  });

  describe('Connection Metrics', () => {
    it('should provide connection metrics', async () => {
      const endpoint = 'ws://localhost:8080';
      await connectionManager.createConnection(endpoint, defaultOptions);
      
      const metrics = connectionManager.getConnectionMetrics();
      
      expect(metrics.totalConnections).toBe(1);
      expect(metrics.activeConnections).toBe(1);
      expect(metrics.failedConnections).toBe(0);
      expect(metrics.lastActivity).toBeInstanceOf(Date);
    });

    it('should aggregate metrics from multiple connections', async () => {
      const endpoints = ['ws://localhost:8080', 'ws://localhost:8081'];
      
      for (const endpoint of endpoints) {
        await connectionManager.createConnection(endpoint, defaultOptions);
      }
      
      const metrics = connectionManager.getConnectionMetrics();
      
      expect(metrics.totalConnections).toBe(2);
      expect(metrics.activeConnections).toBe(2);
    });
  });

  describe('Idle Connection Cleanup', () => {
    it('should clean up idle connections', async () => {
      const endpoint = 'ws://localhost:8080';
      const connection = await connectionManager.createConnection(endpoint, defaultOptions);
      
      // Simulate connection becoming inactive
      await connection.close();
      
      // Wait for cleanup interval
      await new Promise(resolve => setTimeout(resolve, 150));
      
      expect(connectionManager.getConnection(endpoint)).toBeNull();
    });
  });

  describe('Graceful Shutdown', () => {
    it('should shutdown gracefully', async () => {
      const endpoints = ['ws://localhost:8080', 'ws://localhost:8081'];
      
      for (const endpoint of endpoints) {
        await connectionManager.createConnection(endpoint, defaultOptions);
      }
      
      expect(connectionManager.listConnections()).toHaveLength(2);
      
      await connectionManager.shutdown();
      
      expect(connectionManager.listConnections()).toHaveLength(0);
    });

    it('should emit shutdown event', (done) => {
      connectionManager.on('shutdown', () => {
        done();
      });
      
      connectionManager.shutdown();
    });
  });

  describe('Error Handling', () => {
    it('should handle WebSocket errors gracefully', async () => {
      // Mock WebSocket that emits error
      class ErrorWebSocket extends EventEmitter {
        public readyState = WebSocket.CONNECTING;
        
        constructor(url: string) {
          super();
          setTimeout(() => {
            this.emit('error', new Error('WebSocket error'));
          }, 10);
        }
        
        send() {}
        close() {
          this.readyState = WebSocket.CLOSED;
          this.emit('close');
        }
      }

      (global as any).WebSocket = ErrorWebSocket;

      await expect(
        connectionManager.createConnection('ws://localhost:8080', defaultOptions)
      ).rejects.toThrow('Connection failed');

      // Restore mock
      (global as any).WebSocket = MockWebSocket;
    });

    it('should handle send errors', async () => {
      const endpoint = 'ws://localhost:8080';
      const connection = await connectionManager.createConnection(endpoint, defaultOptions);
      
      // Close the connection to make send fail
      await connection.close();
      
      await expect(
        connection.send({
          type: 'request',
          content: { jsonrpc: '2.0', id: 1, method: 'test' },
          timestamp: new Date(),
          source: 'test'
        })
      ).rejects.toThrow('Connection not active');
    });
  });
});