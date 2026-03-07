# Comprehensive Error Handling Guide

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Custom Error Classes](#custom-error-classes)
4. [Error Factory](#error-factory)
5. [Retry Logic](#retry-logic)
6. [Recovery Strategies](#recovery-strategies)
7. [Error Messages](#error-messages)
8. [Error Boundaries](#error-boundaries)
9. [Error Monitoring](#error-monitoring)
10. [Error Reproduction](#error-reproduction)
11. [Best Practices](#best-practices)
12. [Examples](#examples)

---

## Overview

The comprehensive error handling system provides:

- **Custom Error Classes**: Typed errors for different scenarios
- **Error Factory**: Convenient error creation and transformation
- **Retry Logic**: Automatic retry with various strategies
- **Recovery Strategies**: Automatic error recovery mechanisms
- **User-Friendly Messages**: Internationalized error messages
- **Error Boundaries**: React component error catching
- **Error Monitoring**: Real-time error tracking and analytics
- **Error Reproduction**: Tools for debugging and testing

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Code                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Error Factory                             │
│  - Create typed errors                                       │
│  - Transform errors                                          │
│  - HTTP response mapping                                     │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Error Handler                             │
│  - Log errors                                                │
│  - Execute recovery strategies                               │
│  - Track statistics                                          │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ├─────────────────┬─────────────────┐
                     ▼                 ▼                 ▼
┌──────────────┐  ┌────────────┐  ┌──────────────────┐
│ Retry Logic  │  │  Recovery  │  │ Error Reporting  │
│              │  │ Strategies │  │    (Sentry)      │
└──────────────┘  └────────────┘  └──────────────────┘
```

---

## Custom Error Classes

### Available Error Types

#### Network Errors (1000-1999)

```typescript
import { NetworkError, TimeoutError, HttpError } from '@tnf/core-error-handling';

// Generic network error
throw new NetworkError('Failed to fetch data', 1000, {
  endpoint: '/api/users',
  method: 'GET',
  statusCode: 500
});

// Timeout error
throw new TimeoutError('/api/slow-endpoint', 30000);

// HTTP error
throw new HttpError(404, 'User not found', '/api/users/123');
```

#### Authentication Errors (2000-2999)

```typescript
import {
  AuthenticationError,
  TokenExpiredError,
  InvalidCredentialsError
} from '@tnf/core-error-handling';

// Token expired
throw new TokenExpiredError();

// Invalid credentials
throw new InvalidCredentialsError();

// Generic auth error
throw new AuthenticationError('MFA verification failed');
```

#### Validation Errors (3000-3999)

```typescript
import {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError
} from '@tnf/core-error-handling';

// Required field
throw new RequiredFieldError('email');

// Invalid format
throw new InvalidFormatError('email', 'email address', 'notanemail');

// Multiple validation errors
throw new ValidationError('Validation failed', undefined, [
  { field: 'email', message: 'Invalid email format' },
  { field: 'password', message: 'Password too weak' }
]);
```

#### Business Errors (4000-4999)

```typescript
import {
  NotFoundError,
  ConflictError,
  RateLimitError
} from '@tnf/core-error-handling';

// Not found
throw new NotFoundError('User', '123');

// Conflict
throw new ConflictError('Email already exists');

// Rate limit
throw new RateLimitError(60); // Retry after 60 seconds
```

#### System Errors (5000-5999)

```typescript
import {
  DatabaseError,
  ServiceUnavailableError,
  ExternalServiceError
} from '@tnf/core-error-handling';

// Database error
throw new DatabaseError('Query failed', 'SELECT', 'SELECT * FROM users');

// Service unavailable
throw new ServiceUnavailableError('Payment Service');

// External service error
throw new ExternalServiceError('Stripe', 'Payment failed', 400);
```

---

## Error Factory

### Creating Errors

```typescript
import { ErrorFactory } from '@tnf/core-error-handling';

// From HTTP response
const error = ErrorFactory.fromHttpResponse(404, {
  message: 'Resource not found',
  resourceType: 'User',
  resourceId: '123'
});

// From generic Error
try {
  // Some operation
} catch (err) {
  const appError = ErrorFactory.fromError(err as Error, {
    component: 'UserService',
    operation: 'fetchUser',
    metadata: { userId: '123' }
  });
  throw appError;
}

// Convenience methods
const notFoundError = ErrorFactory.notFound('User', '123');
const timeoutError = ErrorFactory.timeout('/api/users', 30000);
const validationError = ErrorFactory.validation('Invalid data', 'email');
```

---

## Retry Logic

### Basic Retry

```typescript
import { retry, RetryHandler } from '@tnf/core-error-handling';

// Simple retry
const result = await retry(
  async () => {
    return await fetchUserData();
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,
    backoffMultiplier: 2,
    jitter: true
  },
  'fetchUserData'
);

// Exponential backoff
const handler = new RetryHandler();
const data = await handler.withExponentialBackoff(
  async () => fetchData(),
  3,  // max attempts
  1000  // initial delay
);
```

### Retry with Circuit Breaker

```typescript
import { CircuitBreaker } from '@tnf/core-error-handling';

const breaker = new CircuitBreaker(
  async () => fetchExternalData(),
  {
    failureThreshold: 5,
    resetTimeout: 60000,
    halfOpenRequests: 2,
    operationName: 'fetchExternalData'
  }
);

try {
  const result = await breaker.execute();
} catch (error) {
  console.log('Circuit breaker is open:', breaker.getState());
}
```

### Retry Decorator

```typescript
import { Retry } from '@tnf/core-error-handling';

class UserService {
  @Retry({ maxAttempts: 3, initialDelay: 1000 })
  async fetchUser(id: string) {
    return await fetch(`/api/users/${id}`);
  }
}
```

---

## Recovery Strategies

### Available Strategies

```typescript
import {
  NetworkReconnectionStrategy,
  TokenRefreshStrategy,
  CacheFallbackStrategy,
  ServiceFailoverStrategy
} from '@tnf/core-error-handling';

// Network reconnection
const networkStrategy = new NetworkReconnectionStrategy();

// Token refresh
const tokenStrategy = new TokenRefreshStrategy(async () => {
  // Your token refresh logic
  const newToken = await refreshAuthToken();
  return true;
});

// Cache fallback
const cacheStrategy = new CacheFallbackStrategy(async (key: string) => {
  return await cache.get(key);
});

// Service failover
const failoverStrategy = new ServiceFailoverStrategy();
failoverStrategy.registerBackupService('api', [
  'https://api-backup1.example.com',
  'https://api-backup2.example.com'
]);
```

### Using Recovery Strategies

```typescript
import { BaseErrorHandler } from '@tnf/core-error-handling';

class MyErrorHandler extends BaseErrorHandler {
  protected initializeDefaultRecoveryStrategies(): void {
    this.registerRecoveryStrategy(new NetworkReconnectionStrategy());
    this.registerRecoveryStrategy(new TokenRefreshStrategy());
    this.registerRecoveryStrategy(new CacheFallbackStrategy());
  }

  protected initializeDefaultErrorHandlers(): void {
    // Register custom error handlers
  }
}

const handler = new MyErrorHandler();

// Handle error with automatic recovery
await handler.handleError(error, context);
```

---

## Error Messages

### Getting User-Friendly Messages

```typescript
import {
  errorMessageFormatter,
  getUserFriendlyMessage
} from '@tnf/core-error-handling';

// Set language
errorMessageFormatter.setLanguage('en');

// Get message for error
const message = getUserFriendlyMessage(error);
console.log(message.title);       // "Session Expired"
console.log(message.message);     // "Your session has expired..."
console.log(message.suggestion);  // "Please log in again..."

// Multilingual support
const spanishMessage = getUserFriendlyMessage(error, 'es');
```

### Supported Languages

- English (`en`)
- Spanish (`es`)
- French (`fr`)
- German (`de`)
- Chinese (`zh`)
- Japanese (`ja`)

### Custom Messages

```typescript
errorMessageFormatter.addCustomMessage(8000, {
  en: {
    title: 'Custom Error',
    message: 'This is a custom error message',
    suggestion: 'Try this solution'
  },
  es: {
    title: 'Error Personalizado',
    message: 'Este es un mensaje de error personalizado',
    suggestion: 'Prueba esta solución'
  }
});
```

---

## Error Boundaries

### Basic Usage

```typescript
import { ErrorBoundary } from '@/components/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary
      errorReporting={{ enabled: true }}
      showDetails={process.env.NODE_ENV === 'development'}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Custom Fallback

```typescript
import { ErrorBoundary, ErrorFallbackProps } from '@/components/ErrorBoundary';

const CustomErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetError
}) => (
  <div className="custom-error">
    <h1>Oops! Something went wrong</h1>
    <p>{error.message}</p>
    <button onClick={resetError}>Try Again</button>
  </div>
);

function App() {
  return (
    <ErrorBoundary fallback={CustomErrorFallback}>
      <YourApp />
    </ErrorBoundary>
  );
}
```

### Nested Error Boundaries

```typescript
function App() {
  return (
    <ErrorBoundary>
      <Header />
      <ErrorBoundary fallback={SidebarError}>
        <Sidebar />
      </ErrorBoundary>
      <ErrorBoundary fallback={ContentError}>
        <MainContent />
      </ErrorBoundary>
    </ErrorBoundary>
  );
}
```

---

## Error Monitoring

### Using the Dashboard

```typescript
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';

function AdminPanel() {
  return (
    <div>
      <h1>Admin Panel</h1>
      <ErrorMonitoringDashboard />
    </div>
  );
}
```

### Dashboard Features

- **Real-time error tracking**: See errors as they occur
- **Error statistics**: View total, handled, and unhandled errors
- **Filtering**: Filter by severity, category, time range
- **Error details**: View full stack traces and context
- **Export**: Export errors for analysis
- **Sentry integration**: Report errors directly to Sentry

---

## Error Reproduction

### Recording Errors

```typescript
import { errorRecorder } from '@tnf/core-error-handling';

// Add breadcrumbs
errorRecorder.addBreadcrumb('user', 'User clicked login button');
errorRecorder.addBreadcrumb('api', 'Called login API', 'info', {
  endpoint: '/api/auth/login'
});

// Record error with full context
try {
  await loginUser();
} catch (error) {
  const reproductionData = errorRecorder.record(
    error as ApplicationError,
    {
      component: 'LoginForm',
      operation: 'login',
      userId: currentUser?.id
    },
    {
      method: 'POST',
      url: '/api/auth/login',
      body: { username: 'user@example.com' }
    }
  );

  console.log('Recording ID:', reproductionData.id);
}
```

### Exporting and Sharing

```typescript
// Export recording
const exportData = errorRecorder.exportRecording('error-123');
console.log(exportData); // JSON string

// Share with team or attach to bug report
await sendToBugTracker(exportData);

// Import on another machine
errorRecorder.importRecording(exportData);
```

### Replaying Errors

```typescript
import { errorReplay } from '@tnf/core-error-handling';

// Get recording
const recording = errorRecorder.getRecording('error-123');

// Replay
await errorReplay.replay(recording);

// Generate test case
const testCode = errorReplay.generateTestCase(recording);
console.log(testCode);
```

---

## Best Practices

### 1. Use Specific Error Types

```typescript
// ❌ Bad
throw new Error('User not found');

// ✅ Good
throw new NotFoundError('User', userId);
```

### 2. Include Context

```typescript
// ❌ Bad
throw new NetworkError('Request failed');

// ✅ Good
throw new NetworkError('Request failed', 1000, {
  endpoint: '/api/users',
  method: 'GET',
  statusCode: 500,
  requestId: 'req-123'
});
```

### 3. Use Error Factory for Consistency

```typescript
// ❌ Bad
if (response.status === 404) {
  throw new Error('Not found');
}

// ✅ Good
if (!response.ok) {
  throw ErrorFactory.fromHttpResponse(
    response.status,
    await response.json(),
    endpoint,
    'GET'
  );
}
```

### 4. Implement Retry for Network Operations

```typescript
// ❌ Bad
const data = await fetch('/api/data');

// ✅ Good
const data = await retry(
  async () => fetch('/api/data'),
  {
    maxAttempts: 3,
    retryableErrors: [NetworkError, TimeoutError]
  }
);
```

### 5. Use Error Boundaries Strategically

```typescript
// ✅ Good - Protect critical sections
<ErrorBoundary>
  <CriticalComponent />
</ErrorBoundary>

// ✅ Good - Nested boundaries for granular control
<ErrorBoundary>
  <Layout>
    <ErrorBoundary fallback={SidebarError}>
      <Sidebar />
    </ErrorBoundary>
    <ErrorBoundary fallback={ContentError}>
      <Content />
    </ErrorBoundary>
  </Layout>
</ErrorBoundary>
```

### 6. Log Errors Appropriately

```typescript
// ❌ Bad
console.log(error);

// ✅ Good
logger.error('Operation failed', {
  error: error.message,
  code: error.code,
  stack: error.stack,
  context: {
    userId,
    operation: 'updateProfile'
  }
});
```

### 7. Provide User-Friendly Messages

```typescript
// ❌ Bad
alert(error.message); // Technical error message

// ✅ Good
const friendly = getUserFriendlyMessage(error);
toast.error(friendly.title, {
  description: friendly.message,
  action: friendly.suggestion
});
```

### 8. Use Recovery Strategies

```typescript
// ✅ Good
const handler = new MyErrorHandler({
  enableAutoRecovery: true,
  maxRecoveryAttempts: 3
});

handler.registerRecoveryStrategy(new TokenRefreshStrategy());
handler.registerRecoveryStrategy(new CacheFallbackStrategy());

await handler.handleError(error, context);
```

---

## Examples

### Complete Error Handling Flow

```typescript
import {
  ErrorFactory,
  retry,
  errorRecorder,
  getUserFriendlyMessage
} from '@tnf/core-error-handling';

class UserService {
  async fetchUser(id: string) {
    errorRecorder.addBreadcrumb('user', `Fetching user ${id}`);

    try {
      const data = await retry(
        async () => {
          const response = await fetch(`/api/users/${id}`);

          if (!response.ok) {
            throw ErrorFactory.fromHttpResponse(
              response.status,
              await response.json(),
              `/api/users/${id}`,
              'GET'
            );
          }

          return response.json();
        },
        {
          maxAttempts: 3,
          initialDelay: 1000,
          onRetry: (error, attempt) => {
            console.log(`Retry attempt ${attempt} after error:`, error.message);
          }
        },
        'fetchUser'
      );

      return data;

    } catch (error) {
      const appError = error instanceof ApplicationError
        ? error
        : ErrorFactory.fromError(error as Error);

      // Record for reproduction
      errorRecorder.record(
        appError,
        {
          component: 'UserService',
          operation: 'fetchUser',
          userId: id
        },
        {
          method: 'GET',
          url: `/api/users/${id}`
        }
      );

      // Show user-friendly message
      const message = getUserFriendlyMessage(appError);
      toast.error(message.title, {
        description: message.message
      });

      throw appError;
    }
  }
}
```

### React Component with Full Error Handling

```typescript
import React, { useState, useEffect } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { errorRecorder, getUserFriendlyMessage } from '@tnf/core-error-handling';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    errorRecorder.addBreadcrumb('ui', `Viewing user profile ${userId}`);

    fetchUser(userId)
      .then(setUser)
      .catch(err => {
        const message = getUserFriendlyMessage(err);
        setError(message);
      });
  }, [userId]);

  if (error) {
    return (
      <div className="error-message">
        <h3>{error.title}</h3>
        <p>{error.message}</p>
        {error.suggestion && <p className="suggestion">{error.suggestion}</p>}
      </div>
    );
  }

  return <div>{/* User profile UI */}</div>;
}

export default function UserProfilePage() {
  return (
    <ErrorBoundary
      errorReporting={{ enabled: true }}
      showDetails={false}
    >
      <UserProfile userId="123" />
    </ErrorBoundary>
  );
}
```

---

## Monitoring and Alerting

### Setting Up Sentry

```typescript
import { errorTracker } from '@/services/error-tracking.service';

// Initialize in app entry point
errorTracker.setUser({
  id: currentUser.id,
  email: currentUser.email,
  role: currentUser.role
});

// Add breadcrumbs
errorTracker.addBreadcrumb('User logged in', 'auth', 'info');

// Track errors
try {
  await riskyOperation();
} catch (error) {
  errorTracker.trackError(error, {
    category: ErrorCategory.SYSTEM,
    priority: ErrorPriority.HIGH,
    metadata: { operation: 'riskyOperation' }
  });
}
```

---

## Testing Error Handling

```typescript
import { describe, it, expect } from 'vitest';
import { ErrorFactory, retry } from '@tnf/core-error-handling';

describe('Error Handling', () => {
  it('should retry on network failure', async () => {
    let attempts = 0;

    const result = await retry(
      async () => {
        attempts++;
        if (attempts < 3) {
          throw ErrorFactory.network('Connection failed');
        }
        return 'success';
      },
      { maxAttempts: 3 }
    );

    expect(attempts).toBe(3);
    expect(result).toBe('success');
  });

  it('should convert HTTP errors correctly', () => {
    const error = ErrorFactory.fromHttpResponse(404, {
      message: 'User not found',
      resourceType: 'User'
    });

    expect(error).toBeInstanceOf(NotFoundError);
    expect(error.code).toBe(4001);
  });
});
```

---

## Summary

This comprehensive error handling system provides:

✅ **Type-safe errors** with rich metadata
✅ **Automatic retry** with exponential backoff
✅ **Smart recovery** with multiple strategies
✅ **User-friendly messages** in multiple languages
✅ **React error boundaries** for component isolation
✅ **Real-time monitoring** dashboard
✅ **Error reproduction** tools for debugging
✅ **Sentry integration** for production monitoring

For more information, see the API documentation in each module.
