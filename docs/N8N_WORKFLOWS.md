# N8N Workflows Integration

Comprehensive integration of n8n workflow collections from community repositories into The New Fuse.

## Overview

The N8N Workflows package provides a complete system for fetching, categorizing, searching, and managing n8n workflows from community repositories. It includes thousands of pre-built workflows covering automation, AI, integrations, and more.

## Features

- **Automated Workflow Fetching**: Automatically fetch workflows from 3 major community repositories
- **Smart Categorization**: AI-powered categorization into 14+ categories
- **Advanced Search**: Full-text search with filtering by category, tags, complexity
- **REST API**: Complete REST API for workflow operations
- **Workflow Import**: Direct import to n8n instances
- **Persistent Storage**: Local caching and registry management
- **Slash Commands**: Quick workflow discovery via `/n8n-workflow-search`

## Data Sources

The system fetches workflows from three major community repositories:

1. **Zie619/n8n-workflows** - Thousands of community workflows
2. **enescingoz/awesome-n8n-templates** - Curated, high-quality templates
3. **Danitilahun/n8n-workflow-templates** - Professional workflow templates

## Workflow Categories

Workflows are automatically categorized into the following categories:

### Priority Categories

1. **AI & Agent Automation** (`ai-agents`)
   - AI models, LLMs, ChatGPT, Claude
   - Agent automation workflows
   - Langchain integrations
   - Vector databases

2. **API Integrations** (`api-integrations`)
   - Gmail, Slack, Discord
   - GitHub, GitLab, Jira
   - Google Drive, Dropbox
   - REST APIs, GraphQL

3. **Automation Workflows** (`automation`)
   - Scheduled tasks
   - Trigger-based automation
   - Workflow pipelines
   - Process automation

4. **Data Processing** (`data-processing`)
   - ETL workflows
   - Data transformation
   - CSV/JSON processing
   - Data cleaning

### Additional Categories

5. **Database Operations** (`database-operations`)
6. **File Management** (`file-management`)
7. **Notifications** (`notifications`)
8. **Webhook Handlers** (`webhooks`)
9. **CRM & Sales** (`crm`)
10. **Email Automation** (`email`)
11. **Social Media** (`social-media`)
12. **Analytics & Reporting** (`analytics`)
13. **DevOps & CI/CD** (`DevOps`)
14. **Security & Monitoring** (`security`)

## Package Structure

```
packages/n8n-workflows/
├── src/
│   ├── types/              # TypeScript type definitions
│   │   └── index.ts        # Workflow types and interfaces
│   ├── fetcher/            # Workflow fetching from GitHub
│   │   └── WorkflowFetcher.ts
│   ├── parser/             # Workflow JSON parsing
│   │   └── WorkflowParser.ts
│   ├── categorizer/        # Workflow categorization
│   │   └── WorkflowCategorizer.ts
│   ├── registry/           # Workflow registry management
│   │   └── WorkflowRegistry.ts
│   ├── services/           # High-level services
│   │   └── WorkflowService.ts
│   ├── scripts/            # CLI scripts
│   │   ├── fetch-workflows.ts
│   │   └── sync-workflows.ts
│   └── index.ts            # Main exports
├── package.json
├── tsconfig.json
└── README.md
```

## REST API Endpoints

### Get All Workflows

```http
GET /api/workflows/n8n
```

Query Parameters:
- `query`: Search query string
- `category`: Filter by category
- `source`: Filter by source repository
- `tags`: Filter by tags (comma-separated)
- `complexity`: Filter by complexity (simple, medium, complex)
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)

**Example:**
```bash
curl "http://localhost:3000/api/workflows/n8n?category=ai-agents&limit=10"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflows": [...],
    "total": 1234,
    "limit": 10,
    "offset": 0,
    "categories": {
      "ai-agents": 150,
      "automation": 300,
      ...
    }
  }
}
```

### Get Workflow by ID

```http
GET /api/workflows/n8n/:id
```

**Example:**
```bash
curl "http://localhost:3000/api/workflows/n8n/workflow-abc123"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "workflow-abc123",
    "name": "AI Content Generator",
    "description": "Generate content using OpenAI GPT-4",
    "category": "ai-agents",
    "nodes": [...],
    "triggers": [...],
    "tags": ["ai", "openai", "content"],
    "source": "Zie619/n8n-workflows",
    ...
  }
}
```

### Get Categories

```http
GET /api/workflows/n8n/categories
```

**Response:**
```json
{
  "success": true,
  "data": {
    "categories": [
      {
        "name": "ai-agents",
        "displayName": "AI & Agent Automation",
        "description": "Workflows involving AI models...",
        "count": 150
      },
      ...
    ]
  }
}
```

### Get Statistics

```http
GET /api/workflows/n8n/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWorkflows": 1234,
    "byCategory": {
      "ai-agents": 150,
      "automation": 300,
      ...
    },
    "bySource": {
      "Zie619/n8n-workflows": 800,
      "enescingoz/awesome-n8n-templates": 234,
      "Danitilahun/n8n-workflow-templates": 200
    },
    "byComplexity": {
      "simple": 400,
      "medium": 600,
      "complex": 234
    },
    "mostPopularTags": [
      { "tag": "automation", "count": 500 },
      { "tag": "api", "count": 400 },
      ...
    ],
    "lastSync": "2025-11-18T10:00:00.000Z"
  }
}
```

### Search Workflows

```http
GET /api/workflows/n8n/search?q=<query>
```

**Example:**
```bash
curl "http://localhost:3000/api/workflows/n8n/search?q=slack+notification"
```

### Get Workflows by Category

```http
GET /api/workflows/n8n/category/:category
```

**Example:**
```bash
curl "http://localhost:3000/api/workflows/n8n/category/ai-agents"
```

### Get Workflows by Tag

```http
GET /api/workflows/n8n/tag/:tag
```

**Example:**
```bash
curl "http://localhost:3000/api/workflows/n8n/tag/openai"
```

### Get Similar Workflows

```http
GET /api/workflows/n8n/:id/similar?limit=5
```

**Example:**
```bash
curl "http://localhost:3000/api/workflows/n8n/workflow-abc123/similar"
```

### Sync Workflows

```http
POST /api/workflows/n8n/sync
```

**Example:**
```bash
curl -X POST "http://localhost:3000/api/workflows/n8n/sync"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalWorkflows": 1234,
    "stats": {...},
    "errors": []
  }
}
```

### Import Workflow to N8N

```http
POST /api/workflows/n8n/import
```

**Request Body:**
```json
{
  "workflowId": "workflow-abc123",
  "n8nInstanceUrl": "https://n8n.example.com",
  "apiKey": "your-n8n-api-key",
  "activate": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "workflowId": "n8n-workflow-id",
    "message": "Workflow imported successfully"
  }
}
```

## Slash Commands

### /n8n-workflow-search

Search for n8n workflows using natural language.

**Usage:**
```
/n8n-workflow-search AI automation workflows
/n8n-workflow-search email notification simple
/n8n-workflow-search slack integration
```

### /n8n-workflow-sync

Sync workflows from GitHub repositories.

**Usage:**
```
/n8n-workflow-sync
```

## Programmatic Usage

### TypeScript/JavaScript

```typescript
import { WorkflowService } from '@the-new-fuse/n8n-workflows';

// Initialize service
const service = new WorkflowService({
  enablePersistence: true,
});

await service.initialize();

// Sync workflows
const result = await service.syncWorkflows();
console.log(`Synced ${result.totalWorkflows} workflows`);

// Search workflows
const searchResult = await service.search({
  query: 'slack notification',
  category: 'api-integrations',
  limit: 10,
});

console.log(`Found ${searchResult.total} workflows`);

// Get workflow by ID
const workflow = await service.getWorkflow('workflow-abc123');

// Get similar workflows
const similar = await service.getSimilarWorkflows('workflow-abc123', 5);

// Import to n8n
const importResult = await service.importToN8n({
  workflowId: 'workflow-abc123',
  n8nInstanceUrl: 'https://n8n.example.com',
  apiKey: 'your-api-key',
  activate: true,
});
```

## CLI Scripts

### Fetch Workflows

```bash
cd packages/n8n-workflows
pnpm run fetch:workflows
```

This will:
1. Clone/update all repository sources
2. Parse workflow JSON files
3. Categorize workflows
4. Save to registry

### Sync Service

```bash
cd packages/n8n-workflows
pnpm run sync:workflows
```

Runs a continuous sync service that updates workflows every 24 hours.

## Workflow Data Structure

### N8nWorkflow Interface

```typescript
interface N8nWorkflow {
  id: string;                      // Unique workflow ID
  name: string;                    // Workflow name
  description: string;             // Description
  category: WorkflowCategory;      // Auto-categorized
  nodes: WorkflowNode[];          // Workflow nodes
  connections: WorkflowConnections; // Node connections
  triggers: TriggerNode[];        // Trigger nodes
  source: WorkflowSource;         // Source repository
  tags: string[];                 // Tags
  jsonDefinition: any;            // Raw n8n JSON
  metadata: WorkflowMetadata;     // Metadata
  settings?: WorkflowSettings;    // Workflow settings
  active?: boolean;               // Active status
  createdAt?: Date;               // Created date
  updatedAt?: Date;               // Updated date
}
```

### WorkflowMetadata Interface

```typescript
interface WorkflowMetadata {
  id: string;
  name: string;
  description: string;
  tags: string[];
  category: WorkflowCategory;
  author?: string;
  createdAt?: Date;
  updatedAt?: Date;
  source: WorkflowSource;
  complexity?: 'simple' | 'medium' | 'complex';
  useCases?: string[];
  requiredCredentials?: string[];
}
```

## Integration with Resource Registry

The N8N Workflows system integrates with The New Fuse's resource registry:

1. **Automatic Registration**: Workflows are automatically registered as resources
2. **Search Integration**: Workflow search is integrated into the global search
3. **Agent Discovery**: AI agents can discover and use workflows
4. **Resource Tagging**: Workflows are tagged and categorized for easy discovery

## Performance & Caching

- **Local Caching**: Workflows are cached locally in `.n8n-workflows-cache/`
- **Registry Storage**: Parsed workflows are stored in `.n8n-workflows-registry/`
- **Category Indexes**: Separate indexes for each category for faster queries
- **Incremental Sync**: Only updated workflows are re-processed

## Best Practices

1. **Initial Sync**: Run `/n8n-workflow-sync` after installation
2. **Regular Updates**: Sync workflows weekly or use the continuous sync service
3. **Search Optimization**: Use category filters to narrow search results
4. **Import Testing**: Test imported workflows in a staging n8n instance first
5. **Credential Management**: Never commit n8n API keys to version control

## Troubleshooting

### Sync Failures

If sync fails:
1. Check network connectivity
2. Verify GitHub repository access
3. Clear cache: `rm -rf .n8n-workflows-cache`
4. Re-run sync

### Missing Workflows

If workflows are missing:
1. Run manual sync: `pnpm run fetch:workflows`
2. Check error logs
3. Verify repository configurations

### Import Failures

If import to n8n fails:
1. Verify n8n instance URL
2. Check API key permissions
3. Ensure n8n version compatibility
4. Check required credentials in n8n

## Advanced Features

### Custom Repository Sources

Add custom workflow repositories:

```typescript
import { WorkflowFetcher } from '@the-new-fuse/n8n-workflows';

const fetcher = new WorkflowFetcher();

fetcher.addRepository({
  source: 'custom',
  url: 'https://github.com/custom/n8n-workflows.git',
  branch: 'main',
  workflowPaths: ['workflows/**/*.json'],
});
```

### Custom Categorization

Extend the categorizer:

```typescript
import { WorkflowCategorizer } from '@the-new-fuse/n8n-workflows';

const categorizer = new WorkflowCategorizer();

// Get category suggestions
const suggestions = categorizer.suggestCategories(workflow, 3);
```

### Workflow Analysis

Analyze workflow complexity:

```typescript
import { WorkflowParser } from '@the-new-fuse/n8n-workflows';

const parser = new WorkflowParser();
const analysis = parser.analyzeWorkflow(workflow.nodes);

console.log(`Complexity: ${analysis.complexity}`);
console.log(`Node count: ${analysis.nodeCount}`);
console.log(`Required credentials: ${analysis.requiredCredentials}`);
```

## Metrics & Analytics

The system tracks:
- Total workflows imported
- Workflows per category
- Workflows per source
- Complexity distribution
- Popular tags
- Search queries
- Import success rate

## Security

- **API Key Protection**: N8N API keys are never logged or stored
- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: API endpoints are rate-limited
- **Workflow Validation**: Workflows are validated before import

## Future Enhancements

Planned features:
- Workflow versioning
- User ratings and reviews
- Workflow recommendations
- AI-powered workflow generation
- Workflow marketplace
- Collaborative workflow editing
- Workflow templates

## Support

For issues or questions:
- Check the documentation
- Review existing workflows
- Open a GitHub issue
- Contact the development team

## License

MIT License - See LICENSE file for details

---

Last Updated: 2025-11-18
