# API Usage Examples

This document provides practical examples of how to use the new REST API endpoints.

## Authentication

All requests require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 1. User Profile Management

### Get User Profile
```bash
curl -X GET http://localhost:3004/users/usr_123/profile \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "id": "usr_123",
  "email": "user@example.com",
  "name": "John Doe",
  "displayName": "Johnny",
  "bio": "Software developer and AI enthusiast",
  "avatarUrl": "https://example.com/avatar.jpg",
  "location": "San Francisco, CA",
  "company": "Acme Inc.",
  "website": "https://johndoe.com",
  "preferences": {
    "theme": "dark",
    "notifications": true
  },
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### Update User Profile
```bash
curl -X PUT http://localhost:3004/users/usr_123/profile \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "Johnny Doe",
    "bio": "Full-stack developer passionate about AI and automation",
    "location": "San Francisco, CA",
    "preferences": {
      "theme": "dark",
      "notifications": true,
      "language": "en"
    }
  }'
```

---

## 2. Agent Execution History

### Get All Executions (Paginated)
```bash
curl -X GET "http://localhost:3004/agents/executions?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "executions": [
    {
      "id": "exec_001",
      "agentId": "agent_123",
      "agentName": "Data Processor Agent",
      "userId": "usr_123",
      "status": "COMPLETED",
      "input": {
        "query": "Process customer data"
      },
      "output": {
        "processed": 1500,
        "errors": 0
      },
      "startedAt": "2024-01-15T10:00:00.000Z",
      "completedAt": "2024-01-15T10:05:30.000Z",
      "duration": 330000,
      "createdAt": "2024-01-15T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

### Filter Executions by Agent and Status
```bash
curl -X GET "http://localhost:3004/agents/executions?agentId=agent_123&status=FAILED&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Filter by Date Range
```bash
curl -X GET "http://localhost:3004/agents/executions?startDate=2024-01-01T00:00:00Z&endDate=2024-01-31T23:59:59Z" \
  -H "Authorization: Bearer <token>"
```

### Get Single Execution Details
```bash
curl -X GET http://localhost:3004/agents/executions/exec_001 \
  -H "Authorization: Bearer <token>"
```

---

## 3. Workflow Templates

### Get All Templates
```bash
curl -X GET http://localhost:3004/workflows/templates \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
[
  {
    "id": "tmpl_001",
    "name": "Data Processing Pipeline",
    "description": "Template for processing and transforming data",
    "category": "data",
    "template": {
      "nodes": [
        {
          "id": "node1",
          "type": "input",
          "label": "Data Source"
        },
        {
          "id": "node2",
          "type": "transform",
          "label": "Transform Data"
        }
      ],
      "edges": [
        {
          "from": "node1",
          "to": "node2"
        }
      ]
    },
    "tags": ["data", "etl", "pipeline"],
    "createdBy": "usr_admin",
    "isPublic": true,
    "usageCount": 42,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

### Get Template by ID
```bash
curl -X GET http://localhost:3004/workflows/templates/tmpl_001 \
  -H "Authorization: Bearer <token>"
```

### Create New Template
```bash
curl -X POST http://localhost:3004/workflows/templates \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Customer Onboarding Flow",
    "description": "Automated workflow for onboarding new customers",
    "category": "automation",
    "template": {
      "nodes": [
        {
          "id": "node1",
          "type": "trigger",
          "config": {
            "event": "customer.created"
          }
        },
        {
          "id": "node2",
          "type": "action",
          "config": {
            "action": "send_welcome_email"
          }
        }
      ],
      "edges": [
        {
          "from": "node1",
          "to": "node2"
        }
      ]
    },
    "tags": ["automation", "customer", "onboarding"],
    "isPublic": false
  }'
```

### Update Template
```bash
curl -X PUT http://localhost:3004/workflows/templates/tmpl_001 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Template Name",
    "description": "Updated description",
    "isPublic": true
  }'
```

### Delete Template
```bash
curl -X DELETE http://localhost:3004/workflows/templates/tmpl_001 \
  -H "Authorization: Bearer <token>"
```

---

## 4. File Upload/Download

### Upload File
```bash
curl -X POST http://localhost:3004/files/upload \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/document.pdf"
```

**Response:**
```json
{
  "id": "file_001",
  "filename": "document.pdf",
  "mimeType": "application/pdf",
  "size": 2048000,
  "category": "DOCUMENT",
  "url": "https://storage.example.com/files/file_001",
  "uploadedBy": "usr_123",
  "uploadedAt": "2024-01-15T10:00:00.000Z",
  "metadata": {
    "pages": 25
  }
}
```

### Get User Files (Paginated)
```bash
curl -X GET "http://localhost:3004/files?page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "files": [
    {
      "id": "file_001",
      "filename": "document.pdf",
      "mimeType": "application/pdf",
      "size": 2048000,
      "category": "DOCUMENT",
      "url": "https://storage.example.com/files/file_001",
      "uploadedBy": "usr_123",
      "uploadedAt": "2024-01-15T10:00:00.000Z",
      "metadata": {
        "pages": 25
      }
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

### Filter Files by Category
```bash
curl -X GET "http://localhost:3004/files?category=IMAGE&page=1&limit=20" \
  -H "Authorization: Bearer <token>"
```

### Download File
```bash
curl -X GET http://localhost:3004/files/file_001 \
  -H "Authorization: Bearer <token>" \
  -o downloaded_file.pdf
```

### Delete File
```bash
curl -X DELETE http://localhost:3004/files/file_001 \
  -H "Authorization: Bearer <token>"
```

---

## 5. System Health & Metrics

### Get Comprehensive System Metrics (Admin Only)
```bash
curl -X GET http://localhost:3004/system/metrics \
  -H "Authorization: Bearer <admin-token>"
```

**Response:**
```json
{
  "status": "healthy",
  "uptime": 86400,
  "timestamp": "2024-01-15T10:00:00.000Z",
  "memory": {
    "total": 8589934592,
    "used": 4294967296,
    "free": 4294967296,
    "usagePercent": 50.0
  },
  "cpu": {
    "cores": 8,
    "usagePercent": 45.2,
    "loadAverage": 2.5
  },
  "database": {
    "status": "connected",
    "activeConnections": 12,
    "totalQueries": 15234,
    "avgQueryTime": 25.3
  },
  "api": {
    "totalRequests": 100000,
    "requestsPerMinute": 150,
    "avgResponseTime": 125.5,
    "errorRate": 0.5,
    "statusCodeDistribution": {
      "200": 95000,
      "201": 3000,
      "400": 1500,
      "500": 500
    }
  },
  "services": [
    {
      "name": "database",
      "status": "healthy",
      "responseTime": 5,
      "lastCheck": "2024-01-15T10:00:00.000Z",
      "message": "Database connection stable"
    },
    {
      "name": "redis",
      "status": "healthy",
      "responseTime": 2,
      "lastCheck": "2024-01-15T10:00:00.000Z",
      "message": "Cache service operational"
    }
  ],
  "version": "1.0.0",
  "environment": "production"
}
```

### Get Quick Health Check
```bash
curl -X GET http://localhost:3004/system/health \
  -H "Authorization: Bearer <token>"
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:00:00.000Z",
  "uptime": 86400
}
```

---

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
// Get user profile
async function getUserProfile(userId: string, token: string) {
  const response = await fetch(`http://localhost:3004/users/${userId}/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Update user profile
async function updateUserProfile(userId: string, profileData: any, token: string) {
  const response = await fetch(`http://localhost:3004/users/${userId}/profile`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(profileData)
  });
  return await response.json();
}

// Get agent executions
async function getAgentExecutions(filters: any, token: string) {
  const params = new URLSearchParams(filters);
  const response = await fetch(`http://localhost:3004/agents/executions?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  return await response.json();
}

// Upload file
async function uploadFile(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:3004/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  return await response.json();
}

// Create workflow template
async function createWorkflowTemplate(template: any, token: string) {
  const response = await fetch('http://localhost:3004/workflows/templates', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(template)
  });
  return await response.json();
}
```

### Using Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3004',
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

// Get user profile
const profile = await api.get(`/users/${userId}/profile`);

// Update user profile
const updatedProfile = await api.put(`/users/${userId}/profile`, profileData);

// Get agent executions
const executions = await api.get('/agents/executions', {
  params: {
    agentId: 'agent_123',
    status: 'COMPLETED',
    page: 1,
    limit: 20
  }
});

// Upload file
const formData = new FormData();
formData.append('file', file);
const uploadedFile = await api.post('/files/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data'
  }
});

// Create workflow template
const template = await api.post('/workflows/templates', templateData);

// Get system metrics
const metrics = await api.get('/system/metrics');
```

---

## Error Responses

All endpoints follow a consistent error response format:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": [
    "name must be a string",
    "email must be a valid email address"
  ],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource",
  "error": "Forbidden"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "User with ID usr_123 not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:
- **Default**: 100 requests per minute per user
- **Admin endpoints**: 200 requests per minute
- **File uploads**: 10 uploads per minute

When rate limit is exceeded, you'll receive:
```json
{
  "statusCode": 429,
  "message": "Too Many Requests",
  "error": "ThrottlerException"
}
```

---

## Best Practices

1. **Always handle errors**: Check response status codes and handle errors appropriately
2. **Use pagination**: When fetching lists, always use page and limit parameters
3. **Validate file sizes**: Before uploading, check that files are under 10MB
4. **Cache responses**: Cache GET responses when appropriate to reduce API calls
5. **Use filtering**: Take advantage of query parameters to filter results server-side
6. **Monitor health**: Regularly check the `/system/health` endpoint for system status
7. **Secure tokens**: Never expose JWT tokens in client-side code or logs
