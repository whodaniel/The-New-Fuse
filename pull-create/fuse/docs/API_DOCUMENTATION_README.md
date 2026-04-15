# API Documentation

This directory contains comprehensive documentation for The New Fuse API.

## Available Documentation

### 📖 [API Usage Guide](./API_USAGE_GUIDE.md)
Complete guide for developers using The New Fuse API, including:
- Getting started instructions
- Authentication flow
- Common use cases with examples
- Rate limiting information
- Error handling best practices
- Code examples in JavaScript/TypeScript, Python, and cURL

### 📋 [OpenAPI Specification](../openapi.yaml)
OpenAPI 3.1 specification file with:
- All API endpoints documented
- Request/response schemas
- Authentication requirements
- Error responses
- Example payloads

## Quick Start

### 1. View API Documentation

The API includes interactive Swagger UI documentation:

**Development:**
```
http://localhost:3001/api-docs
```

**Production:**
```
https://api.thenewfuse.com/api-docs
```

### 2. Authentication

All API requests require authentication. Get your access token:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"yourpassword"}'
```

### 3. Make Your First API Call

```bash
curl -X GET http://localhost:3001/api/agents \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## API Features

### 🤖 Agent Management
Create, manage, and orchestrate AI agents with various capabilities:
- Natural language processing
- Code generation
- Data analysis
- Workflow execution

### 💬 Real-Time Chat
WebSocket-based chat system with:
- Room management
- Message history
- Real-time notifications
- Analytics

### ⚙️ Workflow Automation
Build and execute complex workflows:
- Visual workflow builder
- Node-based execution
- Template library
- Execution monitoring

### 💰 Web3 Integration
Blockchain functionality including:
- Wallet creation and management
- Transaction execution
- Smart Account (ERC-4337) support
- Batch transactions

### 🔌 MCP Protocol
Model Context Protocol for agent communication:
- Server registration
- Status monitoring
- OAuth integration

## Architecture

The New Fuse API is built using:
- **Framework**: NestJS
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: JWT with refresh tokens
- **Real-time**: Socket.IO for WebSocket connections
- **Documentation**: Swagger/OpenAPI 3.1
- **API Gateway**: Reverse proxy with service routing

## Base URLs

| Environment | URL |
|-------------|-----|
| Development API | http://localhost:3001/api |
| API Gateway | http://localhost:4000/api/v1 |
| Production | https://api.thenewfuse.com/api |

## Available Endpoints

### Authentication
- POST `/auth/login` - User login
- POST `/auth/register` - User registration
- POST `/auth/refresh` - Refresh token
- POST `/auth/logout` - User logout
- GET `/auth/me` - Get current user

### Agents
- GET `/agents` - List agents
- POST `/agents` - Create agent
- GET `/agents/{id}` - Get agent
- PUT `/agents/{id}` - Update agent
- DELETE `/agents/{id}` - Delete agent
- PUT `/agents/{id}/activate` - Activate agent
- GET `/agents/{id}/stats` - Agent statistics

### Chat
- GET `/chat/rooms` - List rooms
- GET `/chat/rooms/{roomId}/messages` - Get messages
- POST `/chat/rooms/{roomId}/messages` - Send message
- GET `/chat/analytics` - Chat analytics

### Workflows
- GET `/workflows` - List workflows
- POST `/workflows` - Create workflow
- POST `/workflows/execute` - Execute workflow
- GET `/workflows/executions/{id}` - Get execution
- POST `/workflows/executions/{id}/cancel` - Cancel execution

### Wallets
- POST `/wallets/create` - Create wallet
- GET `/wallets/user/{userId}` - Get user wallets
- GET `/wallets/address/{address}` - Get wallet by address

### Transactions
- POST `/transactions/execute/{walletId}` - Execute transaction
- POST `/transactions/execute-batch/{walletId}` - Batch transaction
- GET `/transactions/wallet/{walletId}` - Get transactions

### Smart Accounts
- POST `/smart-accounts/enable/{walletId}` - Enable smart account
- POST `/smart-accounts/deploy/{walletId}` - Deploy smart account
- POST `/smart-accounts/execute/{walletId}` - Execute transaction

### MCP Protocol
- GET `/mcp/servers` - List MCP servers
- POST `/mcp/servers` - Register server
- GET `/mcp/servers/{id}/status` - Server status

## Rate Limiting

| Tier | Requests/Minute |
|------|----------------|
| Auth | 10 |
| API | 60 |
| Premium | 120 |
| Admin | 300 |

## Error Handling

The API uses standard HTTP status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limit Exceeded
- `500` - Server Error

Error responses include:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "errors": ["Field 'name' is required"]
}
```

## WebSocket Events

Connect to WebSocket for real-time updates:

```javascript
const socket = io('http://localhost:3001', {
  auth: { token: accessToken }
});

// Agent events
socket.on('agent_status', (data) => { /* ... */ });
socket.on('agent_task_completed', (data) => { /* ... */ });

// Chat events
socket.on('new_message', (message) => { /* ... */ });

// Workflow events
socket.on('execution_progress', (data) => { /* ... */ });
socket.on('execution_completed', (data) => { /* ... */ });
```

## Development Setup

### Prerequisites
- Node.js 18+
- PostgreSQL
- pnpm (recommended) or npm

### Install Dependencies
```bash
pnpm install
```

### Setup Environment Variables
```bash
cp .env.example .env
# Edit .env with your configuration
```

### Run API Server
```bash
cd apps/api
pnpm dev
```

### View API Documentation
```
http://localhost:3001/api-docs
```

## SDK and Client Libraries

### TypeScript/JavaScript
```typescript
import { FuseAPIClient } from '@the-new-fuse/api-client';

const client = new FuseAPIClient({
  baseURL: 'http://localhost:3001/api'
});

await client.login('user@example.com', 'password');
const agents = await client.agents.list();
```

### Python
```python
from fuse_api import FuseClient

client = FuseClient('http://localhost:3001/api')
client.login('user@example.com', 'password')
agents = client.agents.list()
```

## Testing

### Using Swagger UI
1. Navigate to http://localhost:3001/api-docs
2. Click "Authorize" and enter your JWT token
3. Expand an endpoint and click "Try it out"
4. Fill in parameters and click "Execute"

### Using cURL
```bash
# Get access token
TOKEN=$(curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.accessToken')

# Make authenticated request
curl -X GET http://localhost:3001/api/agents \
  -H "Authorization: Bearer $TOKEN"
```

### Using Postman
1. Import the OpenAPI specification from `/openapi.yaml`
2. Set up authentication with Bearer token
3. Start making requests

## Support

- **Email**: support@thenewfuse.com
- **Discord**: https://discord.gg/thenewfuse
- **GitHub Issues**: https://github.com/whodaniel/fuse/issues
- **Documentation**: https://docs.thenewfuse.com

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on contributing to the API.

## License

MIT License - see [LICENSE](../LICENSE) for details

---

**Last Updated**: 2025-11-18
**API Version**: 1.0.0
