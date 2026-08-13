# API Documentation

## Authentication

All API endpoints require JWT authentication unless marked as public.

### Authentication Flow

```typescript
// 1. Obtain Token
POST /api/v1/auth/token
{
  "username": string,
  "password": string
}

// 2. Use Token
Authorization: Bearer <token>
```

## Core Endpoints

### Agent Management

```typescript
// Create Agent
POST /api/v1/agents
{
  "name": string,
  "description": string,
  "systemPrompt": string,
  "capabilities": string[]
}

// Get Agent
GET /api/v1/agents/{id}

// Update Agent
PUT /api/v1/agents/{id}
{
  "name"?: string,
  "description"?: string,
  "systemPrompt"?: string,
  "capabilities"?: string[]
}

// Delete Agent
DELETE /api/v1/agents/{id}
```

### Workflow Management

```typescript
// Create Workflow
POST /api/v1/workflows
{
  "name": string,
  "description": string,
  "nodes": WorkflowNode[],
  "edges": WorkflowEdge[]
}

// Get Workflow
GET /api/v1/workflows/{id}

// Update Workflow
PUT /api/v1/workflows/{id}
{
  "name"?: string,
  "description"?: string,
  "nodes"?: WorkflowNode[],
  "edges"?: WorkflowEdge[]
}
```

## WebSocket API

### Connection

```typescript
const ws = new WebSocket('ws://api.example.com/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle message
};
```

### Message Format

```typescript
interface WebSocketMessage {
  type: 'AGENT_MESSAGE' | 'SYSTEM_MESSAGE' | 'ERROR';
  payload: unknown;
  timestamp: string;
}
```

## Rate Limiting

- 1000 requests per minute for authenticated users
- 60 requests per minute for unauthenticated users
- WebSocket connections limited to 100 per user

## Error Handling

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  timestamp: string;
}
```


