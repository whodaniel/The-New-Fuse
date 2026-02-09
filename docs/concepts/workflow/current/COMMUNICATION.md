# Communication Protocol

## Overview

The New Fuse uses a sophisticated Redis-based communication system for real-time interaction between AI agents.

## Channels

1. `AI_COORDINATION_CHANNEL`: Primary channel for all agent communication
2. `AI_TASK_CHANNEL`: Task-specific messages and coordination
3. `AI_RESULT_CHANNEL`: Results and completion updates

## Message Format (v2.0.0)

```typescript
interface Message {
  header: {
    source: 'cascade' | 'cline';
    target: 'cascade' | 'cline';
    type: MessageType;
    version: string;
    priority: Priority;
  };
  body: {
    content: {
      message: string;
      [key: string]: any;
    };
    metadata: {
      sent_at: string;
      version: string;
    };
    timestamp: string;
  };
}

enum MessageType {
  SYSTEM = 'SYSTEM',
  CONVERSATION = 'CONVERSATION',
  TASK = 'TASK',
  IMPROVEMENT = 'IMPROVEMENT',
  ACKNOWLEDGMENT = 'ACKNOWLEDGMENT',
  STATUS = 'STATUS'
}

enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}
```

## Implementation

### TypeScript/Redis Integration

```typescript
import { Redis } from 'ioredis';
import { Injectable } from '@nestjs/common';
import { Message, MessageType, Priority } from './types';

@Injectable()
export class CommunicationService {
  private readonly redis: Redis;

  constructor() {
    this.redis = new Redis({
      host: 'localhost',
      port: 6379,
      db: 0
    });
  }

  async sendMessage(message: Message): Promise<void> {
    await this.redis.publish(
      'AI_COORDINATION_CHANNEL',
      JSON.stringify(message)
    );
  }

  async listenForMessages(callback: (message: Message) => void): Promise<void> {
    const subscriber = this.redis.duplicate();
    
    await subscriber.subscribe(
      'AI_COORDINATION_CHANNEL',
      'AI_TASK_CHANNEL',
      'AI_RESULT_CHANNEL'
    );

    subscriber.on('message', (channel, message) => {
      const parsedMessage = JSON.parse(message) as Message;
      callback(parsedMessage);
    });
  }
}
```

## Best Practices

1. Message Handling
   - Always validate message format
   - Use appropriate channels
   - Set correct priority levels
   - Include necessary metadata
   - Implement error handling

2. Error Recovery
   - Implement retry mechanisms
   - Handle connection failures
   - Validate message delivery
   - Monitor system health
   - Log errors appropriately

3. Performance
   - Use connection pooling
   - Implement message batching
   - Monitor queue sizes
   - Handle backpressure
   - Optimize message size

## WebSocket Integration

```typescript
@WebSocketGateway()
export class CommunicationGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('message')
  handleMessage(@MessageBody() data: any): void {
    // Handle WebSocket messages
  }
}
```

## Security Considerations

1. Message Encryption
2. Authentication
3. Rate Limiting
4. Input Validation
5. Error Handling
