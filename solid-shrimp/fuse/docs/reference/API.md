# The New Fuse API Documentation

## Table of Contents
1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Base URL](#base-url)
4. [REST API Endpoints](#rest-api-endpoints)
   - [Authentication Endpoints](#authentication-endpoints)
   - [Agent Management](#agent-management)
   - [Workflow Management](#workflow-management)
   - [Task Management](#task-management)
5. [WebSocket API](#websocket-api)
   - [Connection](#connection)
   - [Message Format](#message-format)
   - [Message Types](#message-types)
   - [Error Handling](#error-handling)
6. [Error Responses](#error-responses)
7. [Rate Limiting](#rate-limiting)
8. [Security Considerations](#security-considerations)
9. [Session Management](#session-management)

## Introduction

This document provides comprehensive documentation for The New Fuse API, including REST endpoints and WebSocket communication protocols.

## Authentication

All API endpoints except `/api/v1/auth/login`, `/api/v1/auth/register`, and other explicitly marked public endpoints require authentication using a JWT token.

Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

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

## Base URL

All API endpoints are prefixed with `/api`

## REST API Endpoints

### Authentication Endpoints

#### POST /api/auth/login
Authenticate a user and receive access tokens.

**Request Body:**
```json
{
  "username": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "userId": "number",
  "username": "string",
  "accessToken": "string",
  "tokenType": "string"
}
```

**Cookies Set:**
- `refreshToken`: HTTP-only secure cookie for token refresh

#### POST /api/auth/register
Register a new user account.

**Request Body:**
```json
{
  "username": "string",
  "email": "string",
  "password": "string"
}
```

**Response:**
```json
{
  "userId": "number",
  "username": "string",
  "accessToken": "string",
  "tokenType": "string"
}
```

#### POST /api/auth/refresh
Refresh the access token using the refresh token cookie.

**Response:**
```json
{
  "accessToken": "string",
  "tokenType": "string"
}
```

### Agent Management

#### GET /api/v1/agents
Get all agents for the authenticated user.

**Response:**
```json
{
  "agents": [
    {
      "id": "agent-id",
      "name": "Agent Name",
      "type": "CHAT",
      "description": "Agent description",
      "config": {},
      "createdAt": "2024-01-20T12:00:00Z"
    }
  ]
}
```

#### POST /api/v1/agents
Create a new agent.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "systemPrompt": "string",
  "capabilities": ["string"]
}
```

**Response:**
Returns the created agent object.

#### GET /api/v1/agents/{id}
Get a specific agent by ID.

**Response:**
Returns the agent object.

#### PUT /api/v1/agents/{id}
Update an existing agent.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "systemPrompt": "string",
  "capabilities": ["string"]
}
```

**Response:**
Returns the updated agent object.

#### DELETE /api/v1/agents/{id}
Delete an agent.

**Response:**
204 No Content

### Workflow Management

#### POST /api/v1/workflows
Create a new workflow.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "nodes": [],
  "edges": []
}
```

**Response:**
Returns the created workflow object.

#### GET /api/v1/workflows/{id}
Get a specific workflow by ID.

**Response:**
Returns the workflow object.

#### PUT /api/v1/workflows/{id}
Update an existing workflow.

**Request Body:**
```json
{
  "name": "string",
  "description": "string",
  "nodes": [],
  "edges": []
}
```

**Response:**
Returns the updated workflow object.

### Task Management Endpoints

#### GET /api/tasks
Get all tasks for the authenticated user.

**Response:**
```json
{
  "tasks": [
    {
      "id": "string",
      "title": "string",
      "description": "string",
      "status": "string",
      "priority": "number",
      "createdAt": "date",
      "updatedAt": "date"
    }
  ]
}
```

#### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "priority": "number"
}
```

#### PUT /api/tasks/:taskId
Update task status or priority.

## WebSocket API

### Connection

WebSocket connections are established at `/api/ws` with required authentication parameters.

```typescript
const ws = new WebSocket('ws://api.example.com/ws');
ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle message
};
```

### Message Format

All WebSocket messages follow this general format:

```typescript
interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
  messageId: string;
  priority?: number;
}
```

### Message Types

#### 1. Room Management

##### Join Room
```json
{
  "type": "joinRoom",
  "payload": {
    "roomId": "string"
  }
}
```

##### Leave Room
```json
{
  "type": "leaveRoom",
  "payload": {
    "roomId": "string"
  }
}
```

#### 2. Chat Messages

##### Send Message
```json
{
  "type": "message",
  "payload": {
    "roomId": "string",
    "content": "string",
    "metadata": {
      "type": "text|file|system",
      "fileUrl?": "string",
      "fileName?": "string"
    }
  }
}
```

##### Message Received
```json
{
  "type": "messageReceived",
  "payload": {
    "messageId": "string",
    "roomId": "string",
    "senderId": "string",
    "timestamp": "number"
  }
}
```

#### 3. Task Updates

##### Task Status Update
```json
{
  "type": "taskUpdate",
  "payload": {
    "taskId": "string",
    "status": "string",
    "progress": "number",
    "metadata": "object"
  }
}
```

#### 4. System Messages

##### Error Message
```json
{
  "type": "error",
  "payload": {
    "code": "string",
    "message": "string",
    "details": "object"
  }
}
```

### Message Priority Levels

Messages can include a priority field:
- 0: System Critical
- 1: High Priority
- 2: Normal Priority (default)
- 3: Low Priority
- 4: Background Task

### Error Handling

#### Reconnection Strategy
The client should implement exponential backoff when attempting to reconnect:
1. Initial delay: 1000ms
2. Maximum delay: 30000ms
3. Multiplier: 1.5

#### Error Codes
- 1000: Normal closure
- 1001: Going away
- 1002: Protocol error
- 1003: Unsupported data
- 4000: Invalid authentication
- 4001: Rate limit exceeded
- 4002: Invalid message format
- 4003: Room not found
- 4004: Permission denied

## Error Responses

All error responses follow the format:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

## Rate Limiting

- 1000 requests per minute for authenticated users
- Rate limit headers are included in all responses:
  - `X-RateLimit-Limit`: Maximum requests per window
  - `X-RateLimit-Remaining`: Remaining requests in current window
  - `X-RateLimit-Reset`: Time when the rate limit resets (Unix timestamp)

## Security Considerations

- All API requests should be made over HTTPS
- JWT tokens expire after 1 hour
- Refresh tokens are valid for 30 days
- Implement proper error handling for security-related errors
- Follow OWASP security best practices

## Session Management

The New Fuse uses a secure session middleware for managing user sessions.

### Features
- Automatic session validation
- Session refresh handling
- User context attachment
- TypeScript support
- Error handling
- Security best practices

### Session Configuration

```typescript
interface SessionOptions {
  cookieName?: string;
  cookieOptions?: CookieOptions;
  sessionDuration?: number;
  refreshThreshold?: number;
}
```

### Security Considerations
- CSRF protection
- XSS prevention
- Session fixation protection
- Secure cookie settings
- Rate limiting
