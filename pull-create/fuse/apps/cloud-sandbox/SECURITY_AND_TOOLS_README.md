# Cloud Sandbox Security & Tools System

Comprehensive RBAC, multi-tenant isolation, and AI tool framework for The New
Fuse cloud sandbox.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Security System](#security-system)
- [Tool System](#tool-system)
- [Skill Chains](#skill-chains)
- [Integration Guide](#integration-guide)
- [API Reference](#api-reference)
- [Examples](#examples)

## Overview

This system provides enterprise-grade security and a powerful tool framework for
executing code, automating browsers, and performing file operations in a cloud
sandbox environment.

### Key Features

**Security**:

- JWT and API key authentication
- Role-based access control (RBAC)
- Capability-based permissions
- Multi-tenant isolation with resource quotas
- Rate limiting per tenant
- Comprehensive audit logging
- Dangerous command blocking

**Tools**:

- Type-safe parameter validation
- Automatic retry logic for transient failures
- Timeout handling
- Sanitization of sensitive data
- MCP protocol compatibility

**Skills**:

- Chain multiple tools into complex workflows
- Context passing between steps
- Conditional logic
- Error handling and rollback
- AI-friendly prompts

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                     Client Connection                          │
│            (JWT Token or Agent API Key)                        │
└─────────────────────────┬─────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────────┐
│              CloudSandboxAuthGuard                             │
│  • Validates JWT tokens                                        │
│  • Validates agent API keys                                    │
│  • Returns AuthenticatedUser context                           │
└─────────────────────────┬─────────────────────────────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────────┐
│          SecureCloudSandboxModule                              │
│  Coordinates all security components                           │
└─────────────────────────┬─────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          │               │               │
          ▼               ▼               ▼
┌─────────────────┐ ┌──────────┐ ┌─────────────┐
│PermissionChecker│ │  Tenant  │ │   Audit     │
│                 │ │Isolation │ │  Logger     │
│ • Role checks   │ │          │ │             │
│ • Capability    │ │ • Quotas │ │ • All       │
│   validation    │ │ • Rates  │ │   actions   │
│ • Dangerous     │ │ • Limits │ │ • Security  │
│   commands      │ │          │ │   alerts    │
└─────────────────┘ └──────────┘ └─────────────┘
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
┌───────────────────────────────────────────────────────────────┐
│                 Tool/Skill Execution                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Browser    │  │  Execution   │  │  Filesystem  │       │
│  │    Tools     │  │    Tools     │  │    Tools     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│                                                                │
│  ┌──────────────────────────────────────────────────────┐    │
│  │              Skill Chains                             │    │
│  │  (Multi-step workflows with context passing)          │    │
│  └──────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────┘
```

## Security System

### Authentication

Two authentication methods are supported:

#### 1. JWT Tokens (for humans and agents)

```typescript
// Client connects with JWT
const ws = new WebSocket('ws://localhost:8080/ws', {
  headers: {
    Authorization: 'Bearer eyJhbGc...',
  },
});
```

#### 2. API Keys (for agents)

```typescript
// Agent connects with API key
const ws = new WebSocket('ws://localhost:8080/ws', {
  headers: {
    'X-Agent-API-Key': 'your-agent-api-key-here',
  },
});
```

### Authorization

Access control is enforced at multiple levels:

#### Role-Based Access Control (RBAC)

| Role           | Permissions                                |
| -------------- | ------------------------------------------ |
| SUPER_ADMIN    | All permissions including admin operations |
| ADMIN          | Execute, browser, files, monitor           |
| AGENCY_OWNER   | Execute, browser, files, monitor           |
| AGENCY_ADMIN   | Execute, browser, files                    |
| AGENCY_MANAGER | Execute, browser                           |
| AGENT_OPERATOR | Execute, browser                           |
| USER           | Execute only                               |

#### Capability-Based Access (for agents)

Agents must have specific capabilities to execute certain tools:

```typescript
{
  toolName: 'run_command',
  requiredCapabilities: ['CODE_EXECUTION'],
}
```

#### Dangerous Command Blocking

Potentially dangerous commands are blocked for non-admin users:

```typescript
// Blocked for USER, allowed for SUPER_ADMIN
run_command({ command: 'rm -rf /' })

// Blocked patterns:
- rm -rf /
- dd if=
- mkfs
- Fork bombs
- Pipe to bash/shell
```

### Multi-Tenant Isolation

#### Resource Quotas by Tier

| Tier       | Concurrent Executions | Executions/Hour | Executions/Day | Max File Size | Total Storage | Browser Sessions |
| ---------- | --------------------- | --------------- | -------------- | ------------- | ------------- | ---------------- |
| FREE       | 1                     | 10              | 50             | 1 MB          | 10 MB         | 1                |
| BASIC      | 3                     | 50              | 500            | 10 MB         | 100 MB        | 2                |
| STANDARD   | 5                     | 200             | 2,000          | 50 MB         | 1 GB          | 5                |
| PREMIUM    | 10                    | 1,000           | 10,000         | 100 MB        | 10 GB         | 10               |
| ENTERPRISE | 50                    | 10,000          | 100,000        | 500 MB        | 100 GB        | 50               |

#### Quota Enforcement

```typescript
// Automatically enforced before tool execution
const result = await securityModule.executeSecuredTool(
  {
    user,
    toolName: 'run_command',
    params: { command: 'echo test' },
  },
  handler
);

// If quota exceeded:
// { success: false, error: 'Tenant has reached hourly execution limit (50)' }
```

### Audit Logging

All operations are logged with comprehensive details:

```typescript
interface AuditLog {
  timestamp: Date;
  eventType:
    | 'authentication'
    | 'authorization'
    | 'tool_execution'
    | 'access_denied';
  userId: string;
  userType: 'agent' | 'human';
  userRole: string;
  tenantId: string;
  action: string;
  resource?: string;
  params?: Record<string, unknown>; // Sanitized (passwords redacted)
  result: 'success' | 'failure' | 'denied';
  error?: string;
}
```

#### Querying Audit Logs

```typescript
// Get security alerts
const alerts = await securityModule.getSecurityAlerts(50);

// Get tenant activity
const logs = await securityModule.getAuditLogs('tenant-123', 100);

// Export logs
const json = auditLogger.exportLogs(logs);
```

## Tool System

### Tool Wrapper

All tools are wrapped with consistent validation, error handling, and retry
logic.

#### Tool Schema

```typescript
const schema: ToolSchema = {
  name: 'browser_navigate',
  description: 'Navigate the headless browser to a URL',
  category: 'browser',
  riskLevel: 'medium',
  timeout: 30000,
  retryable: true,
  parameters: [
    {
      name: 'url',
      type: 'string',
      description: 'The URL to navigate to',
      required: true,
      validation: (value) => {
        try {
          new URL(value as string);
          return true;
        } catch {
          return false;
        }
      },
      sanitize: (value) => {
        const url = value as string;
        if (!url.startsWith('http')) {
          return `https://${url}`;
        }
        return url;
      },
    },
  ],
  returns: {
    type: 'object',
    description: 'Navigation result with URL and page title',
  },
};
```

### Available Tools

#### Browser Tools

| Tool                      | Description        | Risk Level | Permissions Required  |
| ------------------------- | ------------------ | ---------- | --------------------- |
| browser_navigate          | Navigate to URL    | Medium     | cloud-sandbox:browser |
| browser_screenshot        | Take screenshot    | Low        | cloud-sandbox:browser |
| browser_click             | Click element      | Medium     | cloud-sandbox:browser |
| browser_type              | Type into input    | Medium     | cloud-sandbox:browser |
| browser_get_html          | Get page HTML      | Low        | cloud-sandbox:browser |
| browser_evaluate          | Execute JavaScript | High       | cloud-sandbox:browser |
| browser_wait_for_selector | Wait for element   | Low        | cloud-sandbox:browser |

#### Execution Tools

| Tool            | Description                 | Risk Level | Permissions Required  |
| --------------- | --------------------------- | ---------- | --------------------- |
| run_command     | Execute shell command       | Critical   | cloud-sandbox:execute |
| run_node_code   | Execute Node.js code        | High       | cloud-sandbox:execute |
| run_python_code | Execute Python code         | High       | cloud-sandbox:execute |
| get_env_info    | Get environment information | Medium     | cloud-sandbox:system  |
| ping            | Health check                | Low        | cloud-sandbox:monitor |

#### Filesystem Tools

| Tool             | Description             | Risk Level | Permissions Required |
| ---------------- | ----------------------- | ---------- | -------------------- |
| read_file        | Read file contents      | Medium     | cloud-sandbox:files  |
| write_file       | Write file              | High       | cloud-sandbox:files  |
| list_directory   | List directory contents | Low        | cloud-sandbox:files  |
| create_directory | Create directory        | Medium     | cloud-sandbox:files  |
| delete_file      | Delete file             | High       | cloud-sandbox:files  |
| copy_file        | Copy file               | Medium     | cloud-sandbox:files  |
| file_stats       | Get file metadata       | Low        | cloud-sandbox:files  |

### Tool Execution

```typescript
// Initialize tools
const { toolRegistry } = await initializeToolsAndSkills(getPage);

// Execute a tool
const result = await toolRegistry.execute({
  user: authenticatedUser,
  toolName: 'browser_navigate',
  params: { url: 'https://example.com' },
});

if (result.success) {
  console.log('Result:', result.result);
  console.log('Execution time:', result.executionTime, 'ms');
} else {
  console.error('Error:', result.error);
}
```

## Skill Chains

Skills are higher-level workflows that chain multiple tools together.

### Built-in Skills

#### 1. Web Scraping (`web_scrape`)

Navigates to a URL, extracts content, and saves to a file.

```typescript
const result = await skillRegistry.execute('web_scrape', user, {
  url: 'https://example.com/article',
  selector: 'article',
  outputFile: '/tmp/article.html',
});

// Steps:
// 1. browser_navigate → Navigate to URL
// 2. browser_wait_for_selector → Wait for content
// 3. browser_get_html → Extract HTML
// 4. write_file → Save to file
```

#### 2. Execute and Save (`execute_and_save`)

Runs code and saves output to a file.

```typescript
const result = await skillRegistry.execute('execute_and_save', user, {
  code: 'console.log("Hello World")',
  language: 'node',
  outputFile: '/tmp/output.txt',
});

// Steps:
// 1. run_node_code or run_python_code → Execute code
// 2. write_file → Save output
```

#### 3. Web Form Submit (`web_form_submit`)

Fills and submits a web form.

```typescript
const result = await skillRegistry.execute('web_form_submit', user, {
  url: 'https://example.com/contact',
  fields: {
    '#name': 'John Doe',
    '#email': 'john@example.com',
    '#message': 'Hello!',
  },
  submitButton: '#submit',
  screenshotPath: '/tmp/result.png',
});

// Steps:
// 1. browser_navigate → Go to form
// 2. browser_type → Fill fields (loops through all)
// 3. browser_click → Submit
// 4. browser_screenshot → Capture result
```

### Creating Custom Skills

```typescript
const customSkill = new SkillChain(
  {
    name: 'my_custom_skill',
    description: 'Does something custom',
    category: 'custom',
    prompt: 'Instructions for AI on how to use this skill...',
    parameters: [
      { name: 'param1', type: 'string', description: '...', required: true },
    ],
    steps: [
      {
        toolName: 'browser_navigate',
        description: 'Navigate to URL',
        params: (context) => ({
          url: context.initialParams.url,
        }),
        onSuccess: (result, context) => {
          // Store result in context for next step
          context.variables.set('pageTitle', result.title);
        },
        onError: (error, context) => {
          // Handle error: 'continue', 'abort', or void
          return 'abort';
        },
        condition: (context) => {
          // Optional: only run if condition is true
          return context.variables.get('shouldNavigate') === true;
        },
      },
      // ... more steps
    ],
  },
  toolRegistry
);

skillRegistry.register(customSkill);
```

## Integration Guide

See [INTEGRATION_GUIDE.md](./src/auth/INTEGRATION_GUIDE.md) for complete
integration instructions.

### Quick Start

1. **Initialize Security Module**:

```typescript
import { SecureCloudSandboxModule } from './auth/SecureCloudSandboxModule';
import { initializeToolsAndSkills } from './tools';

const securityModule = new SecureCloudSandboxModule(jwtService, db);
const { toolRegistry, skillRegistry } = await initializeToolsAndSkills(getPage);
```

2. **Secure WebSocket Connections**:

```typescript
wss.on('connection', async (ws, request) => {
  const headers = extractHeaders(request);
  const authResult = await securityModule.authenticateConnection(headers);

  if (!authResult.authenticated) {
    ws.close(1008, authResult.error);
    return;
  }

  const client = {
    id: uuidv4(),
    ws,
    user: authResult.user,
    lastActivity: new Date(),
  };
});
```

3. **Execute Tools Securely**:

```typescript
const result = await securityModule.executeSecuredTool(
  {
    user: client.user,
    toolName: 'run_command',
    params: { command: 'echo "Hello"' },
  },
  async (params) => {
    // Original tool logic
    const { stdout } = await execAsync(params.command);
    return { stdout };
  }
);
```

## API Reference

### SecureCloudSandboxModule

```typescript
class SecureCloudSandboxModule {
  // Authenticate connection
  authenticateConnection(
    headers: Record<string, string>
  ): Promise<AuthenticationResult>;

  // Execute tool with full security
  executeSecuredTool(
    context: SecuredToolExecutionContext,
    handler: Function
  ): Promise<SecuredToolExecutionResult>;

  // Get available tools for user
  getAvailableTools(user: AuthenticatedUser): string[];

  // Check permissions
  canUserAccessTool(
    user: AuthenticatedUser,
    toolName: string,
    params?: object
  ): PermissionCheckResult;

  // Quota management
  checkTenantQuota(
    user: AuthenticatedUser,
    operationType: string
  ): Promise<QuotaCheckResult>;
  getTenantUsage(tenantId: string): { usage; quota };

  // Audit logs
  getAuditLogs(tenantId: string, limit?: number): Promise<AuditLog[]>;
  getSecurityAlerts(limit?: number): Promise<AuditLog[]>;

  // Admin operations
  resetTenantUsage(
    adminUser: AuthenticatedUser,
    tenantId: string
  ): Promise<void>;
  updateTenantQuota(
    adminUser: AuthenticatedUser,
    tenantId: string,
    quota: object
  ): Promise<void>;
}
```

### ToolRegistry

```typescript
class ToolRegistry {
  register(wrapper: ToolWrapper): void;
  get(name: string): ToolWrapper | undefined;
  getAll(): ToolWrapper[];
  getByCategory(category: string): ToolWrapper[];
  getMCPTools(): Array<{ name; description; inputSchema }>;
  execute(context: ToolExecutionContext): Promise<ToolExecutionResult>;
}
```

### SkillRegistry

```typescript
class SkillRegistry {
  register(skill: SkillChain): void;
  get(name: string): SkillChain | undefined;
  getAll(): SkillChain[];
  getByCategory(category: string): SkillChain[];
  execute(
    skillName: string,
    user: AuthenticatedUser,
    params: object
  ): Promise<SkillExecutionResult>;
  getSkillCatalog(): Array<{ name; description; category; prompt }>;
}
```

## Examples

### Example 1: Simple Tool Execution

```typescript
// Execute a browser navigation
const result = await securityModule.executeSecuredTool(
  {
    user: authenticatedUser,
    toolName: 'browser_navigate',
    params: { url: 'https://google.com' },
  },
  async (params) => {
    const page = await getPage();
    await page.goto(params.url);
    return {
      success: true,
      url: page.url(),
      title: await page.title(),
    };
  }
);

console.log(result);
// {
//   success: true,
//   result: { success: true, url: '...', title: 'Google' },
//   executionTime: 1234,
//   quotaRemaining: { executions: 49, ... }
// }
```

### Example 2: Skill Chain Execution

```typescript
// Web scraping skill
const result = await skillRegistry.execute('web_scrape', user, {
  url: 'https://news.ycombinator.com',
  selector: '.itemlist',
  outputFile: '/tmp/hackernews.html',
});

console.log(result);
// {
//   success: true,
//   completedSteps: 4,
//   totalSteps: 4,
//   results: [...],
//   finalResult: { success: true, path: '/tmp/hackernews.html', ... },
//   executionTime: 5678
// }
```

### Example 3: Admin Operations

```typescript
// Get tenant usage report
const usage = securityModule.getTenantUsage('tenant-123');
console.log(usage);
// {
//   usage: {
//     currentExecutions: 2,
//     executionsLastHour: 45,
//     executionsLastDay: 342,
//     currentStorage: 5242880,
//     currentBrowserSessions: 1,
//   },
//   quota: {
//     maxConcurrentExecutions: 5,
//     maxExecutionsPerHour: 200,
//     maxExecutionsPerDay: 2000,
//     ...
//   }
// }

// Reset tenant quota (SUPER_ADMIN only)
await securityModule.resetTenantUsage(superAdminUser, 'tenant-123');

// Get security alerts
const alerts = await securityModule.getSecurityAlerts(50);
console.log(alerts);
// [
//   { eventType: 'access_denied', userId: 'user-456', action: 'run_command', ... },
//   { eventType: 'authentication', userId: 'unknown', result: 'failure', ... },
// ]
```

## Environment Variables

```env
# Required
JWT_SECRET=your-super-secret-jwt-key
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional
JWT_EXPIRES_IN=1h
REDIS_URL=redis://default:<YOUR_REDIS_PASSWORD>@<REDIS_HOST>:<REDIS_PORT>
```

## Testing

```bash
# Run security tests
pnpm test apps/cloud-sandbox

# Test authentication
curl -H "Authorization: Bearer YOUR_JWT" ws://localhost:8080/ws

# Test tool execution
curl -X POST http://localhost:8080/api/agent/call \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"method":"tools/call","params":{"name":"ping","arguments":{}},"id":1}'
```

## License

MIT

## Contributing

1. Follow NestJS conventions
2. Add tests for new tools/skills
3. Document all security-relevant changes
4. Update this README
