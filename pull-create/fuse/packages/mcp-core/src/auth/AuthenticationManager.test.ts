/**
 * Unit tests for AuthenticationManager
 */

import { AuthenticationManager, AuthResult, AuthContext, AuthPolicy } from './AuthenticationManager';
import { AuthConfig } from '../interfaces/IMCPConnection';
import { MCPErrorClass, MCPErrorCode } from '../types/error';

describe('AuthenticationManager', () => {
  let authManager: AuthenticationManager;

  beforeEach(() => {
    authManager = new AuthenticationManager({
      tokenExpirationTime: 3600,
      refreshTokenExpirationTime: 86400,
      maxFailedAttempts: 3,
      lockoutDuration: 300,
      enableAuditLogging: true
    });
  });

  afterEach(() => {
    // Clean up any timers or resources
    authManager.removeAllListeners();
  });

  describe('Bearer Token Authentication', () => {
    it('should reject authentication with missing bearer token', async () => {
      const credentials: AuthConfig = {
        type: 'bearer'
        // No token provided
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Bearer token is required');
    });

    it('should reject authentication with invalid bearer token', async () => {
      const credentials: AuthConfig = {
        type: 'bearer',
        token: 'invalid_token'
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid bearer token');
    });

    it('should accept valid bearer token after basic auth creates it', async () => {
      // First authenticate with basic auth to create tokens
      const basicCredentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const basicResult = await authManager.authenticateConnection(basicCredentials);
      expect(basicResult.success).toBe(true);
      expect(basicResult.accessToken).toBeDefined();

      // Now use the bearer token
      const bearerCredentials: AuthConfig = {
        type: 'bearer',
        token: basicResult.accessToken!
      };

      const bearerResult = await authManager.authenticateConnection(bearerCredentials);
      
      expect(bearerResult.success).toBe(true);
      expect(bearerResult.userId).toBe('testuser');
    });
  });

  describe('Basic Authentication', () => {
    it('should reject authentication with missing credentials', async () => {
      const credentials: AuthConfig = {
        type: 'basic'
        // No username/password provided
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Username and password are required');
    });

    it('should authenticate successfully with valid credentials', async () => {
      const credentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(true);
      expect(result.userId).toBe('testuser');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(result.roles).toEqual(['user']);
      expect(result.permissions).toEqual(['read', 'write']);
    });

    it('should reject authentication with empty credentials', async () => {
      const credentials: AuthConfig = {
        type: 'basic',
        username: '',
        password: ''
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid username or password');
    });
  });

  describe('OAuth Authentication', () => {
    it('should reject authentication with missing OAuth token', async () => {
      const credentials: AuthConfig = {
        type: 'oauth'
        // No token provided
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('OAuth token is required');
    });

    it('should authenticate successfully with valid OAuth token', async () => {
      const credentials: AuthConfig = {
        type: 'oauth',
        token: 'oauth_valid_token'
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(true);
      expect(result.userId).toBe('oauth_user');
      expect(result.roles).toEqual(['user']);
      expect(result.permissions).toEqual(['read', 'write']);
    });

    it('should reject authentication with invalid OAuth token', async () => {
      const credentials: AuthConfig = {
        type: 'oauth',
        token: 'invalid_oauth_token'
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid OAuth token');
    });
  });

  describe('API Key Authentication', () => {
    it('should reject authentication with missing API key', async () => {
      const credentials: AuthConfig = {
        type: 'api_key'
        // No apiKey provided
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('API key is required');
    });

    it('should reject authentication with invalid API key', async () => {
      const credentials: AuthConfig = {
        type: 'api_key',
        apiKey: 'invalid_api_key'
      };

      const result = await authManager.authenticateConnection(credentials);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid API key');
    });
  });

  describe('Token Management', () => {
    it('should refresh access token successfully', async () => {
      // First authenticate to get tokens
      const credentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const authResult = await authManager.authenticateConnection(credentials);
      expect(authResult.success).toBe(true);
      expect(authResult.refreshToken).toBeDefined();

      // Refresh the token
      const refreshResult = await authManager.refreshToken(authResult.refreshToken!);
      
      expect(refreshResult.success).toBe(true);
      expect(refreshResult.userId).toBe('testuser');
      expect(refreshResult.accessToken).toBeDefined();
      expect(refreshResult.accessToken).not.toBe(authResult.accessToken);
    });

    it('should reject refresh with invalid refresh token', async () => {
      await expect(
        authManager.refreshToken('invalid_refresh_token')
      ).rejects.toThrow('Invalid refresh token');
    });

    it('should revoke token successfully', async () => {
      // First authenticate to get tokens
      const credentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const authResult = await authManager.authenticateConnection(credentials);
      expect(authResult.success).toBe(true);

      // Revoke the token
      await authManager.revokeToken(authResult.accessToken!);

      // Try to use the revoked token
      const bearerCredentials: AuthConfig = {
        type: 'bearer',
        token: authResult.accessToken!
      };

      const result = await authManager.authenticateConnection(bearerCredentials);
      expect(result.success).toBe(false);
    });
  });

  describe('Authorization Policies', () => {
    it('should authorize request when no policies are defined', async () => {
      const context: AuthContext = {
        userId: 'testuser',
        roles: ['user'],
        permissions: ['read']
      };

      const authorized = await authManager.authorizeRequest(context, '/test/resource', 'read');
      
      expect(authorized).toBe(true);
    });

    it('should authorize request when user has required role', async () => {
      const policy: AuthPolicy = {
        name: 'admin_only',
        requiredRoles: ['admin'],
        resourcePatterns: ['/admin/.*']
      };

      authManager.addPolicy(policy);

      const context: AuthContext = {
        userId: 'adminuser',
        roles: ['admin'],
        permissions: ['read', 'write']
      };

      const authorized = await authManager.authorizeRequest(context, '/admin/settings', 'read');
      
      expect(authorized).toBe(true);
    });

    it('should deny request when user lacks required role', async () => {
      const policy: AuthPolicy = {
        name: 'admin_only',
        requiredRoles: ['admin'],
        resourcePatterns: ['/admin/.*']
      };

      authManager.addPolicy(policy);

      const context: AuthContext = {
        userId: 'regularuser',
        roles: ['user'],
        permissions: ['read']
      };

      const authorized = await authManager.authorizeRequest(context, '/admin/settings', 'read');
      
      expect(authorized).toBe(false);
    });

    it('should authorize request when user has required permission', async () => {
      const policy: AuthPolicy = {
        name: 'write_access',
        requiredPermissions: ['write'],
        operations: ['create', 'update', 'delete']
      };

      authManager.addPolicy(policy);

      const context: AuthContext = {
        userId: 'testuser',
        roles: ['user'],
        permissions: ['read', 'write']
      };

      const authorized = await authManager.authorizeRequest(context, '/data', 'create');
      
      expect(authorized).toBe(true);
    });

    it('should deny request when user lacks required permission', async () => {
      const policy: AuthPolicy = {
        name: 'write_access',
        requiredPermissions: ['write'],
        operations: ['create', 'update', 'delete']
      };

      authManager.addPolicy(policy);

      const context: AuthContext = {
        userId: 'testuser',
        roles: ['user'],
        permissions: ['read']
      };

      const authorized = await authManager.authorizeRequest(context, '/data', 'create');
      
      expect(authorized).toBe(false);
    });

    it('should use custom evaluation function', async () => {
      const policy: AuthPolicy = {
        name: 'custom_policy',
        evaluate: async (context: AuthContext) => {
          return context.userId === 'special_user';
        }
      };

      authManager.addPolicy(policy);

      const authorizedContext: AuthContext = {
        userId: 'special_user',
        roles: ['user'],
        permissions: ['read']
      };

      const unauthorizedContext: AuthContext = {
        userId: 'regular_user',
        roles: ['user'],
        permissions: ['read']
      };

      const authorized1 = await authManager.authorizeRequest(authorizedContext, '/test', 'read');
      const authorized2 = await authManager.authorizeRequest(unauthorizedContext, '/test', 'read');
      
      expect(authorized1).toBe(true);
      expect(authorized2).toBe(false);
    });

    it('should remove policy successfully', async () => {
      const policy: AuthPolicy = {
        name: 'test_policy',
        requiredRoles: ['admin']
      };

      authManager.addPolicy(policy);
      authManager.removePolicy('test_policy');

      const context: AuthContext = {
        userId: 'testuser',
        roles: ['user'],
        permissions: ['read']
      };

      // Should be authorized since policy was removed
      const authorized = await authManager.authorizeRequest(context, '/test', 'read');
      
      expect(authorized).toBe(true);
    });
  });

  describe('Account Lockout', () => {
    it('should lock account after max failed attempts', async () => {
      const credentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'wrongpass'
      };

      // Make failed attempts up to the limit
      for (let i = 0; i < 3; i++) {
        const result = await authManager.authenticateConnection(credentials);
        expect(result.success).toBe(false);
      }

      // Next attempt should be blocked due to lockout
      await expect(
        authManager.authenticateConnection(credentials)
      ).rejects.toThrow('Account is locked due to too many failed attempts');
    });

    it('should reset failed attempts after successful authentication', async () => {
      // Make some failed attempts
      const wrongCredentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'wrongpass'
      };

      for (let i = 0; i < 2; i++) {
        const result = await authManager.authenticateConnection(wrongCredentials);
        expect(result.success).toBe(false);
      }

      // Successful authentication should reset counter
      const correctCredentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const result = await authManager.authenticateConnection(correctCredentials);
      expect(result.success).toBe(true);

      // Should be able to make failed attempts again
      const result2 = await authManager.authenticateConnection(wrongCredentials);
      expect(result2.success).toBe(false);
    });
  });

  describe('Audit Logging', () => {
    it('should record successful login events', async () => {
      const credentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      await authManager.authenticateConnection(credentials);

      const auditEvents = authManager.getAuditEvents(1);
      
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0].type).toBe('login');
      expect(auditEvents[0].userId).toBe('testuser');
      expect(auditEvents[0].success).toBe(true);
    });

    it('should record failed authentication events', async () => {
      const credentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'wrongpass'
      };

      await authManager.authenticateConnection(credentials);

      const auditEvents = authManager.getAuditEvents(1);
      
      expect(auditEvents).toHaveLength(1);
      expect(auditEvents[0].type).toBe('access_denied');
      expect(auditEvents[0].userId).toBe('testuser');
      expect(auditEvents[0].success).toBe(false);
    });

    it('should record token refresh events', async () => {
      // First authenticate to get tokens
      const credentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      const authResult = await authManager.authenticateConnection(credentials);
      
      // Clear previous events
      authManager.getAuditEvents(); // This doesn't clear, but we'll check the latest

      // Refresh token
      await authManager.refreshToken(authResult.refreshToken!);

      const auditEvents = authManager.getAuditEvents(1);
      
      expect(auditEvents[0].type).toBe('token_refresh');
      expect(auditEvents[0].userId).toBe('testuser');
      expect(auditEvents[0].success).toBe(true);
    });

    it('should record policy violation events', async () => {
      const policy: AuthPolicy = {
        name: 'admin_only',
        requiredRoles: ['admin']
      };

      authManager.addPolicy(policy);

      const context: AuthContext = {
        userId: 'testuser',
        roles: ['user'],
        permissions: ['read']
      };

      await authManager.authorizeRequest(context, '/admin', 'read');

      const auditEvents = authManager.getAuditEvents(1);
      
      expect(auditEvents[0].type).toBe('policy_violation');
      expect(auditEvents[0].userId).toBe('testuser');
      expect(auditEvents[0].success).toBe(false);
      expect(auditEvents[0].error).toContain('Policy violation: admin_only');
    });
  });

  describe('Statistics', () => {
    it('should provide authentication statistics', async () => {
      // Create some authentication activity
      const credentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      await authManager.authenticateConnection(credentials);

      const stats = authManager.getAuthStatistics();
      
      expect(stats.activeTokens).toBeGreaterThan(0);
      expect(stats.successfulLogins24h).toBe(1);
      expect(stats.totalAuditEvents).toBeGreaterThan(0);
      expect(stats.tokenTypes.access).toBeGreaterThan(0);
      expect(stats.tokenTypes.refresh).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for unsupported authentication type', async () => {
      const credentials = {
        type: 'unsupported' as any
      };

      await expect(
        authManager.authenticateConnection(credentials)
      ).rejects.toThrow('Unsupported authentication type: unsupported');
    });

    it('should handle authorization errors gracefully', async () => {
      const policy: AuthPolicy = {
        name: 'error_policy',
        evaluate: async () => {
          throw new Error('Policy evaluation error');
        }
      };

      authManager.addPolicy(policy);

      const context: AuthContext = {
        userId: 'testuser',
        roles: ['user'],
        permissions: ['read']
      };

      const authorized = await authManager.authorizeRequest(context, '/test', 'read');
      
      expect(authorized).toBe(false);
    });
  });

  describe('Token Cleanup', () => {
    it('should clean up expired tokens', (done) => {
      // Create auth manager with very short token expiration
      const shortExpiryAuthManager = new AuthenticationManager({
        tokenExpirationTime: 1, // 1 second
        enableAuditLogging: false
      });

      shortExpiryAuthManager.on('tokensExpired', (count) => {
        expect(count).toBeGreaterThan(0);
        shortExpiryAuthManager.removeAllListeners();
        done();
      });

      // Create a token that will expire quickly
      const credentials: AuthConfig = {
        type: 'basic',
        username: 'testuser',
        password: 'testpass'
      };

      shortExpiryAuthManager.authenticateConnection(credentials);
    });
  });
});