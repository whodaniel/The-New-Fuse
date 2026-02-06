# MCP Core Best Practices

This guide outlines best practices for developing, deploying, and maintaining
MCP systems using the MCP Core package.

## Table of Contents

- [Architecture Best Practices](#architecture-best-practices)
- [Security Best Practices](#security-best-practices)
- [Performance Best Practices](#performance-best-practices)
- [Error Handling Best Practices](#error-handling-best-practices)
- [Testing Best Practices](#testing-best-practices)
- [Monitoring and Observability](#monitoring-and-observability)
- [Deployment Best Practices](#deployment-best-practices)
- [Code Organization](#code-organization)
- [Documentation Standards](#documentation-standards)

## Architecture Best Practices

### 1. Design for Scalability

**Use Connection Pooling**

```typescript
// Good: Use connection pooling for multiple clients
const connectionPool = new MCPConnectionPool({
  serverUrl: 'ws://localhost:8080',
  maxConnections: 10,
  idleTimeout: 30000,
});

// Bad: Creating new connections for each request
const client = MCPSystemFactory.createClient(config);
await client.connect(); // Creates new connection every time
```

**Implement Proper Resource Management**

```typescript
// Good: Proper resource cleanup
class ResourceAwareHandler extends ResourceHandler {
  private resources = new Map();

  async dispose(): Promise<void> {
    // Clean up all resources
    for (const [key, resource] of this.resources) {
      await resource.cleanup();
    }
    this.resources.clear();
  }
}

// Bad: No cleanup mechanism
class LeakyHandler extends ResourceHandler {
  private resources = new Map(); // Never cleaned up
}
```

### 2. Implement Circuit Breaker Pattern

```typescript
class CircuitBreakerClient {
  private circuitBreaker = new CircuitBreaker({
    failureThreshold: 5,
    resetTimeout: 30000,
    monitoringPeriod: 10000,
  });

  async callTool(name: string, params: any): Promise<any> {
    return this.circuitBreaker.execute(async () => {
      return this.client.callTool(name, params);
    });
  }
}
```

### 3. Use Proper Abstraction Layers

```typescript
// Good: Abstract interface for different implementations
interface DataStore {
  read(key: string): Promise<any>;
  write(key: string, value: any): Promise<void>;
}

class FileDataStore implements DataStore {
  // File-based implementation
}

class DatabaseDataStore implements DataStore {
  // Database-based implementation
}

// Bad: Tight coupling to specific implementation
class Handler {
  private fileSystem = new FileSystem(); // Tightly coupled
}
```

## Security Best Practices

### 1. Always Validate Input

```typescript
// Good: Comprehensive input validation
class SecureToolHandler extends ToolHandler {
  private ajv = new Ajv({ strict: true });

  async execute(params: any): Promise<any> {
    // Validate against schema
    const valid = this.ajv.validate(this.getSchema(), params);
    if (!valid) {
      throw new MCPError(
        MCPErrorCode.TOOL_VALIDATION_FAILED,
        'Input validation failed',
        { errors: this.ajv.errors }
      );
    }

    // Sanitize input
    const sanitized = this.sanitizeInput(params);

    return this.performOperation(sanitized);
  }

  private sanitizeInput(params: any): any {
    // Remove dangerous properties
    const { __proto__, constructor, ...safe } = params;
    return safe;
  }
}
```

### 2. Implement Proper Authentication

```typescript
// Good: Comprehensive authentication
class AuthenticatedServer extends MCPServer {
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    // Validate authentication
    const token = this.extractToken(request);
    const user = await this.validateToken(token);

    // Check authorization
    const hasPermission = await this.checkPermission(user, request.method);
    if (!hasPermission) {
      throw new MCPError(
        MCPErrorCode.AUTHORIZATION_FAILED,
        'Insufficient permissions'
      );
    }

    // Add user context
    request.meta = { ...request.meta, user };

    return super.handleRequest(request);
  }
}
```

### 3. Use Secure Communication

```typescript
// Good: TLS configuration
const server = MCPSystemFactory.createServer({
  name: 'secure-server',
  version: '1.0.0',
  port: 8443,
  tls: {
    enabled: true,
    cert: fs.readFileSync('server.crt'),
    key: fs.readFileSync('server.key'),
    ca: fs.readFileSync('ca.crt'),
  },
});
```

## Performance Best Practices

### 1. Implement Caching Strategies

```typescript
// Good: Multi-level caching
class CachedResourceHandler extends ResourceHandler {
  private memoryCache = new Map();
  private diskCache = new DiskCache();

  async read(uri: string): Promise<any> {
    // Check memory cache first
    if (this.memoryCache.has(uri)) {
      return this.memoryCache.get(uri);
    }

    // Check disk cache
    const diskCached = await this.diskCache.get(uri);
    if (diskCached) {
      this.memoryCache.set(uri, diskCached);
      return diskCached;
    }

    // Read from source
    const data = await this.readFromSource(uri);

    // Cache at both levels
    this.memoryCache.set(uri, data);
    await this.diskCache.set(uri, data);

    return data;
  }
}
```

### 2. Use Batch Operations

```typescript
// Good: Batch multiple operations
class BatchingClient {
  private pendingRequests: MCPRequest[] = [];
  private batchTimeout: NodeJS.Timeout | null = null;

  async sendRequest(request: MCPRequest): Promise<MCPResponse> {
    return new Promise((resolve, reject) => {
      this.pendingRequests.push({ ...request, resolve, reject });

      if (!this.batchTimeout) {
        this.batchTimeout = setTimeout(() => this.processBatch(), 10);
      }
    });
  }

  private async processBatch(): Promise<void> {
    const batch = this.pendingRequests.splice(0);
    this.batchTimeout = null;

    try {
      const responses = await this.client.sendBatch(batch);
      // Resolve individual promises
      batch.forEach((req, index) => {
        req.resolve(responses[index]);
      });
    } catch (error) {
      batch.forEach((req) => req.reject(error));
    }
  }
}
```

### 3. Optimize Resource Usage

```typescript
// Good: Resource monitoring and limits
class ResourceOptimizedServer extends MCPServer {
  private resourceMonitor = new ResourceMonitor({
    maxMemoryUsage: 512 * 1024 * 1024, // 512MB
    maxCpuUsage: 80, // 80%
    checkInterval: 5000,
  });

  constructor(config: MCPServerConfig) {
    super(config);

    this.resourceMonitor.on('memoryWarning', () => {
      this.triggerGarbageCollection();
    });

    this.resourceMonitor.on('cpuWarning', () => {
      this.throttleRequests();
    });
  }
}
```

## Error Handling Best Practices

### 1. Use Structured Error Handling

```typescript
// Good: Structured error handling with context
class RobustHandler extends ToolHandler {
  async execute(params: any): Promise<any> {
    const context = {
      toolName: this.name,
      params: this.sanitizeForLogging(params),
      timestamp: new Date().toISOString(),
      requestId: params.requestId,
    };

    try {
      return await this.performOperation(params);
    } catch (error) {
      // Log with context
      this.logger.error('Tool execution failed', { error, context });

      // Transform to appropriate MCP error
      if (error instanceof ValidationError) {
        throw new MCPError(MCPErrorCode.TOOL_VALIDATION_FAILED, error.message, {
          context,
          originalError: error.message,
        });
      } else if (error instanceof TimeoutError) {
        throw new MCPError(
          MCPErrorCode.TOOL_TIMEOUT,
          'Tool execution timed out',
          { context, timeout: error.timeout }
        );
      } else {
        throw new MCPError(
          MCPErrorCode.TOOL_EXECUTION_FAILED,
          'Tool execution failed',
          { context, originalError: error.message }
        );
      }
    }
  }
}
```

### 2. Implement Retry Logic with Backoff

```typescript
// Good: Exponential backoff retry
class RetryableClient {
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxAttempts = 3
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        if (!this.isRetryable(error) || attempt === maxAttempts) {
          throw error;
        }

        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
        await this.sleep(delay);
      }
    }

    throw lastError!;
  }

  private isRetryable(error: any): boolean {
    return (
      error instanceof MCPError &&
      [
        MCPErrorCode.SERVICE_UNAVAILABLE,
        MCPErrorCode.CONNECTION_TIMEOUT,
      ].includes(error.code)
    );
  }
}
```

## Testing Best Practices

### 1. Write Comprehensive Unit Tests

```typescript
// Good: Comprehensive test coverage
describe('TextProcessorTool', () => {
  let tool: TextProcessorTool;

  beforeEach(() => {
    tool = new TextProcessorTool();
  });

  describe('execute', () => {
    it('should uppercase text correctly', async () => {
      const result = await tool.execute({
        text: 'hello world',
        operation: 'uppercase',
      });

      expect(result.result).toBe('HELLO WORLD');
      expect(result.operation).toBe('uppercase');
    });

    it('should handle empty text', async () => {
      const result = await tool.execute({
        text: '',
        operation: 'uppercase',
      });

      expect(result.result).toBe('');
    });

    it('should throw error for invalid operation', async () => {
      await expect(
        tool.execute({
          text: 'hello',
          operation: 'invalid',
        })
      ).rejects.toThrow('Unknown operation: invalid');
    });
  });

  describe('validate', () => {
    it('should validate correct parameters', async () => {
      const valid = await tool.validate({
        text: 'hello',
        operation: 'uppercase',
      });

      expect(valid).toBe(true);
    });

    it('should reject invalid parameters', async () => {
      const valid = await tool.validate({
        text: 123,
        operation: 'uppercase',
      });

      expect(valid).toBe(false);
    });
  });
});
```

### 2. Use Integration Tests

```typescript
// Good: End-to-end integration tests
describe('MCP Server Integration', () => {
  let server: MCPServer;
  let client: MCPClient;

  beforeAll(async () => {
    server = MCPSystemFactory.createServer({
      name: 'test-server',
      version: '1.0.0',
      port: 8081,
    });

    await server.registerTool(
      {
        name: 'echo',
        description: 'Echo tool',
        inputSchema: { type: 'object' },
      },
      new EchoTool()
    );

    await server.start();

    client = MCPSystemFactory.createClient({
      serverUrl: 'ws://localhost:8081',
    });

    await client.connect();
  });

  afterAll(async () => {
    await client.disconnect();
    await server.stop();
  });

  it('should handle tool execution end-to-end', async () => {
    const result = await client.callTool('echo', {
      message: 'test message',
    });

    expect(result.echo).toBe('test message');
  });
});
```

## Monitoring and Observability

### 1. Implement Comprehensive Logging

```typescript
// Good: Structured logging with correlation IDs
class ObservableServer extends MCPServer {
  private logger = new Logger({
    level: 'info',
    format: 'json',
    includeCorrelationId: true,
  });

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const correlationId =
      request.meta?.correlationId || this.generateCorrelationId();
    const startTime = Date.now();

    this.logger.info('Request received', {
      correlationId,
      method: request.method,
      id: request.id,
    });

    try {
      const response = await super.handleRequest(request);
      const duration = Date.now() - startTime;

      this.logger.info('Request completed', {
        correlationId,
        method: request.method,
        id: request.id,
        duration,
        success: !response.error,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error('Request failed', {
        correlationId,
        method: request.method,
        id: request.id,
        duration,
        error: error.message,
      });

      throw error;
    }
  }
}
```

### 2. Add Health Checks

```typescript
// Good: Comprehensive health checks
class HealthCheckServer extends MCPServer {
  private healthChecks = new Map<string, HealthCheck>();

  constructor(config: MCPServerConfig) {
    super(config);
    this.setupHealthChecks();
  }

  private setupHealthChecks(): void {
    this.healthChecks.set('memory', {
      name: 'Memory Usage',
      check: () => {
        const usage = process.memoryUsage();
        const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
        return {
          healthy: heapPercent < 90,
          details: { heapPercent, heapUsed: usage.heapUsed },
        };
      },
    });

    this.healthChecks.set('connections', {
      name: 'Active Connections',
      check: () => {
        const activeConnections = this.getActiveConnectionCount();
        return {
          healthy: activeConnections < this.config.maxConnections * 0.9,
          details: {
            activeConnections,
            maxConnections: this.config.maxConnections,
          },
        };
      },
    });
  }

  async getHealthStatus(): Promise<HealthStatus> {
    const results = new Map();

    for (const [name, check] of this.healthChecks) {
      try {
        results.set(name, await check.check());
      } catch (error) {
        results.set(name, {
          healthy: false,
          error: error.message,
        });
      }
    }

    const allHealthy = Array.from(results.values()).every((r) => r.healthy);

    return {
      healthy: allHealthy,
      checks: Object.fromEntries(results),
      timestamp: new Date().toISOString(),
    };
  }
}
```

## Deployment Best Practices

### 1. Use Environment-Specific Configuration

```typescript
// Good: Environment-based configuration
class ConfigManager {
  static getConfig(): MCPServerConfig {
    const env = process.env.NODE_ENV || 'development';

    const baseConfig = {
      name: 'mcp-server',
      version: process.env.APP_VERSION || '1.0.0',
    };

    switch (env) {
      case 'production':
        return {
          ...baseConfig,
          port: parseInt(process.env.PORT || '8080'),
          maxConnections: 1000,
          rateLimiting: {
            enabled: true,
            maxRequestsPerMinute: 1000,
          },
          logging: {
            level: 'info',
            format: 'json',
          },
          security: {
            enableAuth: true,
            enableCors: false,
          },
        };

      case 'development':
        return {
          ...baseConfig,
          port: 8080,
          maxConnections: 10,
          logging: {
            level: 'debug',
            format: 'text',
          },
          security: {
            enableAuth: false,
            enableCors: true,
          },
        };

      default:
        throw new Error(`Unknown environment: ${env}`);
    }
  }
}
```

### 2. Implement Graceful Shutdown

```typescript
// Good: Graceful shutdown handling
class GracefulServer extends MCPServer {
  private isShuttingDown = false;

  constructor(config: MCPServerConfig) {
    super(config);
    this.setupGracefulShutdown();
  }

  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      if (this.isShuttingDown) return;

      console.log(`Received ${signal}, starting graceful shutdown...`);
      this.isShuttingDown = true;

      try {
        // Stop accepting new connections
        await this.stopAcceptingConnections();

        // Wait for existing requests to complete
        await this.waitForActiveRequests(30000); // 30 second timeout

        // Close all connections
        await this.closeAllConnections();

        // Stop the server
        await this.stop();

        console.log('Graceful shutdown completed');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    if (this.isShuttingDown) {
      throw new MCPError(
        MCPErrorCode.SERVICE_UNAVAILABLE,
        'Server is shutting down'
      );
    }

    return super.handleRequest(request);
  }
}
```

## Code Organization

### 1. Use Proper Project Structure

```
src/
├── interfaces/          # Core interfaces
├── types/              # Type definitions
├── server/             # Server implementation
├── client/             # Client implementation
├── handlers/           # Resource and tool handlers
├── validation/         # Input validation
├── auth/              # Authentication & authorization
├── monitoring/        # Monitoring and metrics
├── utils/             # Utility functions
└── index.ts           # Main exports
```

### 2. Follow Naming Conventions

```typescript
// Good: Clear, descriptive names
class DatabaseResourceHandler extends ResourceHandler {
  async readUserRecord(userId: string): Promise<UserRecord> {
    // Implementation
  }
}

interface UserAuthenticationConfig {
  tokenExpirationTime: number;
  refreshTokenEnabled: boolean;
  multiFactorAuthRequired: boolean;
}

// Bad: Unclear, abbreviated names
class DbRH extends ResourceHandler {
  async rd(id: string): Promise<any> {
    // Implementation
  }
}
```

These best practices will help you build robust, scalable, and maintainable MCP
systems. Always consider the specific requirements of your use case and adapt
these practices accordingly.
