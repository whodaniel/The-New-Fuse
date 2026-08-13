/**
 * Integration tests for ConnectionManager with advanced connection features
 * Tests authentication, TLS/SSL support, and secure connection handling
 */

import { EventEmitter } from 'events';
import { ConnectionManager } from './ConnectionManager.js';
import { ConnectionOptions, ConnectionStatus, AuthConfig, TLSConfig } from '../interfaces/IMCPConnection.js';
import { MCPErrorClass, MCPErrorCode } from '../types/error.js';

// Mock secure WebSocket for testing TLS connections
class MockSecureWebSocket extends EventEmitter {
  public readyState: number = WebSocket.CONNECTING;
  public static CONNECTING = 0;
  public static OPEN = 1;
  public static CLOSING = 2;
  public static CLOSED = 3;

  private authHeaders?: Record<string, string>;
  private tlsOptions?: any;

  constructor(public url: string, options?: any) {
    super();
    
    // Store auth headers and TLS options for verification
    this.authHeaders = options?.headers;
    this.tlsOptions = options;
    
    // Simulate connection delay and validation
    setTimeout(() => {
      // Simulate authentication validation
      if (this.url.includes('auth-required') && !this.authHeaders?.['Authorization']) {
        this.readyState = WebSocket.CLOSED;
        this.emit('error', new Error('Authentication required'));
        return;
      }
      
      // Simulate TLS validation
      if (this.url.startsWith('wss://') && this.tlsOptions?.rejectUnauthorized !== false) {
        // Simulate successful TLS handshake
      }
      
      this.readyState = WebSocket.OPEN;
      this.emit('open');
    }, 20);
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
      }, 10);
    }
  }

  close(): void {
    this.readyState = WebSocket.CLOSED;
    this.emit('close');
  }

  // Method to verify auth headers were set correctly
  getAuthHeaders(): Record<string, string> | undefined {
    return this.authHeaders;
  }

  // Method to verify TLS options were set correctly
  getTLSOptions(): any {
    return this.tlsOptions;
  }
}

// Mock global WebSocket
(global as any).WebSocket = MockSecureWebSocket;

describe('ConnectionManager Integration Tests', () => {
  let connectionManager: ConnectionManager;

  beforeEach(() => {
    connectionManager = new ConnectionManager({
      maxConnections: 10,
      maxIdleTime: 5000,
      healthCheckInterval: 1000,
      reconnectInterval: 100,
      maxReconnectAttempts: 3
    });
  });

  afterEach(async () => {
    await connectionManager.closeAllConnections();
  });

  describe('Authentication Integration', () => {
    it('should establish connection with Bearer token authentication', async () => {
      const authConfig: AuthConfig = {
        type: 'bearer',
        token: 'test-bearer-token-123'
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: authConfig
      };

      const connection = await connectionManager.createConnection('ws://localhost:8080', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      
      // Verify auth headers were set
      const ws = (connection as any).ws as MockSecureWebSocket;
      const authHeaders = ws.getAuthHeaders();
      expect(authHeaders?.['Authorization']).toBe('Bearer test-bearer-token-123');
    });

    it('should establish connection with Basic authentication', async () => {
      const authConfig: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: authConfig
      };

      const connection = await connectionManager.createConnection('ws://localhost:8080', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      
      // Verify auth headers were set
      const ws = (connection as any).ws as MockSecureWebSocket;
      const authHeaders = ws.getAuthHeaders();
      const expectedAuth = Buffer.from('testuser:testpass').toString('base64');
      expect(authHeaders?.['Authorization']).toBe(`Basic ${expectedAuth}`);
    });

    it('should establish connection with API key authentication', async () => {
      const authConfig: AuthConfig = {
        type: 'api_key',
        apiKey: 'api-key-12345'
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: authConfig
      };

      const connection = await connectionManager.createConnection('ws://localhost:8080', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      
      // Verify auth headers were set
      const ws = (connection as any).ws as MockSecureWebSocket;
      const authHeaders = ws.getAuthHeaders();
      expect(authHeaders?.['X-API-Key']).toBe('api-key-12345');
    });

    it('should establish connection with OAuth authentication', async () => {
      const authConfig: AuthConfig = {
        type: 'oauth',
        token: 'oauth-access-token-xyz',
        clientId: 'client-123',
        clientSecret: 'secret-456'
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: authConfig
      };

      const connection = await connectionManager.createConnection('ws://localhost:8080', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      
      // Verify auth headers were set
      const ws = (connection as any).ws as MockSecureWebSocket;
      const authHeaders = ws.getAuthHeaders();
      expect(authHeaders?.['Authorization']).toBe('Bearer oauth-access-token-xyz');
    });

    it('should include additional auth parameters as headers', async () => {
      const authConfig: AuthConfig = {
        type: 'bearer',
        token: 'test-token',
        additionalParams: {
          'X-Client-Version': '1.0.0',
          'X-Request-ID': 'req-123'
        }
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: authConfig
      };

      const connection = await connectionManager.createConnection('ws://localhost:8080', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      
      // Verify all headers were set
      const ws = (connection as any).ws as MockSecureWebSocket;
      const authHeaders = ws.getAuthHeaders();
      expect(authHeaders?.['Authorization']).toBe('Bearer test-token');
      expect(authHeaders?.['X-Client-Version']).toBe('1.0.0');
      expect(authHeaders?.['X-Request-ID']).toBe('req-123');
    });

    it('should fail connection when authentication is required but not provided', async () => {
      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true
        // No auth config provided
      };

      await expect(
        connectionManager.createConnection('ws://localhost:8080/auth-required', options)
      ).rejects.toThrow('Authentication required');
    });
  });

  describe('TLS/SSL Integration', () => {
    it('should establish secure WebSocket connection with TLS enabled', async () => {
      const tlsConfig: TLSConfig = {
        enabled: true,
        rejectUnauthorized: true
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        tls: tlsConfig
      };

      const connection = await connectionManager.createConnection('https://secure.example.com', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      expect(connection.endpoint).toBe('https://secure.example.com');
      
      // Verify WebSocket URL was converted to secure
      const ws = (connection as any).ws as MockSecureWebSocket;
      expect(ws.url).toBe('wss://secure.example.com');
    });

    it('should establish connection with custom TLS certificates', async () => {
      const tlsConfig: TLSConfig = {
        enabled: true,
        rejectUnauthorized: false,
        ca: 'custom-ca-cert',
        cert: 'client-cert',
        key: 'client-key',
        passphrase: 'key-passphrase'
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        tls: tlsConfig
      };

      const connection = await connectionManager.createConnection('wss://secure.example.com', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      
      // Verify TLS options were passed to WebSocket
      const ws = (connection as any).ws as MockSecureWebSocket;
      const tlsOptions = ws.getTLSOptions();
      expect(tlsOptions.rejectUnauthorized).toBe(false);
      expect(tlsOptions.ca).toBe('custom-ca-cert');
      expect(tlsOptions.cert).toBe('client-cert');
      expect(tlsOptions.key).toBe('client-key');
      expect(tlsOptions.passphrase).toBe('key-passphrase');
    });

    it('should auto-upgrade HTTP to WSS when TLS is enabled', async () => {
      const tlsConfig: TLSConfig = {
        enabled: true
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        tls: tlsConfig
      };

      const connection = await connectionManager.createConnection('example.com:8080', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      
      // Verify URL was upgraded to secure WebSocket
      const ws = (connection as any).ws as MockSecureWebSocket;
      expect(ws.url).toBe('wss://example.com:8080');
    });
  });

  describe('Combined Authentication and TLS', () => {
    it('should establish secure authenticated connection', async () => {
      const authConfig: AuthConfig = {
        type: 'bearer',
        token: 'secure-token-123'
      };

      const tlsConfig: TLSConfig = {
        enabled: true,
        rejectUnauthorized: true
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: authConfig,
        tls: tlsConfig,
        headers: {
          'X-Client-ID': 'secure-client-001'
        }
      };

      const connection = await connectionManager.createConnection('https://secure-api.example.com', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      
      // Verify both auth and custom headers were set
      const ws = (connection as any).ws as MockSecureWebSocket;
      const headers = ws.getAuthHeaders();
      expect(headers?.['Authorization']).toBe('Bearer secure-token-123');
      expect(headers?.['X-Client-ID']).toBe('secure-client-001');
      
      // Verify secure WebSocket URL
      expect(ws.url).toBe('wss://secure-api.example.com');
    });
  });

  describe('Security Metrics', () => {
    it('should track security metrics for connections', async () => {
      // Create connections with different security configurations
      const secureAuthOptions: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: { type: 'bearer', token: 'token1' },
        tls: { enabled: true }
      };

      const insecureOptions: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true
      };

      const basicAuthOptions: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: { type: 'basic', username: 'user', password: 'pass' }
      };

      await connectionManager.createConnection('wss://secure1.example.com', secureAuthOptions);
      await connectionManager.createConnection('ws://insecure.example.com', insecureOptions);
      await connectionManager.createConnection('ws://basic.example.com', basicAuthOptions);

      const securityMetrics = connectionManager.getSecurityMetrics();
      
      expect(securityMetrics.security.tlsEnabled).toBe(1);
      expect(securityMetrics.security.tlsPercentage).toBeCloseTo(33.33, 1);
      expect(securityMetrics.security.authenticatedConnections).toBe(2);
      expect(securityMetrics.security.authenticationPercentage).toBeCloseTo(66.67, 1);
      expect(securityMetrics.security.authenticationTypes).toEqual({
        bearer: 1,
        basic: 1
      });
      expect(securityMetrics.compliance.secureConnections).toBe(1);
      expect(securityMetrics.compliance.insecureConnections).toBe(2);
    });
  });

  describe('Performance Metrics', () => {
    it('should collect and report performance metrics', async () => {
      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true
      };

      // Create multiple connections
      await connectionManager.createConnection('ws://perf1.example.com', options);
      await connectionManager.createConnection('ws://perf2.example.com', options);

      // Wait a bit for connections to establish
      await new Promise(resolve => setTimeout(resolve, 50));

      // Perform health checks to generate metrics
      await connectionManager.checkConnectionHealth('ws://perf1.example.com');
      await connectionManager.checkConnectionHealth('ws://perf2.example.com');

      const performanceMetrics = connectionManager.getPerformanceMetrics();
      
      expect(performanceMetrics.throughput.totalDataTransferred).toBeGreaterThanOrEqual(0);
      expect(performanceMetrics.latency.averageResponseTime).toBeGreaterThanOrEqual(0);
      expect(performanceMetrics.reliability.successRate).toBeGreaterThan(0);
      expect(performanceMetrics.reliability.uptime).toBeGreaterThan(0);
    });
  });

  describe('Connection Recovery with Authentication', () => {
    it('should maintain authentication during reconnection', async () => {
      const authConfig: AuthConfig = {
        type: 'bearer',
        token: 'persistent-token-123'
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 50,
        keepAlive: true,
        auth: authConfig
      };

      const connection = await connectionManager.createConnection('ws://reconnect-test.example.com', options);
      
      expect(connection.status).toBe(ConnectionStatus.CONNECTED);
      
      // Verify initial auth headers
      let ws = (connection as any).ws as MockSecureWebSocket;
      let authHeaders = ws.getAuthHeaders();
      expect(authHeaders?.['Authorization']).toBe('Bearer persistent-token-123');

      // Simulate connection loss and wait for reconnection
      return new Promise<void>((resolve) => {
        connectionManager.on('connectionReconnected', (endpoint) => {
          expect(endpoint).toBe('ws://reconnect-test.example.com');
          
          // Verify auth headers are maintained after reconnection
          const reconnectedConnection = connectionManager.getConnection(endpoint);
          const newWs = (reconnectedConnection as any).ws as MockSecureWebSocket;
          const newAuthHeaders = newWs.getAuthHeaders();
          expect(newAuthHeaders?.['Authorization']).toBe('Bearer persistent-token-123');
          
          resolve();
        });

        // Trigger disconnection
        (connection as any).ws.emit('close');
      });
    });
  });

  describe('Error Handling for Secure Connections', () => {
    it('should handle TLS certificate errors gracefully', async () => {
      // Mock WebSocket that fails TLS validation
      class TLSFailureWebSocket extends EventEmitter {
        public readyState = WebSocket.CONNECTING;
        
        constructor(url: string, options?: any) {
          super();
          setTimeout(() => {
            this.readyState = WebSocket.CLOSED;
            this.emit('error', new Error('TLS certificate validation failed'));
          }, 10);
        }
        
        send() {}
        close() {
          this.readyState = WebSocket.CLOSED;
          this.emit('close');
        }
      }

      (global as any).WebSocket = TLSFailureWebSocket;

      const tlsConfig: TLSConfig = {
        enabled: true,
        rejectUnauthorized: true
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 50,
        keepAlive: true,
        tls: tlsConfig
      };

      await expect(
        connectionManager.createConnection('wss://invalid-cert.example.com', options)
      ).rejects.toThrow('TLS certificate validation failed');

      // Restore mock
      (global as any).WebSocket = MockSecureWebSocket;
    });

    it('should handle authentication failures gracefully', async () => {
      // Mock WebSocket that rejects invalid auth
      class AuthFailureWebSocket extends EventEmitter {
        public readyState = WebSocket.CONNECTING;
        
        constructor(url: string, options?: any) {
          super();
          setTimeout(() => {
            if (!options?.headers?.['Authorization'] || 
                options.headers['Authorization'] === 'Bearer invalid-token') {
              this.readyState = WebSocket.CLOSED;
              this.emit('error', new Error('Authentication failed'));
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

      (global as any).WebSocket = AuthFailureWebSocket;

      const authConfig: AuthConfig = {
        type: 'bearer',
        token: 'invalid-token'
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 50,
        keepAlive: true,
        auth: authConfig
      };

      await expect(
        connectionManager.createConnection('ws://auth-server.example.com', options)
      ).rejects.toThrow('Authentication failed');

      // Restore mock
      (global as any).WebSocket = MockSecureWebSocket;
    });
  });
});