# Session Middleware Documentation

## Overview
The session middleware provides secure session management for Express applications using The New Fuse security framework.

## Features
- Automatic session validation
- Session refresh handling
- User context attachment
- TypeScript support
- Error handling
- Security best practices

## Installation

```bash
npm install @your-org/security
```

## Basic Usage

```typescript
import { sessionMiddleware, requireSession } from '@your-org/security';
import express from 'express';

const app = express();

// Apply middleware
app.use(sessionMiddleware);

// Protect routes
app.use('/api', requireSession, apiRoutes);
```

## Configuration

### Session Options
```typescript
interface SessionOptions {
  cookieName?: string;
  cookieOptions?: CookieOptions;
  sessionDuration?: number;
  refreshThreshold?: number;
}

// Usage
app.use(sessionMiddleware({
  cookieName: 'my-session',
  sessionDuration: 3600,
  refreshThreshold: 300
}));
```

## Middleware Functions

### sessionMiddleware
- Validates incoming session tokens
- Refreshes sessions when needed
- Attaches session data to request

### requireSession
- Ensures valid session exists
- Returns 401 if no session
- TypeScript friendly

## Type Definitions

```typescript
interface SessionRequest extends Request {
  session?: Session;
  user?: AuthUser;
}

interface Session {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  metadata?: Record<string, unknown>;
}
```

## Security Considerations
- CSRF protection
- XSS prevention
- Session fixation protection
- Secure cookie settings
- Rate limiting

## Best Practices
1. Always use HTTPS
2. Implement proper error handling
3. Set appropriate timeouts
4. Monitor session activity
5. Regular security audits

## Examples

### Basic Authentication Flow
```typescript
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await authenticate(email, password);
  const session = await sessionManager.createSession(user);
  res.json({ sessionId: session.id });
});
```

### Protected Route
```typescript
app.get('/profile', requireSession, async (req: SessionRequest, res) => {
  const { user } = req;
  const profile = await getUserProfile(user.id);
  res.json(profile);
});
```

### WebSocket Authentication
```typescript
wss.on('connection', async (ws, req) => {
  const sessionId = req.headers['x-session-id'];
  const session = await sessionManager.validateSession(sessionId);
  if (!session) {
    ws.close(1008, 'Invalid session');
    return;
  }
  // Handle connection...
});
```

### Session Refresh Handling
```typescript
app.use(sessionMiddleware({
  refreshThreshold: 600, // 10 minutes before expiry
  onRefresh: async (session, req, res) => {
    // Custom logic when session is refreshed
    await logSessionRefresh(session.id, req.ip);
    
    // You can modify the refreshed session if needed
    return {
      ...session,
      metadata: {
        ...session.metadata,
        lastRefreshed: new Date()
      }
    };
  }
}));
```

### Custom Session Validation
```typescript
app.use(sessionMiddleware({
  validator: async (sessionId, req) => {
    // Custom validation logic
    const session = await sessionStore.get(sessionId);
    if (!session) return null;
    
    // Check if user is still active
    const user = await userService.findById(session.userId);
    if (user.status !== 'active') return null;
    
    // Check for suspicious activity
    const isValidIP = await securityService.validateIPForUser(user.id, req.ip);
    if (!isValidIP) {
      await securityService.reportSuspiciousActivity(user.id, req.ip);
      return null;
    }
    
    return session;
  }
}));
```

### Multi-Factor Authentication Integration
```typescript
app.use(sessionMiddleware({
  sessionTransformer: async (session, req) => {
    // Check if MFA is required but not completed
    if (session.metadata?.mfaRequired && !session.metadata?.mfaVerified) {
      // Limit session capabilities
      return {
        ...session,
        permissions: ['mfa:complete'],
        restrictedUntilMfa: true
      };
    }
    return session;
  }
}));

// MFA verification endpoint
app.post('/verify-mfa', requireSession, async (req: SessionRequest, res) => {
  const { code } = req.body;
  const { user, session } = req;
  
  const isValid = await mfaService.verifyCode(user.id, code);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid MFA code' });
  }
  
  // Update session to mark MFA as verified
  await sessionManager.updateSession(session.id, {
    metadata: {
      ...session.metadata,
      mfaVerified: true
    }
  });
  
  res.json({ success: true });
});
```

### Error Handling
```typescript
app.use(sessionMiddleware({
  onError: (error, req, res, next) => {
    // Log the error
    logger.error('Session error', { error, requestId: req.id });
    
    // Different handling based on error type
    if (error.code === 'SESSION_EXPIRED') {
      return res.status(401).json({
        error: 'Your session has expired. Please log in again.',
        code: 'SESSION_EXPIRED'
      });
    }
    
    if (error.code === 'SESSION_INVALID') {
      return res.status(401).json({
        error: 'Invalid session. Please log in again.',
        code: 'SESSION_INVALID'
      });
    }
    
    // Default error handling
    next(error);
  }
}));
```

### Session Revocation
```typescript
// Logout endpoint
app.post('/logout', requireSession, async (req: SessionRequest, res) => {
  await sessionManager.revokeSession(req.session.id);
  res.clearCookie('session-token');
  res.json({ success: true });
});

// Revoke all user sessions (e.g., on password change)
app.post('/revoke-all-sessions', requireSession, async (req: SessionRequest, res) => {
  await sessionManager.revokeAllUserSessions(req.user.id, {
    exceptSessionId: req.session.id // Keep current session active
  });
  res.json({ success: true });
});
```

## Advanced Components

### Role-Based Access Control
```typescript
// Define middleware for role-based access
const requireRole = (role: string) => {
  return (req: SessionRequest, res: Response, next: NextFunction) => {
    if (!req.session || !req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    if (!req.user.roles.includes(role)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }
    
    next();
  };
};

// Apply to routes
app.use('/admin', requireSession, requireRole('admin'), adminRoutes);
app.use('/reports', requireSession, requireRole('analyst'), reportRoutes);
```

### Session Monitoring and Analytics
```typescript
app.use(sessionMiddleware({
  onSessionAccess: async (session, req) => {
    // Record session activity for monitoring
    await sessionAnalytics.recordAccess({
      sessionId: session.id,
      userId: session.userId,
      timestamp: new Date(),
      endpoint: req.path,
      method: req.method,
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip
    });
    
    // Check for suspicious patterns
    const isSuspicious = await securityMonitor.checkActivity(session.userId, req.ip);
    if (isSuspicious) {
      await notificationService.alertSecurityTeam({
        userId: session.userId,
        sessionId: session.id,
        reason: 'Suspicious activity pattern detected'
      });
    }
  }
}));
```

### Mobile App Integration
```typescript
// API token authentication for mobile apps
app.use('/api/mobile', async (req, res, next) => {
  const apiToken = req.headers['x-api-token'];
  if (!apiToken) {
    return res.status(401).json({ error: 'API token required' });
  }
  
  try {
    // Validate API token and create session
    const tokenData = await tokenService.validateToken(apiToken);
    if (!tokenData) {
      return res.status(401).json({ error: 'Invalid API token' });
    }
    
    // Create or retrieve session
    const session = await sessionManager.getOrCreateSessionFromToken(tokenData);
    
    // Attach to request
    req.session = session;
    req.user = await userService.findById(session.userId);
    
    next();
  } catch (error) {
    next(error);
  }
});

// Refresh token endpoint for mobile clients
app.post('/api/refresh-token', async (req, res) => {
  const { refreshToken } = req.body;
  
  try {
    const newTokens = await tokenService.refreshTokenPair(refreshToken);
    res.json({
      accessToken: newTokens.accessToken,
      refreshToken: newTokens.refreshToken,
      expiresIn: newTokens.expiresIn
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});
```

### Distributed Session Management
```typescript
// Configure Redis session store
const redisStore = new RedisSessionStore({
  client: redisClient,
  prefix: 'session:',
  ttl: 86400 // 24 hours in seconds
});

app.use(sessionMiddleware({
  store: redisStore,
  cookieOptions: {
    secure: true,
    httpOnly: true,
    sameSite: 'strict'
  },
  // Handle session synchronization across instances
  onSessionChange: async (sessionId, data) => {
    await messageBus.publish('session:updated', {
      sessionId,
      timestamp: Date.now(),
      data
    });
  }
}));

// Listen for session events from other instances
messageBus.subscribe('session:updated', async (message) => {
  await redisStore.touchSession(message.sessionId);
  console.log(`Session ${message.sessionId} synchronized across instances`);
});
```

### GraphQL Integration
```typescript
// Add session context to GraphQL resolvers
const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: async ({ req }) => {
    // Session is attached by middleware
    const { session, user } = req;
    
    return {
      session,
      user,
      dataSources: {
        userAPI: new UserAPI(),
        contentAPI: new ContentAPI()
      },
      // Add session-specific permissions
      permissions: user ? await permissionService.getUserPermissions(user.id) : []
    };
  }
});

// Apply middleware before Apollo
app.use(sessionMiddleware);
server.applyMiddleware({ app });

// Example resolver with session access
const resolvers = {
  Query: {
    me: (_, __, { user, session }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      return userService.getProfile(user.id, { sessionId: session.id });
    },
    // Session-aware data fetching
    recentActivity: async (_, __, { user, session }) => {
      if (!user) throw new AuthenticationError('Not authenticated');
      
      // Record this data access in session history
      await sessionManager.recordDataAccess(session.id, 'recentActivity');
      
      return activityService.getRecentForUser(user.id);
    }
  }
};
```

### Microservices Integration
```typescript
// Session propagation between microservices
app.use('/api/orders', requireSession, async (req: SessionRequest, res) => {
  try {
    // Create a signed session token for microservice
    const serviceToken = await sessionManager.createServiceToken(req.session, {
      audience: 'order-service',
      expiresIn: '5m' // Short-lived token
    });
    
    // Forward request to microservice with token
    const response = await axios.get('http://order-service/api/user-orders', {
      headers: {
        'Authorization': `Bearer ${serviceToken}`,
        'X-Request-ID': req.id
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// On the microservice side
app.use(serviceSessionMiddleware({
  audience: 'order-service',
  issuer: 'main-app',
  publicKey: process.env.SESSION_JWT_PUBLIC_KEY
}));
```

## Troubleshooting

### Common Issues

#### Session Not Persisting
```typescript
// Check cookie settings
app.use(sessionMiddleware({
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production', // Must be false in HTTP dev environment
    httpOnly: true,
    sameSite: 'lax', // Try 'lax' instead of 'strict' if having cross-site issues
    domain: process.env.COOKIE_DOMAIN // Make sure domain is correct
  }
}));
```

#### Session Expiring Too Quickly
```typescript
// Increase session duration and refresh window
app.use(sessionMiddleware({
  sessionDuration: 86400, // 24 hours in seconds
  refreshThreshold: 3600, // Refresh if less than 1 hour remaining
  // Add debug logging
  onRefresh: async (session) => {
    console.log(`Session ${session.id} refreshed at ${new Date().toISOString()}`);
    console.log(`New expiry: ${session.expiresAt.toISOString()}`);
    return session;
  }
}));
```

#### Cross-Origin Issues
```typescript
// Configure CORS properly
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true // Important for cookies
}));

app.use(sessionMiddleware({
  cookieOptions: {
    sameSite: 'none', // For cross-origin requests
    secure: true // Required when sameSite is 'none'
  }
}));
```

### Debugging Tools

```typescript
// Debug middleware to log session details
app.use((req: SessionRequest, res, next) => {
  console.log('Session debug:', {
    hasSession: !!req.session,
    sessionId: req.session?.id,
    userId: req.user?.id,
    expires: req.session?.expiresAt,
    path: req.path,
    cookies: req.cookies
  });
  next();
});

// Session introspection endpoint (admin only)
app.get('/admin/sessions/:id', requireRole('admin'), async (req, res) => {
  const session = await sessionManager.getSessionDetails(req.params.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  
  // Get all active sessions for this user
  const userSessions = await sessionManager.getUserActiveSessions(session.userId);
  
  res.json({
    session,
    userSessions: userSessions.map(s => ({
      id: s.id,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      lastActive: s.metadata?.lastActive,
      userAgent: s.metadata?.userAgent,
      ipAddress: s.metadata?.ipAddress
    }))
  });
});
```

## Performance Optimization

### Caching Session Data
```typescript
const sessionCache = new LRUCache<string, Session>({
  max: 10000, // Maximum number of sessions to cache
  ttl: 60 * 1000 // Cache TTL: 1 minute
});

app.use(sessionMiddleware({
  // Custom session fetcher with caching
  sessionFetcher: async (sessionId) => {
    // Try to get from cache first
    const cachedSession = sessionCache.get(sessionId);
    if (cachedSession) {
      return cachedSession;
    }
    
    // Fetch from database
    const session = await sessionStore.get(sessionId);
    if (session) {
      // Cache for future requests
      sessionCache.set(sessionId, session);
    }
    
    return session;
  },
  // Update cache on session changes
  onSessionChange: (sessionId, session) => {
    if (session) {
      sessionCache.set(sessionId, session);
    } else {
      sessionCache.delete(sessionId);
    }
  }
}));
```
```

Would you like me to:
1. Add more component updates?
2. Expand the migration guide with more examples?
3. Add more documentation sections?
4. Something else?