# Security Package

This package contains security-related functionality for the project, including session management.

## Session Manager

The `SessionManager` is responsible for handling user sessions across the application. It provides:

- Session creation and validation
- Session timeout management
- Concurrent session limits
- IP and user agent validation

### Usage

```typescript
import { sessionManager } from '@your-org/security';

// Create a new session
const session = await sessionManager.createSession(user, token);

// Validate a session
const isValid = await sessionManager.validateSession(sessionId);

// Revoke a session
await sessionManager.revokeSession(sessionId);
```

## Configuration

Session manager can be configured with the following options:

- `maxConcurrentSessions`: Maximum number of active sessions per user
- `sessionTimeout`: Session timeout in milliseconds
- `extendOnActivity`: Whether to extend session timeout on activity
- `requireIpMatch`: Whether to validate IP address
- `requireUserAgentMatch`: Whether to validate user agent

## Testing

Run tests with:

```bash
yarn test
```
