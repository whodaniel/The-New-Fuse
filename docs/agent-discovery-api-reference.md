# Agent Discovery API Reference

Quick reference guide for all agent discovery API endpoints.

## Base URL

```
http://localhost:3000/api/agents
```

## Endpoints

### 1. Register Agent

Register a new agent or update existing registration.

**Endpoint:** `POST /discovery/register`

**Request Body:**

```json
{
  "agentId": "code-reviewer-01",
  "name": "Code Review Agent",
  "description": "Expert code reviewer",
  "type": "code-analysis",
  "groups": ["code-quality", "security"],
  "version": "1.2.0",
  "capabilities": [
    {
      "name": "code-review",
      "version": "1.2.0",
      "description": "Comprehensive code review",
      "languages": ["python", "typescript"],
      "confidence": 0.95,
      "pricing": {
        "perInvocation": 0.01,
        "currency": "USD"
      }
    }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Agent registered successfully",
    "agentId": "code-reviewer-01"
  }
}
```

---

### 2. Send Heartbeat

Send agent heartbeat with current metrics.

**Endpoint:** `POST /discovery/heartbeat`

**Request Body:**

```json
{
  "agentId": "code-reviewer-01",
  "status": "online",
  "metrics": {
    "isHealthy": true,
    "uptime": 3600,
    "successRate": 0.95,
    "avgResponseTime": 1200,
    "cpuUsage": 25.5,
    "memoryUsage": 40.2,
    "activeTasks": 2,
    "totalTasks": 100,
    "failedTasks": 5
  }
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Heartbeat received",
    "timestamp": "2025-11-18T10:30:00Z"
  }
}
```

---

### 3. Deregister Agent

Remove agent from discovery system.

**Endpoint:** `POST /discovery/deregister`

**Request Body:**

```json
{
  "agentId": "code-reviewer-01"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Agent deregistered successfully",
    "agentId": "code-reviewer-01"
  }
}
```

---

### 4. Discover Agents

Query agents based on criteria.

**Endpoint:** `POST /discover`

**Request Body:**

```json
{
  "capability": "code-review",
  "languages": ["python"],
  "minConfidence": 0.8,
  "status": ["online", "idle"],
  "maxCpuUsage": 50,
  "minSuccessRate": 0.9,
  "sortBy": "successRate",
  "limit": 5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "agents": [
      {
        "registration": {
          "agentId": "code-reviewer-01",
          "name": "Code Review Agent",
          "capabilities": [...]
        },
        "status": "online",
        "load": 0.23,
        "metrics": {...},
        "lastHeartbeat": "2025-11-18T10:30:00Z",
        "score": 0.95
      }
    ],
    "total": 1,
    "queryTime": 12,
    "recommendations": [
      {
        "agentId": "code-reviewer-01",
        "score": 0.87,
        "reason": "Low load (23.0%), high success rate (95.0%)",
        "estimatedWaitTime": 1476
      }
    ]
  }
}
```

---

### 5. Get All Agents

Get all registered agents.

**Endpoint:** `GET /discovery`

**Response:**

```json
{
  "success": true,
  "data": {
    "agents": [...],
    "total": 12,
    "timestamp": "2025-11-18T10:30:00Z"
  }
}
```

---

### 6. Get Agent by ID

Get specific agent details.

**Endpoint:** `GET /discovery/:agentId`

**Response:**

```json
{
  "success": true,
  "data": {
    "registration": {...},
    "status": "online",
    "load": 0.23,
    "metrics": {...},
    "lastHeartbeat": "2025-11-18T10:30:00Z",
    "firstSeen": "2025-11-18T10:00:00Z"
  }
}
```

---

### 7. Match Capabilities

Semantic search for capabilities.

**Endpoint:** `POST /discovery/match`

**Request Body:**

```json
{
  "query": "analyze statistical data",
  "minScore": 0.5,
  "maxResults": 5,
  "preferLowLoad": true
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "matches": [
      {
        "agent": {...},
        "capability": {
          "name": "statistical-analysis",
          "description": "...",
          "confidence": 0.93
        },
        "score": 0.89,
        "matchReasons": [
          "Description matches search term",
          "Very high confidence"
        ]
      }
    ],
    "total": 3,
    "query": "analyze statistical data"
  }
}
```

---

### 8. Compose Capabilities

Chain multiple agents for workflows.

**Endpoint:** `POST /discovery/compose`

**Request Body:**

```json
{
  "capabilities": [
    "data-cleaning",
    "statistical-analysis",
    "data-visualization"
  ],
  "maxChainLength": 5,
  "preferReliable": true,
  "maxCost": 0.5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "compositions": [
      {
        "composition": {
          "name": "Composed: data-cleaning → statistical-analysis → data-visualization",
          "agentChain": ["cleaner-01", "analyzer-01", "visualizer-01"],
          "capabilities": [
            "data-cleaning",
            "statistical-analysis",
            "data-visualization"
          ],
          "totalCost": 0.09,
          "estimatedTime": 5200
        },
        "score": 0.85,
        "reliability": 0.82
      }
    ],
    "total": 2,
    "requestedCapabilities": [
      "data-cleaning",
      "statistical-analysis",
      "data-visualization"
    ]
  }
}
```

---

### 9. System Health

Get discovery system health status.

**Endpoint:** `GET /discovery/system/health`

**Response:**

```json
{
  "success": true,
  "data": {
    "system": {
      "healthy": true,
      "timestamp": "2025-11-18T10:30:00Z"
    },
    "agents": {
      "total": 12,
      "online": 10,
      "healthy": 11,
      "avgLoad": 0.234,
      "avgSuccessRate": 0.932
    }
  }
}
```

---

### 10. Advanced Query

Advanced query with semantic search.

**Endpoint:** `POST /discovery/query/advanced`

**Request Body:**

```json
{
  "capability": "code",
  "languages": ["python"],
  "minConfidence": 0.85,
  "minSuccessRate": 0.9,
  "maxCpuUsage": 50,
  "maxLoad": 0.6,
  "status": ["online", "idle"],
  "semanticSearch": true,
  "sortBy": "successRate",
  "limit": 5
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "agents": [...],
    "total": 3,
    "queryTime": 18,
    "recommendations": [...],
    "matches": [...]
  }
}
```

## Query Parameters

### DiscoveryQuery Options

| Parameter        | Type     | Description                                                     |
| ---------------- | -------- | --------------------------------------------------------------- |
| `capability`     | string   | Capability name or description to search                        |
| `languages`      | string[] | Required programming languages                                  |
| `frameworks`     | string[] | Required frameworks                                             |
| `groups`         | string[] | Agent groups to filter by                                       |
| `types`          | string[] | Agent types to filter by                                        |
| `status`         | string[] | Status filter (online, busy, idle, offline, error)              |
| `maxCpuUsage`    | number   | Maximum CPU usage percentage (0-100)                            |
| `maxMemoryUsage` | number   | Maximum memory usage percentage (0-100)                         |
| `maxLoad`        | number   | Maximum load (0-1)                                              |
| `minConfidence`  | number   | Minimum capability confidence (0-1)                             |
| `minSuccessRate` | number   | Minimum task success rate (0-1)                                 |
| `maxCost`        | number   | Maximum cost per invocation                                     |
| `semanticSearch` | boolean  | Enable semantic search                                          |
| `sortBy`         | string   | Sort field (relevance, load, successRate, responseTime, uptime) |
| `sortDirection`  | string   | Sort direction (asc, desc)                                      |
| `limit`          | number   | Maximum number of results                                       |

## Agent Status Values

- `online` - Agent is online and accepting tasks
- `busy` - Agent is busy with many tasks
- `idle` - Agent is idle and available
- `offline` - Agent is offline
- `error` - Agent is in error state
- `starting` - Agent is starting up
- `stopping` - Agent is shutting down

## Error Responses

### 400 Bad Request

```json
{
  "success": false,
  "error": {
    "message": "agentId is required",
    "code": 400
  }
}
```

### 404 Not Found

```json
{
  "success": false,
  "error": {
    "message": "Agent not found",
    "code": 404
  }
}
```

### 500 Internal Server Error

```json
{
  "success": false,
  "error": {
    "message": "Failed to register agent",
    "code": 500
  }
}
```

## Rate Limits

- Registration: 10 requests/minute per IP
- Heartbeat: 120 requests/minute per agent
- Discovery queries: 100 requests/minute per IP

## WebSocket Events (Future)

Coming soon: Real-time updates via WebSocket

```javascript
socket.on('agent:registered', (data) => {
  console.log('New agent:', data);
});

socket.on('agent:deregistered', (data) => {
  console.log('Agent removed:', data);
});

socket.on('agent:status_changed', (data) => {
  console.log('Status changed:', data);
});
```

## Code Examples

### JavaScript/TypeScript

```typescript
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/agents';

// Register agent
await axios.post(`${API_URL}/discovery/register`, {
  agentId: 'my-agent',
  name: 'My Agent',
  version: '1.0.0',
  capabilities: [...]
});

// Discover agents
const { data } = await axios.post(`${API_URL}/discover`, {
  capability: 'code-review',
  languages: ['python']
});

console.log(data.data.agents);
```

### Python

```python
import requests

API_URL = 'http://localhost:3000/api/agents'

# Register agent
response = requests.post(f'{API_URL}/discovery/register', json={
    'agentId': 'my-agent',
    'name': 'My Agent',
    'version': '1.0.0',
    'capabilities': [...]
})

# Discover agents
response = requests.post(f'{API_URL}/discover', json={
    'capability': 'code-review',
    'languages': ['python']
})

agents = response.json()['data']['agents']
print(agents)
```

### cURL

```bash
# Register agent
curl -X POST http://localhost:3000/api/agents/discovery/register \
  -H "Content-Type: application/json" \
  -d '{
    "agentId": "my-agent",
    "name": "My Agent",
    "version": "1.0.0",
    "capabilities": [...]
  }'

# Discover agents
curl -X POST http://localhost:3000/api/agents/discover \
  -H "Content-Type: application/json" \
  -d '{
    "capability": "code-review",
    "languages": ["python"]
  }'
```

## Best Practices

1. **Heartbeats**: Send every 30 seconds to maintain presence
2. **Registration**: Re-register on startup and after network issues
3. **Deregistration**: Always deregister on graceful shutdown
4. **Error Handling**: Retry registration/heartbeat on failure
5. **Metrics**: Update metrics accurately for load balancing
6. **Versioning**: Use semantic versioning for capabilities
7. **Dependencies**: Declare capability dependencies accurately
8. **Pricing**: Set realistic pricing for cost estimation
9. **Queries**: Use specific filters to reduce query time
10. **Caching**: Cache frequent queries on client side

## Support

For API issues:

- Check system health: `GET /discovery/system/health`
- View all agents: `GET /discovery`
- Check Redis connection
- Review agent logs
- Ensure heartbeats are being sent
