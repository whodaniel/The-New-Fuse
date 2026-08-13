# GraphQL API Implementation Summary

## Overview

A complete GraphQL API layer has been successfully added to The New Fuse
backend, providing flexible and efficient data querying alongside existing REST
APIs.

## Key Features

- **Full GraphQL Schema** for User, Agent, Workflow, and WorkflowStep entities
- **JWT Authentication** integrated with existing security infrastructure
- **DataLoader Implementation** for N+1 query optimization
- **Apollo Server** with GraphQL Playground for development
- **Type-safe Resolvers** with full TypeScript support
- **Backward Compatible** - works alongside existing REST APIs

## GraphQL Types Created

### 1. User Type

```graphql
type User {
  id: ID!
  username: String!
  email: String!
  firstName: String
  lastName: String
  fullName: String # Computed field
  roles: [String!]!
  isActive: Boolean!
  agents: [Agent!] # Optimized with DataLoader
  workflows: [Workflow!] # Optimized with DataLoader
  createdAt: DateTime!
  updatedAt: DateTime!
  preferences: String
  metadata: String
}
```

### 2. Agent Type

```graphql
enum AgentStatus {
  ACTIVE
  INACTIVE
  PROCESSING
  ERROR
}

type Agent {
  id: ID!
  name: String!
  type: String!
  description: String
  status: AgentStatus! # Computed based on activity
  capabilities: [String!]
  owner: User # Optimized with DataLoader
  isActive: Boolean!
  createdAt: DateTime!
  updatedAt: DateTime!
  lastActiveAt: DateTime
  config: String
  metadata: String
}
```

### 3. Workflow Type

```graphql
enum WorkflowStatus {
  IDLE
  RUNNING
  COMPLETED
  FAILED
  PAUSED
}

type Workflow {
  id: ID!
  name: String!
  description: String
  creator: User # Optimized with DataLoader
  steps: [WorkflowStep!] # Optimized with DataLoader
  status: WorkflowStatus! # Computed from statistics
  isActive: Boolean!
  executionCount: Int!
  lastExecutedAt: DateTime
  statistics: WorkflowStatistics
  createdAt: DateTime!
  updatedAt: DateTime!
}
```

## Resolvers Implemented

### Queries

| Query                | Description                           | Authentication |
| -------------------- | ------------------------------------- | -------------- |
| `me`                 | Get current user                      | Required       |
| `user(id)`           | Get user by ID                        | Required       |
| `users`              | Get all users (paginated)             | Required       |
| `agent(id)`          | Get agent by ID                       | Required       |
| `agents(userId?)`    | Get all agents, optionally by user    | Required       |
| `workflow(id)`       | Get workflow by ID                    | Required       |
| `workflows(userId?)` | Get all workflows, optionally by user | Required       |

### Mutations

| Mutation                 | Description           | Authentication |
| ------------------------ | --------------------- | -------------- |
| `createAgent(input)`     | Create new agent      | Required       |
| `updateAgent(input)`     | Update existing agent | Required       |
| `createWorkflow(input)`  | Create new workflow   | Required       |
| `executeWorkflow(input)` | Execute a workflow    | Required       |

## Query Examples

### Get Current User with Relations

```graphql
query {
  me {
    id
    username
    email
    fullName
    agents {
      id
      name
      status
      capabilities
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

### Get User's Agents

```graphql
query GetUserAgents($userId: ID!) {
  agents(userId: $userId) {
    id
    name
    type
    status
    capabilities
    lastActiveAt
    owner {
      username
      email
    }
  }
}
```

### Get Workflow with Steps

```graphql
query GetWorkflow($id: ID!) {
  workflow(id: $id) {
    id
    name
    description
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
      lastExecutionStatus
    }
    creator {
      username
      email
    }
  }
}
```

### Complex Nested Query

```graphql
query ComplexUserData($id: ID!) {
  user(id: $id) {
    username
    email
    fullName
    agents {
      name
      status
      capabilities
      lastActiveAt
    }
    workflows {
      name
      status
      executionCount
      lastExecutedAt
      steps {
        name
        type
        isActive
        agent {
          name
          status
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

## Mutation Examples

### Create Agent

```graphql
mutation CreateAgent {
  createAgent(
    input: {
      name: "Data Analysis Agent"
      type: "ANALYST"
      description: "Analyzes data and generates insights"
      capabilities: ["data-analysis", "visualization", "reporting"]
    }
  ) {
    id
    name
    status
    capabilities
    owner {
      username
    }
    createdAt
  }
}
```

### Update Agent

```graphql
mutation UpdateAgent {
  updateAgent(
    input: {
      id: "agent-uuid-here"
      name: "Updated Agent Name"
      description: "Updated description"
      capabilities: ["chat", "tasks", "code-gen"]
      isActive: true
    }
  ) {
    id
    name
    description
    status
    capabilities
    updatedAt
  }
}
```

### Create Workflow

```graphql
mutation CreateWorkflow {
  createWorkflow(
    input: {
      name: "Data Processing Pipeline"
      description: "Processes incoming data through multiple steps"
      variables: "{\"timeout\": 300, \"retries\": 3}"
    }
  ) {
    id
    name
    status
    creator {
      username
    }
    createdAt
  }
}
```

### Execute Workflow

```graphql
mutation ExecuteWorkflow {
  executeWorkflow(
    input: {
      workflowId: "workflow-uuid-here"
      variables: "{\"inputData\": \"sample-data\", \"options\": {\"async\": true}}"
      async: true
    }
  ) {
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

## DataLoader Performance Optimization

### N+1 Query Prevention

The implementation uses DataLoader to batch and cache database queries:

**Without DataLoader:**

```
User query with 10 agents:
- 1 query for user
- 10 queries for each agent's owner
= 11 total queries
```

**With DataLoader:**

```
User query with 10 agents:
- 1 query for user
- 1 batched query for all owners
= 2 total queries
```

### Implemented Loaders

1. **UserLoader** - Batches user lookups by ID
2. **AgentLoader** - Batches agent lookups by ID and by user ID
3. **WorkflowLoader** - Batches workflow and workflow step lookups

## Authentication

All GraphQL operations require JWT authentication:

```bash
# Include JWT token in Authorization header
curl -X POST http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{"query": "{ me { id username email } }"}'
```

In GraphQL Playground:

```json
{
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

## File Structure

```
<repo-root>/apps/api/src/graphql/
├── types/
│   ├── user.type.ts
│   ├── agent.type.ts
│   ├── workflow.type.ts
│   ├── workflow-step.type.ts
│   └── input.types.ts
├── resolvers/
│   ├── user.resolver.ts
│   ├── agent.resolver.ts
│   └── workflow.resolver.ts
├── loaders/
│   ├── user.loader.ts
│   ├── agent.loader.ts
│   └── workflow.loader.ts
├── guards/
│   └── gql-auth.guard.ts
├── graphql.module.ts
├── GRAPHQL_EXAMPLES.md
└── README.md
```

## How to Use

### 1. Start the Server

```bash
cd apps/api
pnpm install  # If dependencies not installed
pnpm dev
```

### 2. Access GraphQL Playground

Open in browser:

```
http://localhost:3000/graphql
```

### 3. Authenticate

1. Get JWT token from REST login endpoint
2. Add to HTTP Headers in Playground:

```json
{
  "Authorization": "Bearer YOUR_TOKEN"
}
```

### 4. Run Queries

Use the interactive editor with auto-completion and documentation

## Integration with REST APIs

GraphQL and REST APIs work together seamlessly:

- **Shared Infrastructure**: Same database, auth, security, logging
- **Independent Operation**: Use either or both
- **No Breaking Changes**: Existing REST endpoints unchanged
- **Client Flexibility**: Choose best API for each use case

## Configuration

### Development

- GraphQL Playground: ✅ Enabled
- Schema Introspection: ✅ Enabled
- Error Details: ✅ Full stack traces

### Production

- GraphQL Playground: ❌ Disabled
- Schema Introspection: ❌ Disabled
- Error Details: ⚠️ Safe error messages only

Controlled by `NODE_ENV` environment variable.

## Benefits

1. **Flexible Data Fetching** - Request exactly what you need
2. **Reduced Over-fetching** - No unnecessary data transfer
3. **Single Endpoint** - `/graphql` for all operations
4. **Strong Typing** - Full TypeScript support
5. **Performance** - DataLoader prevents N+1 queries
6. **Developer Experience** - Interactive playground and docs
7. **Backward Compatible** - REST APIs still work

## Next Steps

1. **Add More Types** - Expand schema for other entities
2. **Subscriptions** - Add real-time GraphQL subscriptions
3. **Query Complexity** - Implement query cost analysis
4. **Caching** - Add Redis caching for DataLoaders
5. **Monitoring** - Track GraphQL query performance
6. **Federation** - Enable schema federation for microservices

## Documentation Files

- **README.md** - Complete technical documentation
- **GRAPHQL_EXAMPLES.md** - Comprehensive query/mutation examples
- **This File** - Quick reference summary

## Support

For more examples and documentation:

- See `<repo-root>/apps/api/src/graphql/GRAPHQL_EXAMPLES.md`
- See `<repo-root>/apps/api/src/graphql/README.md`
- Use GraphQL Playground schema explorer (Docs tab)
