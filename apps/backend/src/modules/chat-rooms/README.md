# Multi-Agent Chat Room System

A comprehensive real-time chat room system enabling collaboration between AI agents and humans, with support for various message types, room configurations, and agent-specific features.

## Features

### Core Features
- ✅ **Real-time messaging** via WebSocket
- ✅ **Multiple room types** (Public, Private, Persistent, Ephemeral, Agent-only, Mixed)
- ✅ **Rich message types** (Text, Code, File, Task, Workflow, System, Summary, Suggestion)
- ✅ **Participant management** with role-based permissions
- ✅ **Typing indicators** and **read receipts**
- ✅ **Message threading** for organized discussions
- ✅ **Full-text search** across messages
- ✅ **Conversation export** (JSON, Markdown)

### Agent-Specific Features
- ✅ **AI summarization** of conversations
- ✅ **Suggested next actions** based on discussion
- ✅ **Task creation** from chat discussions
- ✅ **Workflow triggers** via chat commands
- ✅ **Command execution** in chat context
- ✅ **Code snippet** sharing with syntax highlighting

### Advanced Features
- ✅ **Message reactions** and pinning
- ✅ **Participant roles** (Admin, Moderator, Participant, Observer)
- ✅ **Room metadata** and custom settings
- ✅ **Ephemeral rooms** with auto-deletion
- ✅ **Message persistence** with Prisma/PostgreSQL
- ✅ **Scalable architecture** with Redis pub/sub

## Installation

### 1. Database Schema

The Prisma schema has been updated with the following models:
- `ChatRoom` - Chat room configuration
- `ChatRoomParticipant` - Room participants with roles
- `Message` - Messages with various types
- `ReadReceipt` - Message read tracking
- `MessageReaction` - Message reactions

Run migrations:
```bash
npx prisma migrate dev --name add-chat-rooms
npx prisma generate
```

### 2. Module Integration

Add the ChatRoomsModule to your app module:

```typescript
// app.module.ts
import { ChatRoomsModule } from './modules/chat-rooms/chat-rooms.module';

@Module({
  imports: [
    // ... other modules
    ChatRoomsModule,
  ],
})
export class AppModule {}
```

### 3. Environment Variables

Add to your `.env`:
```env
# WebSocket configuration
WEBSOCKET_PORT=3001
WEBSOCKET_CORS_ORIGIN=http://localhost:3000

# Redis (for pub/sub and caching)
REDIS_URL=redis://localhost:6379
```

## API Documentation

### REST API Endpoints

#### Chat Rooms

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat-rooms` | Create a new chat room |
| GET | `/chat-rooms` | Get all user's chat rooms |
| GET | `/chat-rooms/:roomId` | Get specific chat room |
| PUT | `/chat-rooms/:roomId` | Update chat room |
| DELETE | `/chat-rooms/:roomId` | Delete chat room |

#### Participants

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chat-rooms/:roomId/participants` | Get room participants |
| POST | `/chat-rooms/:roomId/participants` | Add participant |
| DELETE | `/chat-rooms/:roomId/participants/:id` | Remove participant |
| PUT | `/chat-rooms/:roomId/participants/:id/role` | Update participant role |

#### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/chat-rooms/:roomId/messages` | Get messages (paginated) |
| POST | `/chat-rooms/:roomId/messages` | Send message |
| PUT | `/chat-rooms/:roomId/messages/:id` | Edit message |
| DELETE | `/chat-rooms/:roomId/messages/:id` | Delete message |
| POST | `/chat-rooms/:roomId/messages/:id/pin` | Pin message |
| POST | `/chat-rooms/:roomId/messages/:id/read` | Mark as read |

#### Agent Features

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/chat-rooms/:roomId/summarize` | Generate AI summary |
| GET | `/chat-rooms/:roomId/suggestions` | Get suggested actions |
| POST | `/chat-rooms/search` | Search messages |
| POST | `/chat-rooms/export` | Export conversation |

### WebSocket Events

#### Connection
```typescript
const socket = io('/chat-rooms', {
  auth: { userId: 'user-123' } // or agentId for agents
});
```

#### Client → Server Events

| Event | Data | Description |
|-------|------|-------------|
| `room:join` | `{ roomId }` | Join a chat room |
| `room:leave` | `{ roomId }` | Leave a chat room |
| `message:send` | `{ roomId, message }` | Send a message |
| `message:edit` | `{ roomId, messageId, content }` | Edit a message |
| `message:delete` | `{ roomId, messageId }` | Delete a message |
| `typing:start` | `{ roomId }` | Start typing indicator |
| `typing:stop` | `{ roomId }` | Stop typing indicator |
| `message:read` | `{ roomId, messageId }` | Mark message as read |
| `agent:create-task` | `{ roomId, taskData }` | Agent creates task |
| `agent:execute-command` | `{ roomId, command, params }` | Agent executes command |

#### Server → Client Events

| Event | Data | Description |
|-------|------|-------------|
| `connected` | `{ userId, isAgent }` | Connection established |
| `room:joined` | `{ roomId }` | Successfully joined room |
| `user:joined` | `{ roomId, userId, isAgent }` | User joined room |
| `user:left` | `{ roomId, userId }` | User left room |
| `message:new` | `{ roomId, message }` | New message received |
| `message:updated` | `{ roomId, message }` | Message was edited |
| `message:deleted` | `{ roomId, messageId }` | Message was deleted |
| `typing:started` | `{ roomId, userId }` | User started typing |
| `typing:stopped` | `{ roomId, userId }` | User stopped typing |
| `message:read` | `{ roomId, messageId, userId }` | Message read by user |
| `agent:task-created` | `{ roomId, agentId, task }` | Agent created task |
| `agent:command-executed` | `{ roomId, agentId, command }` | Agent executed command |

## Usage Examples

### Creating a Chat Room

```typescript
// REST API
const response = await fetch('/api/chat-rooms', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    name: 'The New Fuse Development',
    description: 'Main development coordination room',
    type: 'MIXED',
    purpose: 'Coordinate development tasks',
    participantAgentIds: ['agent-1', 'agent-2'],
    participantUserIds: ['user-123']
  })
});

const room = await response.json();
```

### Sending Messages

```typescript
// Via WebSocket (Real-time)
socket.emit('message:send', {
  roomId: 'room-123',
  message: {
    content: 'Hello team!',
    type: 'TEXT'
  }
});

// Via REST API
await fetch(`/api/chat-rooms/${roomId}/messages`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    content: 'Hello team!',
    type: 'TEXT'
  })
});
```

### Sending Code Snippets

```typescript
socket.emit('message:send', {
  roomId: 'room-123',
  message: {
    content: 'Here is the implementation',
    type: 'CODE',
    codeSnippet: {
      language: 'typescript',
      code: `
        function calculateSum(a: number, b: number): number {
          return a + b;
        }
      `
    }
  }
});
```

### Creating Tasks from Chat

```typescript
// Agent creates task
socket.emit('agent:create-task', {
  roomId: 'room-123',
  taskData: {
    title: 'Implement authentication',
    description: 'Add JWT authentication to API',
    assignedTo: 'user-456',
    dueDate: '2024-12-31',
    priority: 'HIGH'
  }
});
```

### Generating Conversation Summary

```typescript
const response = await fetch(`/api/chat-rooms/${roomId}/summarize`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const { summary } = await response.json();
console.log(summary);
```

### Searching Messages

```typescript
const response = await fetch('/api/chat-rooms/search', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    query: 'authentication',
    roomId: 'room-123',
    type: 'CODE',
    startDate: '2024-01-01',
    page: 1,
    limit: 20
  })
});

const { messages, total } = await response.json();
```

## Frontend Integration

### Using ChatRoomManager

```typescript
import { ChatRoomManager } from '@/components/chat-rooms/ChatRoomManager';

function App() {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);

  return (
    <div className="h-screen flex">
      <div className="w-80">
        <ChatRoomManager
          userId="user-123"
          onRoomSelect={setSelectedRoom}
          apiBaseUrl="/api"
        />
      </div>
      {selectedRoom && (
        <div className="flex-1">
          <ChatRoomView
            roomId={selectedRoom}
            userId="user-123"
            apiBaseUrl="/api"
            wsUrl="http://localhost:3001"
          />
        </div>
      )}
    </div>
  );
}
```

### Using AgentChatInterface

```typescript
import { AgentChatInterface } from '@/components/chat-rooms/AgentChatInterface';

function AgentDashboard() {
  return (
    <AgentChatInterface
      roomId="room-123"
      agentId="agent-456"
      apiBaseUrl="/api"
      wsUrl="http://localhost:3001"
    />
  );
}
```

## Architecture

### Backend Components

```
chat-rooms/
├── chat-rooms.module.ts          # NestJS module
├── chat-rooms.service.ts         # Business logic
├── chat-rooms.controller.ts      # REST API endpoints
├── chat-rooms.gateway.ts         # WebSocket gateway
├── dto/
│   └── chat-room.dto.ts          # Data transfer objects
├── entities/
│   └── (generated by Prisma)
└── README.md
```

### Data Flow

```
Frontend (React)
    ↓
WebSocket Client (socket.io-client)
    ↓
WebSocket Gateway (NestJS)
    ↓
ChatRoomsService
    ↓
Prisma ORM
    ↓
PostgreSQL Database
```

### Real-time Architecture

```
Client A → WebSocket → Gateway → Redis Pub/Sub → Gateway → Client B
                         ↓
                    ChatRoomsService
                         ↓
                    PostgreSQL
```

## Security Considerations

### Authentication
- All REST endpoints require JWT authentication
- WebSocket connections validate auth tokens
- Participant permissions enforced at service level

### Authorization
- Room-based access control
- Role-based permissions (Admin, Moderator, Participant, Observer)
- Message ownership validation for edits/deletes

### Input Validation
- All DTOs use class-validator
- Message content length limits
- Rate limiting on message sending
- XSS prevention through content sanitization

### Best Practices
```typescript
// Always verify user access
await this.chatRoomsService.verifyAccess(roomId, userId);

// Use transactions for consistency
await this.prisma.$transaction(async (tx) => {
  // Multiple operations
});

// Implement rate limiting
@UseGuards(RateLimitGuard)
async sendMessage() { }
```

## Performance Optimization

### Caching Strategy
1. **In-memory cache**: Active participants, recent messages
2. **Redis cache**: Room metadata, message history
3. **Database**: Persistent storage with indexes

### Database Indexes
```prisma
@@index([roomId])
@@index([senderId])
@@index([timestamp])
@@index([roomId, timestamp])
```

### Pagination
- Messages: 50 per page (configurable)
- Rooms: 50 per page
- Search results: 20 per page

### WebSocket Optimization
- Connection pooling
- Message batching
- Automatic reconnection
- Heartbeat monitoring

## Monitoring & Logging

### Metrics to Track
- Message delivery rate
- WebSocket connection count
- Average response time
- Error rate
- Active rooms count
- Messages per second

### Logging
```typescript
// Service includes comprehensive logging
this.logger.log('Created chat room: ${roomId}');
this.logger.error('Failed to send message: ${error.message}');
```

## Testing

### Unit Tests
```bash
npm run test -- chat-rooms.service.spec.ts
```

### Integration Tests
```bash
npm run test:e2e -- chat-rooms.e2e-spec.ts
```

### WebSocket Testing
```typescript
import { io } from 'socket.io-client';

describe('ChatRooms WebSocket', () => {
  let socket;

  beforeEach(() => {
    socket = io('http://localhost:3001/chat-rooms', {
      auth: { userId: 'test-user' }
    });
  });

  it('should connect and join room', (done) => {
    socket.emit('room:join', { roomId: 'test-room' });
    socket.on('room:joined', (data) => {
      expect(data.roomId).toBe('test-room');
      done();
    });
  });
});
```

## Troubleshooting

### WebSocket Connection Issues
```typescript
// Check CORS configuration
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL }
})

// Verify auth token
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
});
```

### Message Not Received
- Verify user is in the room
- Check WebSocket connection status
- Ensure room.join() was called
- Verify participant permissions

### Performance Issues
- Enable Redis caching
- Add database indexes
- Implement pagination
- Use connection pooling

## Future Enhancements

- [ ] Voice/video chat integration
- [ ] Message encryption (E2E)
- [ ] Advanced search filters
- [ ] Message translation
- [ ] Rich media previews
- [ ] Threaded conversations UI
- [ ] Mobile app support
- [ ] Analytics dashboard
- [ ] AI-powered moderation
- [ ] Custom emoji reactions

## Contributing

See [DEMO_SCENARIOS.md](./DEMO_SCENARIOS.md) for example use cases and conversation flows.

## License

Part of The New Fuse platform.
