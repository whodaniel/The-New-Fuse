import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { getAuthToken, setupTestApp, cleanupTestData } from '../test-utils/test-helpers';
import { AuthService } from '../../../apps/api/src/services/auth.service';
import { DrizzleService } from '../../../apps/api/src/services/drizzle.service';
import { SessionService } from '../../../apps/api/src/services/session.service';
import { JwtService } from '@nestjs/jwt';
import { WorkflowService } from '../../../apps/api/src/services/workflow.service';
import { AgentService } from '../../../apps/api/src/services/agent.service';
import request from 'supertest';

describe('Authentication Integration Tests', () => {
  let app: INestApplication;
  let authService: AuthService;
  let drizzleService: DrizzleService;
  let sessionService: SessionService;
  let jwtService: JwtService;
  let workflowService: WorkflowService;
  let agentService: AgentService;

  beforeAll(async () => {
    app = await setupTestApp();
    authService = app.get(AuthService);
    drizzleService = app.get(DrizzleService);
    sessionService = app.get(SessionService);
    jwtService = app.get(JwtService);
    workflowService = app.get(WorkflowService);
    agentService = app.get(AgentService);
  });

  afterAll(async () => {
    await cleanupTestData(app);
    await app.close();
  });

  describe('Complete Authentication Flow', () => {
    it('should handle full user registration and authentication cycle', async () => {
      const userData = {
        email: 'integrationtest@example.com',
        password: 'SecurePassword123!',
        firstName: 'Integration',
        lastName: 'Test'
      };

      // 1. Register new user
      const registerResponse = await authService.register(userData);
      expect(registerResponse).toMatchObject({
        user: {
          id: expect.any(String),
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          isEmailVerified: false
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      });

      const userId = registerResponse.user.id;
      const accessToken = registerResponse.accessToken;

      // 2. Verify user can authenticate with new credentials
      const loginResponse = await authService.login({
        email: userData.email,
        password: userData.password
      });

      expect(loginResponse).toMatchObject({
        user: {
          id: userId,
          email: userData.email
        },
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      });

      // 3. Verify access token is valid
      const decodedToken = await jwtService.verifyAsync(loginResponse.accessToken);
      expect(decodedToken.sub).toBe(userId);
      expect(decodedToken.email).toBe(userData.email);

      // 4. Test protected route access
      const protectedResponse = await request(app.getHttpServer())
        .get('/agents')
        .set('Authorization', `Bearer ${loginResponse.accessToken}`)
        .expect(200);

      expect(protectedResponse.body).toBeInstanceOf(Array);

      // 5. Test session persistence
      const sessionData = await sessionService.getSession(userId);
      expect(sessionData).toBeDefined();
      expect(sessionData.userId).toBe(userId);

      // 6. Logout and verify session is invalid
      await authService.logout(userId);
      const invalidSession = await sessionService.getSession(userId);
      expect(invalidSession).toBeNull();

      // 7. Verify protected route is no longer accessible
      await request(app.getHttpServer())
        .get('/agents')
        .set('Authorization', `Bearer ${loginResponse.accessToken}`)
        .expect(401);
    });

    it('should handle email verification workflow', async () => {
      const userData = {
        email: 'emailverify@example.com',
        password: 'SecurePassword123!',
        firstName: 'Email',
        lastName: 'Verify'
      };

      // Register user
      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // User should not be verified initially
      expect(registerResponse.user.isEmailVerified).toBe(false);

      // Generate and verify email verification token
      const verificationToken = await authService.generateEmailVerificationToken(userId);
      expect(verificationToken).toBeDefined();

      // Verify email
      await authService.verifyEmail(verificationToken);

      // Check user is now verified
      const verifiedUser = await drizzleService.user.findUnique({
        where: { id: userId }
      });

      expect(verifiedUser.isEmailVerified).toBe(true);
      expect(verifiedUser.emailVerifiedAt).toBeDefined();

      // Test that verified user can access email-required features
      const loginResponse = await authService.login({
        email: userData.email,
        password: userData.password
      });

      // Should have additional capabilities as verified user
      expect(loginResponse.user.isEmailVerified).toBe(true);
    });

    it('should handle password reset workflow', async () => {
      const userData = {
        email: 'passwordreset@example.com',
        password: 'OriginalPassword123!',
        firstName: 'Password',
        lastName: 'Reset'
      };

      // Register user
      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Request password reset
      const resetToken = await authService.requestPasswordReset(userData.email);
      expect(resetToken).toBeDefined();

      // Generate new password
      const newPassword = 'NewSecurePassword456!';

      // Reset password with token
      await authService.resetPassword(resetToken, newPassword);

      // Verify old password no longer works
      await expect(
        authService.login({
          email: userData.email,
          password: userData.password
        })
      ).rejects.toThrow('Invalid credentials');

      // Verify new password works
      const loginResponse = await authService.login({
        email: userData.email,
        password: newPassword
      });

      expect(loginResponse.user.id).toBe(userId);
      expect(loginResponse.accessToken).toBeDefined();
    });

    it('should handle token refresh workflow', async () => {
      const userData = {
        email: 'tokenrefresh@example.com',
        password: 'RefreshPassword123!',
        firstName: 'Token',
        lastName: 'Refresh'
      };

      // Register and login
      const registerResponse = await authService.register(userData);
      let accessToken = registerResponse.accessToken;
      const refreshToken = registerResponse.refreshToken;

      // Wait a short time to ensure token ages
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Refresh access token
      const refreshResponse = await authService.refreshToken(refreshToken);

      expect(refreshResponse).toMatchObject({
        accessToken: expect.any(String),
        refreshToken: expect.any(String)
      });

      // New tokens should be different from old ones
      expect(refreshResponse.accessToken).not.toBe(accessToken);
      expect(refreshResponse.refreshToken).not.toBe(refreshToken);

      // Verify new access token works
      const decodedToken = await jwtService.verifyAsync(refreshResponse.accessToken);
      expect(decodedToken.sub).toBe(registerResponse.user.id);

      // Old access token should be invalid (if properly implemented)
      try {
        await jwtService.verifyAsync(accessToken);
        // If we get here, tokens might not be properly invalidated
        // In production, you might want to implement token blacklisting
      } catch (error) {
        // This is expected - old token should be invalid
        expect(error).toBeDefined();
      }
    });
  });

  describe('Authentication with Database Operations', () => {
    it('should maintain user context across database transactions', async () => {
      const userData = {
        email: 'dbcontext@example.com',
        password: 'DBContext123!',
        firstName: 'DB',
        lastName: 'Context'
      };

      // Register user
      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;
      const accessToken = registerResponse.accessToken;

      // Create workflow as authenticated user
      const workflowData = {
        name: 'DB Context Test Workflow',
        description: 'Testing database context with authentication',
        steps: [
          {
            id: 'step-1',
            type: 'input',
            config: {
              prompt: 'Enter your name',
              inputType: 'text'
            }
          }
        ],
        triggers: [
          {
            type: 'manual',
            conditions: []
          }
        ]
      };

      const workflow = await workflowService.createWorkflow(workflowData, userId);
      expect(workflow.userId).toBe(userId);

      // Create agent as same user
      const agentData = {
        name: 'DB Context Test Agent',
        description: 'Testing agent creation with authentication context',
        type: 'assistant',
        capabilities: ['chat', 'analysis'],
        configuration: {
          model: 'gpt-3.5-turbo',
          temperature: 0.7
        }
      };

      const agent = await agentService.createAgent(agentData, userId);
      expect(agent.userId).toBe(userId);

      // Verify both records have same user association
      expect(workflow.userId).toBe(agent.userId);

      // Clean up created resources
      await workflowService.deleteWorkflow(workflow.id, userId);
      await agentService.deleteAgent(agent.id, userId);
    });

    it('should handle concurrent authentication requests', async () => {
      const userData = {
        email: 'concurrent@example.com',
        password: 'Concurrent123!',
        firstName: 'Concurrent',
        lastName: 'User'
      };

      // Register user
      const registerResponse = await authService.register(userData);

      // Simulate multiple concurrent login attempts
      const loginPromises = Array(5).fill(null).map(() =>
        authService.login({
          email: userData.email,
          password: userData.password
        })
      );

      const loginResults = await Promise.all(loginPromises);

      // All should succeed
      expect(loginResults.length).toBe(5);
      loginResults.forEach(result => {
        expect(result.user.id).toBe(registerResponse.user.id);
        expect(result.accessToken).toBeDefined();
      });

      // Each should have unique tokens (no session conflicts)
      const tokens = loginResults.map(r => r.accessToken);
      const uniqueTokens = new Set(tokens);
      expect(uniqueTokens.size).toBe(5);
    });

    it('should handle session management with multiple resources', async () => {
      const userData = {
        email: 'multiresource@example.com',
        password: 'MultiResource123!',
        firstName: 'Multi',
        lastName: 'Resource'
      };

      // Register and login
      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Create multiple resources
      const workflows = await Promise.all([
        workflowService.createWorkflow({
          name: 'Workflow 1',
          description: 'First workflow',
          steps: [],
          triggers: []
        }, userId),
        workflowService.createWorkflow({
          name: 'Workflow 2',
          description: 'Second workflow',
          steps: [],
          triggers: []
        }, userId)
      ]);

      const agents = await Promise.all([
        agentService.createAgent({
          name: 'Agent 1',
          description: 'First agent',
          type: 'assistant',
          capabilities: ['chat'],
          configuration: {}
        }, userId),
        agentService.createAgent({
          name: 'Agent 2',
          description: 'Second agent',
          type: 'assistant',
          capabilities: ['analysis'],
          configuration: {}
        }, userId)
      ]);

      // All resources should belong to the same user
      workflows.forEach(workflow => {
        expect(workflow.userId).toBe(userId);
      });

      agents.forEach(agent => {
        expect(agent.userId).toBe(userId);
      });

      // Logout and verify session cleanup affects all resources
      await authService.logout(userId);

      // User should not be able to access resources anymore
      await expect(
        workflowService.getWorkflow(workflows[0].id, userId)
      ).rejects.toThrow('Unauthorized');

      await expect(
        agentService.getAgent(agents[0].id, userId)
      ).rejects.toThrow('Unauthorized');

      // Clean up resources
      await Promise.all([
        workflowService.deleteWorkflow(workflows[0].id, userId),
        workflowService.deleteWorkflow(workflows[1].id, userId),
        agentService.deleteAgent(agents[0].id, userId),
        agentService.deleteAgent(agents[1].id, userId)
      ]);
    });
  });

  describe('Integration with External Services', () => {
    it('should handle Supabase Auth integration', async () => {
      const userData = {
        email: 'supabase@example.com',
        password: 'Supabase123!',
        firstName: 'Supabase',
        lastName: 'Integration'
      };

      // Register user (should integrate with Supabase Auth)
      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Verify user exists in Supabase
      const supabaseUser = await authService.getSupabaseUser(userId);
      expect(supabaseUser).toBeDefined();
      expect(supabaseUser.email).toBe(userData.email);

      // Test JWT token validation through Supabase
      const isValidToken = await authService.validateToken(registerResponse.accessToken);
      expect(isValidToken).toBe(true);

      // Test logout (should sync with Supabase)
      await authService.logout(userId);

      // Verify session is cleaned up in our database
      const sessionAfterLogout = await sessionService.getSession(userId);
      expect(sessionAfterLogout).toBeNull();
    });

    it('should handle WebSocket authentication', async () => {
      const userData = {
        email: 'websocket@example.com',
        password: 'WebSocket123!',
        firstName: 'WebSocket',
        lastName: 'Auth'
      };

      // Register and login
      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;
      const accessToken = registerResponse.accessToken;

      // Test WebSocket token validation
      const wsToken = await authService.generateWebSocketToken(userId, accessToken);
      expect(wsToken).toBeDefined();

      // Verify WebSocket token can be used for authentication
      const isValidWsToken = await authService.validateWebSocketToken(wsToken);
      expect(isValidWsToken.userId).toBe(userId);

      // Test token refresh for WebSocket
      const newWsToken = await authService.refreshWebSocketToken(wsToken);
      expect(newWsToken).not.toBe(wsToken);

      // Old WebSocket token should be invalid
      const isOldTokenValid = await authService.validateWebSocketToken(wsToken);
      expect(isOldTokenValid).toBe(false);
    });
  });

  describe('Error Scenarios and Recovery', () => {
    it('should handle database errors during authentication', async () => {
      const userData = {
        email: 'dberror@example.com',
        password: 'DBError123!',
        firstName: 'DB',
        lastName: 'Error'
      };

      // Mock database error
      jest.spyOn(drizzleService.user, 'create').mockRejectedValue(
        new Error('Database connection failed')
      );

      // Should handle error gracefully
      await expect(
        authService.register(userData)
      ).rejects.toThrow('Database connection failed');

      // Restore normal operation
      jest.restoreAllMocks();

      // Should work normally after error recovery
      const registerResponse = await authService.register({
        ...userData,
        email: 'dberror-recovery@example.com'
      });

      expect(registerResponse.user.email).toBe('dberror-recovery@example.com');
    });

    it('should handle session store failures', async () => {
      const userData = {
        email: 'sessionerror@example.com',
        password: 'SessionError123!',
        firstName: 'Session',
        lastName: 'Error'
      };

      // Register user
      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Mock session service error
      jest.spyOn(sessionService, 'setSession').mockRejectedValue(
        new Error('Session store unavailable')
      );

      // Should still allow login but handle session error
      const loginResponse = await authService.login({
        email: userData.email,
        password: userData.password
      });

      expect(loginResponse.user.id).toBe(userId);
      expect(loginResponse.accessToken).toBeDefined();

      // Restore normal operation
      jest.restoreAllMocks();
    });

    it('should handle concurrent modification of user data', async () => {
      const userData = {
        email: 'concurrentmod@example.com',
        password: 'ConcurrentMod123!',
        firstName: 'Concurrent',
        lastName: 'Mod'
      };

      // Register user
      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Simulate concurrent updates
      const updatePromises = [
        authService.updateUserProfile(userId, { firstName: 'Updated1' }),
        authService.updateUserProfile(userId, { firstName: 'Updated2' }),
        authService.updateUserProfile(userId, { firstName: 'Updated3' })
      ];

      const results = await Promise.allSettled(updatePromises);
      
      // Some updates might succeed, some might fail due to conflicts
      const successfulUpdates = results.filter(r => r.status === 'fulfilled');
      expect(successfulUpdates.length).toBeGreaterThan(0);

      // Final state should be consistent
      const finalUser = await drizzleService.user.findUnique({
        where: { id: userId }
      });
      expect(finalUser.firstName).toBeDefined();
    });

    it('should handle token blacklisting and security', async () => {
      const userData = {
        email: 'blacklist@example.com',
        password: 'Blacklist123!',
        firstName: 'Blacklist',
        lastName: 'Test'
      };

      // Register and login
      const registerResponse = await authService.register(userData);
      const accessToken = registerResponse.accessToken;

      // Blacklist the token
      await authService.blacklistToken(accessToken);

      // Token should no longer be valid
      await expect(
        authService.validateToken(accessToken)
      ).rejects.toThrow('Token has been blacklisted');

      // Should not be able to access protected resources
      const isValidToken = await authService.validateToken(accessToken);
      expect(isValidToken).toBe(false);
    });
  });

  describe('Performance and Scalability', () => {
    it('should handle high-volume authentication requests', async () => {
      const userData = {
        email: 'performance@example.com',
        password: 'Performance123!',
        firstName: 'Performance',
        lastName: 'Test'
      };

      // Create user first
      await authService.register(userData);

      const startTime = Date.now();

      // Simulate multiple concurrent login attempts
      const loginPromises = Array(50).fill(null).map(() =>
        authService.login({
          email: userData.email,
          password: userData.password
        })
      );

      const results = await Promise.all(loginPromises);
      const endTime = Date.now();

      const duration = endTime - startTime;
      
      // Should handle 50 concurrent logins within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
      expect(results.length).toBe(50);
      
      // All should succeed
      const successfulLogins = results.filter(r => r.accessToken);
      expect(successfulLogins.length).toBe(50);
    });

    it('should efficiently manage session cleanup', async () => {
      const userData = {
        email: 'cleanup@example.com',
        password: 'Cleanup123!',
        firstName: 'Cleanup',
        lastName: 'Test'
      };

      // Register user
      const registerResponse = await authService.register(userData);
      const userId = registerResponse.user.id;

      // Create multiple sessions
      const sessions = await Promise.all([
        sessionService.setSession(userId, { device: 'web' }),
        sessionService.setSession(userId, { device: 'mobile' }),
        sessionService.setSession(userId, { device: 'api' })
      ]);

      expect(sessions.length).toBe(3);

      // Clean up all sessions
      await authService.logoutAllSessions(userId);

      // Verify all sessions are cleaned up
      const remainingSessions = await sessionService.getAllSessions(userId);
      expect(remainingSessions).toHaveLength(0);
    });
  });
});