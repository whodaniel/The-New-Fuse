# Error Handling Examples

## Quick Start Examples

### 1. Basic Error Handling

```typescript
import { ErrorFactory, NotFoundError } from '@tnf/core-error-handling';

// Throw a specific error
function getUser(id: string) {
  const user = database.findUser(id);

  if (!user) {
    throw ErrorFactory.notFound('User', id);
    // or
    throw new NotFoundError('User', id);
  }

  return user;
}

// Handle the error
try {
  const user = getUser('123');
} catch (error) {
  if (error instanceof NotFoundError) {
    console.log('User not found:', error.resourceId);
  }
}
```

### 2. HTTP Error Handling

```typescript
import { ErrorFactory } from '@tnf/core-error-handling';

async function fetchData(url: string) {
  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json();
    throw ErrorFactory.fromHttpResponse(
      response.status,
      errorData,
      url,
      'GET'
    );
  }

  return response.json();
}

// Usage
try {
  const data = await fetchData('/api/users/123');
} catch (error) {
  // Error is automatically typed based on HTTP status
  if (error instanceof NotFoundError) {
    console.log('Resource not found');
  } else if (error instanceof AuthenticationError) {
    console.log('Please log in');
  }
}
```

### 3. Retry with Exponential Backoff

```typescript
import { retry } from '@tnf/core-error-handling';

async function fetchWithRetry(url: string) {
  return retry(
    async () => {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Fetch failed');
      return response.json();
    },
    {
      maxAttempts: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      jitter: true
    }
  );
}

// Usage
const data = await fetchWithRetry('/api/unstable-endpoint');
```

### 4. React Error Boundary

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

### 5. User-Friendly Error Messages

```typescript
import { getUserFriendlyMessage } from '@tnf/core-error-handling';

try {
  await someOperation();
} catch (error) {
  const friendly = getUserFriendlyMessage(error, 'en');

  toast.error(friendly.title, {
    description: friendly.message,
    action: {
      label: 'Learn More',
      onClick: () => console.log(friendly.suggestion)
    }
  });
}
```

## Advanced Examples

### 6. Custom Error Handler with Recovery

```typescript
import {
  BaseErrorHandler,
  NetworkReconnectionStrategy,
  TokenRefreshStrategy
} from '@tnf/core-error-handling';

class AppErrorHandler extends BaseErrorHandler {
  protected initializeDefaultRecoveryStrategies(): void {
    // Network recovery
    this.registerRecoveryStrategy(new NetworkReconnectionStrategy());

    // Token refresh
    const tokenStrategy = new TokenRefreshStrategy(async () => {
      const newToken = await refreshAuthToken();
      localStorage.setItem('token', newToken);
      return true;
    });
    this.registerRecoveryStrategy(tokenStrategy);
  }

  protected initializeDefaultErrorHandlers(): void {
    // Custom handlers can be registered here
  }
}

// Usage
const errorHandler = new AppErrorHandler({
  enableAutoRecovery: true,
  maxRecoveryAttempts: 3
});

try {
  await apiCall();
} catch (error) {
  await errorHandler.handleError(error, {
    component: 'ApiService',
    operation: 'fetchData'
  });
}
```

### 7. Circuit Breaker Pattern

```typescript
import { CircuitBreaker } from '@tnf/core-error-handling';

const externalApiBreaker = new CircuitBreaker(
  async () => fetch('https://external-api.com/data'),
  {
    failureThreshold: 5,
    resetTimeout: 60000,
    operationName: 'externalApi'
  }
);

async function callExternalApi() {
  try {
    return await externalApiBreaker.execute();
  } catch (error) {
    if (externalApiBreaker.getState() === 'OPEN') {
      console.log('Circuit breaker is open, using fallback');
      return fallbackData;
    }
    throw error;
  }
}
```

### 8. Error Recording and Reproduction

```typescript
import { errorRecorder, errorReplay } from '@tnf/core-error-handling';

// Add breadcrumbs throughout user journey
errorRecorder.addBreadcrumb('navigation', 'User navigated to profile page');
errorRecorder.addBreadcrumb('ui.click', 'User clicked edit button');

// Set state capture function
errorRecorder.setStateCapture(() => ({
  user: getCurrentUser(),
  route: window.location.pathname,
  formData: getFormState()
}));

try {
  await updateProfile(data);
} catch (error) {
  // Record error with full context
  const reproduction = errorRecorder.record(
    error,
    {
      component: 'ProfileForm',
      operation: 'updateProfile',
      userId: currentUser.id
    },
    {
      method: 'PUT',
      url: '/api/profile',
      body: data
    }
  );

  console.log('Error ID:', reproduction.id);

  // Export for bug report
  const exportData = errorRecorder.exportRecording(reproduction.id);
  await attachToBugReport(exportData);
}

// Later, in development
const recording = errorRecorder.getRecording('error-123');
await errorReplay.replay(recording);
```

### 9. Multilingual Error Messages

```typescript
import { errorMessageFormatter } from '@tnf/core-error-handling';

// Detect user language
const userLanguage = navigator.language.split('-')[0];
errorMessageFormatter.setLanguage(userLanguage);

// Add custom messages
errorMessageFormatter.addCustomMessage(9000, {
  en: {
    title: 'Subscription Required',
    message: 'This feature requires an active subscription.',
    suggestion: 'Upgrade your plan to access this feature.'
  },
  es: {
    title: 'Suscripción Requerida',
    message: 'Esta función requiere una suscripción activa.',
    suggestion: 'Mejora tu plan para acceder a esta función.'
  },
  fr: {
    title: 'Abonnement Requis',
    message: 'Cette fonctionnalité nécessite un abonnement actif.',
    suggestion: 'Mettez à niveau votre forfait pour accéder à cette fonctionnalité.'
  }
});
```

### 10. Validation Error Handling

```typescript
import { ValidationError, ErrorFactory } from '@tnf/core-error-handling';

function validateUserInput(data: any) {
  const errors = [];

  if (!data.email) {
    errors.push({ field: 'email', message: 'Email is required' });
  } else if (!isValidEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }

  if (!data.password) {
    errors.push({ field: 'password', message: 'Password is required' });
  } else if (data.password.length < 8) {
    errors.push({ field: 'password', message: 'Password must be at least 8 characters' });
  }

  if (errors.length > 0) {
    throw new ValidationError('Validation failed', undefined, errors);
  }
}

// Usage in form
async function handleSubmit(data) {
  try {
    validateUserInput(data);
    await submitForm(data);
  } catch (error) {
    if (error instanceof ValidationError) {
      error.validationErrors?.forEach(err => {
        showFieldError(err.field, err.message);
      });
    }
  }
}
```

### 11. Monitoring Dashboard Integration

```typescript
import { ErrorMonitoringDashboard } from '@/components/ErrorMonitoringDashboard';

function AdminDashboard() {
  return (
    <div className="admin-layout">
      <Sidebar />
      <main>
        <h1>System Health</h1>
        <ErrorMonitoringDashboard />
      </main>
    </div>
  );
}
```

### 12. Complete Application Setup

```typescript
// app.tsx
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { errorMessageFormatter } from '@tnf/core-error-handling';
import { errorTracker } from '@/services/error-tracking.service';

// Initialize error handling
errorMessageFormatter.setLanguage(userSettings.language);

errorTracker.setUser({
  id: currentUser.id,
  email: currentUser.email,
  role: currentUser.role
});

function App() {
  return (
    <ErrorBoundary
      errorReporting={{ enabled: true }}
      showDetails={import.meta.env.DEV}
    >
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/profile" element={
            <ErrorBoundary fallback={ProfileErrorFallback}>
              <Profile />
            </ErrorBoundary>
          } />
          <Route path="/admin" element={
            <ErrorBoundary>
              <AdminDashboard />
            </ErrorBoundary>
          } />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
```

## Testing Examples

### 13. Unit Testing Error Handling

```typescript
import { describe, it, expect, vi } from 'vitest';
import { ErrorFactory, retry } from '@tnf/core-error-handling';

describe('UserService', () => {
  it('should handle not found errors', async () => {
    const service = new UserService();

    await expect(service.getUser('invalid-id')).rejects.toThrow(NotFoundError);
  });

  it('should retry on network failure', async () => {
    let attempts = 0;
    const mockFetch = vi.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) {
        return Promise.reject(ErrorFactory.network('Connection failed'));
      }
      return Promise.resolve({ data: 'success' });
    });

    const result = await retry(mockFetch, { maxAttempts: 3 });

    expect(attempts).toBe(3);
    expect(result.data).toBe('success');
  });

  it('should convert HTTP errors correctly', () => {
    const error = ErrorFactory.fromHttpResponse(401, {
      message: 'Unauthorized'
    });

    expect(error).toBeInstanceOf(AuthenticationError);
  });
});
```

### 14. Integration Testing with Error Boundaries

```typescript
import { render, screen } from '@testing-library/react';
import { ErrorBoundary } from '@/components/ErrorBoundary';

const ThrowError = () => {
  throw new Error('Test error');
};

describe('ErrorBoundary', () => {
  it('should catch and display errors', () => {
    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('should allow recovery', async () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    const retryButton = screen.getByText(/try again/i);
    await userEvent.click(retryButton);

    // Component should re-render
  });
});
```

## Production Patterns

### 15. Graceful Degradation

```typescript
import { GracefulDegradationStrategy } from '@tnf/core-error-handling';

const degradationStrategy = new GracefulDegradationStrategy();

// Register fallback for recommendations
degradationStrategy.registerFallbackHandler('getRecommendations', async () => {
  return {
    items: await getPopularItems(),
    isDegraded: true,
    message: 'Showing popular items instead of personalized recommendations'
  };
});

// Use in error handler
errorHandler.registerRecoveryStrategy(degradationStrategy);
```

### 16. Error Aggregation and Alerting

```typescript
import { BaseErrorHandler } from '@tnf/core-error-handling';

class ProductionErrorHandler extends BaseErrorHandler {
  private errorCounts = new Map<number, number>();
  private alertThreshold = 10;

  async handleError(error, context) {
    const result = await super.handleError(error, context);

    // Track error frequency
    const count = (this.errorCounts.get(error.code) || 0) + 1;
    this.errorCounts.set(error.code, count);

    // Alert if threshold exceeded
    if (count >= this.alertThreshold) {
      await this.sendAlert(error, count);
    }

    return result;
  }

  private async sendAlert(error, count) {
    await fetch('/api/alerts', {
      method: 'POST',
      body: JSON.stringify({
        errorCode: error.code,
        message: error.message,
        count,
        severity: error.severity
      })
    });
  }
}
```

---

## Summary

These examples demonstrate:

- ✅ Creating and throwing custom errors
- ✅ HTTP error handling and transformation
- ✅ Retry logic with various strategies
- ✅ Error boundaries in React
- ✅ User-friendly error messages
- ✅ Recovery strategies
- ✅ Circuit breaker pattern
- ✅ Error recording and reproduction
- ✅ Multilingual support
- ✅ Validation handling
- ✅ Monitoring dashboards
- ✅ Testing strategies
- ✅ Production patterns

For more details, see the [Error Handling Guide](./ERROR_HANDLING_GUIDE.md).
