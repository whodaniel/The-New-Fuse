# Resource Registry Quick Start Guide

Get up and running with the Resource Registry in 5 minutes.

## Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm package manager

## Setup

### 1. Install Dependencies

```bash
cd packages/resource-registry
pnpm install
```

### 2. Configure Database

Set your database URL in `.env`:

```bash
DATABASE_URL="postgresql://user:password@localhost:5432/newfuse"
```

### 3. Run Migrations

```bash
pnpm db:migrate
```

### 4. Build the Package

```bash
pnpm build
```

## Basic Usage

### Creating a Resource

```typescript
import { ResourceRegistryService } from '@the-new-fuse/resource-registry';

const service = new ResourceRegistryService();

const resource = await service.create({
  name: 'My First Resource',
  description: 'A simple code snippet',
  category: 'CODE_SNIPPET',
  type: 'TYPESCRIPT',
  content: {
    code: 'console.log("Hello, World!");',
  },
  tags: ['example', 'hello-world'],
  version: '1.0.0',
  source: 'local',
});

console.log('Created resource:', resource.id);
```

### Searching Resources

```typescript
const results = await service.search({
  category: ['CODE_SNIPPET'],
  tags: ['example'],
  page: 1,
  limit: 10,
});

console.log(`Found ${results.total} resources`);
results.data.forEach(r => console.log(`- ${r.name}`));
```

### Getting a Resource

```typescript
const resource = await service.findById(resourceId);
console.log(resource);
```

### Updating a Resource

```typescript
await service.update(resourceId, {
  description: 'Updated description',
  tags: ['example', 'hello-world', 'updated'],
});
```

## Using the API

Start your NestJS application with the ResourceRegistryModule imported.

### Create a Resource via API

```bash
curl -X POST http://localhost:3000/api/resources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Resource",
    "category": "CODE_SNIPPET",
    "type": "TYPESCRIPT",
    "content": {"code": "test"},
    "version": "1.0.0",
    "source": "test"
  }'
```

### Search Resources via API

```bash
curl "http://localhost:3000/api/resources?category=CODE_SNIPPET&limit=10"
```

### Get Resource by ID

```bash
curl http://localhost:3000/api/resources/{resourceId}
```

## Using with MCP

### 1. Build the Package

```bash
cd packages/resource-registry
pnpm build
```

### 2. Start MCP Server

```bash
node dist/mcp/resource-registry-mcp-server.js
```

### 3. Use from Claude

The MCP server exposes these tools:
- `search_resources`
- `get_resource`
- `create_resource`
- `update_resource`
- `list_categories`
- `get_resource_versions`

## Using the Slash Command

In Claude, use the `/resource-search` command:

```
/resource-search claude skills
/resource-search typescript code snippets
/resource-search verified n8n workflows
```

## Common Patterns

### Creating a Claude Skill

```typescript
const skill = await service.create({
  name: 'Data Processor',
  description: 'Process and analyze data',
  category: 'CLAUDE_SKILL',
  type: 'JSON',
  content: {
    skill: {
      name: 'data-processor',
      commands: ['process', 'analyze'],
    },
  },
  tags: ['data', 'processing'],
  version: '1.0.0',
  source: 'github.com/example/skills',
  visibility: 'PUBLIC',
});
```

### Creating an n8n Workflow

```typescript
const workflow = await service.create({
  name: 'Email Automation',
  description: 'Automate email processing',
  category: 'N8N_WORKFLOW',
  type: 'N8N_JSON',
  content: {
    nodes: [/* workflow nodes */],
    connections: {/* workflow connections */},
  },
  tags: ['email', 'automation'],
  version: '1.0.0',
  source: 'n8n.io',
});
```

### Searching with Filters

```typescript
// Find verified TypeScript snippets
const snippets = await service.search({
  category: ['CODE_SNIPPET'],
  type: ['TYPESCRIPT'],
  isVerified: true,
  sortBy: 'downloadCount',
  sortOrder: 'desc',
});

// Find resources by tags
const authResources = await service.search({
  tags: ['authentication', 'security'],
  visibility: ['PUBLIC'],
});

// Find recent resources
const recent = await service.search({
  sortBy: 'createdAt',
  sortOrder: 'desc',
  limit: 20,
});
```

## Access Control

### Public Resource (anyone can access)

```typescript
await service.create({
  name: 'Public Resource',
  category: 'CODE_SNIPPET',
  type: 'TYPESCRIPT',
  content: {code: 'test'},
  version: '1.0.0',
  source: 'test',
  visibility: 'PUBLIC', // Default
});
```

### Agents-Only Resource

```typescript
await service.create({
  name: 'Agent Resource',
  category: 'AGENT_TEMPLATE',
  type: 'JSON',
  content: {template: {}},
  version: '1.0.0',
  source: 'test',
  visibility: 'AGENTS_ONLY', // Only AI agents can access
});
```

### Private Resource

```typescript
await service.create({
  name: 'Private Resource',
  category: 'CODE_SNIPPET',
  type: 'TYPESCRIPT',
  content: {code: 'secret'},
  version: '1.0.0',
  source: 'test',
  visibility: 'PRIVATE', // Only creator can access
  authorId: 'user-123',
});
```

## Next Steps

- Read the [API Documentation](./API.md) for detailed endpoint information
- Check out [Examples](../README.md) for more use cases
- See [Integration Guide](./INTEGRATION.md) for advanced integration patterns
- Review the [README](../README.md) for comprehensive information

## Troubleshooting

### Database Connection Failed

Ensure PostgreSQL is running and `DATABASE_URL` is correct:

```bash
psql $DATABASE_URL
```

### Migration Issues

Reset and re-run migrations:

```bash
npx drizzle migrate reset
npx drizzle migrate dev
```

### TypeScript Errors

Regenerate Drizzle client:

```bash
pnpm db:generate
```

### MCP Server Not Starting

Build the package first:

```bash
pnpm build
```

## Get Help

- [GitHub Issues](https://github.com/the-new-fuse/the-new-fuse/issues)
- [API Documentation](./API.md)
- [Examples](../README.md)
