# Error Handling Quick Reference

## Import Statements

```typescript
// Core errors
import {
  ErrorFactory,
  ApplicationError,
  NetworkError,
  TimeoutError,
  AuthenticationError,
  ValidationError,
  NotFoundError,
  SystemError,
} from '@tnf/core-error-handling';

// Retry and recovery
import {
  retry,
  RetryHandler,
  CircuitBreaker,
  NetworkReconnectionStrategy,
  TokenRefreshStrategy,
} from '@tnf/core-error-handling';

// Messages
import {
  getUserFriendlyMessage,
  errorMessageFormatter,
} from '@tnf/core-error-handling';

// Reproduction
import { errorRecorder, errorReplay } from '@tnf/core-error-handling';

// React components
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';
```

## Common Patterns

### 1. Throw Typed Errors

```typescript
// ❌ Don't
throw new Error('User not found');

// ✅ Do
throw ErrorFactory.notFound('User', userId);
// or
throw new NotFoundError('User', userId);
```

### 2. Handle HTTP Errors

```typescript
const response = await fetch('/api/data');
if (!response.ok) {
  throw ErrorFactory.fromHttpResponse(
    response.status,
    await response.json(),
    '/api/data',
    'GET'
  );
}
```

### 3. Retry Operations

```typescript
// Simple retry
const data = await retry(async () => fetchData(), {
  maxAttempts: 3,
  initialDelay: 1000,
});

// With custom logic
const result = await retry(async () => apiCall(), {
  maxAttempts: 5,
  backoffMultiplier: 2,
  shouldRetry: (error, attempt) => {
    return error instanceof NetworkError && attempt < 5;
  },
});
```

### 4. User-Friendly Messages

```typescript
try {
  await operation();
} catch (error) {
  const msg = getUserFriendlyMessage(error, 'en');
  toast.error(msg.title, {
    description: msg.message,
  });
}
```

### 5. Error Boundaries

```typescript
// App level
<ErrorBoundary errorReporting={{ enabled: true }}>
  <App />
</ErrorBoundary>

// Component level
<ErrorBoundary fallback={CustomFallback}>
  <CriticalComponent />
</ErrorBoundary>
```

### 6. Record for Debugging

```typescript
errorRecorder.addBreadcrumb('user', 'Clicked submit');

try {
  await submitForm(data);
} catch (error) {
  const recording = errorRecorder.record(error, {
    component: 'FormComponent',
    operation: 'submit',
  });
  console.log('Error ID:', recording.id);
}
```

## Error Codes Cheat Sheet

| Code | Error Type          | Example               |
| ---- | ------------------- | --------------------- |
| 1000 | Network             | Connection failed     |
| 1001 | Timeout             | Request timeout       |
| 2000 | Authentication      | Login failed          |
| 2001 | Token Expired       | Session expired       |
| 2100 | Authorization       | Access denied         |
| 3000 | Validation          | Invalid input         |
| 3001 | Required Field      | Field required        |
| 4001 | Not Found           | Resource not found    |
| 4002 | Conflict            | Resource conflict     |
| 4005 | Rate Limit          | Too many requests     |
| 5000 | System              | Internal server error |
| 5001 | Database            | Database query failed |
| 5003 | Service Unavailable | Service down          |

## Factory Methods Quick Reference

```typescript
// Network
ErrorFactory.network(message, endpoint, method, statusCode);
ErrorFactory.timeout(endpoint, timeout);
ErrorFactory.http(statusCode, message, endpoint);

// Auth
ErrorFactory.authentication(message);
ErrorFactory.tokenExpired();
ErrorFactory.invalidCredentials();

// Authorization
ErrorFactory.authorization(message, permission, role);
ErrorFactory.insufficientPermissions(permission, role);

// Validation
ErrorFactory.validation(message, field, errors);
ErrorFactory.requiredField(field);
ErrorFactory.invalidFormat(field, expectedFormat, value);

// Business
ErrorFactory.notFound(resourceType, resourceId);
ErrorFactory.conflict(message, metadata);
ErrorFactory.rateLimit(retryAfter);

// System
ErrorFactory.system(message, code, severity, retryable);
ErrorFactory.database(message, operation, query);
ErrorFactory.serviceUnavailable(serviceName);
```

## Recovery Strategies

```typescript
// Network reconnection
new NetworkReconnectionStrategy();

// Token refresh
new TokenRefreshStrategy(async () => {
  const token = await refreshToken();
  return true;
});

// Cache fallback
new CacheFallbackStrategy(async (key) => {
  return await cache.get(key);
});

// Service failover
const failover = new ServiceFailoverStrategy();
failover.registerBackupService('api', ['backup1.com', 'backup2.com']);
```

## Best Practices Checklist

- ✅ Use specific error types instead of generic Error
- ✅ Include context in error metadata
- ✅ Use ErrorFactory for consistency
- ✅ Implement retry for network operations
- ✅ Use error boundaries in React
- ✅ Provide user-friendly messages
- ✅ Record errors for debugging
- ✅ Monitor errors in production
- ✅ Use recovery strategies
- ✅ Test error handling paths

## Monitoring Dashboard

### Access

Add to your admin panel:

```typescript
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';

<ErrorMonitoringDashboard />
```

### Features

- Real-time error tracking
- Filter by severity, category, time
- Export errors
- View stack traces
- Report to Sentry

## Testing

```typescript
import { describe, it, expect } from 'vitest';
import { ErrorFactory, retry } from '@tnf/core-error-handling';

describe('Error Handling', () => {
  it('should retry on failure', async () => {
    let attempts = 0;
    const result = await retry(
      async () => {
        attempts++;
        if (attempts < 3) throw ErrorFactory.network('Failed');
        return 'success';
      },
      { maxAttempts: 3 }
    );
    expect(attempts).toBe(3);
  });

  it('should create correct error type', () => {
    const error = ErrorFactory.fromHttpResponse(404, {
      message: 'Not found',
    });
    expect(error).toBeInstanceOf(NotFoundError);
  });
});
```

## Configuration

### Sentry

```bash
VITE_SENTRY_DSN=your-dsn
VITE_APP_VERSION=1.0.0
```

### Language

```typescript
import { errorMessageFormatter } from '@tnf/core-error-handling';

errorMessageFormatter.setLanguage('en'); // en, es, fr, de, zh, ja
```

## Resources

- 📖 [Complete Guide](/home/user/fuse/docs/ERROR_HANDLING_GUIDE.md)
- 💡 [Examples](/home/user/fuse/docs/ERROR_HANDLING_EXAMPLES.md)
- 📋 [Implementation Summary](/home/user/fuse/ERROR_HANDLING_IMPLEMENTATION.md)

---

**Package**: `@tnf/core-error-handling` v1.0.0
