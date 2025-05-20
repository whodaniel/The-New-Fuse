# Session Management Migration Guide

## Overview
This guide details the process of migrating from the old session management system to the new `@your-org/security` package.

## Key Changes
- Centralized session management through `sessionManager`
- Enhanced security features
- TypeScript support
- Improved error handling
- Better session lifecycle management

## Migration Steps

### 1. Update Dependencies
```bash
npm install @your-org/security@latest
```

### 2. Replace Direct Session Management
Before:
```typescript
const session = await createSession(user);
```

After:
```typescript
import { sessionManager } from '@your-org/security';
const session = await sessionManager.createSession(user);
```

### 3. Update Middleware Usage
Replace old middleware with new session middleware:
```typescript
import { sessionMiddleware, requireSession } from '@your-org/security';

app.use(sessionMiddleware);
app.use('/protected', requireSession, protectedRoutes);
```

### 4. Update Frontend Components
Update authentication hooks and components to use new session management:
```typescript
import { useSession } from '@your-org/security/react';

function ProtectedComponent() {
  const { session, loading } = useSession();
  if (loading) return <Loading />;
  if (!session) return <Unauthorized />;
  return <Component />;
}
```

### 5. WebSocket Integration
Update WebSocket connections to include session validation:
```typescript
const ws = new WebSocket(URL);
ws.addEventListener('open', () => {
  ws.send(JSON.stringify({ sessionId: currentSessionId }));
});
```

## Testing Changes
1. Verify session creation
2. Test session validation
3. Check session expiration
4. Validate secure transmission
5. Test session recovery

## Rollback Plan
If issues arise:
1. Revert to previous version
2. Restore old session management
3. Update dependency versions