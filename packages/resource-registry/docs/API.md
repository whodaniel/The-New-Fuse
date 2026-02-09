# Resource Registry API Documentation

## Table of Contents

- [Authentication](#authentication)
- [Endpoints](#endpoints)
- [Data Models](#data-models)
- [Examples](#examples)
- [Error Handling](#error-handling)

## Authentication

The Resource Registry API supports multiple authentication methods:

1. **Bearer Token**: For human users
2. **Agent Token**: For AI agents
3. **API Key**: For service-to-service communication

```http
Authorization: Bearer <token>
```

## Endpoints

### Create Resource

Create a new resource in the registry.

**Endpoint:** `POST /api/resources`

**Request Body:**
```json
{
  "name": "Data Processing Skill",
  "description": "Process and analyze data with Claude",
  "category": "CLAUDE_SKILL",
  "type": "JSON",
  "content": {
    "skill": {
      "name": "data-processor",
      "commands": ["process", "analyze"]
    }
  },
  "tags": ["data", "processing"],
  "version": "1.0.0",
  "source": "github.com/example/skills",
  "visibility": "PUBLIC",
  "keywords": ["data", "analytics"]
}
```

**Response:** `201 Created`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Data Processing Skill",
  "category": "CLAUDE_SKILL",
  "version": "1.0.0",
  "createdAt": "2025-11-18T00:00:00.000Z",
  ...
}
```

### Search Resources

Search and filter resources with pagination.

**Endpoint:** `GET /api/resources`

**Query Parameters:**
- `query` (string): Search query
- `category` (array): Filter by categories
- `type` (array): Filter by types
- `visibility` (array): Filter by visibility
- `status` (array): Filter by status
- `tags` (array): Filter by tags
- `keywords` (array): Filter by keywords
- `author` (string): Filter by author name
- `authorId` (string): Filter by author ID
- `isVerified` (boolean): Filter verified resources
- `isFeatured` (boolean): Filter featured resources
- `minVersion` (string): Minimum version
- `maxVersion` (string): Maximum version
- `createdAfter` (string): Created after date (ISO 8601)
- `createdBefore` (string): Created before date (ISO 8601)
- `sortBy` (string): Sort field (name, createdAt, updatedAt, usageCount, downloadCount, favoriteCount)
- `sortOrder` (string): Sort order (asc, desc)
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 20, max: 100)

**Example Request:**
```http
GET /api/resources?query=data&category=CLAUDE_SKILL&isVerified=true&page=1&limit=20
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "Data Processing Skill",
      "category": "CLAUDE_SKILL",
      ...
    }
  ],
  "total": 45,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### Get Resource by ID

Get a specific resource by its ID.

**Endpoint:** `GET /api/resources/:id`

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Data Processing Skill",
  "description": "Process and analyze data with Claude",
  "category": "CLAUDE_SKILL",
  "type": "JSON",
  "content": {...},
  "tags": ["data", "processing"],
  "version": "1.0.0",
  "visibility": "PUBLIC",
  "usageCount": 156,
  "downloadCount": 89,
  "favoriteCount": 23,
  "isVerified": true,
  "metadata": {...},
  "versions": [...],
  "createdAt": "2025-11-18T00:00:00.000Z",
  "updatedAt": "2025-11-18T00:00:00.000Z"
}
```

### Update Resource

Update an existing resource.

**Endpoint:** `PUT /api/resources/:id`

**Request Body:**
```json
{
  "description": "Updated description",
  "tags": ["data", "processing", "analytics"],
  "version": "1.1.0"
}
```

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "version": "1.1.0",
  ...
}
```

### Delete Resource

Delete a resource (soft delete).

**Endpoint:** `DELETE /api/resources/:id`

**Response:** `204 No Content`

### Get Categories

List all available resource categories.

**Endpoint:** `GET /api/resources/categories`

**Response:** `200 OK`
```json
[
  "CLAUDE_SKILL",
  "N8N_WORKFLOW",
  "CODE_SNIPPET",
  "DOCUMENTATION",
  ...
]
```

### Get Resource Versions

Get all versions of a resource.

**Endpoint:** `GET /api/resources/:id/versions`

**Response:** `200 OK`
```json
[
  {
    "id": "version-1",
    "resourceId": "550e8400-e29b-41d4-a716-446655440000",
    "version": "1.1.0",
    "changelog": "Added new features",
    "isLatest": true,
    "createdAt": "2025-11-18T00:00:00.000Z"
  },
  {
    "id": "version-2",
    "version": "1.0.0",
    "isLatest": false,
    ...
  }
]
```

### Get Specific Version

Get a specific version of a resource.

**Endpoint:** `GET /api/resources/:id/versions/:version`

**Response:** `200 OK`
```json
{
  "id": "version-1",
  "resourceId": "550e8400-e29b-41d4-a716-446655440000",
  "version": "1.0.0",
  "content": {...},
  "changelog": "Initial release",
  "createdAt": "2025-11-18T00:00:00.000Z"
}
```

### Download Resource

Download a resource (logs download count).

**Endpoint:** `POST /api/resources/:id/download`

**Response:** `200 OK`
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "Data Processing Skill",
  "version": "1.1.0",
  "content": {...},
  "type": "JSON",
  "category": "CLAUDE_SKILL"
}
```

## Data Models

### Resource

```typescript
{
  id: string;
  name: string;
  description?: string;
  category: ResourceCategory;
  type: ResourceType;
  content: any;
  tags: string[];
  version: string;
  source: string;
  visibility: ResourceVisibility;
  author?: string;
  authorId?: string;
  license?: string;
  homepage?: string;
  repository?: string;
  keywords: string[];
  usageCount: number;
  downloadCount: number;
  favoriteCount: number;
  status: ResourceStatus;
  isVerified: boolean;
  isFeatured: boolean;
  dependencies: string[];
  relatedResources: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

### ResourceCategory

```typescript
enum ResourceCategory {
  CLAUDE_SKILL
  N8N_WORKFLOW
  AGENT_TEMPLATE
  CODE_SNIPPET
  DOCUMENTATION
  TOOL
  INTEGRATION
  WORKFLOW_TEMPLATE
  API_ENDPOINT
  DATABASE_SCHEMA
  UI_COMPONENT
  CONFIGURATION
  SCRIPT
  PROMPT_TEMPLATE
  DATA_SOURCE
}
```

### ResourceVisibility

```typescript
enum ResourceVisibility {
  PUBLIC          // Available to everyone
  AGENTS_ONLY     // Only AI agents can access
  PRIVATE         // Only creator/owner can access
  RESTRICTED      // Requires specific permissions
  INTERNAL        // Internal use only
}
```

## Examples

### Creating a Claude Skill

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "name": "Email Summarizer",
    "description": "Summarize emails efficiently",
    "category": "CLAUDE_SKILL",
    "type": "JSON",
    "content": {
      "skill": {
        "name": "email-summarizer",
        "commands": ["summarize", "extract-action-items"]
      }
    },
    "tags": ["email", "productivity"],
    "version": "1.0.0",
    "source": "github.com/example/email-skill"
  }'
```

### Searching for n8n Workflows

```bash
curl -X GET "http://localhost:3000/api/resources?category=N8N_WORKFLOW&isVerified=true&page=1&limit=10" \
  -H "Authorization: Bearer <token>"
```

### Updating a Resource

```bash
curl -X PUT http://localhost:3000/api/resources/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "description": "Updated description with more details",
    "version": "1.1.0"
  }'
```

## Error Handling

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Invalid semantic version: invalid",
  "error": "Bad Request"
}
```

### Common Error Codes

- `400 Bad Request` - Invalid input data
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource already exists
- `500 Internal Server Error` - Server error

### Error Examples

**Invalid Version:**
```json
{
  "statusCode": 400,
  "message": "Invalid semantic version: 1.0",
  "error": "Bad Request"
}
```

**Access Denied:**
```json
{
  "statusCode": 403,
  "message": "You do not have permission to view this resource",
  "error": "Forbidden"
}
```

**Resource Not Found:**
```json
{
  "statusCode": 404,
  "message": "Resource not found: 550e8400-e29b-41d4-a716-446655440000",
  "error": "Not Found"
}
```
