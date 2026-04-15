# Resource Registry

A comprehensive resource management system for The New Fuse that makes resources available to both AI agents and humans.

## Overview

The Resource Registry provides a centralized system for managing, discovering, and accessing various types of resources including:

- Claude Skills
- n8n Workflows
- Agent templates
- Code snippets
- Documentation
- Tools and utilities
- External integrations
- And more...

## Features

- **Full CRUD Operations**: Create, read, update, and delete resources
- **Advanced Search**: Filter by category, type, tags, keywords, visibility, and more
- **Version Tracking**: Maintain multiple versions of resources with changelog
- **Access Control**: Fine-grained permissions (public, agents-only, private, restricted, internal)
- **Tagging & Categorization**: Organize resources with tags and categories
- **Usage Analytics**: Track views, downloads, and favorites
- **MCP Integration**: Expose resources to AI agents via Model Context Protocol
- **REST API**: Complete REST API with Swagger documentation
- **Agent Discovery**: Make resources discoverable through agent registry

## Installation

```bash
npm install @the-new-fuse/resource-registry
# or
pnpm add @the-new-fuse/resource-registry
```

## Quick Start

### 1. Import the Module

```typescript
import { Module } from '@nestjs/common';
import { ResourceRegistryModule } from '@the-new-fuse/resource-registry';

@Module({
  imports: [ResourceRegistryModule],
})
export class AppModule {}
```

### 2. Use the Service

```typescript
import { Injectable } from '@nestjs/common';
import { ResourceRegistryService } from '@the-new-fuse/resource-registry';

@Injectable()
export class MyService {
  constructor(private resourceRegistry: ResourceRegistryService) {}

  async createResource() {
    const resource = await this.resourceRegistry.create({
      name: 'My First Resource',
      description: 'A sample resource',
      category: 'CODE_SNIPPET',
      type: 'TYPESCRIPT',
      content: { code: 'console.log("Hello World");' },
      tags: ['example', 'typescript'],
      version: '1.0.0',
      source: 'github.com/example/repo',
    });

    return resource;
  }

  async searchResources() {
    const results = await this.resourceRegistry.search({
      query: 'typescript',
      category: ['CODE_SNIPPET'],
      isVerified: true,
      page: 1,
      limit: 20,
    });

    return results;
  }
}
```

## API Endpoints

### Resources

- `POST /api/resources` - Create a new resource
- `GET /api/resources` - Search and list resources
- `GET /api/resources/:id` - Get a specific resource
- `PUT /api/resources/:id` - Update a resource
- `DELETE /api/resources/:id` - Delete a resource (soft delete)
- `GET /api/resources/categories` - List all categories
- `GET /api/resources/:id/versions` - Get all versions of a resource
- `GET /api/resources/:id/versions/:version` - Get a specific version
- `POST /api/resources/:id/download` - Download a resource (logs download count)

## Resource Categories

- `CLAUDE_SKILL` - Claude AI Skills
- `N8N_WORKFLOW` - n8n Workflow templates
- `AGENT_TEMPLATE` - Agent configuration templates
- `CODE_SNIPPET` - Reusable code snippets
- `DOCUMENTATION` - Documentation resources
- `TOOL` - Tools and utilities
- `INTEGRATION` - External integrations
- `WORKFLOW_TEMPLATE` - Generic workflow templates
- `API_ENDPOINT` - API endpoint definitions
- `DATABASE_SCHEMA` - Database schema definitions
- `UI_COMPONENT` - UI component templates
- `CONFIGURATION` - Configuration files
- `SCRIPT` - Automation scripts
- `PROMPT_TEMPLATE` - LLM prompt templates
- `DATA_SOURCE` - Data source connectors

## Resource Types

Code-based: `JAVASCRIPT`, `TYPESCRIPT`, `PYTHON`, `SHELL`, `SQL`

Configuration: `JSON`, `YAML`, `TOML`, `ENV`

Documentation: `MARKDOWN`, `HTML`, `PDF`

Workflows: `N8N_JSON`, `ZAPIER_JSON`, `MAKE_JSON`

Templates: `TEMPLATE`, `SNIPPET`

API: `OPENAPI`, `GRAPHQL`, `REST`

Other: `BINARY`, `ARCHIVE`, `CUSTOM`

## Visibility Levels

- `PUBLIC` - Available to everyone
- `AGENTS_ONLY` - Only AI agents can access
- `PRIVATE` - Only creator/owner can access
- `RESTRICTED` - Requires specific permissions
- `INTERNAL` - Internal use only

## MCP Integration

The Resource Registry is exposed via Model Context Protocol for AI agents:

```bash
# Start MCP server
node dist/mcp/resource-registry-mcp-server.js
```

Available MCP tools:
- `search_resources` - Search for resources
- `get_resource` - Get a specific resource
- `create_resource` - Create a new resource
- `update_resource` - Update a resource
- `list_categories` - List all categories
- `get_resource_versions` - Get resource versions

## Slash Command

Use `/resource-search` in Claude to search for resources:

```
/resource-search claude skills for data processing
/resource-search n8n workflows verified
/resource-search api integrations
```

## Database Schema

The package includes Drizzle schema for:
- `Resource` - Main resource table
- `ResourceVersion` - Version history
- `ResourceMetadata` - Extended metadata
- `ResourceAccessLog` - Access logging and analytics

Run migrations:

```bash
cd packages/resource-registry
npx drizzle migrate dev
```

## Access Control

The package includes a robust access control system:

```typescript
import { ResourceAccessControlService } from '@the-new-fuse/resource-registry';

const accessControl = new ResourceAccessControlService();

// Check if user can view resource
const canView = accessControl.canView(resource, {
  userId: 'user-123',
  isAgent: false,
  isAdmin: false,
});

// Assert access (throws if denied)
accessControl.assertCanView(resource, context);
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm build

# Run tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Lint
pnpm lint

# Format
pnpm format
```

## Example: Creating a Claude Skill Resource

```typescript
const claudeSkill = await resourceRegistry.create({
  name: 'Data Processing Skill',
  description: 'Process and analyze data with Claude',
  category: 'CLAUDE_SKILL',
  type: 'JSON',
  content: {
    skill: {
      name: 'data-processor',
      description: 'Process data efficiently',
      commands: ['process', 'analyze', 'transform'],
      configuration: {
        maxTokens: 4000,
        temperature: 0.7,
      },
    },
  },
  tags: ['data', 'processing', 'analysis'],
  keywords: ['data processing', 'analytics', 'claude'],
  version: '1.0.0',
  source: 'github.com/example/claude-skills',
  visibility: 'PUBLIC',
  isVerified: true,
  metadata: {
    qualityScore: 95,
    estimatedExecutionTime: 5000,
    platforms: ['linux', 'macos', 'windows'],
  },
});
```

## Example: Searching Resources

```typescript
// Search for verified TypeScript code snippets
const results = await resourceRegistry.search({
  query: 'authentication',
  category: ['CODE_SNIPPET'],
  type: ['TYPESCRIPT'],
  isVerified: true,
  tags: ['auth', 'security'],
  sortBy: 'downloadCount',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
});

console.log(`Found ${results.total} resources`);
results.data.forEach((resource) => {
  console.log(`- ${resource.name} (v${resource.version})`);
});
```

## Integration with Agent Registry

Resources are automatically discoverable by registered agents:

```typescript
import { AgentRegistration } from '@the-new-fuse/agent-coordination';

// Agents can query resources via the registry
const resources = await resourceRegistry.search({
  visibility: ['PUBLIC', 'AGENTS_ONLY'],
  category: ['CLAUDE_SKILL', 'AGENT_TEMPLATE'],
});
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

## Support

For issues and questions, please open an issue on GitHub.
