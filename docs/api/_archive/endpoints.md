# API Documentation

## Base URL
All API endpoints are prefixed with `/api`

## Authentication Endpoints

### POST /api/auth/login
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

### POST /api/auth/register
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

### POST /api/auth/refresh
Refresh the access token using the refresh token cookie.

**Response:**
```json
{
  "accessToken": "string",
  "tokenType": "string"
}
```

## Task Management Endpoints

### GET /api/tasks
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

### POST /api/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "priority": "number"
}
```

### PUT /api/tasks/:taskId
Update task status or priority.

**Request Body:**
```json
{
  "status": "string",
  "priority": "number"
}
```

## WebSocket Endpoints

### /api/ws
Main WebSocket connection endpoint.

**Connection Query Parameters:**
- `userId`: User ID for authentication
- `token`: Valid JWT access token

## Health Check

### GET /api/health
Check system health status.

**Response:**
```json
{
  "status": "string",
  "timestamp": "date",
  "services": {
    "database": "string",
    "redis": "string",
    "api": "string"
  },
  "metrics": {
    "uptime": "number",
    "responseTime": "number",
    "activeConnections": "number"
  }
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "string",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "string",
  "error": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "string",
  "error": "Forbidden"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "string",
  "error": "Internal Server Error"
}
```
