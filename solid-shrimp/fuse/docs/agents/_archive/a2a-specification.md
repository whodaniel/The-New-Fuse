# Agent-to-Agent (A2A) Protocol Specification

The Agent-to-Agent (A2A) protocol is a standardized communication protocol for direct communication between AI agents in the Fuse framework. This document outlines the specification, methods, and usage patterns.

## Overview

A2A enables different AI agents to communicate directly with each other, share context, and coordinate on complex tasks. It supports multiple protocol versions and adapters for different agent types.

## Protocol Structure

A2A messages follow a structured format, with support for multiple versions:

### A2A Message V1 (Flat Structure)

```typescript
interface A2AMessageV1 {
    id: string;
    type: string;
    timestamp: number;
    sender: string;
    recipient?: string;
    payload: any;
    metadata: {
        priority: 'low' | 'medium' | 'high';
        timeout?: number;
        retryCount?: number;
        protocol_version: '1.0';
    };
}
```

### A2A Message V2 (Header/Body Structure)

```typescript
interface A2AMessageV2 {
    header: {
        id: string;
        type: string;
        version: string;
        priority: 'low' | 'medium' | 'high';
        source: string;
        target?: string;
    };
    body: {
        content: any;
        metadata: {
            sent_at: number;
            timeout?: number;
            retries?: number;
            trace_id?: string;
        };
    };
}
```

## Message Types

A2A supports the following message types:

```typescript
enum A2AMessageType {
    TASK_REQUEST = 'TASK_REQUEST',
    QUERY = 'QUERY',
    RESPONSE = 'RESPONSE',
    NOTIFICATION = 'NOTIFICATION',
    ERROR = 'ERROR',
    HEARTBEAT = 'HEARTBEAT',
    CAPABILITY_DISCOVERY = 'CAPABILITY_DISCOVERY',
    WORKFLOW_STEP = 'WORKFLOW_STEP'
}
```

## Protocol Adapters

A2A supports multiple protocol adapters to enable communication between different agent types:

```typescript
interface ProtocolAdapter {
    name: string;
    version: string;
    supportedProtocols: string[];
    canHandle(protocol: string): boolean;
    adaptMessage(message: A2AMessage, targetProtocol: string): Promise<any>;
}
```

### Google A2A Adapter

```typescript
class GoogleA2AAdapter {
  readonly name = 'google-a2a-adapter';
  readonly version = '1.0.0';
  readonly supportedProtocols = ['a2a-v2.0', 'google-a2a-v1.0'];

  canHandle(protocol: string): boolean {
    return this.supportedProtocols.includes(protocol);
  }

  async adaptMessage(message: A2AMessage, targetProtocol: string): Promise<GoogleA2AMessage> {
    if (targetProtocol === 'google-a2a-v1.0') {
      return this.convertToGoogleFormat(message);
    } else if (targetProtocol === 'a2a-v2.0') {
      return this.convertFromGoogleFormat(message as unknown as GoogleA2AMessage);
    }
    throw new Error(`Unsupported target protocol: ${targetProtocol}`);
  }
}
```

### ACA Protocol Adapter

```typescript
class ACAProtocolAdapter {
  readonly name = 'aca-protocol-adapter';
  readonly version = '1.0.0';
  readonly supportedProtocols = ['a2a-v2.0', 'aca-v1.0'];

  canHandle(protocol: string): boolean {
    return this.supportedProtocols.includes(protocol);
  }

  async adaptMessage(message: A2AMessage, targetProtocol: string): Promise<ACAMessage | A2AMessage> {
    if (targetProtocol === 'aca-v1.0') {
      return this.convertToACAFormat(message);
    } else if (targetProtocol === 'a2a-v2.0') {
      return this.convertFromACAFormat(message as unknown as ACAMessage);
    }
    throw new Error(`Unsupported target protocol: ${targetProtocol}`);
  }
}
```

## Implementation

### Protocol Handler

```typescript
class A2AProtocolHandler {
  private messageHandlers: Map<string, MessageHandler>;
  private agentCardService: AgentCardService;

  constructor(agentCardService: AgentCardService) {
    this.messageHandlers = new Map();
    this.agentCardService = agentCardService;
    this.registerDefaultHandlers();
  }

  async handleMessage(message: A2AMessage): Promise<void> {
    try {
      // Validate message format
      this.validateMessage(message);

      // Check if target agent exists
      if (message.header.target) {
        const targetAgent = this.agentCardService.getAgentById(message.header.target);
        if (!targetAgent) {
          throw new Error(`Target agent ${message.header.target} not found`);
        }
      }

      // Get handler for message type
      const handler = this.messageHandlers.get(message.header.type);
      if (!handler) {
        throw new Error(`No handler registered for message type ${message.header.type}`);
      }

      // Handle message
      await handler(message);
    } catch (error) {
      // Handle error
      console.error(`Error handling message: ${error.message}`);
      throw error;
    }
  }
}
```

### WebSocket Service

```typescript
class A2AWebSocketService {
  private server: WebSocketServer;
  private clients: Map<string, WebSocket>;
  private protocolHandler: A2AProtocolHandler;

  constructor(port: number, protocolHandler: A2AProtocolHandler) {
    this.server = new WebSocketServer({ port });
    this.clients = new Map();
    this.protocolHandler = protocolHandler;
    this.initialize();
  }

  private initialize(): void {
    this.server.on('connection', (ws: WebSocket) => {
      // Handle connection
      ws.on('message', async (data: WebSocket.Data) => {
        try {
          const message = JSON.parse(data.toString()) as A2AMessage;
          await this.protocolHandler.handleMessage(message);
        } catch (error) {
          // Handle error
          console.error(`Error handling WebSocket message: ${error.message}`);
        }
      });
    });
  }

  async sendMessage(agentId: string, message: A2AMessage): Promise<void> {
    const client = this.clients.get(agentId);
    if (!client) {
      throw new Error(`Agent ${agentId} not connected`);
    }
    client.send(JSON.stringify(message));
  }
}
```

## VS Code Integration

The New Fuse VS Code extension integrates with A2A to provide a seamless experience for developers:

```typescript
// Initialize the protocol registry
const protocolRegistry = new ProtocolRegistry(context);

// Initialize the unified communication manager
const communicationManager = new CommunicationManager(context, {
    agentId: 'thefuse.main',
    agentName: 'The New Fuse',
    capabilities: ['orchestration', 'agent-discovery', 'workflow-execution'],
    version: '1.0.0',
    apiVersion: '1.0.0',
    debug: false
});

// Initialize communication manager
communicationManager.initialize(redisClient).then(() => {
    log('Communication manager initialized');
}).catch(error => {
    log(`Error initializing communication manager: ${error.message}`);
});
```

## Best Practices

1. **Error Handling**: Always handle errors properly in message handling
2. **Timeouts**: Implement timeouts for message requests
3. **Validation**: Validate messages before processing
4. **Security**: Implement proper authentication and authorization
5. **Logging**: Log all A2A messages for debugging and auditing
6. **Rate Limiting**: Implement rate limiting to prevent abuse
7. **Versioning**: Use proper versioning for messages and protocols

## Conclusion

The Agent-to-Agent (A2A) protocol provides a standardized way for AI agents to communicate directly with each other. By following this specification, developers can create interoperable AI systems that work together seamlessly.
