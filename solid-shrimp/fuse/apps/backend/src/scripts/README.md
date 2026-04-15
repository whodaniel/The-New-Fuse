# Agent Communication System

This directory contains scripts for testing and implementing the inter-agent communication system for The New Fuse project. The communication system uses Redis pub/sub channels to enable real-time messaging between AI agents.

## Overview

The agent communication system allows different AI agents to communicate with each other through Redis channels. The main components are:

- **Redis Service**: Handles the Redis connections and provides methods for publishing and subscribing to channels
- **Agent Bridge Service**: Connects WebSocket clients to the Redis communication system
- **Test Scripts**: Scripts to test the communication between agents

## Communication Channels

The system uses the following Redis channels:

- `agent:composer`: For messages sent to the Composer agent
- `agent:roo-coder`: For messages sent to the Roo Coder agent
- `agent:broadcast`: For broadcasting messages to all agents

## Message Types

Messages exchanged between agents follow this structure:

```typescript
interface AgentMessage {
  type: 'initialization' | 'acknowledgment' | 'task_request' | 'task_update' | 'code_review' | 'suggestion' | 'task_response';
  timestamp: string;
  message?: string;
  metadata?: {
    version: string;
    priority: 'low' | 'medium' | 'high';
  };
  taskId?: string;
  status?: string;
  details?: Record<string, any>;
}
```

## Scripts

### test-agent-communication.ts

This script simulates the Composer agent sending messages to Roo Coder and handling responses.

```bash
# Run the script
ts-node src/scripts/test-agent-communication.ts
```

### roo-coder-client.ts

This script simulates the Roo Coder agent receiving messages from Composer and sending responses.

```bash
# Run the script
ts-node src/scripts/roo-coder-client.ts
```

## Testing the Communication

To test the communication between agents:

1. Start Redis server if not already running:
   ```bash
   redis-server
   ```

2. In one terminal, run the Composer agent script:
   ```bash
   cd apps/backend
   ts-node src/scripts/test-agent-communication.ts
   ```

3. In another terminal, run the Roo Coder agent script:
   ```bash
   cd apps/backend
   ts-node src/scripts/roo-coder-client.ts
   ```

4. Watch the communication between the agents in the terminal outputs.

## Integration with WebSocket

The `AgentBridgeService` connects the Redis communication system to WebSocket clients, allowing web clients to participate in the agent communication system.

## Example Usage

```typescript
// Example: Sending a message from Composer to Roo Coder
const redisService = new RedisService();
await redisService.sendToRooCoder({
  type: 'task_request',
  timestamp: new Date().toISOString(),
  message: 'Please implement the Agent model',
  metadata: {
    version: '1.0.0',
    priority: 'high'
  }
});
```

## Extending the System

To add a new agent to the system:

1. Create a new Redis channel for the agent (e.g., `agent:new-agent`)
2. Subscribe to the channel in the RedisService
3. Implement message handlers for the new agent
4. Create a client script for the new agent similar to `roo-coder-client.ts`

## Troubleshooting

- **Connection Issues**: Ensure Redis server is running on localhost:6379 or set the REDIS_URL environment variable
- **Message Not Received**: Check that you're subscribed to the correct channel
- **Parse Errors**: Ensure messages are properly formatted as JSON