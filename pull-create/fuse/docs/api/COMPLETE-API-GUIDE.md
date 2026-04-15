# Complete API Guide

This comprehensive guide consolidates all API documentation including endpoints, authentication, WebSocket protocols, and middleware configurations.

## Table of Contents

1. [Base Configuration](#base-configuration)
2. [Authentication](#authentication) 
3. [REST API Endpoints](#rest-api-endpoints)
4. [WebSocket Protocol](#websocket-protocol)
5. [Middleware](#middleware)
6. [API Reference](#api-reference)
7. [Error Handling](#error-handling)
8. [Security Guidelines](#security-guidelines)

## Base Configuration

All API endpoints are prefixed with `/api` and require proper authentication.

**Base URL Structure:**
```
https://your-domain.com/api/v1/{endpoint}
```

**Required Headers:**
```http
Content-Type: application/json
Authorization: Bearer <access_token>
```

## Authentication

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
Refresh access token using refresh token from cookie.

**Response:**
```json
{
  "accessToken": "string",
  "tokenType": "string"
}
```

#### POST /api/auth/logout
Logout user and invalidate tokens.

**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

### JWT Token Structure

```typescript
interface JWTPayload {
    userId: number;
    username: string;
    email: string;
    exp: number;
    iat: number;
}
```

## REST API Endpoints

### Agents

#### Create Agent
```http
POST /api/v1/agents
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "string",
  "type": "string",
  "configuration": {
    "model": "string",
    "parameters": {},
    "capabilities": ["string"]
  }
}
```

**Response:**
```json
{
  "id": "string",
  "name": "string",
  "type": "string",
  "status": "active",
  "createdAt": "timestamp",
  "configuration": {}
}
```

#### List Agents
```http
GET /api/v1/agents
Authorization: Bearer <token>
```

**Query Parameters:**
- `limit`: number (default: 10)
- `offset`: number (default: 0)
- `type`: string (filter by agent type)
- `status`: string (filter by status)

#### Get Agent
```http
GET /api/v1/agents/{agentId}
Authorization: Bearer <token>
```

#### Update Agent
```http
PUT /api/v1/agents/{agentId}
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "string",
  "configuration": {},
  "status": "active" | "inactive" | "error"
}
```

#### Delete Agent
```http
DELETE /api/v1/agents/{agentId}
Authorization: Bearer <token>
```

### Communication

#### Send Message to Agent
```http
POST /api/v1/agents/{agentId}/messages
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "string",
  "type": "command" | "query" | "notification",
  "priority": "low" | "medium" | "high",
  "metadata": {}
}
```

#### Get Agent Messages
```http
GET /api/v1/agents/{agentId}/messages
Authorization: Bearer <token>
```

### Monitoring Endpoints

#### GET /api/monitoring/memory
Fetch memory store items and overall statistics.

**Response:**
```json
{
  "items": [
    {
      "id": "string",
      "content": "string",
      "embedding": "number[]",
      "metadata": "object",
      "timestamp": "string"
    }
  ],
  "stats": {
    "totalItems": "number",
    "hitRate": "number"
  }
}
```

#### GET /api/monitoring/metrics
Fetch custom metrics including step execution timings and memory metrics.

**Response:**
```json
{
  "stepMetrics": [
    {
      "nodeId": "string",
      "duration": "number",
      "success": "boolean"
    }
  ],
  "memoryMetrics": {
    "totalItems": "number",
    "hitRate": "number"
  }
}
```

### Configuration

#### Get System Configuration
```http
GET /api/v1/config
Authorization: Bearer <token>
```

#### Update Configuration
```http
PUT /api/v1/config
Content-Type: application/json
Authorization: Bearer <token>

{
  "section": "string",
  "settings": {}
}
```

## WebSocket Protocol

### Connection

WebSocket connections are established at `/api/ws` with required authentication parameters.

**Connection URL:**
```
ws://localhost:3711/api/ws?token=<access_token>
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

**Join Room:**
```json
{
  "type": "joinRoom",
  "payload": {
    "roomId": "string"
  }
}
```

**Leave Room:**
```json
{
  "type": "leaveRoom",
  "payload": {
    "roomId": "string"
  }
}
```

#### 2. Chat Messages

**Send Message:**
```json
{
  "type": "message",
  "payload": {
    "roomId": "string",
    "content": "string",
    "messageType": "text" | "command" | "system",
    "metadata": {}
  }
}
```

**Message Received:**
```json
{
  "type": "messageReceived",
  "payload": {
    "messageId": "string",
    "roomId": "string",
    "senderId": "string",
    "content": "string",
    "timestamp": "number",
    "metadata": {}
  }
}
```

#### 3. Agent Communication

**Agent-to-Agent Message:**
```json
{
  "type": "a2aMessage",
  "payload": {
    "sourceAgentId": "string",
    "targetAgentId": "string",
    "action": "string",
    "data": {},
    "requestId": "string"
  }
}
```

**Agent Status Update:**
```json
{
  "type": "agentStatus",
  "payload": {
    "agentId": "string",
    "status": "online" | "offline" | "busy" | "error",
    "capabilities": ["string"],
    "metadata": {}
  }
}
```

#### 4. System Events

**System Notification:**
```json
{
  "type": "systemNotification",
  "payload": {
    "level": "info" | "warning" | "error",
    "message": "string",
    "code": "string",
    "timestamp": "number"
  }
}
```

**Connection Status:**
```json
{
  "type": "connectionStatus",
  "payload": {
    "status": "connected" | "disconnected" | "reconnecting",
    "clientId": "string",
    "timestamp": "number"
  }
}
```

### Error Handling

**WebSocket Error Message:**
```json
{
  "type": "error",
  "payload": {
    "code": "string",
    "message": "string",
    "details": {},
    "timestamp": "number"
  }
}
```

## Middleware

### Session Middleware

The session middleware handles user authentication, session management, and security for API requests.

#### Configuration

```typescript
interface SessionConfig {
  secret: string;
  maxAge: number;
  secure: boolean;
  httpOnly: boolean;
  sameSite: 'strict' | 'lax' | 'none';
}
```

#### Session Data Structure

```typescript
interface SessionData {
  userId: number;
  username: string;
  email: string;
  roles: string[];
  permissions: string[];
  lastActivity: number;
  csrfToken: string;
}
```

#### Middleware Functions

**Authentication Middleware:**
```typescript
const authenticateUser = (req: Request, res: Response, next: NextFunction) => {
  // Verify JWT token
  // Attach user data to request
  // Handle token refresh if needed
};
```

**Authorization Middleware:**
```typescript
const authorizeRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Check user roles and permissions
    // Allow or deny access
  };
};
```

**Rate Limiting Middleware:**
```typescript
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP'
});
```

## API Reference

### Standard Response Format

All API responses follow this structure:

```typescript
interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    requestId: string;
    pagination?: {
      total: number;
      page: number;
      limit: number;
    };
  };
}
```

### HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **422 Unprocessable Entity**: Validation errors
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Request validation failed",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "meta": {
    "timestamp": 1640995200000,
    "requestId": "req_abc123"
  }
}
```

## Error Handling

### Common Error Codes

- `AUTH_TOKEN_INVALID`: Invalid or expired authentication token
- `AUTH_TOKEN_MISSING`: No authentication token provided
- `VALIDATION_ERROR`: Request validation failed
- `RESOURCE_NOT_FOUND`: Requested resource does not exist
- `RATE_LIMIT_EXCEEDED`: Too many requests
- `AGENT_OFFLINE`: Target agent is not available
- `WEBSOCKET_CONNECTION_FAILED`: WebSocket connection error
- `INSUFFICIENT_PERMISSIONS`: User lacks required permissions

### Error Handling Best Practices

1. **Always include error codes** for programmatic handling
2. **Provide descriptive messages** for debugging
3. **Include relevant context** in error details
4. **Log errors appropriately** based on severity
5. **Return consistent error formats** across all endpoints
6. **Handle WebSocket disconnections** gracefully
7. **Implement retry logic** for transient errors

## Security Guidelines

### Authentication Security

1. **Use HTTPS only** in production
2. **Implement proper CORS** policies
3. **Use secure JWT configurations**:
   - Short-lived access tokens (15 minutes)
   - Secure HTTP-only refresh tokens
   - Proper token rotation
4. **Implement rate limiting** on authentication endpoints
5. **Use strong password policies**
6. **Implement CSRF protection**

### API Security

1. **Validate all inputs** thoroughly
2. **Use parameterized queries** to prevent SQL injection
3. **Implement proper authorization** checks
4. **Sanitize output** to prevent XSS
5. **Use secure headers**:
   ```http
   X-Content-Type-Options: nosniff
   X-Frame-Options: DENY
   X-XSS-Protection: 1; mode=block
   Strict-Transport-Security: max-age=31536000
   ```

### WebSocket Security

1. **Authenticate WebSocket connections** before allowing communication
2. **Validate all WebSocket messages**
3. **Implement message rate limiting**
4. **Use secure WebSocket protocols** (WSS)
5. **Sanitize WebSocket message content**
6. **Implement proper connection management**

### Data Protection

1. **Encrypt sensitive data** at rest and in transit
2. **Implement proper logging** without exposing sensitive information
3. **Use secure session management**
4. **Implement data retention policies**
5. **Follow GDPR and privacy regulations**
6. **Regular security audits** and vulnerability assessments

## Integration Examples

### JavaScript/TypeScript Client

```typescript
class APIClient {
  private baseURL: string;
  private accessToken: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async authenticate(username: string, password: string) {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    
    const data = await response.json();
    this.accessToken = data.accessToken;
    return data;
  }

  async createAgent(agentConfig: AgentConfig) {
    return await this.request('POST', '/api/v1/agents', agentConfig);
  }

  private async request(method: string, endpoint: string, body?: any) {
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.accessToken}`
      },
      body: body ? JSON.stringify(body) : undefined
    });

    return await response.json();
  }
}
```

### WebSocket Client

```typescript
class WebSocketClient {
  private ws: WebSocket;
  private messageHandlers: Map<string, Function[]> = new Map();

  connect(url: string, token: string) {
    this.ws = new WebSocket(`${url}?token=${token}`);
    
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      this.handleMessage(message);
    };
  }

  on(messageType: string, handler: Function) {
    if (!this.messageHandlers.has(messageType)) {
      this.messageHandlers.set(messageType, []);
    }
    this.messageHandlers.get(messageType)!.push(handler);
  }

  send(message: any) {
    this.ws.send(JSON.stringify({
      ...message,
      timestamp: Date.now(),
      messageId: `msg_${Date.now()}_${Math.random()}`
    }));
  }

  private handleMessage(message: any) {
    const handlers = this.messageHandlers.get(message.type) || [];
    handlers.forEach(handler => handler(message));
  }
}
```

This complete API guide consolidates all API documentation including endpoints, authentication, WebSocket protocols, middleware, security guidelines, and integration examples. All technical details have been preserved and enhanced with additional context and best practices.
