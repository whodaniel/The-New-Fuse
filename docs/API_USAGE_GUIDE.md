# The New Fuse API - Usage Guide

Welcome to The New Fuse API! This guide will help you get started with our
comprehensive API for multi-agent orchestration, workflow automation, and
blockchain integration.

## Table of Contents

- [Getting Started](#getting-started)
- [Authentication](#authentication)
- [API Endpoints Overview](#api-endpoints-overview)
- [Common Use Cases](#common-use-cases)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Best Practices](#best-practices)
- [WebSocket Support](#websocket-support)
- [Code Examples](#code-examples)

---

## Getting Started

### Base URLs

- **Development API**: `http://localhost:3001/api`
- **API Gateway**: `http://localhost:4000/api/v1`
- **Production**: `https://api.thenewfuse.com/api`

### API Documentation

Interactive API documentation is available via Swagger UI:

- **Development**: http://localhost:3001/api-docs
- **Production**: https://api.thenewfuse.com/api-docs

The Swagger UI provides:

- Interactive API testing
- Request/response schemas
- Authentication configuration
- Example payloads

### Prerequisites

- Node.js 18+ (for development)
- Valid API credentials (email/password or API key)
- For Web3 features: Compatible wallet or Web3Auth setup

---

## Authentication

The New Fuse API uses **JWT (JSON Web Token)** authentication for most
endpoints.

### 1. Register a New Account

```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "developer@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**

```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "email": "developer@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  },
  "expiresIn": 900
}
```

### 2. Login

```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "developer@example.com",
  "password": "SecurePass123!"
}
```

### 3. Use the Access Token

Include the access token in the `Authorization` header for all authenticated
requests:

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Refresh Tokens

Access tokens expire in 15 minutes. Use the refresh token to get a new access
token:

```bash
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## API Endpoints Overview

### Authentication (`/auth`)

- `POST /auth/register` - Register new user
- `POST /auth/login` - User login
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - User logout
- `GET /auth/me` - Get current user info

### Agents (`/agents`)

- `GET /agents` - List all agents (filterable)
- `POST /agents` - Create new agent
- `GET /agents/active` - Get active agents
- `GET /agents/stats/types` - Agent statistics by type
- `GET /agents/{id}` - Get agent by ID
- `PUT /agents/{id}` - Update agent
- `DELETE /agents/{id}` - Delete agent
- `GET /agents/{id}/stats` - Get agent statistics
- `PUT /agents/{id}/activate` - Activate agent
- `PUT /agents/{id}/deactivate` - Deactivate agent
- `PUT /agents/{id}/pause` - Pause agent

### Chat (`/chat`)

- `GET /chat/rooms` - List chat rooms
- `GET /chat/rooms/{roomId}` - Get room details
- `GET /chat/rooms/{roomId}/messages` - Get messages (paginated)
- `POST /chat/rooms/{roomId}/messages` - Send message
- `GET /chat/analytics` - Get chat analytics

### Workflows (`/workflows`)

- `GET /workflows` - List workflows (paginated)
- `POST /workflows` - Create workflow
- `GET /workflows/{id}` - Get workflow details
- `PATCH /workflows/{id}` - Update workflow
- `DELETE /workflows/{id}` - Delete workflow
- `POST /workflows/execute` - Execute workflow
- `GET /workflows/executions/{executionId}` - Get execution status
- `POST /workflows/executions/{executionId}/cancel` - Cancel execution
- `GET /workflows/templates` - Get workflow templates
- `POST /workflows/from-template` - Create from template

### Web3 Wallets (`/wallets`)

- `POST /wallets/create` - Create new wallet
- `GET /wallets/user/{userId}` - Get user's wallets
- `GET /wallets/address/{address}` - Get wallet by address
- `GET /wallets/info/{walletId}` - Get wallet with smart account info

### Transactions (`/transactions`)

- `POST /transactions/execute/{walletId}` - Execute transaction
- `POST /transactions/execute-batch/{walletId}` - Execute batch transaction
- `GET /transactions/wallet/{walletId}` - Get wallet transactions
- `POST /transactions/update-status/{txHash}` - Update transaction status
- `POST /transactions/ai-user-operation` - Create AI UserOperation

### Smart Accounts (`/smart-accounts`)

- `POST /smart-accounts/enable/{walletId}` - Enable smart account
- `POST /smart-accounts/deploy/{walletId}` - Deploy smart account
- `POST /smart-accounts/execute/{walletId}` - Execute smart account transaction
- `POST /smart-accounts/execute-batch/{walletId}` - Execute batch transaction
- `GET /smart-accounts/info/{walletId}` - Get smart account info

### MCP Protocol (`/mcp`)

- `GET /mcp/servers` - List MCP servers
- `POST /mcp/servers` - Register MCP server
- `GET /mcp/servers/{id}/status` - Get server status
- `PUT /mcp/servers/{id}` - Update server config
- `DELETE /mcp/servers/{id}` - Remove server
- `GET /mcp/oauth/discovery` - OAuth discovery metadata

---

## Common Use Cases

### Use Case 1: Creating and Managing AI Agents

**Step 1: Create an Agent**

```bash
POST /api/agents
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "Customer Support Assistant",
  "type": "CHAT",
  "description": "Handles customer inquiries and support tickets",
  "systemPrompt": "You are a helpful customer support assistant. Be professional and empathetic.",
  "capabilities": ["natural_language", "api_integration"],
  "configuration": {
    "maxConcurrent": 5,
    "responseTimeout": 30
  }
}
```

**Step 2: Activate the Agent**

```bash
PUT /api/agents/{agentId}/activate
Authorization: Bearer <your-token>
```

**Step 3: Monitor Agent Statistics**

```bash
GET /api/agents/{agentId}/stats
Authorization: Bearer <your-token>
```

**Response:**

```json
{
  "uptime": 99.2,
  "avgResponseTime": 2.1,
  "totalTasks": 1547,
  "completedTasks": 1512,
  "failedTasks": 35,
  "successRate": 97.7,
  "satisfaction": 4.5
}
```

### Use Case 2: Building and Executing Workflows

**Step 1: Create a Workflow**

```bash
POST /api/workflows
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "Data Processing Pipeline",
  "description": "Extract, transform, and load data",
  "nodes": [
    {
      "id": "node1",
      "type": "http_request",
      "config": {
        "url": "https://api.example.com/data",
        "method": "GET"
      }
    },
    {
      "id": "node2",
      "type": "transform",
      "config": {
        "operations": ["filter", "map"]
      }
    },
    {
      "id": "node3",
      "type": "database_write",
      "config": {
        "table": "processed_data"
      }
    }
  ],
  "edges": [
    {"from": "node1", "to": "node2"},
    {"from": "node2", "to": "node3"}
  ],
  "tags": ["data", "etl"]
}
```

**Step 2: Execute the Workflow**

```bash
POST /api/workflows/execute
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "workflowId": "workflow123",
  "input": {
    "startDate": "2025-01-01",
    "endDate": "2025-01-31"
  }
}
```

**Step 3: Monitor Execution**

```bash
GET /api/workflows/executions/{executionId}
Authorization: Bearer <your-token>
```

### Use Case 3: Web3 Wallet and Transaction Management

**Step 1: Create a Wallet**

```bash
POST /api/wallets/create
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "userId": "user123",
  "verifierId": "google|user@example.com",
  "chainId": 1,
  "userType": "HUMAN",
  "enableSmartAccount": true
}
```

**Step 2: Enable and Deploy Smart Account**

```bash
POST /api/smart-accounts/enable/{walletId}
Authorization: Bearer <your-token>
```

```bash
POST /api/smart-accounts/deploy/{walletId}
Authorization: Bearer <your-token>
```

**Step 3: Execute a Transaction**

```bash
POST /api/transactions/execute/{walletId}
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "to": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "value": "1000000000000000000",
  "data": "0x",
  "useSmartAccount": true
}
```

### Use Case 4: Real-Time Chat Integration

**Step 1: Get Available Chat Rooms**

```bash
GET /api/chat/rooms
Authorization: Bearer <your-token>
```

**Step 2: Retrieve Messages from a Room**

```bash
GET /api/chat/rooms/{roomId}/messages?limit=50&offset=0
Authorization: Bearer <your-token>
```

**Step 3: Send a Message**

```bash
POST /api/chat/rooms/{roomId}/messages
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "content": "Hello team! How can I help?",
  "type": "text",
  "metadata": {
    "urgency": "normal"
  }
}
```

### Use Case 5: MCP Protocol Integration

**Step 1: Register an MCP Server**

```bash
POST /api/mcp/servers
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "name": "AI Analysis Server",
  "endpoint": "https://mcp-server.example.com",
  "capabilities": ["text_analysis", "sentiment_detection", "summarization"]
}
```

**Step 2: Check Server Status**

```bash
GET /api/mcp/servers/{serverId}/status
Authorization: Bearer <your-token>
```

---

## Rate Limiting

The API implements tiered rate limiting to ensure fair usage and system
stability.

### Rate Limit Tiers

| Tier    | Requests per Minute | Applied To               |
| ------- | ------------------- | ------------------------ |
| Auth    | 10                  | Authentication endpoints |
| API     | 60                  | Standard API endpoints   |
| Premium | 120                 | Premium users            |
| Admin   | 300                 | Admin users              |

### Rate Limit Headers

Each response includes rate limit information in the headers:

```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 45
X-RateLimit-Reset: 1640000000
```

### Handling Rate Limits

When you exceed the rate limit, you'll receive a `429 Too Many Requests`
response:

```json
{
  "statusCode": 429,
  "message": "Rate limit exceeded. Please try again later.",
  "error": "Too Many Requests"
}
```

**Best Practice**: Implement exponential backoff in your application:

```javascript
async function apiCall(url, options, retries = 3) {
  for (let i = 0; i < retries; i++) {
    const response = await fetch(url, options);

    if (response.status === 429) {
      const resetTime = response.headers.get('X-RateLimit-Reset');
      const waitTime = Math.min(Math.pow(2, i) * 1000, 60000); // Max 1 minute
      await new Promise((resolve) => setTimeout(resolve, waitTime));
      continue;
    }

    return response;
  }
  throw new Error('Max retries exceeded');
}
```

---

## Error Handling

The API uses standard HTTP status codes and provides detailed error messages.

### Common Status Codes

| Code | Meaning               | Description                       |
| ---- | --------------------- | --------------------------------- |
| 200  | OK                    | Successful request                |
| 201  | Created               | Resource created successfully     |
| 204  | No Content            | Successful deletion               |
| 400  | Bad Request           | Invalid request data              |
| 401  | Unauthorized          | Missing or invalid authentication |
| 403  | Forbidden             | Insufficient permissions          |
| 404  | Not Found             | Resource not found                |
| 409  | Conflict              | Resource already exists           |
| 422  | Unprocessable Entity  | Validation errors                 |
| 429  | Too Many Requests     | Rate limit exceeded               |
| 500  | Internal Server Error | Server error                      |
| 502  | Bad Gateway           | Service unavailable               |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": [
    "name must be at least 3 characters long",
    "email must be a valid email address"
  ],
  "timestamp": "2025-11-05T02:17:55.000Z"
}
```

### Handling Errors in Your Application

```javascript
try {
  const response = await fetch('http://localhost:3001/api/agents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agentData),
  });

  if (!response.ok) {
    const error = await response.json();

    switch (response.status) {
      case 401:
        // Refresh token or redirect to login
        await refreshAccessToken();
        break;
      case 400:
        // Show validation errors to user
        console.error('Validation errors:', error.errors);
        break;
      case 429:
        // Rate limit exceeded - wait and retry
        await wait(5000);
        break;
      default:
        console.error('API Error:', error.message);
    }

    throw new Error(error.message);
  }

  const data = await response.json();
  return data;
} catch (error) {
  console.error('Request failed:', error);
  throw error;
}
```

---

## Best Practices

### 1. Authentication and Security

- **Store tokens securely**: Use httpOnly cookies or secure storage
- **Refresh tokens proactively**: Refresh before expiration
- **Never expose tokens**: Don't log or include in URLs
- **Use HTTPS**: Always use secure connections in production

### 2. API Request Optimization

- **Use pagination**: Request data in manageable chunks
- **Filter at the source**: Use query parameters to filter data
- **Cache responses**: Implement client-side caching where appropriate
- **Batch operations**: Use batch endpoints when available

### 3. Error Handling

- **Implement retry logic**: Handle transient failures gracefully
- **Log errors properly**: Include context and request IDs
- **Handle all status codes**: Don't just check for 200
- **Provide user feedback**: Show meaningful error messages

### 4. Performance

- **Use compression**: Enable gzip/brotli compression
- **Minimize payload size**: Request only needed fields
- **Implement timeouts**: Set reasonable timeout values
- **Monitor rate limits**: Track and respect rate limits

### 5. WebSocket Best Practices

- **Implement reconnection logic**: Handle disconnections gracefully
- **Heartbeat mechanism**: Keep connections alive
- **Message queuing**: Handle messages during disconnection
- **Authentication**: Authenticate WebSocket connections

---

## WebSocket Support

The New Fuse API provides WebSocket support for real-time features.

### Connecting to WebSocket

```javascript
const socket = io('http://localhost:3001', {
  auth: {
    token: accessToken,
  },
  transports: ['websocket'],
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionAttempts: 5,
});

// Connection events
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});

socket.on('connect_error', (error) => {
  console.error('Connection error:', error);
});
```

### Real-Time Chat

```javascript
// Join a chat room
socket.emit('join_room', { roomId: 'room123' });

// Listen for new messages
socket.on('new_message', (message) => {
  console.log('New message:', message);
  // Update UI with new message
});

// Send a message
socket.emit('send_message', {
  roomId: 'room123',
  content: 'Hello!',
  type: 'text',
});
```

### Agent Status Updates

```javascript
// Subscribe to agent updates
socket.emit('subscribe_agent', { agentId: 'agent123' });

// Listen for status changes
socket.on('agent_status', (data) => {
  console.log('Agent status:', data.status);
  console.log('Metrics:', data.metrics);
});

// Listen for agent tasks
socket.on('agent_task_completed', (data) => {
  console.log('Task completed:', data);
});
```

### Workflow Execution Updates

```javascript
// Subscribe to workflow execution
socket.emit('subscribe_execution', { executionId: 'exec123' });

// Listen for execution updates
socket.on('execution_progress', (data) => {
  console.log('Progress:', data.progress);
  console.log('Current node:', data.currentNode);
});

socket.on('execution_completed', (data) => {
  console.log('Execution completed:', data.output);
});

socket.on('execution_failed', (data) => {
  console.error('Execution failed:', data.error);
});
```

---

## Code Examples

### JavaScript/TypeScript (Node.js)

```typescript
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

class FuseAPIClient {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  async login(email: string, password: string) {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });

    this.accessToken = response.data.accessToken;
    this.refreshToken = response.data.refreshToken;

    return response.data;
  }

  async refreshAccessToken() {
    if (!this.refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
      refreshToken: this.refreshToken,
    });

    this.accessToken = response.data.accessToken;
    this.refreshToken = response.data.refreshToken;
  }

  private async request(method: string, path: string, data?: any) {
    try {
      const response = await axios({
        method,
        url: `${API_BASE_URL}${path}`,
        data,
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        await this.refreshAccessToken();
        // Retry the request
        return this.request(method, path, data);
      }
      throw error;
    }
  }

  // Agent methods
  async createAgent(agentData: any) {
    return this.request('POST', '/agents', agentData);
  }

  async getAgents(filters?: any) {
    const query = new URLSearchParams(filters).toString();
    return this.request('GET', `/agents?${query}`);
  }

  async getAgent(agentId: string) {
    return this.request('GET', `/agents/${agentId}`);
  }

  async updateAgent(agentId: string, updates: any) {
    return this.request('PUT', `/agents/${agentId}`, updates);
  }

  async deleteAgent(agentId: string) {
    return this.request('DELETE', `/agents/${agentId}`);
  }

  // Workflow methods
  async createWorkflow(workflowData: any) {
    return this.request('POST', '/workflows', workflowData);
  }

  async executeWorkflow(workflowId: string, input: any) {
    return this.request('POST', '/workflows/execute', {
      workflowId,
      input,
    });
  }

  async getExecutionStatus(executionId: string) {
    return this.request('GET', `/workflows/executions/${executionId}`);
  }
}

// Usage
const client = new FuseAPIClient();

async function main() {
  // Login
  await client.login('user@example.com', 'password123');

  // Create an agent
  const agent = await client.createAgent({
    name: 'My Assistant',
    type: 'CHAT',
    description: 'A helpful assistant',
  });

  console.log('Created agent:', agent);

  // Create and execute a workflow
  const workflow = await client.createWorkflow({
    name: 'Test Workflow',
    nodes: [
      /* ... */
    ],
    edges: [
      /* ... */
    ],
  });

  const execution = await client.executeWorkflow(workflow.id, {
    param1: 'value1',
  });

  console.log('Execution started:', execution);
}

main().catch(console.error);
```

### Python

```python
import requests
from typing import Optional, Dict, Any

class FuseAPIClient:
    def __init__(self, base_url: str = 'http://localhost:3001/api'):
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.refresh_token: Optional[str] = None

    def login(self, email: str, password: str) -> Dict[str, Any]:
        response = requests.post(
            f'{self.base_url}/auth/login',
            json={'email': email, 'password': password}
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data['accessToken']
        self.refresh_token = data['refreshToken']

        return data

    def refresh_access_token(self):
        if not self.refresh_token:
            raise ValueError('No refresh token available')

        response = requests.post(
            f'{self.base_url}/auth/refresh',
            json={'refreshToken': self.refresh_token}
        )
        response.raise_for_status()

        data = response.json()
        self.access_token = data['accessToken']
        self.refresh_token = data['refreshToken']

    def _request(self, method: str, path: str, data: Optional[Dict] = None) -> Any:
        headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Content-Type': 'application/json'
        }

        try:
            response = requests.request(
                method,
                f'{self.base_url}{path}',
                json=data,
                headers=headers
            )
            response.raise_for_status()
            return response.json()
        except requests.HTTPError as e:
            if e.response.status_code == 401:
                self.refresh_access_token()
                return self._request(method, path, data)
            raise

    # Agent methods
    def create_agent(self, agent_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/agents', agent_data)

    def get_agents(self, filters: Optional[Dict] = None) -> list:
        query = '?' + '&'.join(f'{k}={v}' for k, v in (filters or {}).items())
        return self._request('GET', f'/agents{query}')

    def get_agent(self, agent_id: str) -> Dict[str, Any]:
        return self._request('GET', f'/agents/{agent_id}')

    # Workflow methods
    def create_workflow(self, workflow_data: Dict[str, Any]) -> Dict[str, Any]:
        return self._request('POST', '/workflows', workflow_data)

    def execute_workflow(self, workflow_id: str, input_data: Dict) -> Dict[str, Any]:
        return self._request('POST', '/workflows/execute', {
            'workflowId': workflow_id,
            'input': input_data
        })

# Usage
client = FuseAPIClient()

# Login
client.login('user@example.com', 'password123')

# Create an agent
agent = client.create_agent({
    'name': 'My Assistant',
    'type': 'CHAT',
    'description': 'A helpful assistant'
})

print('Created agent:', agent)

# Execute a workflow
execution = client.execute_workflow('workflow123', {
    'param1': 'value1'
})

print('Execution started:', execution)
```

### cURL Examples

```bash
# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'

# Create an agent (replace TOKEN with your access token)
curl -X POST http://localhost:3001/api/agents \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Support Bot",
    "type": "CHAT",
    "description": "Handles customer inquiries"
  }'

# Get agents
curl -X GET http://localhost:3001/api/agents \
  -H "Authorization: Bearer TOKEN"

# Execute a workflow
curl -X POST http://localhost:3001/api/workflows/execute \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "workflow123",
    "input": {"param1": "value1"}
  }'

# Create a wallet
curl -X POST http://localhost:3001/api/wallets/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user123",
    "verifierId": "google|user@example.com",
    "chainId": 1,
    "enableSmartAccount": true
  }'
```

---

## Support and Resources

### Documentation

- **Swagger UI**: http://localhost:3001/api-docs
- **OpenAPI Spec**: `/openapi.yaml` in the repository
- **GitHub**: https://github.com/whodaniel/fuse

### Getting Help

- **Email**: support@thenewfuse.com
- **Discord**: https://discord.gg/thenewfuse
- **GitHub Issues**: https://github.com/whodaniel/fuse/issues

### Additional Resources

- [Architecture Overview](./ARCHITECTURE.md)
- [Agent Development Guide](./AGENT_DEVELOPMENT.md)
- [Workflow Builder Guide](./WORKFLOW_GUIDE.md)
- [Web3 Integration Guide](./WEB3_INTEGRATION.md)

---

## Changelog

### Version 1.0.0 (2025-11-18)

- Initial API documentation
- Complete OpenAPI 3.1 specification
- Swagger UI integration
- Comprehensive usage guide
- Code examples in multiple languages

---

**Happy Building!** 🚀
