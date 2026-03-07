# Model Context Protocol (MCP) Specification

The Model Context Protocol (MCP) is a standardized communication protocol for inter-LLM communication in the Fuse framework. This document outlines the specification, methods, and usage patterns.

## Overview

MCP enables different AI models and agents to share context, execute capabilities, and coordinate on complex tasks by providing a standardized interface for communication. It supports both synchronous and asynchronous communication patterns.

## Protocol Structure

MCP messages follow a structured format:

```json
{
  "version": "1.0",
  "messageType": "request|response|event",
  "id": "unique-message-id",
  "timestamp": "2025-04-10T15:30:00Z",
  "source": {
    "agentId": "source-agent-id",
    "name": "Source Agent Name"
  },
  "target": {
    "agentId": "target-agent-id",
    "name": "Target Agent Name"
  },
  "content": {
    // Message-specific content
  },
  "metadata": {
    // Optional metadata
  }
}
```

## Message Types

### Request Messages

Used to request a capability or action from another agent:

```json
{
  "messageType": "request",
  "content": {
    "capability": "text-analysis",
    "action": "sentiment-analysis",
    "parameters": {
      "text": "I really enjoyed using this new feature!"
    },
    "contextId": "conversation-123"
  }
}
```

### Response Messages

Sent in response to a request:

```json
{
  "messageType": "response",
  "content": {
    "status": "success",
    "data": {
      "sentiment": "positive",
      "score": 0.89,
      "confidence": 0.95
    },
    "requestId": "original-request-id"
  }
}
```

### Event Messages

Used for broadcasting events to subscribed agents:

```json
{
  "messageType": "event",
  "content": {
    "eventType": "workflow-completed",
    "data": {
      "workflowId": "workflow-123",
      "status": "completed",
      "results": {}
    }
  }
}
```

## Capability Declaration

Agents declare their capabilities using a standardized format:

```json
{
  "capabilities": [
    {
      "id": "text-analysis",
      "name": "Text Analysis",
      "description": "Analyzes text for sentiment, entities, and other properties",
      "version": "1.0",
      "actions": [
        {
          "id": "sentiment-analysis",
          "name": "Sentiment Analysis",
          "description": "Analyzes the sentiment of provided text",
          "parameters": [
            {
              "name": "text",
              "type": "string",
              "required": true,
              "description": "The text to analyze"
            },
            {
              "name": "language",
              "type": "string",
              "required": false,
              "description": "The language of the text (ISO code)",
              "default": "en"
            }
          ],
          "returns": {
            "type": "object",
            "properties": {
              "sentiment": {"type": "string", "enum": ["positive", "negative", "neutral"]},
              "score": {"type": "number", "minimum": -1, "maximum": 1},
              "confidence": {"type": "number", "minimum": 0, "maximum": 1}
            }
          }
        }
      ]
    }
  ]
}
```

## Context Sharing

MCP enables context sharing across agents:

```json
{
  "messageType": "request",
  "content": {
    "capability": "context-management",
    "action": "share-context",
    "parameters": {
      "contextId": "conversation-123",
      "contextType": "conversation",
      "content": {
        "messages": [
          {
            "role": "user",
            "content": "How can I optimize my machine learning model?",
            "timestamp": "2025-04-10T15:25:00Z"
          },
          {
            "role": "assistant",
            "content": "There are several approaches to optimize your model...",
            "timestamp": "2025-04-10T15:26:00Z"
          }
        ],
        "metadata": {
          "domain": "machine-learning",
          "userExpertise": "intermediate"
        }
      },
      "permissions": {
        "read": ["agent-1", "agent-2"],
        "write": ["agent-1"]
      }
    }
  }
}
```

## Authentication and Security

All MCP communications are authenticated using JWT tokens:

```json
{
  "version": "1.0",
  "messageType": "request",
  "id": "unique-message-id",
  "authentication": {
    "type": "jwt",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "content": {
    // Message content
  }
}
```

## Error Handling

MCP defines standard error responses:

```json
{
  "messageType": "response",
  "content": {
    "status": "error",
    "error": {
      "code": "capability-not-found",
      "message": "The requested capability 'image-generation' is not available",
      "details": {
        "requestedCapability": "image-generation",
        "availableCapabilities": ["text-analysis", "code-generation"]
      }
    },
    "requestId": "original-request-id"
  }
}
```

## Protocol Extensions

MCP can be extended with custom message types and capabilities through extensions:

```json
{
  "version": "1.0",
  "messageType": "request",
  "extensions": [
    {
      "name": "streaming-response",
      "version": "1.0",
      "parameters": {
        "chunkSize": 1024,
        "maxRate": 10
      }
    }
  ],
  "content": {
    // Message content
  }
}
```

## Implementation in Fuse

In the Fuse framework, MCP is implemented through:

1. **MCP Server**: Handles routing and validation of MCP messages
2. **MCP Client Libraries**: Provide language-specific implementations for agents
3. **VS Code Extension**: Integrates MCP into the development environment

For VS Code integration, use the following tasks:
- Initialize MCP Integration: `Initialize MCP Integration`
- Show MCP Tools: `Show MCP Tools`
- Test MCP Tool: `Test MCP Tool`
- Ask Agent with MCP Tools: `Ask Agent with MCP Tools`

## API Reference

### JavaScript/TypeScript Client

```typescript
import { MCPClient } from '@fuse/mcp-client';

// Initialize client
const client = new MCPClient({
  agentId: 'my-agent',
  agentName: 'My Agent',
  serverUrl: 'wss://mcp.fuse.ai'
});

// Register capabilities
await client.registerCapabilities([
  {
    id: 'text-analysis',
    name: 'Text Analysis',
    // ...capability definition
  }
]);

// Handle incoming requests
client.onRequest('text-analysis', 'sentiment-analysis', async (request) => {
  const { text } = request.parameters;
  // Perform sentiment analysis
  return {
    sentiment: 'positive',
    score: 0.89,
    confidence: 0.95
  };
});

// Send a request to another agent
const response = await client.sendRequest({
  target: {
    agentId: 'other-agent'
  },
  capability: 'code-generation',
  action: 'generate-function',
  parameters: {
    description: 'A function that calculates the factorial of a number',
    language: 'javascript'
  }
});
```

## Usage Examples

### Basic Request-Response Pattern

```typescript
// Agent A sends a request
const response = await clientA.sendRequest({
  target: { agentId: 'agent-b' },
  capability: 'math',
  action: 'calculate',
  parameters: { expression: '2 + 2' }
});

// Agent B handles the request
clientB.onRequest('math', 'calculate', async (request) => {
  const { expression } = request.parameters;
  const result = evaluateExpression(expression);
  return { result };
});
```

### Pub-Sub Pattern

```typescript
// Agent A publishes an event
await clientA.publishEvent({
  eventType: 'data-updated',
  data: { datasetId: 'dataset-123', timestamp: Date.now() }
});

// Agent B subscribes to events
clientB.subscribeToEvents('data-updated', async (event) => {
  const { datasetId, timestamp } = event.data;
  // Handle data update notification
});
```

## Best Practices

1. **Versioning**: Always include version information in capability declarations
2. **Error Handling**: Provide detailed error messages with appropriate error codes
3. **Authentication**: Secure all communications with proper authentication
4. **Rate Limiting**: Implement rate limiting to prevent abuse
5. **Observability**: Log MCP messages for debugging and audit purposes