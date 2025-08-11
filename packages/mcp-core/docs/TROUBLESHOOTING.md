# MCP Core Troubleshooting Guide

This guide helps you diagnose and resolve common issues when working with the MCP Core package.

## Table of Contents

- [Common Issues](#common-issues)
- [Connection Problems](#connection-problems)
- [Performance Issues](#performance-issues)
- [Resource Management Issues](#resource-management-issues)
- [Tool Execution Problems](#tool-execution-problems)
- [Validation Errors](#validation-errors)
- [Memory and Resource Leaks](#memory-and-resource-leaks)
- [Debugging Techniques](#debugging-techniques)
- [Error Codes Reference](#error-codes-reference)
- [Getting Help](#getting-help)

## Common Issues

### Issue: Server Fails to Start

**Symptoms:**
```
Error: listen EADDRINUSE :::8080
```

**Causes:**
- Port already in use by another process
- Permission denied for port binding (ports < 1024 require root)
- Invalid server configuration

**Solutions:**

1. **Check port usage:**
```bash
# On macOS/Linux
lsof -i :8080
netstat -tulpn | grep :8080

# On Windows  
netstat -ano | findstr :8080
```

2. **Use a different port:**
```typescript
const server = MCPSystemFactory.createServer({
  name: 'my-server',
  version: '1.0.0',
  port: 8081  // Changed from 8080
});
```

3. **Kill conflicting process:**
```bash
# Find and kill process using the port
kill -9 $(lsof -ti:8080)
```

4. **Check server configuration:**
```typescript
// Validate configuration before starting
const config: MCPServerConfig = {
  name: 'test-server',
  version: '1.0.0',
  port: 8080,
  host: '0.0.0.0',  // Ensure valid host
  maxConnections: 100
};

// Add error handling
try {
  await server.start(config);
  console.log('Server started successfully');
} catch (error) {
  console.error('Server start failed:', error.message);
}
```

### Issue: Client Connection Refused

**Symptoms:**
```
Error: connect ECONNREFUSED 127.0.0.1:8080
```

**Causes:**
- Server not running
- Wrong server address/port
- Network connectivity issues
- Firewall blocking connection

**Solutions:**

1. **Verify server is running:**
```bash
curl -I http://localhost:8080
telnet localhost 8080
```

2. **Check client configuration:**
```typescript
const client = MCPSystemFactory.createClient({
  serverUrl: 'ws://localhost:8080',  // Ensure correct protocol and port
  connectionTimeout: 10000,         // Increase timeout
  maxRetries: 5                     // Allow retries
});

try {
  await client.connect();
} catch (error) {
  console.error('Connection failed:', error.message);
  // Check if server is reachable
}
```

3. **Test connection manually:**
```typescript
// Add connection diagnostics
async function testConnection(url: string) {
  try {
    const response = await fetch(url.replace('ws://', 'http://'));
    console.log('HTTP check successful:', response.status);
  } catch (error) {
    console.error('HTTP check failed:', error.message);
  }
}

await testConnection('http://localhost:8080');
```

## Connection Problems

### WebSocket Connection Issues

**Symptoms:**
- Intermittent connection drops
- WebSocket upgrade failures
- Connection timeouts

**Diagnosis:**
```typescript
import { MCPSystemFactory } from '@the-new-fuse/mcp-core';

const client = MCPSystemFactory.createClient({
  serverUrl: 'ws://localhost:8080',
  connectionTimeout: 5000,
  maxRetries: 3,
  keepAlive: true,
  heartbeatInterval: 30000
});

// Add connection event handlers
client.on('connect', () => console.log('Connected'));
client.on('disconnect', (reason) => console.log('Disconnected:', reason));
client.on('error', (error) => console.error('Connection error:', error));
client.on('reconnect', (attempt) => console.log('Reconnecting attempt:', attempt));

// Monitor connection health
setInterval(async () => {
  const health = await client.getConnectionHealth();
  console.log('Connection health:', health);
}, 10000);
```

**Solutions:**

1. **Configure connection pooling:**
```typescript
const client = MCPSystemFactory.createClient({
  serverUrl: 'ws://localhost:8080',
  connectionPool: {
    maxConnections: 10,
    idleTimeout: 30000,
    reconnectDelay: 1000
  }
});
```

2. **Implement retry logic:**
```typescript
async function connectWithRetry(client: MCPClient, maxAttempts = 5) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await client.connect();
      console.log(`Connected on attempt ${attempt}`);
      return;
    } catch (error) {
      console.warn(`Connection attempt ${attempt} failed:`, error.message);
      
      if (attempt === maxAttempts) {
        throw new Error(`Failed to connect after ${maxAttempts} attempts`);
      }
      
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### Network Proxy Issues

**Symptoms:**
- Connection works locally but fails through proxy
- SSL certificate errors

**Solutions:**

1. **Configure proxy settings:**
```typescript
const client = MCPSystemFactory.createClient({
  serverUrl: 'wss://remote-server:8080',
  proxy: {
    host: 'proxy.company.com',
    port: 8080,
    auth: {
      username: 'user',
      password: 'pass'
    }
  },
  tls: {
    rejectUnauthorized: false  // Only for development
  }
});
```

2. **Handle corporate firewalls:**
```typescript
// Use HTTP tunneling for WebSocket connections
const client = MCPSystemFactory.createClient({
  serverUrl: 'wss://server.company.com:443/mcp',
  transport: {
    type: 'websocket-tunnel',
    tunnelUrl: 'https://proxy.company.com/tunnel'
  }
});
```

## Performance Issues

### High Memory Usage

**Symptoms:**
- Memory usage continuously increases
- Out of memory errors
- Slow garbage collection

**Diagnosis:**
```typescript
import { PerformanceMonitor } from '@the-new-fuse/mcp-core/monitoring';

const monitor = new PerformanceMonitor(server);

monitor.on('memoryWarning', (usage) => {
  console.warn('High memory usage:', {
    heapUsed: `${(usage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
    heapTotal: `${(usage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
    external: `${(usage.external / 1024 / 1024).toFixed(2)}MB`
  });
});

// Monitor for memory leaks
setInterval(() => {
  const usage = process.memoryUsage();
  if (usage.heapUsed > 500 * 1024 * 1024) { // 500MB threshold
    console.warn('Possible memory leak detected');
    // Trigger garbage collection if needed
    if (global.gc) {
      global.gc();
    }
  }
}, 30000);
```

**Solutions:**

1. **Configure resource limits:**
```typescript
const server = MCPSystemFactory.createServer({
  name: 'memory-efficient-server',
  version: '1.0.0',
  performance: {
    maxMemoryUsage: 256 * 1024 * 1024,  // 256MB limit
    memoryCheckInterval: 10000,
    enableGarbageCollection: true
  }
});
```

2. **Implement resource cleanup:**
```typescript
class ResourceAwareHandler extends ResourceHandler {
  private cache = new Map();
  private readonly maxCacheSize = 1000;

  async read(uri: string): Promise<any> {
    // Check cache first
    if (this.cache.has(uri)) {
      return this.cache.get(uri);
    }

    const data = await this.readFromSource(uri);
    
    // Implement LRU cache
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(uri, data);
    return data;
  }

  // Clean up on shutdown
  dispose() {
    this.cache.clear();
  }
}
```

### Slow Response Times

**Symptoms:**
- High latency for requests
- Timeout errors
- Poor throughput

**Diagnosis:**
```typescript
import { RequestProfiler } from '@the-new-fuse/mcp-core/profiling';

const profiler = new RequestProfiler();

class ProfiledMCPServer extends MCPServer {
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const profile = profiler.start(request.method);
    
    try {
      const response = await super.handleRequest(request);
      profile.end('success');
      return response;
    } catch (error) {
      profile.end('error');
      throw error;
    }
  }
}

// Monitor slow requests
profiler.on('slowRequest', (profile) => {
  console.warn('Slow request detected:', {
    method: profile.method,
    duration: profile.duration,
    stackTrace: profile.stackTrace
  });
});
```

**Solutions:**

1. **Enable request batching:**
```typescript
const server = MCPSystemFactory.createServer({
  name: 'high-performance-server',
  version: '1.0.0',
  performance: {
    enableRequestBatching: true,
    batchSize: 10,
    batchTimeout: 50
  }
});
```

2. **Implement caching strategy:**
```typescript
import { CacheManager } from '@the-new-fuse/mcp-core/caching';

const cache = new CacheManager({
  maxSize: 10000,
  ttl: 300000,  // 5 minutes
  strategy: 'lru'
});

class CachedResourceHandler extends ResourceHandler {
  async read(uri: string): Promise<any> {
    const cacheKey = `resource:${uri}`;
    
    // Check cache first
    const cached = await cache.get(cacheKey);
    if (cached) {
      return cached;
    }
    
    // Read from source
    const data = await this.readFromSource(uri);
    
    // Cache the result
    await cache.set(cacheKey, data);
    
    return data;
  }
}
```

## Resource Management Issues

### Resource Not Found Errors

**Symptoms:**
```
MCPError: Resource not found: file:///path/to/missing.txt
```

**Diagnosis:**
```typescript
class DiagnosticResourceHandler extends ResourceHandler {
  async read(uri: string): Promise<any> {
    console.log(`Attempting to read resource: ${uri}`);
    
    try {
      return await this.readResource(uri);
    } catch (error) {
      console.error(`Failed to read ${uri}:`, {
        error: error.message,
        exists: await this.resourceExists(uri),
        permissions: await this.checkPermissions(uri),
        metadata: await this.getMetadata(uri).catch(() => null)
      });
      throw error;
    }
  }

  private async resourceExists(uri: string): Promise<boolean> {
    try {
      await this.getMetadata(uri);
      return true;
    } catch {
      return false;
    }
  }

  private async checkPermissions(uri: string): Promise<any> {
    // Implement permission checking logic
    return { read: true, write: false };
  }
}
```

**Solutions:**

1. **Implement proper URI handling:**
```typescript
class RobustFileHandler extends ResourceHandler {
  private basePath: string;

  constructor(basePath: string) {
    super();
    this.basePath = path.resolve(basePath);
  }

  async read(uri: string): Promise<any> {
    const filePath = this.resolveUri(uri);
    
    // Security check - ensure path is within base directory
    if (!filePath.startsWith(this.basePath)) {
      throw new Error(`Access denied: ${uri} is outside allowed directory`);
    }

    try {
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        return this.listDirectory(filePath);
      } else {
        return this.readFile(filePath);
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        throw new MCPError(MCPErrorCode.RESOURCE_NOT_FOUND, `Resource not found: ${uri}`);
      }
      throw error;
    }
  }

  private resolveUri(uri: string): string {
    const url = new URL(uri);
    return path.resolve(this.basePath, url.pathname.slice(1));
  }
}
```

### Permission Denied Errors

**Solutions:**

1. **Implement proper access control:**
```typescript
interface ResourcePermissions {
  read: boolean;
  write: boolean;
  execute: boolean;
  roles?: string[];
}

class SecureResourceHandler extends ResourceHandler {
  private permissions: Map<string, ResourcePermissions> = new Map();

  async read(uri: string): Promise<any> {
    await this.checkPermission(uri, 'read');
    return this.performRead(uri);
  }

  async write(uri: string, data: any): Promise<void> {
    await this.checkPermission(uri, 'write');
    return this.performWrite(uri, data);
  }

  private async checkPermission(uri: string, operation: 'read' | 'write' | 'execute'): Promise<void> {
    const perms = this.permissions.get(uri) || { read: true, write: false, execute: false };
    
    if (!perms[operation]) {
      throw new MCPError(
        MCPErrorCode.RESOURCE_ACCESS_DENIED,
        `${operation} access denied for resource: ${uri}`
      );
    }
  }

  setPermissions(uri: string, permissions: ResourcePermissions): void {
    this.permissions.set(uri, permissions);
  }
}
```

## Tool Execution Problems

### Tool Timeout Issues

**Symptoms:**
- Tools fail with timeout errors
- Long-running operations interrupted

**Solutions:**

1. **Configure appropriate timeouts:**
```typescript
const toolEngine = MCPSystemFactory.createToolEngine({
  defaultTimeout: 60000,        // 1 minute default
  maxTimeout: 300000,           // 5 minute maximum
  enableTimeoutExtension: true  // Allow tools to request more time
});

class LongRunningToolHandler extends ToolHandler {
  async execute(params: any): Promise<any> {
    // Request extended timeout for long operations
    if (params.longRunning) {
      this.requestTimeoutExtension(300000); // 5 minutes
    }

    return this.performLongOperation(params);
  }
}
```

2. **Implement progress reporting:**
```typescript
class ProgressReportingTool extends ToolHandler {
  async execute(params: any): Promise<any> {
    const total = params.items.length;
    const results = [];

    for (let i = 0; i < total; i++) {
      const item = params.items[i];
      const result = await this.processItem(item);
      results.push(result);

      // Report progress
      this.reportProgress({
        current: i + 1,
        total,
        percentage: Math.round(((i + 1) / total) * 100),
        message: `Processed ${i + 1} of ${total} items`
      });
    }

    return { results, total: results.length };
  }
}
```

### Tool Validation Failures

**Solutions:**

1. **Improve input validation:**
```typescript
class RobustToolHandler extends ToolHandler {
  private ajv = new Ajv({ allErrors: true });

  async validate(params: any): Promise<boolean> {
    const schema = this.getInputSchema();
    const validate = this.ajv.compile(schema);
    const valid = validate(params);

    if (!valid) {
      const errors = validate.errors?.map(error => ({
        path: error.instancePath,
        message: error.message,
        value: error.data
      }));

      console.error('Validation errors:', errors);
      throw new MCPError(
        MCPErrorCode.TOOL_VALIDATION_FAILED,
        `Input validation failed: ${errors?.map(e => e.message).join(', ')}`,
        { errors }
      );
    }

    return true;
  }

  protected getInputSchema(): object {
    return {
      type: 'object',
      properties: {
        input: { type: 'string', minLength: 1, maxLength: 1000 },
        options: {
          type: 'object',
          properties: {
            format: { type: 'string', enum: ['json', 'csv', 'xml'] },
            includeHeaders: { type: 'boolean' }
          },
          additionalProperties: false
        }
      },
      required: ['input'],
      additionalProperties: false
    };
  }
}
```

## Validation Errors

### JSON-RPC Format Errors

**Symptoms:**
```
Error: Invalid request: missing jsonrpc field
Error: Invalid request: jsonrpc must be '2.0'
```

**Solutions:**

1. **Ensure proper message format:**
```typescript
// Correct message format
const validRequest: MCPRequest = {
  jsonrpc: '2.0',           // Required, must be exactly '2.0'
  id: 'unique-id-123',      // Required for requests
  method: 'resources/list', // Required
  params: {}                // Optional
};

// Use message builder for safety
class MCPMessageBuilder {
  static createRequest(method: string, params?: any, id?: string | number): MCPRequest {
    return {
      jsonrpc: '2.0',
      id: id ?? this.generateId(),
      method,
      params
    };
  }

  static createResponse(id: string | number, result?: any, error?: MCPError): MCPResponse {
    const response: MCPResponse = {
      jsonrpc: '2.0',
      id
    };

    if (error) {
      response.error = error;
    } else {
      response.result = result;
    }

    return response;
  }

  private static generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Schema Validation Errors

**Solutions:**

1. **Use comprehensive validation:**
```typescript
import { mcpValidator } from '@the-new-fuse/mcp-core';

class ValidatedMCPServer extends MCPServer {
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    // Validate request format
    const validation = mcpValidator.validateMCPRequest(request);
    if (!validation.valid) {
      return MCPMessageBuilder.createResponse(
        request.id,
        undefined,
        new MCPError(
          MCPErrorCode.INVALID_REQUEST,
          `Request validation failed: ${validation.errors.map(e => e.message).join(', ')}`,
          { errors: validation.errors }
        )
      );
    }

    try {
      return await super.handleRequest(request);
    } catch (error) {
      return MCPMessageBuilder.createResponse(
        request.id,
        undefined,
        error instanceof MCPError ? error : new MCPError(
          MCPErrorCode.INTERNAL_ERROR,
          error.message
        )
      );
    }
  }
}
```

## Memory and Resource Leaks

### Event Listener Leaks

**Symptoms:**
```
(node:1234) MaxListenersExceededWarning: Possible EventEmitter memory leak detected
```

**Solutions:**

1. **Proper event listener cleanup:**
```typescript
class CleanupAwareMCPServer extends MCPServer {
  private subscriptions: Set<() => void> = new Set();

  async registerResource(resource: MCPResource, handler: ResourceHandler): Promise<void> {
    await super.registerResource(resource, handler);

    // Track cleanup functions
    if (handler.subscribe) {
      const cleanup = await handler.subscribe(resource.uri, (data) => {
        this.handleResourceChange(resource.uri, data);
      });
      
      this.subscriptions.add(cleanup);
    }
  }

  async stop(): Promise<void> {
    // Clean up all subscriptions
    for (const cleanup of this.subscriptions) {
      try {
        cleanup();
      } catch (error) {
        console.warn('Error during cleanup:', error);
      }
    }
    this.subscriptions.clear();

    await super.stop();
  }
}
```

2. **Use weak references for caching:**
```typescript
class WeakCacheManager {
  private cache = new WeakMap();
  private keys = new Set();

  set(key: object, value: any): void {
    this.cache.set(key, value);
    this.keys.add(key);
  }

  get(key: object): any {
    return this.cache.get(key);
  }

  cleanup(): void {
    // Remove stale keys
    for (const key of this.keys) {
      if (!this.cache.has(key)) {
        this.keys.delete(key);
      }
    }
  }
}
```

## Debugging Techniques

### Enable Debug Logging

```typescript
import { Logger } from '@the-new-fuse/mcp-core/logging';

// Configure detailed logging
const logger = new Logger({
  level: 'debug',
  format: 'json',
  includeStackTrace: true,
  includeTimestamp: true
});

const server = MCPSystemFactory.createServer({
  name: 'debug-server',
  version: '1.0.0',
  logging: {
    level: 'debug',
    enableRequestLogging: true,
    enableResponseLogging: true,
    enableErrorLogging: true
  }
});
```

### Request/Response Tracing

```typescript
class TracingMCPServer extends MCPServer {
  async handleRequest(request: MCPRequest): Promise<MCPResponse> {
    const traceId = this.generateTraceId();
    
    console.log(`[${traceId}] Incoming request:`, {
      method: request.method,
      id: request.id,
      params: request.params
    });

    const startTime = Date.now();
    
    try {
      const response = await super.handleRequest(request);
      const duration = Date.now() - startTime;
      
      console.log(`[${traceId}] Response (${duration}ms):`, {
        id: response.id,
        success: !response.error,
        error: response.error?.message
      });
      
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      console.error(`[${traceId}] Error (${duration}ms):`, error);
      throw error;
    }
  }

  private generateTraceId(): string {
    return `trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

### Health Monitoring

```typescript
import { HealthChecker } from '@the-new-fuse/mcp-core/health';

const healthChecker = new HealthChecker({
  server,
  checkInterval: 30000,
  checks: [
    {
      name: 'memory-usage',
      check: () => {
        const usage = process.memoryUsage();
        const heapPercent = (usage.heapUsed / usage.heapTotal) * 100;
        return {
          healthy: heapPercent < 90,
          details: { heapPercent, heapUsed: usage.heapUsed }
        };
      }
    },
    {
      name: 'database-connection',
      check: async () => {
        try {
          await this.database.ping();
          return { healthy: true };
        } catch (error) {
          return { healthy: false, error: error.message };
        }
      }
    }
  ]
});

healthChecker.on('unhealthy', (check) => {
  console.error(`Health check failed: ${check.name}`, check.details);
  
  // Implement alerting logic
  this.sendAlert(`Health check ${check.name} failed`, check.details);
});
```

## Error Codes Reference

### JSON-RPC Standard Errors

| Code | Name | Description |
|------|------|-------------|
| -32700 | Parse Error | Invalid JSON was received |
| -32600 | Invalid Request | The JSON sent is not a valid Request object |
| -32601 | Method Not Found | The method does not exist / is not available |
| -32602 | Invalid Params | Invalid method parameter(s) |
| -32603 | Internal Error | Internal JSON-RPC error |

### MCP-Specific Errors

| Code | Name | Description | Retryable |
|------|------|-------------|-----------|
| -32000 | Resource Not Found | Requested resource does not exist | No |
| -32001 | Resource Access Denied | Permission denied for resource | No |
| -32002 | Resource Unavailable | Resource temporarily unavailable | Yes |
| -32010 | Tool Not Found | Requested tool does not exist | No |
| -32011 | Tool Execution Failed | Tool execution error | Depends |
| -32012 | Tool Validation Failed | Tool input validation failed | No |
| -32013 | Tool Timeout | Tool execution timed out | Yes |
| -32020 | Service Unavailable | MCP service is unavailable | Yes |
| -32021 | Service Overloaded | MCP service is overloaded | Yes |
| -32030 | Authentication Failed | Authentication credentials invalid | No |
| -32031 | Authorization Failed | Insufficient permissions | No |

## Getting Help

### Diagnostic Information

When reporting issues, include:

```typescript
// Generate diagnostic report
function generateDiagnosticReport() {
  return {
    timestamp: new Date().toISOString(),
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage()
    },
    mcp: {
      version: require('@the-new-fuse/mcp-core/package.json').version,
      serverConfig: server.getConfig(),
      activeConnections: server.getConnectionCount(),
      registeredResources: server.getResourceCount(),
      registeredTools: server.getToolCount()
    },
    performance: {
      uptime: process.uptime(),
      requestsHandled: server.getMetrics().totalRequests,
      averageResponseTime: server.getMetrics().averageResponseTime,
      errorRate: server.getMetrics().errorRate
    }
  };
}
```

### Support Channels

1. **GitHub Issues**: For bugs and feature requests
2. **Documentation**: Comprehensive guides and API reference
3. **Community Discord**: Real-time help and discussion
4. **Stack Overflow**: Tag questions with `mcp-core`

### Before Reporting Issues

1. Check the troubleshooting guide
2. Review recent changes to your code
3. Test with minimal reproduction case
4. Check network connectivity and permissions
5. Enable debug logging
6. Generate diagnostic report

Remember to never include sensitive information (API keys, passwords, personal data) in issue reports or diagnostic information.