# GraphQL API Examples

This document provides example queries and mutations for The New Fuse GraphQL API.

## Authentication

All GraphQL requests require authentication via JWT token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Queries

### Get Current User

```graphql
query GetMe {
  me {
    id
    username
    email
    firstName
    lastName
    fullName
    roles
    isActive
    createdAt
    updatedAt
  }
}
```

### Get User by ID

```graphql
query GetUser($id: ID!) {
  user(id: $id) {
    id
    username
    email
    fullName
    agents {
      id
      name
      type
      status
    }
    workflows {
      id
      name
      status
      executionCount
    }
  }
}
```

### Get All Users

```graphql
query GetUsers {
  users {
    id
    username
    email
    fullName
    isActive
    createdAt
  }
}
```

### Get Agent by ID

```graphql
query GetAgent($id: ID!) {
  agent(id: $id) {
    id
    name
    type
    description
    status
    isActive
    capabilities
    owner {
      id
      username
      email
    }
    createdAt
    updatedAt
    lastActiveAt
  }
}
```

### Get All Agents

```graphql
query GetAgents {
  agents {
    id
    name
    type
    description
    status
    capabilities
    isActive
    createdAt
  }
}
```

### Get Agents by User

```graphql
query GetUserAgents($userId: ID!) {
  agents(userId: $userId) {
    id
    name
    type
    status
    capabilities
    lastActiveAt
  }
}
```

### Get Workflow by ID

```graphql
query GetWorkflow($id: ID!) {
  workflow(id: $id) {
    id
    name
    description
    status
    isActive
    executionCount
    lastExecutedAt
    creator {
      id
      username
      email
    }
    steps {
      id
      name
      type
      isActive
      agent {
        id
        name
      }
    }
    statistics {
      averageExecutionTime
      successRate
      lastExecutionStatus
    }
  }
}
```

### Get All Workflows

```graphql
query GetWorkflows {
  workflows {
    id
    name
    description
    status
    isActive
    executionCount
    lastExecutedAt
    createdAt
  }
}
```

### Get Workflows by User

```graphql
query GetUserWorkflows($userId: ID!) {
  workflows(userId: $userId) {
    id
    name
    description
    status
    executionCount
    statistics {
      successRate
      lastExecutionStatus
    }
  }
}
```

### Complex Query with Nested Relations

```graphql
query GetUserWithAgentsAndWorkflows($id: ID!) {
  user(id: $id) {
    id
    username
    email
    fullName
    agents {
      id
      name
      type
      status
      capabilities
      lastActiveAt
    }
    workflows {
      id
      name
      status
      executionCount
      steps {
        id
        name
        type
        agent {
          id
          name
        }
      }
      statistics {
        averageExecutionTime
        successRate
      }
    }
  }
}
```

## Mutations

### Create Agent

```graphql
mutation CreateAgent($input: CreateAgentInput!) {
  createAgent(input: $input) {
    id
    name
    type
    description
    status
    capabilities
    owner {
      id
      username
    }
    createdAt
  }
}
```

Variables:
```json
{
  "input": {
    "name": "My Assistant Agent",
    "type": "ASSISTANT",
    "description": "An AI assistant for general tasks",
    "capabilities": ["chat", "task-execution", "data-analysis"]
  }
}
```

### Update Agent

```graphql
mutation UpdateAgent($input: UpdateAgentInput!) {
  updateAgent(input: $input) {
    id
    name
    description
    capabilities
    isActive
    updatedAt
  }
}
```

Variables:
```json
{
  "input": {
    "id": "agent-uuid-here",
    "name": "Updated Agent Name",
    "description": "Updated description",
    "capabilities": ["chat", "task-execution", "data-analysis", "code-generation"],
    "isActive": true
  }
}
```

### Create Workflow

```graphql
mutation CreateWorkflow($input: CreateWorkflowInput!) {
  createWorkflow(input: $input) {
    id
    name
    description
    status
    creator {
      id
      username
    }
    createdAt
  }
}
```

Variables:
```json
{
  "input": {
    "name": "Data Processing Workflow",
    "description": "Workflow for processing and analyzing data",
    "variables": "{\"timeout\": 300, \"retries\": 3}"
  }
}
```

### Execute Workflow

```graphql
mutation ExecuteWorkflow($input: ExecuteWorkflowInput!) {
  executeWorkflow(input: $input) {
    id
    name
    status
    lastExecutedAt
    executionCount
    statistics {
      lastExecutionStatus
    }
  }
}
```

Variables:
```json
{
  "input": {
    "workflowId": "workflow-uuid-here",
    "variables": "{\"inputData\": \"sample-data\"}",
    "async": true
  }
}
```

## Example Usage with cURL

### Query Example

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "query GetMe { me { id username email fullName } }"
  }'
```

### Mutation Example

```bash
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "query": "mutation CreateAgent($input: CreateAgentInput!) { createAgent(input: $input) { id name type status } }",
    "variables": {
      "input": {
        "name": "Test Agent",
        "type": "ASSISTANT",
        "description": "A test agent",
        "capabilities": ["chat"]
      }
    }
  }'
```

## GraphQL Playground

When running in development mode, GraphQL Playground is available at:

```
http://localhost:3000/graphql
```

The playground provides:
- Interactive query and mutation builder
- Schema documentation
- Auto-completion
- Real-time error highlighting

## Error Handling

GraphQL errors follow this format:

```json
{
  "errors": [
    {
      "message": "Error message here",
      "extensions": {
        "code": "ERROR_CODE"
      }
    }
  ],
  "data": null
}
```

Common error codes:
- `UNAUTHENTICATED`: Missing or invalid authentication token
- `FORBIDDEN`: User doesn't have permission
- `BAD_USER_INPUT`: Invalid input data
- `INTERNAL_SERVER_ERROR`: Server error

## Performance Optimization

The GraphQL API uses DataLoader to prevent N+1 query problems:

- User-Agent relationships are batched
- User-Workflow relationships are batched
- Workflow-Step relationships are batched

This ensures optimal database performance even with complex nested queries.
