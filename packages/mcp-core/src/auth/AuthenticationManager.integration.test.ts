/**
 * Integration tests for AuthenticationManager with ConnectionManager
 * Tests end-to-end authentication and authorization flows
 */

import { EventEmitter } from 'events';
import { ConnectionManager } from '../client/ConnectionManager';
import { AuthenticationManager, AuthContext, AuthPolicy } from './AuthenticationManager';
import { ConnectionOptions, AuthConfig, TLSConfig } from '../interfaces/IMCPConnection';
import { MCPErrorClass, MCPErrorCode } from '../types/error';

// Mock WebSocket for testing
class MockAuthWebSocket extends EventEmitter {
  public readyState: number = WebSocket.CONNECTING;
  public static CONNECTING = 0;
  public static OPEN = 1;
  public static CLOSING = 2;
  public static CLOSED = 3;

  private authHeaders?: Record<string, string>;
  private authManager: AuthenticationManager;

  constructor(public url: string, options?: any, authManager?: AuthenticationManager) {
    super();
    
    this.authHeaders = options?.headers;
    this.authManager = authManager || new AuthenticationManager();
    
    // Simulate authentication validation
    setTimeout(async () => {
      try {
        if (this.url.includes('auth-required')) {
          await this.validateAuthentication();
        }
        
        this.readyState = WebSocket.OPEN;
        this.emit('open');
      } catch (error) {
        this.readyState = WebSocket.CLOSED;
        this.emit('error', error);
      }
    }, 20);
  }

  private async validateAuthentication(): Promise<void> {
    if (!this.authHeaders?.['Authorization']) {
      throw new Error('Authentication required');
    }

    const authHeader = this.authHeaders['Authorization'];
    let authConfig: AuthConfig;

    if (authHeader.startsWith('Bearer ')) {
      authConfig = {
        type: 'bearer',
        token: authHeader.substring(7)
      };
    } else if (authHeader.startsWith('Basic ')) {
      const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
      const [username, password] = credentials.split(':');
      authConfig = {
        type: 'basic',
        username,
        password
      };
    } else {
      throw new Error('Unsupported authentication type');
    }

    const result = await this.authManager.authenticateConnection(authConfig);
    if (!result.success) {
      throw new Error(result.error || 'Authentication failed');
    }
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

  getAuthHeaders(): Record<string, string> | undefined {
    return this.authHeaders;
  }
}

// Global auth manager for tests
let globalAuthManager: AuthenticationManager;

// Mock WebSocket constructor
function createMockWebSocket(url: string, options?: any) {
  return new MockAuthWebSocket(url, options, globalAuthManager);
}

(global as any).WebSocket = createMockWebSocket;

describe('AuthenticationManager Integration Tests', () => {
  let connectionManager: ConnectionManager;
  let authManager: AuthenticationManager;

  beforeEach(() => {
    authManager = new AuthenticationManager({
      tokenExpirationTime: 3600,
      refreshTokenExpirationTime: 86400,
      maxFailedAttempts: 3,
      lockoutDuration: 300,
      enableAuditLogging: true
    });

    globalAuthManager = authManager;

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
    authManager.removeAllListeners();
  });

  describe('End-to-End Authentication Flow', () => {
    it('should establish authenticated connection with valid credentials', async () => {
      // First, create valid credentials through basic auth
      const basicAuth: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const authResult = await authManager.authenticateConnection(basicAuth);
      expect(authResult.success).toBe(true);
      expect(authResult.accessToken).toBeDefined();

      // Use the token to establish a connection
      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: {
          type: 'bearer',
          token: authResult.accessToken!
        }
      };

      const connection = await connectionManager.createConnection(
        'ws://localhost:8080/auth-required',
        options
      );

      expect(connection.status).toBe('connected');
      
      // Verify auth headers were set correctly
      const ws = (connection as any).ws as MockAuthWebSocket;
      const headers = ws.getAuthHeaders();
      expect(headers?.['Authorization']).toBe(`Bearer ${authResult.accessToken}`);
    });

    it('should fail connection with invalid credentials', async () => {
      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 50,
        keepAlive: true,
        auth: {
          type: 'bearer',
          token: 'invalid_token'
        }
      };

      await expect(
        connectionManager.createConnection('ws://localhost:8080/auth-required', options)
      ).rejects.toThrow('Authentication failed');
    });

    it('should handle basic authentication in connection headers', async () => {
      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: {
          type: 'basic',
          username: 'testuser',
          password: 'testpass'
        }
      };

      const connection = await connectionManager.createConnection(
        'ws://localhost:8080/auth-required',
        options
      );

      expect(connection.status).toBe('connected');
      
      // Verify basic auth header was set correctly
      const ws = (connection as any).ws as MockAuthWebSocket;
      const headers = ws.getAuthHeaders();
      const expectedAuth = Buffer.from('testuser:testpass').toString('base64');
      expect(headers?.['Authorization']).toBe(`Basic ${expectedAuth}`);
    });
  });

  describe('Authorization Integration', () => {
    it('should enforce resource-based authorization policies', async () => {
      // Set up authorization policy
      const adminPolicy: AuthPolicy = {
        name: 'admin_resources',
        requiredRoles: ['admin'],
        resourcePatterns: ['/admin/.*']
      };

      authManager.addPolicy(adminPolicy);

      // Create user context
      const userContext: AuthContext = {
        userId: 'regularuser',
        roles: ['user'],
        permissions: ['read']
      };

      const adminContext: AuthContext = {
        userId: 'adminuser',
        roles: ['admin'],
        permissions: ['read', 'write', 'admin']
      };

      // Test authorization
      const userAuthorized = await authManager.authorizeRequest(
        userContext,
        '/admin/settings',
        'read'
      );

      const adminAuthorized = await authManager.authorizeRequest(
        adminContext,
        '/admin/settings',
        'read'
      );

      expect(userAuthorized).toBe(false);
      expect(adminAuthorized).toBe(true);
    });

    it('should enforce operation-based authorization policies', async () => {
      // Set up authorization policy for write operations
      const writePolicy: AuthPolicy = {
        name: 'write_operations',
        requiredPermissions: ['write'],
        operations: ['create', 'update', 'delete']
      };

      authManager.addPolicy(writePolicy);

      const readOnlyContext: AuthContext = {
        userId: 'readonly',
        roles: ['user'],
        permissions: ['read']
      };

      const writeContext: AuthContext = {
        userId: 'writer',
        roles: ['user'],
        permissions: ['read', 'write']
      };

      // Test authorization for different operations
      const readOnlyCreate = await authManager.authorizeRequest(
        readOnlyContext,
        '/data',
        'create'
      );

      const writeCreate = await authManager.authorizeRequest(
        writeContext,
        '/data',
        'create'
      );

      const readOnlyRead = await authManager.authorizeRequest(
        readOnlyContext,
        '/data',
        'read'
      );

      expect(readOnlyCreate).toBe(false);
      expect(writeCreate).toBe(true);
      expect(readOnlyRead).toBe(true); // No policy applies to read operations
    });
  });

  describe('Token Lifecycle Management', () => {
    it('should handle token refresh in connection context', async () => {
      // Initial authentication
      const basicAuth: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const authResult = await authManager.authenticateConnection(basicAuth);
      expect(authResult.success).toBe(true);
      expect(authResult.refreshToken).toBeDefined();

      // Refresh the token
      const refreshResult = await authManager.refreshToken(authResult.refreshToken!);
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.accessToken).not.toBe(authResult.accessToken);

      // Use refreshed token for connection
      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: {
          type: 'bearer',
          token: refreshResult.accessToken!
        }
      };

      const connection = await connectionManager.createConnection(
        'ws://localhost:8080/auth-required',
        options
      );

      expect(connection.status).toBe('connected');
    });

    it('should handle token revocation', async () => {
      // Initial authentication
      const basicAuth: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const authResult = await authManager.authenticateConnection(basicAuth);
      expect(authResult.success).toBe(true);

      // Revoke the token
      await authManager.revokeToken(authResult.accessToken!);

      // Try to use revoked token for connection
      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 1,
        retryDelay: 50,
        keepAlive: true,
        auth: {
          type: 'bearer',
          token: authResult.accessToken!
        }
      };

      await expect(
        connectionManager.createConnection('ws://localhost:8080/auth-required', options)
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('Security Metrics Integration', () => {
    it('should track authentication metrics across connections', async () => {
      // Create multiple authenticated connections
      const users = ['user1', 'user2', 'user3'];
      const connections = [];

      for (const username of users) {
        const basicAuth: AuthConfig = {
          type: 'basic',
          username,
          password: 'testpass'
        };

        const authResult = await authManager.authenticateConnection(basicAuth);
        expect(authResult.success).toBe(true);

        const options: ConnectionOptions = {
          timeout: 5000,
          retryAttempts: 2,
          retryDelay: 100,
          keepAlive: true,
          auth: {
            type: 'bearer',
            token: authResult.accessToken!
          }
        };

        const connection = await connectionManager.createConnection(
          `ws://localhost:808${users.indexOf(username)}`,
          options
        );

        connections.push(connection);
      }

      // Check authentication statistics
      const authStats = authManager.getAuthStatistics();
      expect(authStats.activeTokens).toBeGreaterThanOrEqual(6); // 3 access + 3 refresh tokens
      expect(authStats.successfulLogins24h).toBe(3);

      // Check connection security metrics
      const securityMetrics = connectionManager.getSecurityMetrics();
      expect(securityMetrics.security.authenticatedConnections).toBe(3);
      expect(securityMetrics.security.authenticationPercentage).toBe(100);
    });

    it('should track failed authentication attempts', async () => {
      // Make some failed authentication attempts
      const failedAttempts = 3;
      
      for (let i = 0; i < failedAttempts; i++) {
        const options: ConnectionOptions = {
          timeout: 5000,
          retryAttempts: 1,
          retryDelay: 50,
          keepAlive: true,
          auth: {
            type: 'bearer',
            token: `invalid_token_${i}`
          }
        };

        try {
          await connectionManager.createConnection(
            `ws://localhost:8080/auth-required`,
            options
          );
        } catch (error) {
          // Expected to fail
        }
      }

      // Check authentication statistics
      const authStats = authManager.getAuthStatistics();
      expect(authStats.failedLogins24h).toBe(failedAttempts);

      // Check audit events
      const auditEvents = authManager.getAuditEvents(failedAttempts);
      const failedEvents = auditEvents.filter(event => 
        event.type === 'access_denied' && !event.success
      );
      expect(failedEvents.length).toBe(failedAttempts);
    });
  });

  describe('Combined TLS and Authentication', () => {
    it('should establish secure authenticated connection', async () => {
      // Create authenticated user
      const basicAuth: AuthConfig = {
        type: 'basic',
        username: 'secureuser',
        password: 'securepass'
      };

      const authResult = await authManager.authenticateConnection(basicAuth);
      expect(authResult.success).toBe(true);

      // Create secure connection with authentication
      const tlsConfig: TLSConfig = {
        enabled: true,
        rejectUnauthorized: false
      };

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: {
          type: 'bearer',
          token: authResult.accessToken!
        },
        tls: tlsConfig,
        headers: {
          'X-Client-Version': '1.0.0'
        }
      };

      const connection = await connectionManager.createConnection(
        'https://secure.example.com/auth-required',
        options
      );

      expect(connection.status).toBe('connected');
      
      // Verify both TLS and auth were configured
      const ws = (connection as any).ws as MockAuthWebSocket;
      expect(ws.url).toBe('wss://secure.example.com/auth-required');
      
      const headers = ws.getAuthHeaders();
      expect(headers?.['Authorization']).toBe(`Bearer ${authResult.accessToken}`);
      expect(headers?.['X-Client-Version']).toBe('1.0.0');
    });
  });

  describe('Error Recovery with Authentication', () => {
    it('should maintain authentication during reconnection', async () => {
      // Create authenticated connection
      const basicAuth: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const authResult = await authManager.authenticateConnection(basicAuth);
      expect(authResult.success).toBe(true);

      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 50,
        keepAlive: true,
        auth: {
          type: 'bearer',
          token: authResult.accessToken!
        }
      };

      const connection = await connectionManager.createConnection(
        'ws://localhost:8080/auth-required',
        options
      );

      expect(connection.status).toBe('connected');

      // Simulate connection loss and wait for reconnection
      return new Promise<void>((resolve) => {
        connectionManager.on('connectionReconnected', (endpoint) => {
          expect(endpoint).toBe('ws://localhost:8080/auth-required');
          
          // Verify authentication is maintained after reconnection
          const reconnectedConnection = connectionManager.getConnection(endpoint);
          const ws = (reconnectedConnection as any).ws as MockAuthWebSocket;
          const headers = ws.getAuthHeaders();
          expect(headers?.['Authorization']).toBe(`Bearer ${authResult.accessToken}`);
          
          resolve();
        });

        // Trigger disconnection
        (connection as any).ws.emit('close');
      });
    });
  });

  describe('Audit Trail Integration', () => {
    it('should create comprehensive audit trail for connection lifecycle', async () => {
      // Clear any existing audit events
      authManager.getAuditEvents(); // This doesn't clear but we'll track new ones

      // Authenticate user
      const basicAuth: AuthConfig = {
        type: 'basic',
        username: 'audituser',
        password: 'auditpass'
      };

      const authResult = await authManager.authenticateConnection(basicAuth);
      expect(authResult.success).toBe(true);

      // Create connection
      const options: ConnectionOptions = {
        timeout: 5000,
        retryAttempts: 2,
        retryDelay: 100,
        keepAlive: true,
        auth: {
          type: 'bearer',
          token: authResult.accessToken!
        }
      };

      const connection = await connectionManager.createConnection(
        'ws://localhost:8080/auth-required',
        options
      );

      // Refresh token
      await authManager.refreshToken(authResult.refreshToken!);

      // Test authorization
      const context: AuthContext = {
        userId: 'audituser',
        roles: ['user'],
        permissions: ['read']
      };

      await authManager.authorizeRequest(context, '/test/resource', 'read');

      // Revoke token
      await authManager.revokeToken(authResult.accessToken!);

      // Check audit trail
      const auditEvents = authManager.getAuditEvents();
      
      const loginEvents = auditEvents.filter(e => e.type === 'login');
      const refreshEvents = auditEvents.filter(e => e.type === 'token_refresh');
      const logoutEvents = auditEvents.filter(e => e.type === 'logout');

      expect(loginEvents.length).toBeGreaterThan(0);
      expect(refreshEvents.length).toBeGreaterThan(0);
      expect(logoutEvents.length).toBeGreaterThan(0);

      // Verify event details
      const loginEvent = loginEvents.find(e => e.userId === 'audituser');
      expect(loginEvent).toBeDefined();
      expect(loginEvent!.success).toBe(true);
    });
  });
});