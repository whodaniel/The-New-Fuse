# Resource Registry Examples

This document provides practical examples of using the Resource Registry.

## Table of Contents

- [Creating Resources](#creating-resources)
- [Searching Resources](#searching-resources)
- [Managing Versions](#managing-versions)
- [Access Control](#access-control)
- [Integration Examples](#integration-examples)

## Creating Resources

### Example 1: Claude Skill

```typescript
import { ResourceRegistryService } from '@the-new-fuse/resource-registry';

const resourceRegistry = new ResourceRegistryService();

const claudeSkill = await resourceRegistry.create({
  name: 'Code Review Assistant',
  description: 'Automated code review with best practices',
  category: 'CLAUDE_SKILL',
  type: 'JSON',
  content: {
    skill: {
      name: 'code-reviewer',
      description: 'Review code for quality and security',
      commands: ['review', 'suggest', 'optimize'],
      configuration: {
        maxTokens: 8000,
        temperature: 0.3,
        models: ['claude-sonnet-4-5'],
      },
      prompts: {
        review:
          'Review this code for:\n- Best practices\n- Security issues\n- Performance concerns',
        suggest: 'Suggest improvements for this code',
      },
    },
  },
  tags: ['code-review', 'quality', 'security', 'best-practices'],
  keywords: ['code review', 'static analysis', 'claude'],
  version: '1.0.0',
  source: 'github.com/example/code-review-skill',
  visibility: 'PUBLIC',
  isVerified: true,
  metadata: {
    qualityScore: 98,
    estimatedExecutionTime: 10000,
    platforms: ['linux', 'macos', 'windows'],
    requiredDependencies: [],
    optionalDependencies: ['eslint', 'prettier'],
  },
});

console.log('Created skill:', claudeSkill.id);
```

### Example 2: n8n Workflow

```typescript
const n8nWorkflow = await resourceRegistry.create({
  name: 'Email to Slack Notifier',
  description: 'Forward important emails to Slack channels',
  category: 'N8N_WORKFLOW',
  type: 'N8N_JSON',
  content: {
    nodes: [
      {
        name: 'Email Trigger',
        type: 'n8n-nodes-base.emailReadImap',
        parameters: {
          mailbox: 'INBOX',
        },
      },
      {
        name: 'Filter Important',
        type: 'n8n-nodes-base.filter',
        parameters: {
          conditions: {
            string: [
              {
                value1: '={{$json["subject"]}}',
                operation: 'contains',
                value2: 'IMPORTANT',
              },
            ],
          },
        },
      },
      {
        name: 'Send to Slack',
        type: 'n8n-nodes-base.slack',
        parameters: {
          channel: '#notifications',
          text: '={{$json["subject"]}}',
        },
      },
    ],
    connections: {
      'Email Trigger': {
        main: [[{ node: 'Filter Important', type: 'main', index: 0 }]],
      },
      'Filter Important': {
        main: [[{ node: 'Send to Slack', type: 'main', index: 0 }]],
      },
    },
  },
  tags: ['email', 'slack', 'notifications', 'automation'],
  keywords: ['email notifications', 'slack integration'],
  version: '1.0.0',
  source: 'n8n.io/workflows/email-slack',
  visibility: 'PUBLIC',
  license: 'MIT',
});
```

### Example 3: Code Snippet

```typescript
const codeSnippet = await resourceRegistry.create({
  name: 'TypeScript Authentication Helper',
  description: 'JWT authentication utilities for TypeScript',
  category: 'CODE_SNIPPET',
  type: 'TYPESCRIPT',
  content: {
    language: 'typescript',
    code: `import jwt from 'jsonwebtoken';

export class AuthHelper {
  static generateToken(payload: any, secret: string, expiresIn: string = '24h'): string {
    return jwt.sign(payload, secret, { expiresIn });
  }

  static verifyToken(token: string, secret: string): any {
    try {
      return jwt.verify(token, secret);
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  static decodeToken(token: string): any {
    return jwt.decode(token);
  }
}`,
    dependencies: ['jsonwebtoken', '@types/jsonwebtoken'],
  },
  tags: ['typescript', 'authentication', 'jwt', 'security'],
  keywords: ['auth', 'jwt', 'token'],
  version: '1.0.0',
  source: 'github.com/example/ts-auth',
  visibility: 'PUBLIC',
  license: 'MIT',
});
```

### Example 4: Agent Template

```typescript
const agentTemplate = await resourceRegistry.create({
  name: 'Data Analysis Agent',
  description: 'Template for data analysis agents',
  category: 'AGENT_TEMPLATE',
  type: 'JSON',
  content: {
    template: {
      name: 'data-analyst-agent',
      type: 'ANALYSIS',
      capabilities: ['CODE_EXECUTION', 'ANALYSIS', 'RESEARCH'],
      systemPrompt: `You are a data analysis expert. Your role is to:
- Analyze datasets and identify patterns
- Generate insights and visualizations
- Provide statistical analysis
- Make data-driven recommendations`,
      config: {
        model: 'claude-sonnet-4-5',
        maxTokens: 8000,
        temperature: 0.5,
      },
      tools: ['python-executor', 'sql-query', 'chart-generator'],
    },
  },
  tags: ['agent-template', 'data-analysis', 'analytics'],
  keywords: ['data science', 'analytics', 'agent'],
  version: '1.0.0',
  source: 'github.com/example/agent-templates',
  visibility: 'PUBLIC',
});
```

## Searching Resources

### Example 1: Basic Search

```typescript
// Search for all Claude skills
const results = await resourceRegistry.search({
  category: ['CLAUDE_SKILL'],
  page: 1,
  limit: 20,
});

console.log(`Found ${results.total} Claude skills`);
results.data.forEach((resource) => {
  console.log(`- ${resource.name} (v${resource.version})`);
});
```

### Example 2: Advanced Search with Filters

```typescript
// Search for verified TypeScript code snippets related to authentication
const results = await resourceRegistry.search({
  query: 'authentication',
  category: ['CODE_SNIPPET'],
  type: ['TYPESCRIPT'],
  tags: ['auth', 'security'],
  isVerified: true,
  sortBy: 'downloadCount',
  sortOrder: 'desc',
  page: 1,
  limit: 10,
});

for (const resource of results.data) {
  console.log(`${resource.name}`);
  console.log(`  Downloads: ${resource.downloadCount}`);
  console.log(`  Tags: ${resource.tags.join(', ')}`);
}
```

### Example 3: Search by Date Range

```typescript
// Find resources created in the last 7 days
const sevenDaysAgo = new Date();
sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

const recentResources = await resourceRegistry.search({
  createdAfter: sevenDaysAgo.toISOString(),
  sortBy: 'createdAt',
  sortOrder: 'desc',
  limit: 50,
});

console.log(`${recentResources.total} resources created in the last 7 days`);
```

### Example 4: Agent-Only Resources

```typescript
// Search for resources accessible only to agents
const agentResources = await resourceRegistry.search({
  visibility: ['AGENTS_ONLY'],
  category: ['AGENT_TEMPLATE', 'CLAUDE_SKILL'],
  isVerified: true,
});

console.log(`${agentResources.total} agent-only resources found`);
```

## Managing Versions

### Example 1: Create New Version

```typescript
// Update resource with new version
const updatedResource = await resourceRegistry.update(resourceId, {
  version: '1.1.0',
  content: {
    // Updated content
    skill: {
      name: 'code-reviewer',
      commands: ['review', 'suggest', 'optimize', 'fix'], // Added 'fix'
    },
  },
});

console.log(`Updated to version ${updatedResource.version}`);
```

### Example 2: List All Versions

```typescript
const versions = await resourceRegistry.getVersions(resourceId);

console.log('Version history:');
versions.forEach((version) => {
  console.log(`v${version.version} - ${version.createdAt}`);
  if (version.changelog) {
    console.log(`  ${version.changelog}`);
  }
});
```

### Example 3: Get Specific Version

```typescript
// Get version 1.0.0 of a resource
const v1 = await resourceRegistry.getVersion(resourceId, '1.0.0');

console.log('Version 1.0.0 content:', v1.content);
```

## Access Control

### Example 1: Check View Permission

```typescript
import { ResourceAccessControlService } from '@the-new-fuse/resource-registry';

const accessControl = new ResourceAccessControlService();

const resource = await resourceRegistry.findById(resourceId);

const userContext = {
  userId: 'user-123',
  isAgent: false,
  isAdmin: false,
};

if (accessControl.canView(resource, userContext)) {
  console.log('User can view this resource');
} else {
  console.log('Access denied');
}
```

### Example 2: Filter Resources by Access

```typescript
const allResources = await resourceRegistry.search({
  category: ['CODE_SNIPPET'],
  limit: 100,
});

const agentContext = {
  agentId: 'agent-456',
  isAgent: true,
  isAdmin: false,
};

const accessibleResources = accessControl.filterByAccess(
  allResources.data,
  agentContext
);

console.log(
  `Agent can access ${accessibleResources.length} out of ${allResources.total} resources`
);
```

### Example 3: Assert Permissions

```typescript
try {
  const resource = await resourceRegistry.findById(resourceId);

  accessControl.assertCanModify(resource, {
    userId: 'user-123',
    isAgent: false,
    isAdmin: false,
  });

  // If we get here, user has permission
  await resourceRegistry.update(resourceId, {
    description: 'Updated description',
  });
} catch (error) {
  console.error('Permission denied:', error.message);
}
```

## Integration Examples

### Example 1: Using with Agent Registry

```typescript
import { ResourceRegistryService } from '@the-new-fuse/resource-registry';
import { AgentRegistration } from '@the-new-fuse/agent-coordination';

async function provisionAgentWithResources(agentId: string) {
  const resourceRegistry = new ResourceRegistryService();

  // Find relevant resources for the agent
  const resources = await resourceRegistry.search({
    category: ['AGENT_TEMPLATE', 'CLAUDE_SKILL'],
    visibility: ['PUBLIC', 'AGENTS_ONLY'],
    isVerified: true,
  });

  // Assign resources to agent
  for (const resource of resources.data) {
    console.log(`Provisioning ${resource.name} for agent ${agentId}`);
    await resourceRegistry.logAccess(resource.id, 'VIEW', agentId, 'agent');
  }

  return resources.data;
}
```

### Example 2: MCP Integration

```typescript
import { ResourceRegistryMCPServer } from '@the-new-fuse/resource-registry/mcp';

// Start MCP server
const mcpServer = new ResourceRegistryMCPServer();
await mcpServer.start();

// Now AI agents can access resources via MCP tools:
// - search_resources
// - get_resource
// - create_resource
// - etc.
```

### Example 3: Batch Import Resources

```typescript
async function importResourcesFromGitHub(repoUrl: string) {
  const resourceRegistry = new ResourceRegistryService();

  // Fetch resources from GitHub (example)
  const resourceFiles = [
    { name: 'skill-1.json', category: 'CLAUDE_SKILL' },
    { name: 'skill-2.json', category: 'CLAUDE_SKILL' },
  ];

  const imported = [];

  for (const file of resourceFiles) {
    const content = await fetchFromGitHub(`${repoUrl}/${file.name}`);

    const resource = await resourceRegistry.create({
      name: file.name.replace('.json', ''),
      category: file.category,
      type: 'JSON',
      content: JSON.parse(content),
      version: '1.0.0',
      source: `${repoUrl}/${file.name}`,
      visibility: 'PUBLIC',
    });

    imported.push(resource);
  }

  console.log(`Imported ${imported.length} resources`);
  return imported;
}
```

### Example 4: Analytics Dashboard

```typescript
async function getResourceAnalytics() {
  const resourceRegistry = new ResourceRegistryService();

  // Get top downloaded resources
  const topDownloaded = await resourceRegistry.search({
    sortBy: 'downloadCount',
    sortOrder: 'desc',
    limit: 10,
  });

  // Get top used resources
  const topUsed = await resourceRegistry.search({
    sortBy: 'usageCount',
    sortOrder: 'desc',
    limit: 10,
  });

  // Get featured resources
  const featured = await resourceRegistry.search({
    isFeatured: true,
  });

  return {
    topDownloaded: topDownloaded.data,
    topUsed: topUsed.data,
    featured: featured.data,
    totalResources: topDownloaded.total,
  };
}
```

## Best Practices

1. **Use semantic versioning**: Always use proper semantic versions (e.g.,
   1.0.0, 1.1.0, 2.0.0)
2. **Add meaningful tags**: Use descriptive tags to make resources discoverable
3. **Include documentation**: Add comprehensive descriptions and usage examples
4. **Set appropriate visibility**: Choose the right visibility level for your
   resources
5. **Track dependencies**: List all dependencies in metadata
6. **Version your content**: Create new versions for significant changes
7. **Use access control**: Leverage the access control system to protect
   sensitive resources
8. **Log usage**: Track resource usage for analytics and improvements
