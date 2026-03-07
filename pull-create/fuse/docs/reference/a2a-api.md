# A2A API Reference

## Overview

The Agent-to-Agent (A2A) API provides endpoints for agent communication, message handling, and workflow integration. This document provides a comprehensive reference for all A2A API endpoints.

## Base URL

```
https://a2a.protocol.local
```

## Authentication

All API requests require authentication using an API key. Include the API key in the `Authorization` header:

```
Authorization: Bearer <api_key>
```

## Endpoints

### Messages

#### Send Message

```
POST /api/messages
```

Send an A2A message to a specific agent.

**Request Body (v1.0)**

```json
{
  "id": "msg-123456",
  "type": "TASK_REQUEST",
  "timestamp": 1650000000000,
  "sender": "agent-1",
  "recipient": "agent-2",
  "payload": {
    "task": "analyze-data",
    "data": { ... }
  },
  "metadata": {
    "priority": "high",
    "timeout": 30000,
    "retryCount": 3,
    "protocol_version": "1.0"
  }
}
```

**Request Body (v2.0)**

```json
{
  "header": {
    "id": "msg-123456",
    "type": "TASK_REQUEST",
    "version": "2.0",
    "priority": "high",
    "source": "agent-1",
    "target": "agent-2"
  },
  "body": {
    "content": {
      "task": "analyze-data",
      "data": { ... }
    },
    "metadata": {
      "sent_at": 1650000000000,
      "timeout": 30000,
      "retries": 3,
      "trace_id": "trace-123456"
    }
  }
}
```

**Response**

```json
{
  "success": true,
  "message_id": "msg-123456",
  "timestamp": 1650000000000
}
```

#### Broadcast Message

```
POST /api/broadcast
```

Broadcast an A2A message to multiple agents.

**Request Body (v1.0)**

```json
{
  "id": "msg-123456",
  "type": "NOTIFICATION",
  "timestamp": 1650000000000,
  "sender": "agent-1",
  "payload": {
    "notification": "system-update",
    "data": { ... }
  },
  "metadata": {
    "priority": "medium",
    "protocol_version": "1.0"
  }
}
```

**Request Body (v2.0)**

```json
{
  "header": {
    "id": "msg-123456",
    "type": "NOTIFICATION",
    "version": "2.0",
    "priority": "medium",
    "source": "agent-1"
  },
  "body": {
    "content": {
      "notification": "system-update",
      "data": { ... }
    },
    "metadata": {
      "sent_at": 1650000000000
    }
  }
}
```

**Response**

```json
{
  "success": true,
  "recipients": ["agent-2", "agent-3", "agent-4"],
  "timestamp": 1650000000000
}
```

#### Send Request and Wait for Response

```
POST /api/request
```

Send an A2A request and wait for a response.

**Request Headers**

```
X-Request-Timeout: 30000
```

**Request Body (v1.0)**

```json
{
  "id": "msg-123456",
  "type": "QUERY",
  "timestamp": 1650000000000,
  "sender": "agent-1",
  "recipient": "agent-2",
  "payload": {
    "query": "get-data",
    "parameters": { ... }
  },
  "metadata": {
    "priority": "high",
    "timeout": 30000,
    "retryCount": 3,
    "protocol_version": "1.0"
  }
}
```

**Request Body (v2.0)**

```json
{
  "header": {
    "id": "msg-123456",
    "type": "QUERY",
    "version": "2.0",
    "priority": "high",
    "source": "agent-1",
    "target": "agent-2"
  },
  "body": {
    "content": {
      "query": "get-data",
      "parameters": { ... }
    },
    "metadata": {
      "sent_at": 1650000000000,
      "timeout": 30000,
      "retries": 3,
      "trace_id": "trace-123456"
    }
  }
}
```

**Response**

```json
{
  "header": {
    "id": "msg-789012",
    "type": "RESPONSE",
    "version": "2.0",
    "priority": "high",
    "source": "agent-2",
    "target": "agent-1"
  },
  "body": {
    "content": {
      "result": "success",
      "data": { ... }
    },
    "metadata": {
      "sent_at": 1650000001000,
      "request_id": "msg-123456"
    }
  }
}
```

### Agents

#### Get Agents

```
GET /api/agents
```

Get a list of available agents.

**Response**

```json
{
  "agents": [
    {
      "id": "agent-1",
      "name": "Code Assistant",
      "capabilities": ["code-generation", "code-review", "bug-fixing"],
      "status": "online",
      "lastSeen": 1650000000000
    },
    {
      "id": "agent-2",
      "name": "Data Analyzer",
      "capabilities": ["data-analysis", "visualization", "reporting"],
      "status": "online",
      "lastSeen": 1650000000000
    }
  ]
}
```

#### Get Agent

```
GET /api/agents/{agent_id}
```

Get information about a specific agent.

**Response**

```json
{
  "id": "agent-1",
  "name": "Code Assistant",
  "capabilities": ["code-generation", "code-review", "bug-fixing"],
  "status": "online",
  "lastSeen": 1650000000000,
  "metadata": {
    "version": "1.0.0",
    "description": "AI assistant for code-related tasks"
  }
}
```

### Workflows

#### Execute Workflow

```
POST /api/workflows/{workflow_id}/execute
```

Execute a workflow with A2A nodes.

**Request Body**

```json
{
  "input": {
    "data": { ... },
    "context": { ... }
  },
  "options": {
    "timeout": 60000,
    "parallel": true
  }
}
```

**Response**

```json
{
  "execution_id": "exec-123456",
  "status": "started",
  "timestamp": 1650000000000
}
```

#### Get Workflow Execution

```
GET /api/workflows/{workflow_id}/executions/{execution_id}
```

Get information about a workflow execution.

**Response**

```json
{
  "execution_id": "exec-123456",
  "workflow_id": "workflow-123456",
  "status": "completed",
  "startTime": 1650000000000,
  "endTime": 1650000010000,
  "nodeResults": {
    "node-1": { ... },
    "node-2": { ... }
  },
  "metrics": {
    "totalExecutionTime": 10000,
    "nodeExecutionTimes": {
      "node-1": 5000,
      "node-2": 5000
    },
    "successRate": 1.0
  }
}
```

#### Abort Workflow Execution

```
POST /api/workflows/{workflow_id}/executions/{execution_id}/abort
```

Abort a workflow execution.

**Response**

```json
{
  "execution_id": "exec-123456",
  "status": "aborted",
  "timestamp": 1650000005000
}
```

## WebSocket API

The A2A API also provides a WebSocket interface for real-time communication.

### Connection

```
wss://a2a.protocol.local/ws
```

### Authentication

Include the API key in the connection URL:

```
wss://a2a.protocol.local/ws?api_key=<api_key>
```

### Messages

#### Subscribe to Agent

```json
{
  "type": "subscribe",
  "agent_id": "agent-1"
}
```

#### Unsubscribe from Agent

```json
{
  "type": "unsubscribe",
  "agent_id": "agent-1"
}
```

#### Send Message

```json
{
  "type": "message",
  "message": {
    "header": {
      "id": "msg-123456",
      "type": "TASK_REQUEST",
      "version": "2.0",
      "priority": "high",
      "source": "agent-1",
      "target": "agent-2"
    },
    "body": {
      "content": {
        "task": "analyze-data",
        "data": { ... }
      },
      "metadata": {
        "sent_at": 1650000000000,
        "timeout": 30000,
        "retries": 3,
        "trace_id": "trace-123456"
      }
    }
  }
}
```

#### Receive Message

```json
{
  "type": "message",
  "message": {
    "header": {
      "id": "msg-789012",
      "type": "RESPONSE",
      "version": "2.0",
      "priority": "high",
      "source": "agent-2",
      "target": "agent-1"
    },
    "body": {
      "content": {
        "result": "success",
        "data": { ... }
      },
      "metadata": {
        "sent_at": 1650000001000,
        "request_id": "msg-123456"
      }
    }
  }
}
```

## Error Codes

| Code | Description |
| ---- | ----------- |
| 400  | Bad Request |
| 401  | Unauthorized |
| 403  | Forbidden |
| 404  | Not Found |
| 408  | Request Timeout |
| 429  | Too Many Requests |
| 500  | Internal Server Error |
| 503  | Service Unavailable |

## Rate Limits

- 100 requests per minute per API key
- 10 concurrent WebSocket connections per API key

## References

For more information, refer to:

- [A2A Protocol Documentation](../architecture/a2a-protocol.md)
- [Workflow Builder Documentation](../workflow-builder.md)
- [MCP Integration Guide](../architecture/mcp-integration.md)
