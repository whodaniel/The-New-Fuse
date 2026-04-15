# Trae AI Agent

This is an implementation of the Trae AI Agent for The New Fuse system, following the onboarding instructions.

## Features

- System verification (Redis connection check)
- Agent registration with the API
- Communication setup with Redis channels
- Message handling for different types of messages
- Initial handshake implementation
- Heartbeat protocol implementation
- Metrics collection and reporting
- Health monitoring and alerts

## Prerequisites

- Redis server running on localhost:6379 (or specified by REDIS_URL environment variable)
- API endpoint available at http://localhost:3001/api/v1/agents/register

## Usage

```bash
# Make sure Redis is running
redis-cli ping  # Should return "PONG"

# Run the Trae Agent
node run-trae-agent.js

# Or directly run the compiled client
node dist/scripts/trae-agent-client.js
```

## Communication Channels

The agent subscribes to the following Redis channels:
- Primary: 'agent:trae'
- Broadcast: 'agent:broadcast'
- Augment: 'agent:augment'
- Heartbeat: 'agent:heartbeat'
- Metrics: 'monitoring:metrics'
- Alerts: 'monitoring:alerts'

## Message Format

```typescript
interface AgentMessage {
  type: string;
  timestamp: string;
  metadata: {
    version: string;
    priority: 'low' | 'medium' | 'high';
    source: string;
  };
  details?: Record<string, any>;
}
```

## Implementation Details

1. **System Verification**: Checks Redis connection and environment variables
2. **Agent Registration**: Sends registration payload to the API
3. **Communication Setup**: Subscribes to Redis channels and sets up message handlers
4. **Initial Handshake**: Sends initial handshake message to 'agent:augment' channel
5. **Message Handling**: Processes incoming messages based on their type

## Next Steps

After running the agent:
1. Monitor 'agent:augment' for responses
2. Begin capability assessment
3. Await task assignments
4. Maintain connection status