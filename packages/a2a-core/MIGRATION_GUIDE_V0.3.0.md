# A2A Protocol v0.3.0 Migration Guide

## Overview

This guide helps you migrate from The New Fuse's custom A2A implementation to
the official A2A Protocol v0.3.0 specification from the Linux Foundation.

**Migration Date**: November 2025 **Protocol Version**: v0.3.0 **Source**:
https://github.com/a2aproject/A2A

---

## Breaking Changes

### 1. Protocol Version Update

**Before (v1.0.0)**:

```typescript
export const A2A_PROTOCOL_VERSION = '1.0.0';
```

**After (v0.3.0)**:

```typescript
export const A2A_PROTOCOL_VERSION = '0.3.0';
```

**Impact**: All protocol version checks need to be updated.

---

### 2. Agent Card Structure

The AgentCard is now a **required**, structured manifest following the official
specification.

**Before**:

```typescript
interface AgentRegistration {
  agentId: string;
  name: string;
  type: AgentType;
  capabilities: string[];
  // ... other fields
}
```

**After**:

```typescript
interface AgentCard {
  protocolVersion: string; // REQUIRED: "0.3.0"
  name: string; // Human-readable agent name
  description: string; // Agent description
  url: string; // Primary endpoint URL
  preferredTransport?: TransportProtocol; // JSONRPC, GRPC, or HTTP+JSON
  additionalInterfaces?: AgentInterface[]; // Alternative transports
  capabilities: AgentCapabilities;
  securitySchemes?: { [scheme: string]: SecurityScheme };
  security?: { [scheme: string]: string[] }[];
  defaultInputModes: string[]; // MIME types
  defaultOutputModes: string[]; // MIME types
  skills: AgentSkill[]; // Agent capabilities
  // ... additional fields
}
```

**Migration Steps**:

1. Add `protocolVersion: '0.3.0'` to all agent cards
2. Convert agent capabilities to the `skills` array format
3. Add `defaultInputModes` and `defaultOutputModes` (e.g.,
   `['text/plain', 'application/json']`)
4. Specify transport protocols using `preferredTransport` and
   `additionalInterfaces`
5. Define security schemes if authentication is required

**Well-Known URI Change**:

- **Old**: `/.well-known/agent.json`
- **New**: `/.well-known/agent-card.json`

---

### 3. Message Structure

Messages now follow a structured format with **role**, **parts**, and **kind**
discriminator.

**Before**:

```typescript
interface A2AMessage {
  id: string;
  fromAgent: string;
  toAgent: string;
  type: A2AMessageType;
  payload: any;
  priority: A2APriority;
  timestamp: number;
}
```

**After**:

```typescript
interface Message {
  readonly role: 'user' | 'agent';
  parts: Part[]; // Array of TextPart, FilePart, or DataPart
  messageId: string;
  taskId?: string; // Links message to a task
  contextId?: string; // Groups related tasks
  readonly kind: 'message';
  metadata?: { [key: string]: any };
  extensions?: string[];
  referenceTaskIds?: string[];
}
```

**Part Types**:

```typescript
// Text content
interface TextPart {
  readonly kind: 'text';
  text: string;
}

// File content
interface FilePart {
  readonly kind: 'file';
  file: FileWithBytes | FileWithUri;
}

// Structured data
interface DataPart {
  readonly kind: 'data';
  data: { [key: string]: any };
}
```

**Migration Steps**:

1. Replace `payload` with `parts` array
2. Convert simple text payloads to `TextPart`:
   `{ kind: 'text', text: 'content' }`
3. Convert JSON payloads to `DataPart`: `{ kind: 'data', data: {...} }`
4. Set appropriate `role` ('user' or 'agent')
5. Add `messageId` (UUID recommended)
6. Move priority to `metadata.priority` if needed

---

### 4. Task-Based Interaction Model

V0.3.0 introduces a **stateful task model** for managing conversations and
long-running operations.

**Key Concepts**:

```typescript
interface Task {
  id: string;
  contextId: string;
  status: TaskStatus;
  history?: Message[];
  artifacts?: Artifact[];
  readonly kind: 'task';
}

interface TaskStatus {
  state: TaskState;
  message?: Message;
  timestamp?: string;
}

enum TaskState {
  Submitted = 'submitted',
  Working = 'working',
  InputRequired = 'input-required',
  Completed = 'completed',
  Canceled = 'canceled',
  Failed = 'failed',
  Rejected = 'rejected',
  AuthRequired = 'auth-required',
  Unknown = 'unknown',
}
```

**Migration Steps**:

1. Implement task lifecycle management
2. Track task states (submitted → working → completed/failed)
3. Store conversation history in task.history
4. Generate artifacts for agent outputs
5. Use contextId to group related tasks

---

### 5. Transport Protocols

V0.3.0 supports multiple transport protocols, not just custom messaging.

**Supported Transports**:

```typescript
enum TransportProtocol {
  JSONRPC = 'JSONRPC', // JSON-RPC 2.0 over HTTP (primary)
  GRPC = 'GRPC', // gRPC over HTTP/2
  HTTP_JSON = 'HTTP+JSON', // REST-style HTTP+JSON
}
```

**JSON-RPC 2.0 Methods**:

- `message/send` - Send a message to an agent
- `message/stream` - Send a message with streaming response (SSE)
- `tasks/get` - Get task status
- `tasks/cancel` - Cancel a task
- `tasks/resubscribe` - Resume streaming for a task
- `tasks/pushNotificationConfig/set` - Configure push notifications
- `tasks/pushNotificationConfig/get` - Get push notification config
- `tasks/pushNotificationConfig/list` - List all configs
- `tasks/pushNotificationConfig/delete` - Delete a config
- `agent/getAuthenticatedExtendedCard` - Get extended agent card

**Migration Steps**:

1. Implement JSON-RPC 2.0 request/response format
2. Support `message/send` and `message/stream` methods
3. Implement task management methods (`tasks/*`)
4. Declare supported transport in AgentCard
5. Consider implementing gRPC or HTTP+JSON for broader compatibility

---

### 6. Security Schemes

V0.3.0 uses **OpenAPI 3.0-style security schemes** instead of custom auth.

**Supported Schemes**:

```typescript
type SecurityScheme =
  | APIKeySecurityScheme
  | HTTPAuthSecurityScheme
  | OAuth2SecurityScheme
  | OpenIdConnectSecurityScheme
  | MutualTLSSecurityScheme;
```

**Example - OAuth2**:

```typescript
{
  "securitySchemes": {
    "oauth": {
      "type": "oauth2",
      "flows": {
        "authorizationCode": {
          "authorizationUrl": "https://auth.example.com/oauth/authorize",
          "tokenUrl": "https://auth.example.com/oauth/token",
          "scopes": {
            "read": "Read access",
            "write": "Write access"
          }
        }
      },
      "oauth2MetadataUrl": "https://auth.example.com/.well-known/oauth-authorization-server"
    }
  },
  "security": [
    { "oauth": ["read", "write"] }
  ]
}
```

**Example - mTLS** (new in v0.3.0):

```typescript
{
  "securitySchemes": {
    "mtls": {
      "type": "mutualTLS",
      "description": "Client certificate authentication"
    }
  },
  "security": [
    { "mtls": [] }
  ]
}
```

**Migration Steps**:

1. Define security schemes in AgentCard.securitySchemes
2. Specify required security in AgentCard.security
3. Skills can override security requirements
4. Implement authentication at HTTP layer (not in JSON-RPC payload)

---

### 7. Error Handling

V0.3.0 uses **JSON-RPC 2.0 error codes** with A2A-specific extensions.

**Standard JSON-RPC Errors**:

```typescript
enum A2AErrorCode {
  PARSE_ERROR = -32700,
  INVALID_REQUEST = -32600,
  METHOD_NOT_FOUND = -32601,
  INVALID_PARAMS = -32602,
  INTERNAL_ERROR = -32603,
}
```

**A2A-Specific Errors** (-32000 to -32099):

```typescript
enum A2AErrorCode {
  TASK_NOT_FOUND = -32001,
  TASK_ALREADY_CANCELED = -32002,
  TASK_NOT_CANCELABLE = -32003,
  AUTHENTICATION_REQUIRED = -32004,
  AUTHORIZATION_FAILED = -32005,
  RATE_LIMIT_EXCEEDED = -32006,
  RESOURCE_EXHAUSTED = -32007,
  INVALID_TASK_STATE = -32008,
  PUSH_NOTIFICATION_CONFIG_NOT_FOUND = -32009,
  UNSUPPORTED_OPERATION = -32010,
  AGENT_UNAVAILABLE = -32011,
  TIMEOUT = -32012,
}
```

**Error Response Format**:

```typescript
{
  "jsonrpc": "2.0",
  "id": "request-123",
  "error": {
    "code": -32001,
    "message": "Task not found",
    "data": { "taskId": "task-abc-123" }
  }
}
```

**Migration Steps**:

1. Use JSON-RPC 2.0 error format in responses
2. Map existing errors to appropriate error codes
3. Include helpful error data for debugging

---

### 8. Streaming and Push Notifications

**Server-Sent Events (SSE)**:

```typescript
// Streaming response via message/stream
Content-Type: text/event-stream

data: {"jsonrpc":"2.0","id":"1","result":{"kind":"task",...}}

data: {"jsonrpc":"2.0","id":"1","result":{"kind":"status-update",...}}

data: {"jsonrpc":"2.0","id":"1","result":{"kind":"artifact-update",...}}
```

**Push Notifications**:

```typescript
interface PushNotificationConfig {
  id?: string;
  url: string; // Client webhook URL
  token?: string; // Validation token
  authentication?: {
    schemes: string[];
    credentials?: string;
  };
}
```

**Migration Steps**:

1. Implement SSE streaming for `message/stream`
2. Support push notification configuration
3. Send HTTP POST to client webhook for async updates
4. Include validation token in webhook calls

---

## Deprecated Features

The following features from the custom implementation are deprecated:

### 1. Legacy Message Types

```typescript
// ❌ DEPRECATED
enum A2AMessageType {
  TASK_ASSIGNMENT,
  STATUS_UPDATE,
  DATA_REQUEST,
  // ...
}

// ✅ USE INSTEAD: Task-based model with message/send
```

### 2. Legacy Priority Enum

```typescript
// ❌ DEPRECATED
enum A2APriority {
  CRITICAL = 1,
  HIGH = 2,
  // ...
}

// ✅ USE INSTEAD: Add priority to metadata
message.metadata = { priority: 'high' };
```

### 3. Legacy Agent Status

```typescript
// ❌ DEPRECATED
enum AgentStatus {
  ONLINE,
  OFFLINE,
  BUSY,
  // ...
}

// ✅ USE INSTEAD: TaskState for task lifecycle
```

---

## Step-by-Step Migration

### Phase 1: Type Updates

1. ✅ Update `A2A_PROTOCOL_VERSION` to '0.3.0'
2. ✅ Import new type definitions
3. ✅ Update existing types to match v0.3.0 spec
4. ✅ Add backward compatibility layer if needed

### Phase 2: Message Format

1. Convert message payloads to Part[] format
2. Add role, kind, and messageId to messages
3. Update message handlers to parse new format

### Phase 3: Task Management

1. Implement Task storage and lifecycle
2. Add TaskState transitions
3. Track conversation history
4. Generate artifacts for outputs

### Phase 4: Transport Layer

1. Implement JSON-RPC 2.0 request/response format
2. Add `message/send` and `message/stream` handlers
3. Implement task management endpoints
4. Add SSE streaming support

### Phase 5: Agent Card

1. Create AgentCard following v0.3.0 schema
2. Define skills and capabilities
3. Specify security schemes
4. Serve at `/.well-known/agent-card.json`
5. Implement `agent/getAuthenticatedExtendedCard` if needed

### Phase 6: Security

1. Migrate auth to OpenAPI-style security schemes
2. Implement mTLS support if required
3. Add OAuth2 metadata URL if using OAuth
4. Move authentication to HTTP layer

### Phase 7: Testing

1. Test message/send and message/stream methods
2. Verify task lifecycle management
3. Test streaming with SSE
4. Validate push notifications
5. Test security schemes
6. Verify AgentCard serves correctly

---

## Code Examples

### Before: Sending a Message (Custom)

```typescript
const message: A2AMessage = {
  id: 'msg-123',
  fromAgent: 'agent-1',
  toAgent: 'agent-2',
  type: A2AMessageType.DATA_REQUEST,
  payload: { query: 'Hello' },
  priority: A2APriority.HIGH,
  timestamp: Date.now(),
};

await a2aService.sendMessage(message);
```

### After: Sending a Message (v0.3.0)

```typescript
// Create message
const message: Message = {
  role: 'user',
  parts: [{ kind: 'text', text: 'Hello, agent!' }],
  messageId: uuidv4(),
  kind: 'message',
};

// Send via JSON-RPC 2.0
const request: SendMessageRequest = {
  jsonrpc: '2.0',
  id: 'req-123',
  method: 'message/send',
  params: {
    message,
    configuration: {
      acceptedOutputModes: ['text/plain', 'application/json'],
      historyLength: 10,
    },
  },
};

const response = await fetch(agentCard.url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer token',
  },
  body: JSON.stringify(request),
});

const result: SendMessageResponse = await response.json();
if ('error' in result) {
  console.error('Error:', result.error);
} else {
  const task: Task = result.result as Task;
  console.log('Task created:', task.id);
}
```

### Creating an Agent Card

```typescript
const agentCard: AgentCard = {
  protocolVersion: '0.3.0',
  name: 'My Agent',
  description: 'An intelligent agent for task automation',
  url: 'https://api.example.com/a2a/v1',
  preferredTransport: TransportProtocol.JSONRPC,
  version: '1.0.0',
  capabilities: {
    streaming: true,
    pushNotifications: true,
    stateTransitionHistory: true,
  },
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain', 'application/json'],
  skills: [
    {
      id: 'task-automation',
      name: 'Task Automation',
      description: 'Automate repetitive tasks',
      tags: ['automation', 'productivity'],
      examples: ['Automate my email responses'],
    },
  ],
  securitySchemes: {
    bearer: {
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    },
  },
  security: [{ bearer: [] }],
};
```

---

## Resources

- **Official Specification**: https://github.com/a2aproject/A2A
- **Documentation**: https://a2aproject.github.io/A2A/
- **TypeScript Types**: Included in this package
- **Protocol Version**: v0.3.0
- **Release Notes**: See CHANGELOG.md in the A2A repository

---

## Support

For questions or issues during migration:

1. Check the official A2A documentation
2. Review the TypeScript types in `types.ts`
3. Examine the examples in this guide
4. Consult the A2A community forums

---

## Summary

Key differences between custom A2A and v0.3.0:

| Feature            | Custom (v1.0.0)     | Official (v0.3.0)                          |
| ------------------ | ------------------- | ------------------------------------------ |
| Protocol Version   | 1.0.0               | 0.3.0                                      |
| Message Format     | Custom payload      | Parts-based (TextPart, FilePart, DataPart) |
| Interaction Model  | Direct messaging    | Task-based with lifecycle                  |
| Transport          | Custom              | JSON-RPC 2.0 / gRPC / HTTP+JSON            |
| Security           | Custom              | OpenAPI 3.0 security schemes               |
| Discovery          | Custom registration | AgentCard with skills                      |
| Streaming          | Custom              | Server-Sent Events (SSE)                   |
| Push Notifications | Custom              | Standardized webhook config                |
| Well-Known URI     | /agent.json         | /agent-card.json                           |
| Error Handling     | Custom              | JSON-RPC 2.0 error codes                   |

This migration brings The New Fuse's A2A implementation into full compliance
with the Linux Foundation's official specification, enabling broader
interoperability with other A2A-compliant agents and systems.
