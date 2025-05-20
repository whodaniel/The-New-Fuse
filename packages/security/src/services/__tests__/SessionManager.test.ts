import { DefaultSessionManager } from '../SessionManager.js';
import { AuthUser } from '../../types/auth.js';

describe('SessionManager', () => {
  let sessionManager: DefaultSessionManager;
  // Corrected mockUser object definition
  const mockUser: AuthUser = {
    id: '123', // Assuming ID is a string
    email: 'test@example.com',
    roles: ['user']
  };

  beforeEach(() => {
    sessionManager = new DefaultSessionManager({
      maxConcurrentSessions: 2,
      sessionTimeout: 1000, // 1 second for testing
      extendOnActivity: true
    });
  });

  // Corrected test function syntax
  it('should create a new session', async () => {
    const session = await sessionManager.createSession(
      mockUser,
      'token123',
      '127.0.0.1',
      'Mozilla/5.0'
    );

    expect(session).toBeDefined();
    expect(session.userId).toBe(mockUser.id);
    expect(session.token).toBe('token123');
    expect(session.isActive).toBe(true);
  });

  // Corrected test function syntax
  it('should validate an active session', async () => {
    const session = await sessionManager.createSession(mockUser, 'token123');
    const isValid = await sessionManager.validateSession(session.id);
    expect(isValid).toBe(true);
  });

  // Corrected test function syntax
  it('should invalidate expired sessions', async () => {
    const session = await sessionManager.createSession(mockUser, 'token123');

    // Wait for session to expire
    await new Promise(resolve => setTimeout(resolve, 1100));

    const isValid = await sessionManager.validateSession(session.id);
    expect(isValid).toBe(false);
  });

  // Corrected test function syntax
  it('should enforce maximum concurrent sessions', async () => {
    const session1 = await sessionManager.createSession(mockUser, 'token1');
    await sessionManager.createSession(mockUser, 'token2'); // Keep the call to create the session
    await sessionManager.createSession(mockUser, 'token3'); // Keep the call to create the session

    const activeSessions = await sessionManager.getActiveUserSessions(mockUser.id);
    expect(activeSessions.length).toBe(2);
    expect(activeSessions.find(s => s.id === session1.id)).toBeUndefined(); // The first session should be evicted
  });

  // Corrected test function syntax
  it('should revoke all user sessions', async () => {
    await sessionManager.createSession(mockUser, 'token1');
    await sessionManager.createSession(mockUser, 'token2');

    await sessionManager.revokeAllUserSessions(mockUser.id);
    const activeSessions = await sessionManager.getActiveUserSessions(mockUser.id);
    expect(activeSessions.length).toBe(0);
  });
});
