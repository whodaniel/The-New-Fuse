# @the-new-fuse/a2a-core

**Agent-to-Agent (A2A) Protocol v0.3.0 Implementation for The New Fuse**

This package provides a complete TypeScript implementation of the
[A2A Protocol v0.3.0](https://github.com/a2aproject/A2A) specification from the
Linux Foundation. The A2A protocol enables standardized communication and
interoperability between independent AI agent systems.

## Features

### Protocol Compliance

- ✅ **A2A Protocol v0.3.0** - Fully compliant with the latest specification
- ✅ **JSON-RPC 2.0 Transport** - Primary transport protocol
- ✅ **Task-Based Interaction Model** - Stateful conversations and operations
- ✅ **Agent Discovery** - AgentCard with skills and capabilities
- ✅ **Multiple Security Schemes** - OAuth2, mTLS, API Key, OpenID Connect
- ✅ **Streaming Support** - Server-Sent Events (SSE) for real-time updates
- ✅ **Push Notifications** - Asynchronous task updates via webhooks

### Core Capabilities

- Message exchange with text, files, and structured data
- Task lifecycle management (submitted → working → completed/failed)
- Conversation history and context tracking
- Artifact generation and management
- Multi-transport support (JSON-RPC, gRPC, HTTP+JSON)
- Runtime validation with Zod schemas

## Installation

```bash
npm install @the-new-fuse/a2a-core
```

## Quick Start

### 1. Import Types and Constants

```typescript
import {
  A2A_PROTOCOL_VERSION,
  AgentCard,
  Message,
  Task,
  TaskState,
  TransportProtocol,
} from '@the-new-fuse/a2a-core';
```

### 2. Create an Agent Card

```typescript
const agentCard: AgentCard = {
  protocolVersion: A2A_PROTOCOL_VERSION,
  name: 'My AI Agent',
  description: 'An intelligent agent for task automation',
  url: 'https://api.example.com/a2a/v1',
  preferredTransport: TransportProtocol.JSONRPC,
  version: '1.0.0',
  capabilities: {
    streaming: true,
    pushNotifications: true,
  },
  defaultInputModes: ['text/plain', 'application/json'],
  defaultOutputModes: ['text/plain', 'application/json'],
  skills: [
    {
      id: 'task-automation',
      name: 'Task Automation',
      description: 'Automate repetitive tasks',
      tags: ['automation', 'productivity'],
      examples: ['Automate my email responses', 'Schedule recurring tasks'],
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

### 3. Send a Message

```typescript
import { v4 as uuidv4 } from 'uuid';

// Create a message
const message: Message = {
  role: 'user',
  parts: [
    {
      kind: 'text',
      text: 'Hello, can you help me automate my tasks?',
    },
  ],
  messageId: uuidv4(),
  kind: 'message',
};

// Send via JSON-RPC 2.0
const request: SendMessageRequest = {
  jsonrpc: '2.0',
  id: uuidv4(),
  method: 'message/send',
  params: {
    message,
    configuration: {
      acceptedOutputModes: ['text/plain', 'application/json'],
      historyLength: 10,
    },
  },
};

// Make HTTP request
const response = await fetch(agentCard.url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_TOKEN',
  },
  body: JSON.stringify(request),
});

const result: SendMessageResponse = await response.json();
if ('error' in result) {
  console.error('Error:', result.error);
} else {
  const task: Task = result.result as Task;
  console.log('Task ID:', task.id);
  console.log('Status:', task.status.state);
}
```

### 4. Handle Streaming Responses

```typescript
// Use message/stream for real-time updates
const streamRequest: SendStreamingMessageRequest = {
  jsonrpc: '2.0',
  id: uuidv4(),
  method: 'message/stream',
  params: { message },
};

const response = await fetch(agentCard.url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer YOUR_TOKEN',
  },
  body: JSON.stringify(streamRequest),
});

// Process SSE stream
const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.substring(6));
      const result = data.result;

      if (result.kind === 'task') {
        console.log('Task created:', result.id);
      } else if (result.kind === 'status-update') {
        console.log('Status update:', result.status.state);
      } else if (result.kind === 'artifact-update') {
        console.log('Artifact:', result.artifact.artifactId);
      }
    }
  }
}
```

## Message Parts

A2A v0.3.0 supports three types of message parts:

### Text Part

```typescript
const textPart: TextPart = {
  kind: 'text',
  text: 'This is a text message',
};
```

### File Part (with URI)

```typescript
const filePart: FilePart = {
  kind: 'file',
  file: {
    uri: 'https://example.com/document.pdf',
    name: 'document.pdf',
    mimeType: 'application/pdf',
  },
};
```

### File Part (with bytes)

```typescript
const filePart: FilePart = {
  kind: 'file',
  file: {
    bytes: 'base64EncodedContent...',
    name: 'image.png',
    mimeType: 'image/png',
  },
};
```

### Data Part (structured data)

```typescript
const dataPart: DataPart = {
  kind: 'data',
  data: {
    type: 'form',
    fields: [
      { name: 'email', type: 'email', required: true },
      { name: 'message', type: 'textarea', required: true },
    ],
  },
};
```

## Task Lifecycle

Tasks progress through defined states:

```typescript
enum TaskState {
  Submitted = 'submitted', // Task received, queued
  Working = 'working', // Agent actively processing
  InputRequired = 'input-required', // Waiting for user input
  Completed = 'completed', // Successfully finished
  Canceled = 'canceled', // User canceled
  Failed = 'failed', // Error occurred
  Rejected = 'rejected', // Agent rejected the task
  AuthRequired = 'auth-required', // Additional auth needed
  Unknown = 'unknown', // Indeterminate state
}
```

### Managing Tasks

```typescript
// Get task status
const getTaskRequest: GetTaskRequest = {
  jsonrpc: '2.0',
  id: uuidv4(),
  method: 'tasks/get',
  params: {
    id: taskId,
    historyLength: 10,
  },
};

// Cancel a task
const cancelRequest: CancelTaskRequest = {
  jsonrpc: '2.0',
  id: uuidv4(),
  method: 'tasks/cancel',
  params: { id: taskId },
};
```

## Security

A2A v0.3.0 supports multiple security schemes based on OpenAPI 3.0:

### OAuth2

```typescript
const oauth2Scheme: OAuth2SecurityScheme = {
  type: 'oauth2',
  flows: {
    authorizationCode: {
      authorizationUrl: 'https://auth.example.com/oauth/authorize',
      tokenUrl: 'https://auth.example.com/oauth/token',
      scopes: {
        read: 'Read access',
        write: 'Write access',
      },
    },
  },
  oauth2MetadataUrl:
    'https://auth.example.com/.well-known/oauth-authorization-server',
};
```

### mTLS (Mutual TLS)

```typescript
const mtlsScheme: MutualTLSSecurityScheme = {
  type: 'mutualTLS',
  description: 'Client certificate authentication',
};
```

### API Key

```typescript
const apiKeyScheme: APIKeySecurityScheme = {
  type: 'apiKey',
  in: 'header',
  name: 'X-API-Key',
};
```

### HTTP Bearer

```typescript
const bearerScheme: HTTPAuthSecurityScheme = {
  type: 'http',
  scheme: 'bearer',
  bearerFormat: 'JWT',
};
```

## Push Notifications

Configure webhooks for asynchronous task updates:

```typescript
const pushConfig: PushNotificationConfig = {
  id: 'webhook-1',
  url: 'https://client.example.com/webhooks/a2a',
  token: 'validation-token-123',
  authentication: {
    schemes: ['bearer'],
    credentials: 'Bearer client-token',
  },
};

const setPushRequest: SetTaskPushNotificationConfigRequest = {
  jsonrpc: '2.0',
  id: uuidv4(),
  method: 'tasks/pushNotificationConfig/set',
  params: {
    taskId: task.id,
    pushNotificationConfig: pushConfig,
  },
};
```

## Error Handling

A2A uses JSON-RPC 2.0 error codes with A2A-specific extensions:

```typescript
import { A2AErrorCode, A2ATaskNotFoundError } from '@the-new-fuse/a2a-core';

try {
  // ... A2A operation
} catch (error) {
  if (error instanceof A2ATaskNotFoundError) {
    console.error('Task not found:', error.data.taskId);
  } else if (error.code === A2AErrorCode.AUTHENTICATION_REQUIRED) {
    console.error('Authentication required');
  }
}
```

### Error Codes

**JSON-RPC 2.0 Standard**:

- `-32700` - Parse error
- `-32600` - Invalid request
- `-32601` - Method not found
- `-32602` - Invalid params
- `-32603` - Internal error

**A2A-Specific** (-32000 to -32099):

- `-32001` - Task not found
- `-32002` - Task already canceled
- `-32003` - Task not cancelable
- `-32004` - Authentication required
- `-32005` - Authorization failed
- `-32006` - Rate limit exceeded
- `-32007` - Resource exhausted
- `-32008` - Invalid task state
- `-32009` - Push notification config not found
- `-32010` - Unsupported operation
- `-32011` - Agent unavailable
- `-32012` - Timeout

## Runtime Validation

Use Zod schemas for runtime validation:

```typescript
import {
  MessageSchema,
  TaskSchema,
  AgentCardSchema,
} from '@the-new-fuse/a2a-core';

// Validate a message
const validatedMessage = MessageSchema.parse(messageData);

// Validate a task
const validatedTask = TaskSchema.parse(taskData);

// Validate an agent card
const validatedCard = AgentCardSchema.parse(cardData);
```

## API Reference

### Types

- `AgentCard` - Agent metadata and capabilities
- `Message` - Conversation message
- `Task` - Stateful operation
- `TaskStatus` - Task state and metadata
- `Part` - Message/artifact content (TextPart | FilePart | DataPart)
- `Artifact` - Agent-generated output
- `SecurityScheme` - Authentication configuration
- `TransportProtocol` - Transport type enum

### JSON-RPC Methods

- `message/send` - Send a message to an agent
- `message/stream` - Send a message with streaming response
- `tasks/get` - Get task status
- `tasks/cancel` - Cancel a task
- `tasks/resubscribe` - Resume streaming for a task
- `tasks/pushNotificationConfig/set` - Configure push notifications
- `tasks/pushNotificationConfig/get` - Get push notification config
- `tasks/pushNotificationConfig/list` - List all configs
- `tasks/pushNotificationConfig/delete` - Delete a config
- `agent/getAuthenticatedExtendedCard` - Get extended agent card

### Constants

- `A2A_PROTOCOL_VERSION` - Current protocol version ('0.3.0')

## Migration from Custom A2A

If you're migrating from The New Fuse's custom A2A implementation, see the
[Migration Guide](./MIGRATION_GUIDE_V0.3.0.md) for detailed instructions.

### Key Changes

1. **Protocol version updated to v0.3.0**
2. **Message format**: Now uses parts-based structure
3. **Task-based model**: Stateful conversations with lifecycle management
4. **AgentCard**: Required structured manifest
5. **JSON-RPC 2.0**: Standard transport protocol
6. **Security schemes**: OpenAPI 3.0-style authentication
7. **Well-known URI**: Changed from `agent.json` to `agent-card.json`

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       A2A Client                            │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Agent Card    │  │   Message    │  │  Task Manager   │ │
│  │ Discovery     │  │   Builder    │  │                 │ │
│  └───────────────┘  └──────────────┘  └─────────────────┘ │
└───────────────────────────────┬─────────────────────────────┘
                                │
                          JSON-RPC 2.0
                        (HTTPS/SSE/Webhook)
                                │
┌───────────────────────────────▼─────────────────────────────┐
│                       A2A Server                            │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Agent Card    │  │   JSON-RPC   │  │  Task Engine    │ │
│  │ Endpoint      │  │   Handler    │  │                 │ │
│  └───────────────┘  └──────────────┘  └─────────────────┘ │
│  ┌───────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│  │ Security      │  │   Streaming  │  │  Push Notifs    │ │
│  │ Middleware    │  │   (SSE)      │  │  (Webhooks)     │ │
│  └───────────────┘  └──────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## Best Practices

### 1. AgentCard Hosting

Serve your AgentCard at the well-known URI:

```
https://yourdomain.com/.well-known/agent-card.json
```

### 2. Task Management

- Generate unique task IDs (use UUIDs)
- Track task state transitions
- Store conversation history
- Clean up completed tasks periodically

### 3. Security

- Always use HTTPS in production
- Implement proper authentication and authorization
- Validate all incoming requests
- Use TLS 1.3+ with strong cipher suites

### 4. Streaming

- Send status updates promptly
- Close SSE streams when tasks complete
- Handle client disconnections gracefully

### 5. Error Handling

- Use appropriate error codes
- Include helpful error messages
- Provide actionable error data

## Examples

See the [examples](./examples) directory for complete working examples:

- Basic message exchange
- Streaming conversations
- Push notification setup
- Multi-part messages (text + files)
- Task management
- Security scheme implementation

## Resources

- **Official A2A Specification**: https://github.com/a2aproject/A2A
- **Documentation**: https://a2aproject.github.io/A2A/
- **Protocol Version**: v0.3.0
- **TypeScript Types**: Included in this package
- **Migration Guide**: [MIGRATION_GUIDE_V0.3.0.md](./MIGRATION_GUIDE_V0.3.0.md)

## License

MIT

## Contributing

Contributions are welcome! Please ensure:

- All changes maintain v0.3.0 specification compliance
- TypeScript types are properly defined
- Zod schemas are provided for runtime validation
- Tests are included for new features

## Support

For issues or questions:

1. Check the [official A2A documentation](https://a2aproject.github.io/A2A/)
2. Review the [migration guide](./MIGRATION_GUIDE_V0.3.0.md)
3. Open an issue in this repository

---

**Built with ❤️ by The New Fuse Team**
