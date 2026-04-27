# Verified Doc: docs/agents-and-protocols/AGENT_DEVELOPMENT_GUIDE

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1774266955.3484697

## Content

# Agent Development Guide

## Overview

This guide provides step-by-step instructions for developing AI agents that
integrate with The New Fuse agent communication infrastructure. Whether you're
building a simple assistant or a complex multi-agent system, this guide covers
all the essentials.

**Target Audience**: Developers building AI agents for The New Fuse ecosystem

**Prerequisites**:

- TypeScript/JavaScript knowledge
- Understanding of async/await patterns
- Familiarity with REST APIs
- Basic knowledge of WebSocket communication

---

## Table of Contents

1. [Quick Start](#quick-start)
2. [Agent Architecture](#agent-architecture)
3. [Agent Registration](#agent-registration)
4. [Communication Patterns](#communication-patterns)
5. [Message Handling](#message-handling)
6. [Error Handling](#error-handling)
7. [Testing Your Agent](#testing-your-agent)
8. [Deployment](#deployment)
9. [Best Practices](#best-practices)
10. [Example Implementations](#example-implementations)

---

## Quick Start

### Minimal Agent Example

```typescript
import { MCPRegistryService } from '@the-new-fuse/api';
import { InterAgentChatService } from '@the-new-fuse/backend';

class SimpleAgent {
  private agentId: string;
  private mcpRegistry: MCPRegistryService;
  private chatService: InterAgentChatService;

  constructor(
    private name: string,
    private capabilities: string[]
  ) {}

  async initialize(): Promise<void> {
    // Register with the system
    const agent = await this.mcpRegistry.registerAgent({
      name: this.name,
      type: 'assistant',
      metadata: {
        capabilities: this.capabilities,
        version: '1.0.0',
      },
    });

    this.agentId = agent.id;
    console.log(`Agent registered with ID: ${this.agentId}`);

    // Set up message handlers
    this.setupMessageHandlers();
  }

  private setupMessageHandlers(): void {
    // Handle incoming messages
    // Implementation depends on communication protocol
  }

  async sendMessage(targetAgentId: string, content: string): Promise<void> {
    await this.chatService.sendMessage(targetAgentId, content, {
      fromAgent: this.agentId,
      timestamp: Date.now(),
    });
  }

  async shutdown(): Promise<void> {
    console.log(`Shutting down agent ${this.agentId}`);
    // Cleanup logic here
  }
}

// Usage
const agent = new SimpleAgent('My Assistant', ['chat', 'help']);
await agent.initialize();
```

---

## Agent Architecture

### Core Components

Every agent should implement these core components:

**1. Registration Module**:

- Handles agent registration with the registry
- Manages agent metadata and capabilities
- Handles authentication and authorization

**2. Communication Module**:

- Manages connections (WebSocket, HTTP, Redis, MCP)
- Implements protocol-specific logic
- Handles message serialization/deserialization

**3. Message Handler Module**:

- Processes incoming messages
- Routes messages to appropriate handlers
- Implements business logic

**4. State Management Module**:

- Manages agent state
- Handles session data
- Implements persistence if needed

**5. Error Handler Module**:

- Catches and handles errors
- Implements retry logic
- Provides error reporting

### Agent Lifecycle

```
┌─────────────┐
│   Created   │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Registering │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Active    │ ◄──┐
└──────┬──────┘    │
       │           │
       ├───────────┘ (normal operation)
       │
       ▼
┌─────────────┐
│ Shutting    │
│    Down     │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Terminated  │
└─────────────┘
```

---

## Agent Registration

### Registration Process

**Step 1: Prepare Agent Metadata**

```typescript
interface AgentMetadata {
  name: string;
  type: AgentType;
  capabilities: string[];
  version: string;
  description?: string;
  [key: string]: any;
}

const metadata: AgentMetadata = {
  name: 'Code Assistant',
  type: 'developer',
  capabilities: ['code-generation', 'debugging', 'testing'],
  version: '1.0.0',
  description: 'AI-powered code assistant',
  model: 'gpt-4',
  provider: 'OpenAI',
};
```

**Step 2: Register with MCP Registry**

```typescript
import { MCPRegistryService } from '@the-new-fuse/api';

class AgentRegistration {
  private mcpRegistry: MCPRegistryService;

  async register(metadata: AgentMetadata): Promise<string> {
    try {
      const agent = await this.mcpRegistry.registerAgent({
        name: metadata.name,
        type: metadata.type,
        metadata: {
          capabilities: metadata.capabilities,
          version: metadata.version,
          ...metadata,
        },
      });

      console.log(`Agent registered successfully: ${agent.id}`);
      return agent.id;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  async updateStatus(agentId: string, status: AgentStatus): Promise<void> {
    await this.mcpRegistry.updateAgentStatus(agentId, status);
  }
}
```

**Step 3: Implement Heartbeat**

```typescript
class AgentHeartbeat {
  private heartbeatInterval: NodeJS.Timeout | null = null;

  startHeartbeat(agentId: string, intervalMs: number = 30000): void {
    this.heartbeatInterval = setInterval(async () => {
      try {
        await this.mcpRegistry.updateAgentStatus(agentId, AgentStatus.ACTIVE);
      } catch (error) {
        console.error('Heartbeat failed:', error);
      }
    }, intervalMs);
  }

  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
```

---

## Communication Patterns

### 1. WebSocket Communication

**Client Setup**:

```typescript
import { io, Socket } from 'socket.io-client';

class WebSocketAgent {
  private socket: Socket;
  private agentId: string;

  connect(url: string = 'http://localhost:3000'): void {
    this.socket = io(url, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      this.registerAgent();
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    this.socket.on('agent:message', (message) => {
      this.handleMessage(message);
    });

    this.socket.on('agent:broadcast', (message) => {
      this.handleBroadcast(message);
    });

    this.socket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  private registerAgent(): void {
    const registration = {
      version: '1.0',
      messageId: `reg-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        agentId: this.agentId,
        agentType: 'websocket-agent',
        capabilities: ['chat', 'assistance'],
      },
      target: {
        agentId: 'tnf-relay',
      },
      content: {
        type: 'request',
        action: 'register',
        data: {
          agentId: this.agentId,
          status: 'online',
        },
        priority: 'high',
      },
    };

    this.socket.emit('agent:register', registration);
  }

  sendMessage(targetAgentId: string, content: any): void {
    const message = {
      version: '1.0',
      messageId: `msg-${Date.now()}`,
      timestamp: Date.now(),
      source: {
        agentId: this.agentId,
        agentType: 'websocket-agent',
        capabilities: [],
      },
      target: {
        agentId: targetAgentId,
      },
      content: {
        type: 'request',
        action: 'message',
        data: content,
        priority: 'medium',
      },
    };

    this.socket.emit('agent:message', message);
  }

  private handleMessage(message: any): void {
    console.log('Received message:', message);
    // Implement your message handling logic
  }

  private handleBroadcast(message: any): void {
    console.log('Received broadcast:', message);
    // Implement your broadcast handling logic
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}
```

---

### 2. Redis Pub/Sub Communication

```typescript
import Redis from 'ioredis';

class RedisPubSubAgent {
  private publisher: Redis;
  private subscriber: Redis;
  private agentId: string;

  constructor(
    agentId: string,
    redisUrl: string = 'redis://default:<YOUR_REDIS_PASSWORD>@<REDIS_HOST>:<REDIS_PORT>'
  ) {
    this.agentId = agentId;
    this.publisher = new Redis(redisUrl);
    this.subscriber = new Redis(redisUrl);
  }

  async initialize(): Promise<void> {
    // Subscribe to agent-specific channel
    await this.subscriber.subscribe(`agent-chat:${this.agentId}`);

    // Subscribe to broadcast channel
    await this.subscriber.subscribe('agent-chat:broadcast');

    // Set up message handler
    this.subscriber.on('message', (channel, message) => {
      this.handleRedisMessage(channel, message);
    });

    console.log(`Agent ${this.agentId} subscribed to Redis channels`);
  }

  async sendMessage(
    targetAgentId: string,
    content: string,
    metadata?: any
  ): Promise<void> {
    const message = {
      id: `msg_${Date.now()}`,
      from: this.agentId,
      to: targetAgentId,
      content,
      timestamp: new Date(),
      metadata,
    };

    const channel = `agent-chat:${targetAgentId}`;
    await this.publisher.publish(channel, JSON.stringify(message));
  }

  async broadcastMessage(content: string, metadata?: any): Promise<void> {
    const message = {
      id: `msg_${Date.now()}`,
      from: this.agentId,
      to: 'broadcast',
      content,
      timestamp: new Date(),
      metadata,
    };

    await this.publisher.publish(
      'agent-chat:broadcast',
      JSON.stringify(message)
    );
  }

  private handleRedisMessage(channel: string, message: string): void {
    try {
      const parsed = JSON.parse(message);
      console.log(`Message from ${channel}:`, parsed);
      // Implement your message handling logic
    } catch (error) {
      console.error('Error parsing Redis message:', error);
    }
  }

  async cleanup(): Promise<void> {
    await this.subscriber.unsubscribe();
    this.subscriber.disconnect();
    this.publisher.disconnect();
  }
}
```

---

### 3. HTTP REST Communication

```typescript
class HTTPAgent {
  private apiUrl: string;
  private apiKey: string;
  private agentId: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async register(name: string, type: string, metadata: any): Promise<string> {
    const response = await fetch(`${this.apiUrl}/agents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify({
        name,
        type,
        metadata,
      }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.statusText}`);
    }

    const agent = await response.json();
    this.agentId = agent.id;
    return agent.id;
  }

  async sendMessage(targetAgentId: string, message: any): Promise<void> {
    const response = await fetch(
      `${this.apiUrl}/agents/${targetAgentId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          from: this.agentId,
          content: message,
          timestamp: Date.now(),
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Message send failed: ${response.statusText}`);
    }
  }

  async getAgentInfo(agentId: string): Promise<any> {
    const response = await fetch(`${this.apiUrl}/agents/${agentId}`, {
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to get agent info: ${response.statusText}`);
    }

    return response.json();
  }

  async findAgents(criteria: any): Promise<any[]> {
    const params = new URLSearchParams(criteria);
    const response = await fetch(`${this.apiUrl}/agents?${params}`, {
      headers: {
        'X-API-Key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Agent search failed: ${response.statusText}`);
    }

    return response.json();
  }
}
```

---

## Message Handling

### Message Router Pattern

```typescript
interface MessageHandler {
  (message: any): Promise<void> | void;
}

class MessageRouter {
  private handlers: Map<string, MessageHandler[]> = new Map();

  register(action: string, handler: MessageHandler): void {
    if (!this.handlers.has(action)) {
      this.handlers.set(action, []);
    }
    this.handlers.get(action)!.push(handler);
  }

  async route(message: any): Promise<void> {
    const action = message.content?.action;

    if (!action) {
      console.warn('Message has no action:', message);
      return;
    }

    const handlers = this.handlers.get(action) || [];

    if (handlers.length === 0) {
      console.warn(`No handlers for action: ${action}`);
      return;
    }

    // Execute all handlers for this action
    await Promise.all(handlers.map((handler) => handler(message)));
  }
}

// Usage
const router = new MessageRouter();

router.register('code-generation', async (message) => {
  const { code, language } = message.content.data;
  const generated = await generateCode(code, language);
  // Send response...
});

router.register('debugging', async (message) => {
  const { code, error } = message.content.data;
  const solution = await debug(code, error);
  // Send response...
});

// Route incoming messages
await router.route(incomingMessage);
```

---

## Error Handling

### Retry Logic

```typescript
class RetryHandler {
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt < maxRetries) {
          console.log(
            `Attempt ${attempt + 1} failed, retrying in ${delay}ms...`
          );
          await this.sleep(delay * Math.pow(2, attempt));
        }
      }
    }

    throw new Error(
      `Operation failed after ${maxRetries} retries: ${lastError!.message}`
    );
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Usage
const retryHandler = new RetryHandler();

await retryHandler.withRetry(
  async () => {
    await agent.sendMessage(targetId, content);
  },
  3,
  1000
);
```

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failures: number = 0;
  private lastFailureTime: number = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}
```

---

## Testing Your Agent

### Unit Tests

```typescript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('MyAgent', () => {
  let agent: MyAgent;

  beforeEach(() => {
    agent = new MyAgent('test-agent', ['capability1']);
  });

  it('should register successfully', async () => {
    const agentId = await agent.initialize();
    expect(agentId).toBeDefined();
  });

  it('should send message', async () => {
    await agent.initialize();
    await expect(
      agent.sendMessage('target-id', 'hello')
    ).resolves.not.toThrow();
  });

  it('should handle incoming message', async () => {
    const message = {
      content: {
        action: 'test-action',
        data: { key: 'value' },
      },
    };

    await agent.handleMessage(message);
    // Assert expected behavior
  });
});
```

### Integration Tests

```typescript
describe('Agent Integration Tests', () => {
  let agent1: MyAgent;
  let agent2: MyAgent;

  beforeAll(async () => {
    agent1 = new MyAgent('agent-1', ['send']);
    agent2 = new MyAgent('agent-2', ['receive']);

    await agent1.initialize();
    await agent2.initialize();
  });

  it('should communicate between agents', async () => {
    let receivedMessage: any;

    agent2.onMessage((msg) => {
      receivedMessage = msg;
    });

    await agent1.sendMessage(agent2.agentId, 'test message');

    // Wait for message delivery
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(receivedMessage).toBeDefined();
    expect(receivedMessage.content).toBe('test message');
  });

  afterAll(async () => {
    await agent1.shutdown();
    await agent2.shutdown();
  });
});
```

---

## Deployment

### Environment Configuration

```bash
# .env.agent
AGENT_NAME=my-agent
AGENT_TYPE=developer
AGENT_CAPABILITIES=code-generation,debugging

API_URL=https://api.thenewfuse.com
API_KEY=agent_your_api_key_here

REDIS_URL=redis://redis.thenewfuse.com:6379
WEBSOCKET_URL=wss://ws.thenewfuse.com

LOG_LEVEL=info
HEARTBEAT_INTERVAL=30000
```

### Docker Deployment

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

CMD ["node", "dist/agent.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  my-agent:
    build: .
    environment:
      - API_URL=${API_URL}
      - API_KEY=${API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
```

---

## Best Practices

### 1. Agent Design

- **Single Responsibility**: Each agent should have a clear, focused purpose
- **Stateless When Possible**: Design agents to be stateless for better
  scalability
- **Idempotent Operations**: Operations should be safe to retry
- **Graceful Degradation**: Handle failures gracefully without cascading

### 2. Communication

- **Use Appropriate Protocol**: Choose the right protocol for your use case
- **Message Validation**: Always validate incoming messages
- **Timeout Handling**: Set reasonable timeouts for all operations
- **Rate Limiting**: Implement rate limiting to prevent abuse

### 3. Error Handling

- **Log Everything**: Comprehensive logging is essential
- **Fail Fast**: Detect and report errors quickly
- **Retry with Backoff**: Use exponential backoff for retries
- **Circuit Breakers**: Protect against cascading failures

### 4. Security

- **Validate Inputs**: Never trust incoming data
- **Use API Keys**: Secure all communications with API keys
- **Encrypt Sensitive Data**: Use encryption for sensitive information
- **Audit Logs**: Maintain audit trails for security events

### 5. Performance

- **Async Operations**: Use async/await for all I/O operations
- **Connection Pooling**: Reuse connections when possible
- **Caching**: Cache frequently accessed data
- **Monitor Performance**: Track metrics and optimize bottlenecks

---

## Example Implementations

See the `<repo-root>/examples/` directory for complete example implementations:

- `code-execution-agent/` - Agent for executing code snippets
- `agent-workflow/` - Multi-agent workflow orchestration
- `llm-integration/` - LLM-powered agent examples

---

## Additional Resources

- [Agent Communication
  Architecture](<repo-root>/docs/agents-and-protocols/AGENT_COMMUNICATION_ARCHITECTURE.md)
- [Agent Framework
  Protocols](<repo-root>/docs/agents-and-protocols/AGENT_FRAMEWORK_PROTOCOLS.md)
- [MCP Complete Guide](<repo-root>/docs/protocols/MCP-COMPLETE-GUIDE.md)
- [API Documentation](<repo-root>/docs/api/)

---

## Support

For questions and support:

- GitHub Issues: https://github.com/whodaniel/fuse/issues
- Documentation: <repo-root>/docs/
- Community: Join our Discord/Slack

---

**Version**: 1.0.0 **Last Updated**: 2025-11-18 **Status**: Production Ready

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
