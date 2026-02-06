# @the-new-fuse/n8n-workflows

N8N workflow integration system for The New Fuse - fetches, categorizes, and
manages thousands of community n8n workflows.

## Features

- 🚀 **Automated Fetching**: Automatically fetch workflows from 3 major GitHub
  repositories
- 🏷️ **Smart Categorization**: AI-powered categorization into 14+ categories
- 🔍 **Advanced Search**: Full-text search with filtering
- 🌐 **REST API**: Complete REST API integration
- 📦 **Import to N8N**: Direct workflow import to n8n instances
- 💾 **Persistent Storage**: Local caching and registry
- 🎯 **High Performance**: Optimized for thousands of workflows

## Data Sources

1. **Zie619/n8n-workflows** - Thousands of community workflows
2. **enescingoz/awesome-n8n-templates** - Curated templates
3. **Danitilahun/n8n-workflow-templates** - Professional templates

## Installation

```bash
pnpm add @the-new-fuse/n8n-workflows
```

## Quick Start

```typescript
import { WorkflowService } from '@the-new-fuse/n8n-workflows';

// Initialize
const service = new WorkflowService({
  enablePersistence: true,
});

await service.initialize();

// Sync workflows
const result = await service.syncWorkflows();
console.log(`Synced ${result.totalWorkflows} workflows`);

// Search
const searchResult = await service.search({
  query: 'AI automation',
  category: 'ai-agents',
  limit: 10,
});

// Get workflow
const workflow = await service.getWorkflow('workflow-id');

// Import to n8n
await service.importToN8n({
  workflowId: 'workflow-id',
  n8nInstanceUrl: 'https://n8n.example.com',
  apiKey: 'your-api-key',
});
```

## Categories

- AI & Agent Automation
- API Integrations
- Automation Workflows
- Data Processing
- Database Operations
- File Management
- Notifications
- Webhooks
- CRM & Sales
- Email Automation
- Social Media
- Analytics & Reporting
- DevOps & CI/CD
- Security & Monitoring

## CLI Scripts

### Fetch Workflows

```bash
pnpm run fetch:workflows
```

### Sync Service

```bash
pnpm run sync:workflows
```

## API Reference

See [/docs/N8N_WORKFLOWS.md](/docs/N8N_WORKFLOWS.md) for complete API
documentation.

## Architecture

```
src/
├── types/          # TypeScript types
├── fetcher/        # GitHub repository fetching
├── parser/         # Workflow JSON parsing
├── categorizer/    # Workflow categorization
├── registry/       # Registry management
├── services/       # High-level services
└── scripts/        # CLI scripts
```

## Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Watch mode
pnpm run dev

# Type check
pnpm run type-check

# Lint
pnpm run lint

# Format
pnpm run format
```

## License

MIT
