# API Reference

## Authentication
All endpoints require JWT authentication token in the Authorization header:
```http
Authorization: Bearer <token>
```

## Endpoints

### Agents

#### Create Agent
```http
POST /api/v1/agents
Content-Type: application/json

{
  "name": "string",
  "type": "string",
  "configuration": {
    "model": "string",
    "parameters": {}
  }
}
```

#### List Agents
```http
GET /api/v1/agents
```

### Workflows

#### Create Workflow
```http
POST /api/v1/workflows
Content-Type: application/json

{
  "name": "string",
  "steps": [
    {
      "type": "string",
      "configuration": {}
    }
  ]
}
```

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