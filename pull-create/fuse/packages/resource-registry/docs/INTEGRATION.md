# Resource Registry Integration Guide

This guide explains how to integrate the Resource Registry into The New Fuse ecosystem.

## Table of Contents

- [Backend Integration](#backend-integration)
- [Frontend Integration](#frontend-integration)
- [MCP Integration](#mcp-integration)
- [Agent Integration](#agent-integration)
- [Database Setup](#database-setup)
- [Environment Configuration](#environment-configuration)

## Backend Integration

### 1. Install the Package

```bash
pnpm add @the-new-fuse/resource-registry
```

### 2. Import the Module

In your main application module (e.g., `apps/api/src/app.module.ts`):

```typescript
import { Module } from '@nestjs/common';
import { ResourceRegistryModule } from '@the-new-fuse/resource-registry';

@Module({
  imports: [
    ResourceRegistryModule,
    // ... other modules
  ],
})
export class AppModule {}
```

### 3. Use the Services

Inject the services into your own services or controllers:

```typescript
import { Injectable } from '@nestjs/common';
import { ResourceRegistryService } from '@the-new-fuse/resource-registry';

@Injectable()
export class YourService {
  constructor(private resourceRegistry: ResourceRegistryService) {}

  async listSkills() {
    return this.resourceRegistry.search({
      category: ['CLAUDE_SKILL'],
      isVerified: true,
    });
  }
}
```

## Frontend Integration

### 1. API Client Setup

Create a resource registry API client:

```typescript
// src/services/resource-registry-api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ResourceRegistryAPI {
  private client = axios.create({
    baseURL: `${API_BASE_URL}/api/resources`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  async search(params: any) {
    const response = await this.client.get('/', { params });
    return response.data;
  }

  async getById(id: string) {
    const response = await this.client.get(`/${id}`);
    return response.data;
  }

  async create(data: any) {
    const response = await this.client.post('/', data);
    return response.data;
  }

  async update(id: string, data: any) {
    const response = await this.client.put(`/${id}`, data);
    return response.data;
  }

  async delete(id: string) {
    await this.client.delete(`/${id}`);
  }

  async getCategories() {
    const response = await this.client.get('/categories');
    return response.data;
  }
}

export const resourceRegistryAPI = new ResourceRegistryAPI();
```

### 2. React Component Example

```typescript
import { useState, useEffect } from 'react';
import { resourceRegistryAPI } from '@/services/resource-registry-api';

export function ResourceList() {
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchResources() {
      try {
        const result = await resourceRegistryAPI.search({
          category: ['CLAUDE_SKILL', 'CODE_SNIPPET'],
          isVerified: true,
          page: 1,
          limit: 20,
        });
        setResources(result.data);
      } catch (error) {
        console.error('Failed to fetch resources:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchResources();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Resources</h2>
      <ul>
        {resources.map((resource) => (
          <li key={resource.id}>
            <h3>{resource.name}</h3>
            <p>{resource.description}</p>
            <span>Category: {resource.category}</span>
            <span>Version: {resource.version}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## MCP Integration

### 1. Configure MCP Server

Add to `.mcp.json`:

```json
{
  "mcpServers": {
    "resource-registry": {
      "command": "node",
      "args": ["packages/resource-registry/dist/mcp/resource-registry-mcp-server.js"],
      "env": {
        "DATABASE_URL": "${DATABASE_URL}"
      }
    }
  }
}
```

### 2. Start MCP Server

```bash
# Build the package first
cd packages/resource-registry
pnpm build

# Start the MCP server
node dist/mcp/resource-registry-mcp-server.js
```

### 3. Use from Claude or AI Agents

Once the MCP server is running, AI agents can access resources using these tools:

- `search_resources` - Search for resources
- `get_resource` - Get a specific resource
- `create_resource` - Create a new resource
- `update_resource` - Update a resource
- `list_categories` - List all categories
- `get_resource_versions` - Get resource versions

## Agent Integration

### 1. Register Agent with Resources

```typescript
import { ResourceRegistryService } from '@the-new-fuse/resource-registry';
import { AgentRegistration } from '@the-new-fuse/agent-coordination';

async function setupAgentResources(agentId: string) {
  const resourceRegistry = new ResourceRegistryService();

  // Find resources for this agent
  const agentResources = await resourceRegistry.search({
    category: ['AGENT_TEMPLATE', 'CLAUDE_SKILL'],
    visibility: ['PUBLIC', 'AGENTS_ONLY'],
    isVerified: true,
  });

  // Log access for each resource
  for (const resource of agentResources.data) {
    await resourceRegistry.logAccess(
      resource.id,
      'VIEW',
      agentId,
      'agent'
    );
  }

  return agentResources.data;
}
```

### 2. Provision Agent with Skills

```typescript
async function provisionAgentSkills(agentId: string) {
  const resourceRegistry = new ResourceRegistryService();

  const skills = await resourceRegistry.search({
    category: ['CLAUDE_SKILL'],
    visibility: ['PUBLIC', 'AGENTS_ONLY'],
    isVerified: true,
  });

  // Install skills for the agent
  const installedSkills = [];

  for (const skill of skills.data) {
    // Download and install the skill
    const skillContent = skill.content;

    installedSkills.push({
      resourceId: skill.id,
      name: skill.name,
      version: skill.version,
      content: skillContent,
    });

    // Log download
    await resourceRegistry.logAccess(
      skill.id,
      'DOWNLOAD',
      agentId,
      'agent'
    );
  }

  return installedSkills;
}
```

## Database Setup

### 1. Run Drizzle Migrations

```bash
# Generate Drizzle client
pnpm db:generate

# Run migrations
npx drizzle migrate dev --name add-resource-registry

# Or use the package-specific commands
cd packages/resource-registry
pnpm db:migrate
```

### 2. Seed Database (Optional)

Create a seed file:

```typescript
// packages/resource-registry/drizzle/seed.ts
import { DrizzleClient } from '@drizzle/client';

const drizzle = new DrizzleClient();

async function main() {
  // Seed example resources
  await drizzle.resource.createMany({
    data: [
      {
        name: 'Code Review Skill',
        description: 'Automated code review',
        category: 'CLAUDE_SKILL',
        type: 'JSON',
        content: { /* skill data */ },
        version: '1.0.0',
        source: 'github.com/example/skills',
        visibility: 'PUBLIC',
        isVerified: true,
      },
      // Add more seed data...
    ],
  });
}

main()
  .catch(console.error)
  .finally(() => drizzle.$disconnect());
```

Run the seed:

```bash
npx drizzle db seed
```

## Environment Configuration

### Required Environment Variables

Add to your `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/newfuse"

# Resource Registry (optional)
RESOURCE_REGISTRY_ENABLE_VERSIONING=true
RESOURCE_REGISTRY_MAX_UPLOAD_SIZE=10485760  # 10MB
RESOURCE_REGISTRY_ALLOW_PUBLIC_CREATE=false
```

### Configuration Options

Create a configuration file:

```typescript
// config/resource-registry.config.ts
export default {
  versioning: {
    enabled: process.env.RESOURCE_REGISTRY_ENABLE_VERSIONING === 'true',
    maxVersions: 10,
  },
  upload: {
    maxSize: parseInt(process.env.RESOURCE_REGISTRY_MAX_UPLOAD_SIZE || '10485760'),
    allowedTypes: ['JSON', 'YAML', 'MARKDOWN', 'TYPESCRIPT', 'JAVASCRIPT'],
  },
  access: {
    allowPublicCreate: process.env.RESOURCE_REGISTRY_ALLOW_PUBLIC_CREATE === 'true',
    defaultVisibility: 'PUBLIC',
  },
  search: {
    maxResults: 100,
    defaultLimit: 20,
  },
};
```

## Testing Integration

### 1. Integration Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ResourceRegistryModule, ResourceRegistryService } from '@the-new-fuse/resource-registry';

describe('Resource Registry Integration', () => {
  let service: ResourceRegistryService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ResourceRegistryModule],
    }).compile();

    service = module.get<ResourceRegistryService>(ResourceRegistryService);
  });

  it('should create and retrieve a resource', async () => {
    const resource = await service.create({
      name: 'Test Resource',
      category: 'CODE_SNIPPET',
      type: 'TYPESCRIPT',
      content: { code: 'test' },
      version: '1.0.0',
      source: 'test',
    });

    expect(resource).toBeDefined();
    expect(resource.id).toBeDefined();

    const retrieved = await service.findById(resource.id);
    expect(retrieved.name).toBe('Test Resource');

    // Cleanup
    await service.delete(resource.id);
  });
});
```

## Monitoring and Logging

### 1. Access Logs

Query access logs:

```typescript
import { DrizzleClient } from '@drizzle/client';

const drizzle = new DrizzleClient();

// Get most accessed resources
const topResources = await drizzle.resource.findMany({
  orderBy: { usageCount: 'desc' },
  take: 10,
});

// Get recent access logs
const recentAccess = await drizzle.resourceAccessLog.findMany({
  orderBy: { timestamp: 'desc' },
  take: 100,
  include: { resource: true },
});
```

### 2. Analytics Dashboard

```typescript
async function getResourceAnalytics() {
  const drizzle = new DrizzleClient();

  const [totalResources, byCategory, topDownloaded] = await Promise.all([
    drizzle.resource.count(),
    drizzle.resource.groupBy({
      by: ['category'],
      _count: true,
    }),
    drizzle.resource.findMany({
      orderBy: { downloadCount: 'desc' },
      take: 10,
    }),
  ]);

  return {
    total: totalResources,
    byCategory,
    topDownloaded,
  };
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Verify `DATABASE_URL` is set correctly
   - Ensure database is running
   - Run migrations: `pnpm db:migrate`

2. **MCP Server Not Starting**
   - Build the package first: `pnpm build`
   - Check MCP configuration in `.mcp.json`
   - Verify environment variables are set

3. **Access Control Issues**
   - Check resource visibility settings
   - Verify user/agent authentication
   - Review access logs for denied requests

4. **Search Not Working**
   - Ensure full-text search is enabled in PostgreSQL
   - Check searchable text is being generated
   - Verify indexes are created

For more help, see the [API Documentation](./API.md) and [Examples](./EXAMPLES.md).
