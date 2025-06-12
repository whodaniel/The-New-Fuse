# A2A Protocol Implementation

## Overview

The Agent-to-Agent (A2A) Protocol implementation provides a comprehensive communication framework for AI agents in The New Fuse ecosystem. This implementation includes:

- **Core Protocol**: Type-safe messaging, agent registration, and conversation management
- **Redis Backend**: Scalable message routing and persistence using Redis Streams
- **WebSocket Gateway**: Real-time bidirectional communication
- **React Integration**: Frontend hooks and components for UI interaction
- **Database Models**: Prisma-based persistence for agents, messages, and conversations

## Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Server     │    │     Redis       │
│   React App     │◄──►│   NestJS + A2A   │◄──►│   Message Bus   │
│                 │    │   Controllers    │    │   & Storage     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌────────▼────────┐             │
         │              │   Database      │             │
         └──────────────►│   PostgreSQL    │◄────────────┘
                        │   (Prisma)      │
                        └─────────────────┘
```

## Features

### Core Protocol Features
- **Type-Safe Messaging**: Zod-validated message schemas
- **Agent Registration**: Dynamic agent discovery and capability advertisement
- **Conversation Management**: Multi-agent conversation coordination
- **Request-Response Pattern**: Async request handling with timeouts
- **Broadcasting**: One-to-many message distribution
- **Heartbeat Monitoring**: Agent health and status tracking
- **Message Routing**: Capability-based and topic-based routing

### Transport Layers
- **Redis Streams**: Persistent, scalable message queuing
- **WebSocket**: Real-time bidirectional communication
- **HTTP REST**: RESTful API for management operations

### Security & Validation
- **Message Validation**: Schema validation using Zod
- **Authentication**: Token-based agent authentication
- **Message Signing**: Optional cryptographic message signing
- **Connection Security**: TLS/SSL support for production

## Package Structure

### `@the-new-fuse/a2a-core`
Core protocol implementation with TypeScript types, Redis adapter, WebSocket gateway, and NestJS module.

```typescript
import { A2ACoreModule, A2AService } from '@the-new-fuse/a2a-core';

// In your NestJS app module
@Module({
  imports: [
    A2ACoreModule.forRoot({
      redis: { url: 'redis://localhost:6379' },
      websocket: { port: 3001 }
    })
  ]
})
export class AppModule {}
```

### `@the-new-fuse/a2a-react`
React hooks and components for frontend integration.

```typescript
import { A2AProvider, useA2A } from '@the-new-fuse/a2a-react';

function App() {
  return (
    <A2AProvider
      config={{ url: 'ws://localhost:3001', agentId: 'web-agent' }}
      autoConnect={true}
    >
      <ChatComponent />
    </A2AProvider>
  );
}
```

## Database Schema

The A2A protocol extends the existing database with new models:

- **A2AAgent**: Agent registrations and metadata
- **A2AAgentCapability**: Agent capabilities and services
- **A2AMessage**: Protocol messages and routing information
- **A2AConversation**: Multi-agent conversation coordination
- **A2AConversationParticipant**: Conversation membership
- **A2AHeartbeat**: Agent health and status monitoring

## Usage Examples

### Agent Registration

```typescript
const registration: AgentRegistration = {
  agentId: 'my-agent-123',
  name: 'My AI Agent',
  type: 'ASSISTANT',
  version: '1.0.0',
  capabilities: [
    {
      id: 'text-generation',
      name: 'Text Generation',
      description: 'Generate human-like text',
      version: '1.0.0'
    }
  ]
};

await a2aService.registerAgent(registration);
```

### Sending Messages

```typescript
// Direct message
const response = await a2aService.sendRequest(
  'sender-agent',
  'receiver-agent',
  { task: 'analyze', data: 'sample text' }
);

// Broadcast
await a2aService.broadcast(
  'sender-agent',
  { announcement: 'System maintenance in 5 minutes' },
  { topic: 'system-announcements' }
);
```

### Conversation Management

```typescript
// Start a conversation
const conversationId = await a2aService.startConversation(
  'initiator-agent',
  ['agent-1', 'agent-2', 'agent-3'],
  'Project Planning Discussion'
);

// Join conversation
await a2aService.joinConversation(conversationId, 'new-agent');
```

### React Hook Usage

```typescript
function ChatComponent() {
  const {
    connectionState,
    sendMessage,
    messages,
    agents
  } = useA2AContext();

  const handleSendMessage = async () => {
    await sendMessage({
      toAgent: 'target-agent',
      type: MessageType.REQUEST,
      payload: { text: 'Hello from React!' }
    });
  };

  return (
    <div>
      <div>Status: {connectionState.connected ? 'Connected' : 'Disconnected'}</div>
      <div>Agents: {agents.length}</div>
      <div>Messages: {messages.length}</div>
      <button onClick={handleSendMessage}>Send Message</button>
    </div>
  );
}
```

## Configuration

### Environment Variables

```bash
# Redis Configuration
A2A_REDIS_URL=redis://localhost:6379

# WebSocket Configuration  
A2A_WEBSOCKET_PORT=3001

# Security Settings
A2A_ENABLE_SIGNATURES=false
A2A_ENABLE_ENCRYPTION=false
A2A_SECRET_KEY=your-secret-key

# Monitoring
A2A_ENABLE_METRICS=true
A2A_HEARTBEAT_INTERVAL=30000
A2A_CONNECTION_TIMEOUT=60000

# Frontend Configuration
REACT_APP_A2A_WEBSOCKET_URL=ws://localhost:3001
REACT_APP_A2A_API_URL=http://localhost:3000
```

## API Endpoints

### Agent Management
- `POST /a2a/agents/register` - Register a new agent
- `DELETE /a2a/agents/:agentId` - Unregister an agent
- `GET /a2a/agents` - Discover agents
- `PUT /a2a/agents/:agentId/status` - Update agent status

### Messaging
- `POST /a2a/messages/send` - Send a message
- `POST /a2a/messages/request` - Send a request (with response)
- `POST /a2a/messages/broadcast` - Broadcast a message

### Conversations
- `POST /a2a/conversations` - Start a conversation
- `POST /a2a/conversations/:id/join` - Join a conversation
- `POST /a2a/conversations/:id/leave` - Leave a conversation

### System
- `GET /a2a/system/stats` - Get system statistics
- `GET /a2a/system/connections` - Get connection status

## Development Setup

1. **Install Dependencies**
   ```bash
   cd packages/a2a-core && bun install && bun run build
   cd packages/a2a-react && bun install && bun run build
   ```

2. **Setup Database**
   ```bash
   cd packages/database
   bunx prisma migrate dev
   ```

3. **Start Redis**
   ```bash
   redis-server
   ```

4. **Configure Environment**
   ```bash
   cp .env.a2a.example .env.a2a
   # Edit configuration as needed
   ```

5. **Start API Server**
   ```bash
   cd apps/api && bun run dev
   ```

6. **Start Frontend**
   ```bash
   cd apps/frontend && bun run dev
   ```

## Integration with Existing Features

The A2A protocol seamlessly integrates with existing features:

- **Multi-Agent Chat**: Enhanced with real-time A2A communication
- **Firebase Integration**: Maintains compatibility with existing Firebase features
- **Agent Management**: Extends current agent capabilities
- **WebSocket Services**: Builds upon existing WebSocket infrastructure

## Message Flow

```
1. Agent Registration
   Frontend → API → Redis → Database

2. Message Sending
   Frontend → WebSocket → Redis → Target Agent

3. Response Handling
   Target Agent → Redis → WebSocket → Frontend

4. Conversation Management
   Initiator → API → Redis → All Participants
```

## Monitoring and Debugging

The A2A implementation includes comprehensive monitoring:

- **Connection Status**: Real-time connection monitoring
- **Message Tracing**: Full message lifecycle tracking
- **Agent Health**: Heartbeat monitoring and status tracking
- **Performance Metrics**: Message throughput and latency metrics
- **Error Handling**: Comprehensive error tracking and reporting

## Future Enhancements

- **Message Encryption**: End-to-end message encryption
- **Advanced Routing**: ML-based intelligent message routing
- **Federation**: Cross-instance agent communication
- **Workflow Engine**: Visual workflow designer for agent interactions
- **Analytics Dashboard**: Real-time analytics and insights

## Troubleshooting

### Common Issues

1. **Connection Failed**: Check Redis server and WebSocket port
2. **Authentication Failed**: Verify agent registration and credentials
3. **Message Not Delivered**: Check agent status and routing configuration
4. **Performance Issues**: Monitor Redis memory and connection pools

### Debug Mode

Enable detailed logging by setting:
```bash
A2A_ENABLE_DETAILED_LOGGING=true
```

### Health Checks

Check system health via:
```bash
curl http://localhost:3000/a2a/system/stats
```

## Contributing

When contributing to the A2A implementation:

1. Follow existing TypeScript patterns
2. Add comprehensive tests for new features
3. Update documentation for API changes
4. Ensure backward compatibility
5. Test with multiple agents and scenarios

## License

This A2A Protocol implementation is part of The New Fuse project and follows the same licensing terms.
