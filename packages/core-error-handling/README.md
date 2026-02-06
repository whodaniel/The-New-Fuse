# @the-new-fuse/core-error-handling

Unified error handling system for The New Fuse. Provides comprehensive error
classes, error recovery strategies, retry logic, and logging utilities for
robust application error management.

## Overview

The core-error-handling package is a production-ready error management system
that provides structured error handling across The New Fuse platform. It
includes custom error classes for common scenarios, recovery strategies, retry
mechanisms, and comprehensive logging.

## Features

- **Comprehensive Error Classes**: Pre-built error types for all common
  scenarios
- **Error Categories**: Network, Authentication, Validation, Business, System,
  Integration, Payment
- **Error Severity Levels**: Critical, High, Medium, Low
- **Structured Error Metadata**: Rich context and debugging information
- **Retry Logic**: Configurable automatic retry with exponential backoff
- **Recovery Strategies**: Pre-built recovery patterns for common failures
- **Error Factory**: Create errors with consistent formatting
- **Logger Integration**: Structured logging with error tracking
- **Error Reproduction**: Tools for reproducing and debugging errors
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **Error Codes**: Standardized error code system (1000-7999)
- **JSON Serialization**: Errors can be serialized for logging/transmission

## Installation

```bash
npm install @the-new-fuse/core-error-handling
# or
pnpm add @the-new-fuse/core-error-handling
```

## Quick Start

### Basic Usage

```typescript
import {
  ApplicationError,
  NotFoundError,
  ValidationError,
  ErrorSeverity,
  ErrorCategory,
} from '@the-new-fuse/core-error-handling';

// Throw a not found error
throw new NotFoundError('User', 'user-123');

// Throw a validation error
throw new ValidationError('Invalid email format', 'email');

// Throw a custom application error
throw new ApplicationError(
  'Something went wrong',
  5000,
  ErrorSeverity.HIGH,
  ErrorCategory.SYSTEM
);
```

### With Error Recovery

```typescript
import { RetryLogic } from '@the-new-fuse/core-error-handling';

const retryLogic = new RetryLogic({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  exponentialBackoff: true,
});

const result = await retryLogic.executeWithRetry(async () => {
  return await fetchDataFromAPI();
});
```

### With Logger

```typescript
import { Logger } from '@the-new-fuse/core-error-handling';

const logger = new Logger('MyService');

try {
  // Your code
} catch (error) {
  logger.error('Operation failed', error, {
    userId: 'user-123',
    operation: 'fetchData',
  });
}
```

## Error Classes

### Base Error Classes

#### ApplicationError

Base error class with rich metadata.

```typescript
import {
  ApplicationError,
  ErrorSeverity,
  ErrorCategory,
} from '@the-new-fuse/core-error-handling';

const error = new ApplicationError(
  'Error message',
  1000, // Error code
  ErrorSeverity.HIGH,
  ErrorCategory.SYSTEM,
  true, // retryable
  { customField: 'value' }, // metadata
  originalError // original error if wrapping
);

// Properties
error.code; // 1000
error.severity; // ErrorSeverity.HIGH
error.category; // ErrorCategory.SYSTEM
error.retryable; // true
error.timestamp; // Date
error.metadata; // { customField: 'value' }
error.correlationId; // Optional tracking ID
error.originalError; // Original error if wrapping

// Methods
error.toJSON(); // Serialize to JSON
```

### Network Errors (1000-1999)

```typescript
import {
  NetworkError,
  TimeoutError,
  ConnectionError,
  HttpError,
} from '@the-new-fuse/core-error-handling';

// Generic network error
throw new NetworkError('Network request failed', 1000, {
  endpoint: '/api/users',
  statusCode: 500,
});

// Timeout error
throw new TimeoutError('/api/users', 5000);

// Connection error
throw new ConnectionError('https://api.example.com');

// HTTP error with status code
throw new HttpError(404, 'Not Found', '/api/users', 'GET');
```

### Authentication & Authorization Errors (2000-2999)

```typescript
import {
  AuthenticationError,
  TokenExpiredError,
  InvalidCredentialsError,
  AuthorizationError,
  InsufficientPermissionsError,
} from '@the-new-fuse/core-error-handling';

// Generic authentication error
throw new AuthenticationError('Authentication failed');

// Token expired
throw new TokenExpiredError();

// Invalid credentials
throw new InvalidCredentialsError();

// Authorization error
throw new AuthorizationError('Access denied', 'admin:write', 'user');

// Insufficient permissions
throw new InsufficientPermissionsError('admin:write', 'user');
```

### Validation Errors (3000-3999)

```typescript
import {
  ValidationError,
  RequiredFieldError,
  InvalidFormatError,
  OutOfRangeError,
} from '@the-new-fuse/core-error-handling';

// Generic validation error
throw new ValidationError('Validation failed', 'fieldName', [
  { field: 'email', message: 'Invalid email', value: 'invalid' },
]);

// Required field error
throw new RequiredFieldError('email');

// Invalid format error
throw new InvalidFormatError('email', 'email@example.com', 'notanemail');

// Out of range error
throw new OutOfRangeError('age', 18, 100, 150);
```

### Business Logic Errors (4000-4999)

```typescript
import {
  BusinessError,
  NotFoundError,
  ConflictError,
  DuplicateResourceError,
  OperationNotAllowedError,
  RateLimitError,
} from '@the-new-fuse/core-error-handling';

// Generic business error
throw new BusinessError('Business rule violated');

// Resource not found
throw new NotFoundError('User', 'user-123');

// Conflict error
throw new ConflictError('Resource already exists');

// Duplicate resource
throw new DuplicateResourceError('User', 'email@example.com');

// Operation not allowed
throw new OperationNotAllowedError('delete', 'Resource is locked');

// Rate limit exceeded
throw new RateLimitError(60); // Retry after 60 seconds
```

### System Errors (5000-5999)

```typescript
import {
  SystemError,
  DatabaseError,
  ConfigurationError,
  ServiceUnavailableError,
  ExternalServiceError,
  FileSystemError,
} from '@the-new-fuse/core-error-handling';

// Generic system error
throw new SystemError('System failure');

// Database error
throw new DatabaseError('Query failed', 'INSERT', 'INSERT INTO users...');

// Configuration error
throw new ConfigurationError('Missing required config', 'DATABASE_URL');

// Service unavailable
throw new ServiceUnavailableError('Redis');

// External service error
throw new ExternalServiceError('Stripe', 'Payment failed', 400);

// File system error
throw new FileSystemError('File not found', '/path/to/file', 'read');
```

### Integration Errors (6000-6999)

```typescript
import {
  IntegrationError,
  ApiIntegrationError,
} from '@the-new-fuse/core-error-handling';

// Generic integration error
throw new IntegrationError('Stripe', 'Payment integration failed');

// API integration error
throw new ApiIntegrationError('Stripe', '/v1/charges', 400, 'Invalid card');
```

### Payment Errors (7000-7999)

```typescript
import {
  PaymentError,
  PaymentDeclinedError,
  InsufficientFundsError,
} from '@the-new-fuse/core-error-handling';

// Generic payment error
throw new PaymentError('Payment failed', 7000, {
  paymentMethod: 'card',
  transactionId: 'txn-123',
  amount: 99.99,
});

// Payment declined
throw new PaymentDeclinedError('Insufficient funds');

// Insufficient funds
throw new InsufficientFundsError(100, 50);
```

## Error Codes Reference

```typescript
import { ErrorCodes } from '@the-new-fuse/core-error-handling';

// Network errors (1000-1999)
ErrorCodes.NETWORK_ERROR; // 1000
ErrorCodes.TIMEOUT; // 1001
ErrorCodes.CONNECTION_ERROR; // 1002

// Auth errors (2000-2999)
ErrorCodes.AUTH_ERROR; // 2000
ErrorCodes.TOKEN_EXPIRED; // 2001
ErrorCodes.INVALID_CREDENTIALS; // 2002
ErrorCodes.AUTHORIZATION_ERROR; // 2100

// Validation errors (3000-3999)
ErrorCodes.VALIDATION_ERROR; // 3000
ErrorCodes.REQUIRED_FIELD; // 3001
ErrorCodes.INVALID_FORMAT; // 3002
ErrorCodes.OUT_OF_RANGE; // 3003

// Business errors (4000-4999)
ErrorCodes.BUSINESS_ERROR; // 4000
ErrorCodes.NOT_FOUND; // 4001
ErrorCodes.CONFLICT; // 4002
ErrorCodes.DUPLICATE_RESOURCE; // 4003
ErrorCodes.OPERATION_NOT_ALLOWED; // 4004
ErrorCodes.RATE_LIMIT; // 4005

// System errors (5000-5999)
ErrorCodes.SYSTEM_ERROR; // 5000
ErrorCodes.DATABASE_ERROR; // 5001
ErrorCodes.CONFIGURATION_ERROR; // 5002
ErrorCodes.SERVICE_UNAVAILABLE; // 5003
ErrorCodes.EXTERNAL_SERVICE_ERROR; // 5004
ErrorCodes.FILE_SYSTEM_ERROR; // 5005

// Integration errors (6000-6999)
ErrorCodes.INTEGRATION_ERROR; // 6000
ErrorCodes.API_INTEGRATION_ERROR; // 6001

// Payment errors (7000-7999)
ErrorCodes.PAYMENT_ERROR; // 7000
ErrorCodes.PAYMENT_DECLINED; // 7001
ErrorCodes.INSUFFICIENT_FUNDS; // 7002
```

## Retry Logic

### Basic Retry

```typescript
import { RetryLogic } from '@the-new-fuse/core-error-handling';

const retry = new RetryLogic({
  maxRetries: 3,
  baseDelay: 1000,
  exponentialBackoff: true,
});

const result = await retry.executeWithRetry(async () => {
  return await apiCall();
});
```

### Advanced Retry Configuration

```typescript
const retry = new RetryLogic({
  maxRetries: 5,
  baseDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds max
  exponentialBackoff: true, // 1s, 2s, 4s, 8s, 16s
  jitter: true, // Add randomness to prevent thundering herd
  retryableErrors: [
    // Only retry these errors
    NetworkError,
    TimeoutError,
    ServiceUnavailableError,
  ],
  onRetry: (attempt, error) => {
    console.log(`Retry attempt ${attempt} after error:`, error.message);
  },
});

const result = await retry.executeWithRetry(async () => {
  return await fetchData();
});
```

### Conditional Retry

```typescript
const retry = new RetryLogic({
  maxRetries: 3,
  shouldRetry: (error) => {
    // Custom retry logic
    if (error instanceof RateLimitError) {
      return true; // Always retry rate limits
    }
    if (error instanceof ValidationError) {
      return false; // Never retry validation errors
    }
    return error.retryable; // Use error's retryable property
  },
});
```

## Recovery Strategies

### Circuit Breaker Pattern

```typescript
import { CircuitBreaker } from '@the-new-fuse/core-error-handling';

const breaker = new CircuitBreaker({
  failureThreshold: 5, // Open after 5 failures
  resetTimeout: 60000, // Try again after 60s
  halfOpenRequests: 3, // Test with 3 requests when half-open
});

const result = await breaker.execute(async () => {
  return await externalApiCall();
});
```

### Fallback Strategy

```typescript
import { FallbackStrategy } from '@the-new-fuse/core-error-handling';

const fallback = new FallbackStrategy();

const result = await fallback.executeWithFallback(
  async () => {
    return await primaryService.getData();
  },
  async () => {
    // Fallback to cache
    return await cache.get('data');
  }
);
```

### Graceful Degradation

```typescript
import { GracefulDegradation } from '@the-new-fuse/core-error-handling';

const degradation = new GracefulDegradation([
  async () => await primaryService.getData(),
  async () => await secondaryService.getData(),
  async () => await cache.getData(),
  async () => ({ data: [], fromCache: true }), // Final fallback
]);

const result = await degradation.execute();
```

## Logger

### Basic Logging

```typescript
import { Logger } from '@the-new-fuse/core-error-handling';

const logger = new Logger('UserService');

logger.info('User created', { userId: '123' });
logger.warn('Rate limit approaching', { remaining: 10 });
logger.error('Failed to create user', error, { userId: '123' });
logger.debug('Processing request', { request });
```

### Structured Logging

```typescript
logger.log({
  level: 'info',
  message: 'User action completed',
  context: {
    userId: 'user-123',
    action: 'update_profile',
    duration: 150,
  },
  timestamp: new Date(),
});
```

### Error Logging

```typescript
try {
  await dangerousOperation();
} catch (error) {
  logger.error('Operation failed', error, {
    operation: 'dangerousOperation',
    userId: 'user-123',
    attempt: 3,
  });

  // Log error with correlation ID for tracking
  logger.errorWithCorrelation('Operation failed', error, 'correlation-id-123', {
    metadata,
  });
}
```

## Error Factory

### Create Errors Consistently

```typescript
import { ErrorFactory } from '@the-new-fuse/core-error-handling';

const factory = new ErrorFactory('UserService');

// Create not found error
const error = factory.notFound('User', 'user-123');

// Create validation error
const error = factory.validation('Invalid email format', 'email');

// Create with custom metadata
const error = factory.create({
  message: 'Custom error',
  code: 5000,
  severity: ErrorSeverity.HIGH,
  category: ErrorCategory.BUSINESS,
  metadata: { custom: 'data' },
});
```

## Usage Examples

### API Error Handling

```typescript
import { Controller, Get, Param } from '@nestjs/common';
import { NotFoundError, Logger } from '@the-new-fuse/core-error-handling';

@Controller('users')
export class UsersController {
  private readonly logger = new Logger('UsersController');

  @Get(':id')
  async getUser(@Param('id') id: string) {
    const user = await this.usersService.findById(id);

    if (!user) {
      this.logger.warn('User not found', { userId: id });
      throw new NotFoundError('User', id);
    }

    return user;
  }
}
```

### Service Layer with Retry

```typescript
import { Injectable } from '@nestjs/common';
import {
  RetryLogic,
  NetworkError,
  Logger,
} from '@the-new-fuse/core-error-handling';

@Injectable()
export class ExternalApiService {
  private readonly logger = new Logger('ExternalApiService');
  private readonly retry = new RetryLogic({
    maxRetries: 3,
    baseDelay: 1000,
    exponentialBackoff: true,
  });

  async fetchData(url: string) {
    return await this.retry.executeWithRetry(async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new NetworkError('API request failed', 1000, {
            endpoint: url,
            statusCode: response.status,
          });
        }
        return await response.json();
      } catch (error) {
        this.logger.error('API request failed', error, { url });
        throw error;
      }
    });
  }
}
```

### Global Exception Filter (NestJS)

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { ApplicationError, Logger } from '@the-new-fuse/core-error-handling';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('GlobalExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status = 500;
    let message = 'Internal server error';
    let code = 5000;

    if (exception instanceof ApplicationError) {
      // Map error codes to HTTP status
      status = this.getHttpStatus(exception);
      message = exception.message;
      code = exception.code;

      // Log error
      this.logger.error('Application error', exception, {
        path: request.url,
        method: request.method,
      });

      response.status(status).json({
        error: {
          message,
          code,
          severity: exception.severity,
          category: exception.category,
          timestamp: exception.timestamp,
          correlationId: exception.correlationId,
        },
      });
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;

      response.status(status).json({
        error: {
          message,
          statusCode: status,
        },
      });
    } else {
      // Unknown error
      this.logger.error('Unhandled exception', exception as Error, {
        path: request.url,
        method: request.method,
      });

      response.status(500).json({
        error: {
          message: 'Internal server error',
          code: 5000,
        },
      });
    }
  }

  private getHttpStatus(error: ApplicationError): number {
    const codeRanges = {
      1000: 503, // Network errors -> Service Unavailable
      2000: 401, // Auth errors -> Unauthorized
      2100: 403, // Authorization -> Forbidden
      3000: 400, // Validation -> Bad Request
      4001: 404, // Not found
      4002: 409, // Conflict
      4005: 429, // Rate limit
      5000: 500, // System errors -> Internal Server Error
      6000: 502, // Integration -> Bad Gateway
      7000: 402, // Payment -> Payment Required
    };

    // Find the closest code range
    const ranges = Object.keys(codeRanges)
      .map(Number)
      .sort((a, b) => b - a);
    for (const range of ranges) {
      if (error.code >= range) {
        return codeRanges[range];
      }
    }

    return 500; // Default
  }
}
```

### Error Monitoring Integration

```typescript
import { Logger, ApplicationError } from '@the-new-fuse/core-error-handling';

class ErrorMonitor {
  private readonly logger = new Logger('ErrorMonitor');

  async reportError(error: ApplicationError) {
    // Log to monitoring service (Sentry, DataDog, etc.)
    const errorData = {
      ...error.toJSON(),
      environment: process.env.NODE_ENV,
      service: 'the-new-fuse',
    };

    // Send to external monitoring
    await this.sendToSentry(errorData);
    await this.sendToDataDog(errorData);

    // Log locally
    this.logger.error('Error reported', error);
  }

  private async sendToSentry(data: any) {
    // Sentry integration
  }

  private async sendToDataDog(data: any) {
    // DataDog integration
  }
}
```

## Integration with The New Fuse Ecosystem

### With Core Package

```typescript
import { Logger as CoreLogger } from '@the-new-fuse/core';
import { Logger as ErrorLogger } from '@the-new-fuse/core-error-handling';

// Use error handling logger for error-specific logging
const errorLogger = new ErrorLogger('ErrorService');

// Use core logger for general application logging
const appLogger = CoreLogger.getInstance();
```

### With Database Package

```typescript
import { DatabaseService } from '@the-new-fuse/database';
import { DatabaseError } from '@the-new-fuse/core-error-handling';

async function queryDatabase() {
  try {
    return await drizzle.user.findMany();
  } catch (error) {
    throw new DatabaseError(
      'Failed to query users',
      'SELECT',
      'SELECT * FROM users',
      error
    );
  }
}
```

### With API Package

```typescript
import { ApplicationError } from '@the-new-fuse/core-error-handling';

// Global error handler automatically converts errors to HTTP responses
// See GlobalExceptionFilter example above
```

## Best Practices

### 1. Always Use Specific Error Classes

```typescript
// ❌ Bad
throw new Error('User not found');

// ✅ Good
throw new NotFoundError('User', userId);
```

### 2. Include Context and Metadata

```typescript
// ❌ Bad
throw new NetworkError('Request failed');

// ✅ Good
throw new NetworkError('Request failed', 1000, {
  endpoint: '/api/users',
  method: 'GET',
  statusCode: 500,
  retryCount: 3,
});
```

### 3. Wrap Third-Party Errors

```typescript
// ✅ Good
try {
  await externalApi.call();
} catch (error) {
  throw new IntegrationError(
    'ExternalAPI',
    'API call failed',
    'fetchData',
    error // Wrap original error
  );
}
```

### 4. Use Appropriate Severity Levels

```typescript
// Critical: Data loss, system failure
throw new SystemError('Database corrupted', 5000, ErrorSeverity.CRITICAL);

// High: Major functionality broken
throw new NetworkError('API unavailable', 1000, ErrorSeverity.HIGH);

// Medium: Degraded functionality
throw new BusinessError('Feature unavailable', 4000, ErrorSeverity.MEDIUM);

// Low: Minor issues, validation errors
throw new ValidationError('Invalid input', 'field', ErrorSeverity.LOW);
```

### 5. Log Errors Properly

```typescript
const logger = new Logger('ServiceName');

try {
  await operation();
} catch (error) {
  // Log with context
  logger.error('Operation failed', error, {
    userId: user.id,
    operation: 'updateProfile',
    attempt: retryCount,
  });

  throw error; // Re-throw or handle
}
```

## Configuration

### Logger Configuration

```typescript
import { Logger } from '@the-new-fuse/core-error-handling';

// Configure log level
Logger.setLogLevel('debug'); // debug, info, warn, error

// Configure output format
Logger.setFormat('json'); // json, text

// Configure transports
Logger.addTransport(new FileTransport('./logs/errors.log'));
```

### Retry Configuration

```typescript
// Global retry configuration
RetryLogic.setDefaultConfig({
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 30000,
  exponentialBackoff: true,
  jitter: true,
});
```

## TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type {
  BaseError,
  ErrorSeverity,
  ErrorCategory,
  IErrorHandler,
  RetryConfig,
  LogLevel,
} from '@the-new-fuse/core-error-handling';
```

## Architecture

```
packages/core-error-handling/
├── src/
│   ├── interfaces/
│   │   └── IErrorHandling.ts     # Error interfaces and types
│   ├── base/
│   │   └── BaseErrorHandler.ts   # Base error handler class
│   ├── errors/
│   │   └── CustomErrors.ts       # All error class definitions
│   ├── utils/
│   │   ├── Logger.ts             # Logger implementation
│   │   ├── ErrorFactory.ts       # Error factory
│   │   ├── RetryLogic.ts         # Retry mechanisms
│   │   └── ErrorMessages.ts      # Error message templates
│   ├── recovery/
│   │   └── RecoveryStrategies.ts # Recovery patterns
│   └── index.ts                  # Package exports
├── dist/                         # Compiled output
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

```json
{
  "dependencies": {
    "events": "^3.3.0"
  },
  "devDependencies": {
    "typescript": "^5.9.3",
    "vitest": "^3.2.4"
  }
}
```

## License

MIT

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Add tests for new error types
4. Submit a pull request

## Support

For issues and questions:

- Open an issue on GitHub
- Check the documentation
- Review error code reference

## Related Packages

- `@the-new-fuse/core` - Core functionality with logging
- `@the-new-fuse/database` - Database operations that use these errors
- `@the-new-fuse/api` - API that uses global exception handling
- `@the-new-fuse/core-auth` - Authentication errors
