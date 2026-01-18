# Cloud Sandbox Security Integration Guide

This guide shows how to integrate the new RBAC and multi-tenant security system
into the existing cloud sandbox server.

## Overview

The security system provides:

- **Authentication**: JWT tokens and API keys for agents/humans
- **Authorization**: Role-based and capability-based access control
- **Multi-tenancy**: Strict isolation with resource quotas
- **Audit Logging**: Complete audit trail of all operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   WebSocket Connection                       │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         CloudSandboxAuthGuard                                │
│   ┌──────────────┐           ┌────────────────┐            │
│   │  JWT Tokens  │           │  API Keys      │            │
│   └──────────────┘           └────────────────┘            │
│                                                              │
│   Returns: AuthenticatedUser {                              │
│     id, type, role, tenantId, capabilities, permissions     │
│   }                                                          │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         Tool Execution Request                               │
│         (browser_navigate, run_command, etc.)                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    ToolPermissionChecker                                     │
│    • Validates user has required permissions                │
│    • Checks agent capabilities                              │
│    • Performs security checks for high-risk tools           │
│    • Blocks dangerous commands                              │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    TenantIsolationService                                    │
│    • Enforces resource quotas                               │
│    • Rate limiting (hourly/daily)                           │
│    • Concurrent execution limits                            │
│    • Storage limits                                         │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    Tool Handler Execution                                    │
│    (Original MCP tool logic)                                │
└───────────────────────┬─────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│    AuditLogger                                               │
│    • Log all attempts (success/failure)                     │
│    • Security alerts                                        │
│    • Compliance audit trail                                │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Integration

### 1. Initialize Security Module

Add to the top of `server.ts`:

```typescript
import { SecureCloudSandboxModule } from './auth/SecureCloudSandboxModule';

// Initialize security module
const securityModule = new SecureCloudSandboxModule();
```

### 2. Update ConnectedClient Interface

Replace the current `ConnectedClient` interface:

```typescript
// OLD (INSECURE)
interface ConnectedClient {
  id: string;
  ws: WebSocket;
  authenticated: boolean; // Always true!
  lastActivity: Date;
}

// NEW (SECURE)
import type { AuthenticatedUser } from './auth/CloudSandboxAuthGuard';

interface ConnectedClient {
  id: string;
  ws: WebSocket;
  user: AuthenticatedUser; // Real user/agent context
  lastActivity: Date;
}
```

### 3. Secure WebSocket Connection Handler

Replace the WebSocket connection handler:

```typescript
// OLD (INSECURE)
wss.on('connection', (ws: WebSocket) => {
  const clientId = uuidv4();
  const client: ConnectedClient = {
    id: clientId,
    ws,
    authenticated: true, // TODO: Implement authentication
    lastActivity: new Date(),
  };
  clients.set(clientId, client);
});

// NEW (SECURE)
wss.on('connection', async (ws: WebSocket, request: any) => {
  const clientId = uuidv4();

  // Extract headers
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(request.headers || {})) {
    headers[key] = Array.isArray(value) ? value[0] : (value as string);
  }

  // Authenticate connection
  const authResult = await securityModule.authenticateConnection(headers);

  if (!authResult.authenticated || !authResult.user) {
    logger.warn(
      `Authentication failed for client ${clientId}: ${authResult.error}`
    );
    ws.send(
      JSON.stringify({
        jsonrpc: '2.0',
        error: {
          code: -32001,
          message: 'Authentication required',
          data: authResult.error,
        },
      })
    );
    ws.close(1008, 'Authentication failed'); // Policy violation
    return;
  }

  const client: ConnectedClient = {
    id: clientId,
    ws,
    user: authResult.user,
    lastActivity: new Date(),
  };

  clients.set(clientId, client);

  logger.log(
    `Client connected: ${client.user.type}:${client.user.id} (${client.user.role}) ` +
      `from tenant ${client.user.tenantId}`
  );

  // ... rest of connection logic
});
```

### 4. Secure Tool Execution

Replace the tool handler execution logic:

```typescript
// OLD (INSECURE)
const tools: ToolHandler[] = [
  {
    name: 'browser_navigate',
    handler: async (params) => {
      // No permission check!
      const page = await getPage();
      await page.goto(params.url as string);
      return { success: true };
    },
  },
  // ... more tools
];

// NEW (SECURE)
const tools: ToolHandler[] = [
  {
    name: 'browser_navigate',
    description: 'Navigate the headless browser to a URL',
    handler: async (params, client: ConnectedClient) => {
      // Wrap with security
      return await securityModule.executeSecuredTool(
        {
          user: client.user,
          toolName: 'browser_navigate',
          params,
        },
        async (params) => {
          // Original tool logic
          const page = await getPage();
          await page.goto(params.url as string);
          const title = await page.title();
          return {
            success: true,
            url: page.url(),
            title,
          };
        }
      );
    },
  },
  {
    name: 'run_command',
    description: 'Execute a shell command in the sandbox',
    handler: async (params, client: ConnectedClient) => {
      return await securityModule.executeSecuredTool(
        {
          user: client.user,
          toolName: 'run_command',
          params,
        },
        async (params) => {
          // Security module already checked for dangerous commands
          const { stdout, stderr } = await execAsync(params.command as string);
          return { success: true, stdout, stderr };
        }
      );
    },
  },
  {
    name: 'write_file',
    description: 'Write a file to the sandbox filesystem',
    handler: async (params, client: ConnectedClient) => {
      return await securityModule.executeSecuredTool(
        {
          user: client.user,
          toolName: 'write_file',
          params,
        },
        async (params) => {
          const content = params.content as string;
          const path = params.path as string;

          // Check storage quota
          const fileSize = Buffer.byteLength(content, 'utf8');
          await securityModule.updateStorageUsage(client.user, fileSize);

          await fs.writeFile(path, content);
          return { success: true, path, size: fileSize };
        }
      );
    },
  },
  // ... more secured tools
];
```

### 5. Update MCP Message Handler

Update the message handler to pass the client context:

```typescript
async function handleMCPMessage(
  client: ConnectedClient,
  message: any
): Promise<MCPResponse> {
  const { method, params, id } = message;

  if (method === 'tools/list') {
    // Return only tools the user has access to
    const availableToolNames = securityModule.getAvailableTools(client.user);
    const availableTools = tools
      .filter((t) => availableToolNames.includes(t.name))
      .map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema || { type: 'object' },
      }));

    return {
      jsonrpc: '2.0',
      id,
      result: {
        tools: availableTools,
      },
    };
  }

  if (method === 'tools/call') {
    const { name: toolName, arguments: toolArgs } = params;
    const tool = tools.find((t) => t.name === toolName);

    if (!tool) {
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32601,
          message: `Tool not found: ${toolName}`,
        },
      };
    }

    try {
      // Pass client to handler
      const result = await tool.handler(toolArgs, client);

      return {
        jsonrpc: '2.0',
        id,
        result,
      };
    } catch (error) {
      logger.error(`Tool execution error: ${toolName}`, error);
      return {
        jsonrpc: '2.0',
        id,
        error: {
          code: -32000,
          message:
            error instanceof Error ? error.message : 'Tool execution failed',
        },
      };
    }
  }

  return {
    jsonrpc: '2.0',
    id,
    error: {
      code: -32601,
      message: 'Method not found',
    },
  };
}
```

### 6. Add Admin Endpoints

Add new HTTP endpoints for monitoring and administration:

```typescript
// Get tenant usage report
app.get('/api/admin/tenants/:tenantId/usage', async (req, res) => {
  // Verify admin authentication
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const authResult = await securityModule.authenticateConnection({
    authorization: authHeader,
  });

  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check admin role
  if (
    authResult.user.role !== 'SUPER_ADMIN' &&
    authResult.user.role !== 'ADMIN'
  ) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const tenantId = req.params.tenantId;
  const usage = securityModule.getTenantUsage(tenantId);

  res.json(usage);
});

// Get audit logs
app.get('/api/admin/tenants/:tenantId/audit-logs', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const authResult = await securityModule.authenticateConnection({
    authorization: authHeader,
  });

  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (
    authResult.user.role !== 'SUPER_ADMIN' &&
    authResult.user.role !== 'ADMIN'
  ) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const tenantId = req.params.tenantId;
  const limit = parseInt(req.query.limit as string) || 100;
  const logs = await securityModule.getAuditLogs(tenantId, limit);

  res.json({ logs });
});

// Get security alerts
app.get('/api/admin/security/alerts', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const authResult = await securityModule.authenticateConnection({
    authorization: authHeader,
  });

  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  if (authResult.user.role !== 'SUPER_ADMIN') {
    return res.status(403).json({ error: 'Super admin access required' });
  }

  const limit = parseInt(req.query.limit as string) || 50;
  const alerts = await securityModule.getSecurityAlerts(limit);

  res.json({ alerts });
});

// Reset tenant quota (admin only)
app.post('/api/admin/tenants/:tenantId/reset-quota', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const authResult = await securityModule.authenticateConnection({
    authorization: authHeader,
  });

  if (!authResult.authenticated || !authResult.user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  try {
    await securityModule.resetTenantUsage(authResult.user, req.params.tenantId);
    res.json({ success: true });
  } catch (error) {
    res.status(403).json({ error: (error as Error).message });
  }
});
```

## Testing the Security System

### 1. Test Authentication

```bash
# Test JWT authentication
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  ws://localhost:8080/ws

# Test API key authentication
curl -H "X-Agent-API-Key: YOUR_API_KEY" \
  ws://localhost:8080/ws

# Test failed authentication
curl ws://localhost:8080/ws
# Should return: "Authentication required"
```

### 2. Test Authorization

```typescript
// As a regular USER
const result = await securityModule.executeSecuredTool(
  {
    user: {
      id: 'user-123',
      type: 'human',
      role: 'USER',
      tenantId: 'tenant-1',
      capabilities: [],
      permissions: ['cloud-sandbox:execute'],
    },
    toolName: 'run_command',
    params: { command: 'echo "Hello"' },
  },
  handler
);

// USER can execute basic commands

const result2 = await securityModule.executeSecuredTool(
  {
    user: {
      /* same USER */
    },
    toolName: 'browser_navigate',
    params: { url: 'https://example.com' },
  },
  handler
);

// Should fail - USER doesn't have 'cloud-sandbox:browser' permission
```

### 3. Test Dangerous Command Blocking

```typescript
// As a regular USER
const result = await securityModule.executeSecuredTool(
  {
    user: { role: 'USER' /* ... */ },
    toolName: 'run_command',
    params: { command: 'rm -rf /' },
  },
  handler
);

// Should fail - dangerous command blocked

// As SUPER_ADMIN
const result2 = await securityModule.executeSecuredTool(
  {
    user: { role: 'SUPER_ADMIN' /* ... */ },
    toolName: 'run_command',
    params: { command: 'rm -rf /' },
  },
  handler
);

// Allowed (with warning logged)
```

### 4. Test Quota Enforcement

```typescript
// Make multiple rapid requests as FREE tier user
for (let i = 0; i < 20; i++) {
  const result = await securityModule.executeSecuredTool(
    {
      user: {
        role: 'USER', // FREE tier
        tenantId: 'tenant-1',
        /* ... */
      },
      toolName: 'run_command',
      params: { command: 'echo test' },
    },
    handler
  );

  if (i < 10) {
    // Should succeed
    console.log(`Request ${i}: SUCCESS`);
  } else {
    // Should fail - quota exceeded
    console.log(`Request ${i}: QUOTA EXCEEDED`);
  }
}
```

## Environment Variables

Add to Railway environment variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=1h

# Database (if not already configured)
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional: Redis for distributed rate limiting
REDIS_URL=redis://localhost:6379
```

## Migration Checklist

- [ ] Add security module dependencies to package.json
- [ ] Initialize SecureCloudSandboxModule in server.ts
- [ ] Update ConnectedClient interface
- [ ] Secure WebSocket connection handler
- [ ] Wrap all tool handlers with executeSecuredTool
- [ ] Add admin endpoints for monitoring
- [ ] Configure JWT_SECRET in Railway
- [ ] Test authentication with real JWT tokens
- [ ] Test authorization with different roles
- [ ] Test quota enforcement
- [ ] Test audit logging
- [ ] Deploy to Railway and verify health check

## Next Steps

1. **Database Integration**: Create persistent storage for audit logs
2. **Redis Integration**: Use Redis for distributed rate limiting across
   multiple instances
3. **Metrics**: Add Prometheus metrics for security events
4. **Alerting**: Set up alerts for repeated failed authentications
5. **Documentation**: Document available tools and required permissions
