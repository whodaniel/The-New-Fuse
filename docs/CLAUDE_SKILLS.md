# Claude Skills Integration

Complete integration of Anthropic's Claude Skills into The New Fuse ecosystem.

## Overview

The Claude Skills package (`@the-new-fuse/claude-skills`) provides a
comprehensive integration layer for Anthropic's official Claude Skills
repository. This integration enables The New Fuse agents and users to leverage
battle-tested skills for document processing, development, design, and more.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    Claude Skills Manager                         │
│  ┌────────────┬────────────┬────────────┬─────────────────────┐ │
│  │   Loader   │   Parser   │  Executor  │      Registry       │ │
│  └────────────┴────────────┴────────────┴─────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┼─────────────┐
                │             │             │
         ┌──────▼─────┐ ┌────▼────┐ ┌──────▼──────┐
         │    MCP     │ │Resource │ │   Slash     │
         │  Provider  │ │Registry │ │  Commands   │
         └────────────┘ └─────────┘ └─────────────┘
```

## Features

### 1. Skill Loader

- Clones/syncs Anthropic's skills repository
- Auto-updates on configurable interval
- Filters by category and tags
- Supports priority skill loading

### 2. Skill Parser

- Parses SKILL.md files with YAML frontmatter
- Validates skill definitions using Zod schemas
- Extracts metadata, instructions, and parameters
- Categorizes and tags skills automatically

### 3. Skill Executor

- Executes skills with parameter validation
- Type checking and constraint validation
- Comprehensive error handling
- Execution metrics and monitoring

### 4. Skill Registry

- In-memory skill storage with indexing
- Fast lookup by ID, category, tag, or query
- Search functionality with relevance scoring
- Statistics and analytics

### 5. MCP Integration

- Exposes skills as MCP resources (`skill://skill-id`)
- Converts skills to MCP tools (`skill_skill_name`)
- Category and tag-based filtering
- Full integration with The New Fuse MCP server

## Available Skills

### Document Processing (4 skills)

Source: `document-skills/` (Proprietary, reference only)

- **pdf** - Comprehensive PDF manipulation toolkit
  - Extract text and tables
  - Create, merge, split PDFs
  - Fill PDF forms
  - Handle metadata and annotations

- **xlsx** - Excel spreadsheet creation and analysis
  - Create/edit spreadsheets
  - Formulas and formatting
  - Data analysis and visualization
  - Pivot tables and charts

- **pptx** - PowerPoint presentation creation
  - Create/edit presentations
  - Layouts and templates
  - Charts and automated slides

- **docx** - Word document processing
  - Create/edit documents
  - Tracked changes and comments
  - Formatting preservation

### Development & Technical (3 skills)

- **mcp-builder** - MCP server development guide
  - TypeScript/Python MCP servers
  - Tool and resource design
  - Best practices and patterns
  - HTTP and stdio transports

- **webapp-testing** - Automated web testing
  - Playwright test automation
  - UI verification and debugging
  - Cross-browser testing
  - Screenshot and video capture

- **web-artifacts-builder** - Build HTML artifacts
  - React components
  - Tailwind CSS styling
  - shadcn/ui integration

### Creative & Design (4 skills)

- **algorithmic-art** - Generative art creation
  - p5.js integration
  - Flow fields and particle systems
  - Seeded randomness

- **canvas-design** - Visual art design
  - PNG and PDF formats
  - Design philosophies

- **theme-factory** - Artifact styling
  - 10 pre-set themes
  - Custom theme generation

- **slack-gif-creator** - Animated GIF creation
  - Slack-optimized sizes

### Enterprise & Communication (2 skills)

- **brand-guidelines** - Anthropic brand application
  - Official colors and typography
  - Artifact branding

- **internal-comms** - Internal communications
  - Status reports and newsletters
  - FAQs and updates

### Meta Skills (2 skills)

- **skill-creator** - Create custom skills
  - Skill development guide
  - Best practices

- **template-skill** - Basic skill template
  - Starting point for new skills

## Installation & Setup

### 1. Install Package Dependencies

```bash
cd packages/claude-skills
npm install
```

### 2. Build Package

```bash
npm run build
```

### 3. Initialize Skills Manager

```typescript
import { ClaudeSkillsManager } from '@the-new-fuse/claude-skills';

const manager = new ClaudeSkillsManager({
  loader: {
    sourceRepositoryUrl: 'https://github.com/anthropics/skills.git',
    localCachePath: '.cache/anthropic-skills',
    autoUpdate: true,
    updateInterval: 24 * 60 * 60 * 1000, // 24 hours
  },
  autoInitialize: false,
  prioritySkills: ['mcp-builder', 'pdf', 'xlsx', 'webapp-testing'],
});

// Initialize (clones repo and loads skills)
const result = await manager.initialize();
console.log(`Loaded ${result.imported} skills`);
```

### 4. Load Specific Skills

```typescript
// Load specific skills by name
await manager.loadSkills(['pdf', 'xlsx', 'mcp-builder']);

// Load all skills
await manager.initialize();
```

## Usage

### Basic Skill Execution

```typescript
// Execute a skill
const result = await manager.executeSkill({
  skillId: 'anthropic.skill.pdf',
  parameters: {
    action: 'extract-text',
    file: '/path/to/document.pdf',
  },
  userId: 'user-123',
  sessionId: 'session-456',
});

if (result.success) {
  console.log('Skill output:', result.output);
} else {
  console.error('Error:', result.error);
}
```

### Search and Discovery

```typescript
// Search for skills
const pdfSkills = await manager.searchSkills('pdf');

// Get skills by category
const docSkills = await manager.getSkillsByCategory('document-processing');

// Get skills by tag
const pythonSkills = await manager.getSkillsByTag('python');

// List all skills with filters
const skills = await manager.listSkills({
  categories: [SkillCategory.DOCUMENT_PROCESSING],
  tags: ['pdf', 'python'],
});
```

### MCP Integration

```typescript
// Get MCP provider
const mcpProvider = manager.getMCPProvider();

// Get skills as MCP resources
const resources = await mcpProvider.getSkillResources();

// Get skills as MCP tools
const tools = await mcpProvider.getSkillTools();

// Execute skill via MCP tool
const output = await mcpProvider.executeSkillTool('skill_pdf', {
  action: 'extract-text',
  file: '/path/to/doc.pdf',
});
```

### Statistics and Monitoring

```typescript
// Get statistics
const stats = manager.getStatistics();
console.log('Total skills:', stats.registry.totalSkills);
console.log('By category:', stats.registry.skillsByCategory);

// Get available categories
const categories = manager.getCategories();

// Get available tags
const tags = manager.getTags();
```

## Slash Commands

The integration includes several slash commands for Claude Code:

### Management Commands

- `/skill-load [all|names...]` - Load skills from repository
- `/skill-search <query>` - Search available skills
- `/skill-stats [detailed]` - View statistics

### Skill Activation Commands

- `/skill-pdf <task>` - Activate PDF skill
- `/skill-xlsx <task>` - Activate Excel skill
- `/skill-mcp-builder <task>` - Activate MCP builder skill
- `/skill-webapp-testing <task>` - Activate web testing skill

### Examples

```bash
# Load all skills
/skill-load all

# Load specific skills
/skill-load pdf xlsx mcp-builder

# Search for skills
/skill-search document
/skill-search category:development

# View statistics
/skill-stats detailed

# Use a skill
/skill-pdf extract text from report.pdf
/skill-xlsx create a sales dashboard from data.csv
```

## API Reference

### ClaudeSkillsManager

Main orchestrator class for Claude Skills.

#### Constructor

```typescript
new ClaudeSkillsManager(config?: ClaudeSkillsManagerConfig)
```

#### Methods

- `initialize(prioritySkills?: string[]): Promise<SkillImportResult>`
- `loadSkills(skillNames: string[]): Promise<SkillImportResult>`
- `reloadSkills(): Promise<SkillImportResult>`
- `executeSkill(context: SkillExecutionContext): Promise<SkillExecutionResult>`
- `getSkill(skillId: string): Promise<ClaudeSkill | undefined>`
- `listSkills(filter?: SkillFilter): Promise<ClaudeSkill[]>`
- `searchSkills(query: string): Promise<ClaudeSkill[]>`
- `getSkillsByCategory(category: string): Promise<ClaudeSkill[]>`
- `getSkillsByTag(tag: string): Promise<ClaudeSkill[]>`
- `getCategories(): string[]`
- `getTags(): string[]`
- `getStatistics(): object`
- `getMCPProvider(): MCPSkillProvider`
- `cleanup(): Promise<void>`

### SkillLoader

Loads skills from Anthropic's repository.

#### Methods

- `initialize(): Promise<void>`
- `loadAllSkills(): Promise<SkillImportResult>`
- `loadSkillsByName(names: string[]): Promise<SkillImportResult>`
- `loadSkill(name: string): Promise<ClaudeSkill | null>`
- `listAvailableSkills(): Promise<string[]>`
- `cleanup(): Promise<void>`

### SkillParser

Parses SKILL.md files.

#### Methods

- `parseSkillFile(filePath: string): Promise<ClaudeSkill>`
- `parseSkillDirectory(dirPath: string): Promise<ClaudeSkill[]>`
- `validateSkill(skill: ClaudeSkill): { valid: boolean; errors: string[] }`

### SkillExecutor

Executes skills with validation.

#### Methods

- `registerSkill(skill: ClaudeSkill): void`
- `unregisterSkill(skillId: string): void`
- `execute(context: SkillExecutionContext): Promise<SkillExecutionResult>`
- `validate(skillId: string, params: object): Promise<ValidationResult>`
- `getStatistics(): object`

### SkillRegistry

Manages skill storage and indexing.

#### Methods

- `register(skill: ClaudeSkill): Promise<void>`
- `unregister(skillId: string): Promise<void>`
- `get(skillId: string): Promise<ClaudeSkill | undefined>`
- `list(filter?: SkillFilter): Promise<ClaudeSkill[]>`
- `search(query: string): Promise<ClaudeSkill[]>`
- `update(skillId: string, updates: Partial<ClaudeSkill>): Promise<void>`
- `getCategories(): string[]`
- `getTags(): string[]`
- `getByCategory(category: string): Promise<ClaudeSkill[]>`
- `getByTag(tag: string): Promise<ClaudeSkill[]>`

### MCPSkillProvider

MCP integration layer.

#### Methods

- `getSkillResources(): Promise<MCPResource[]>`
- `getSkillContent(uri: string): Promise<string | null>`
- `getSkillTools(): Promise<SkillMCPTool[]>`
- `executeSkillTool(name: string, params: object): Promise<any>`
- `searchSkills(query: string): Promise<MCPResource[]>`
- `getSkillsByCategory(category: string): Promise<MCPResource[]>`

## Integration Points

### 1. Resource Registry Integration

```typescript
import { ResourceRegistry } from '@the-new-fuse/resource-registry';
import { ClaudeSkillsManager } from '@the-new-fuse/claude-skills';

const registry = new ResourceRegistry();
const skillsManager = new ClaudeSkillsManager();

await skillsManager.initialize();

// Register skills as resources
const skills = await skillsManager.listSkills();
for (const skill of skills) {
  await registry.registerResource({
    id: skill.id,
    type: 'skill',
    name: skill.name,
    description: skill.description,
    metadata: {
      category: skill.category,
      tags: skill.tags,
      source: 'anthropic',
    },
  });
}
```

### 2. MCP Server Integration

```typescript
import { MCPServer } from '@the-new-fuse/mcp-core';
import { ClaudeSkillsManager } from '@the-new-fuse/claude-skills';

const mcpServer = new MCPServer({ port: 3100 });
const skillsManager = new ClaudeSkillsManager();

await skillsManager.initialize();

const mcpProvider = skillsManager.getMCPProvider();

// Register skill resources
const resources = await mcpProvider.getSkillResources();
for (const resource of resources) {
  mcpServer.registerResource(resource);
}

// Register skill tools
const tools = await mcpProvider.getSkillTools();
for (const tool of tools) {
  mcpServer.registerTool({
    name: tool.name,
    description: tool.description,
    inputSchema: tool.inputSchema,
    handler: async (params) => {
      return await mcpProvider.executeSkillTool(tool.name, params);
    },
  });
}
```

### 3. Agent Integration

```typescript
import { Agent } from '@the-new-fuse/agent';
import { ClaudeSkillsManager } from '@the-new-fuse/claude-skills';

const agent = new Agent({
  id: 'agent-1',
  capabilities: ['document-processing', 'code-analysis'],
});

const skillsManager = new ClaudeSkillsManager();
await skillsManager.initialize(['pdf', 'xlsx', 'mcp-builder']);

// Agent can now use skills
agent.on('task', async (task) => {
  if (task.type === 'process-pdf') {
    const result = await skillsManager.executeSkill({
      skillId: 'anthropic.skill.pdf',
      parameters: task.parameters,
      userId: task.userId,
    });

    return result.output;
  }
});
```

## Configuration

### Environment Variables

```bash
# Optional: Override repository URL
CLAUDE_SKILLS_REPO_URL=https://github.com/anthropics/skills.git

# Optional: Override cache path
CLAUDE_SKILLS_CACHE_PATH=/path/to/cache

# Optional: Enable auto-update
CLAUDE_SKILLS_AUTO_UPDATE=true

# Optional: Update interval (milliseconds)
CLAUDE_SKILLS_UPDATE_INTERVAL=86400000
```

### Config File

```typescript
// claude-skills.config.ts
export default {
  loader: {
    sourceRepositoryUrl: process.env.CLAUDE_SKILLS_REPO_URL,
    localCachePath: process.env.CLAUDE_SKILLS_CACHE_PATH || '.cache/skills',
    autoUpdate: process.env.CLAUDE_SKILLS_AUTO_UPDATE === 'true',
    updateInterval: parseInt(
      process.env.CLAUDE_SKILLS_UPDATE_INTERVAL || '86400000'
    ),
    categoriesFilter: ['document-processing', 'development-technical'],
  },
  prioritySkills: ['mcp-builder', 'pdf', 'xlsx', 'webapp-testing'],
};
```

## Testing

```bash
# Run tests
cd packages/claude-skills
npm test

# Run with coverage
npm run test:coverage

# Run specific test
npm test -- SkillParser.test.ts
```

## Performance

- **Skill Loading**: ~2-3 seconds for 16 skills
- **Skill Execution**: <10ms (instructional only)
- **Search**: <5ms for 100 skills
- **Memory**: ~1MB per loaded skill

## Troubleshooting

### Skills Not Loading

```bash
# Clear cache and reinitialize
rm -rf .cache/anthropic-skills
```

```typescript
await manager.cleanup();
await manager.initialize();
```

### Git Clone Fails

Ensure git is installed and network is accessible:

```bash
git --version
ping github.com
```

### Skill Validation Errors

Check SKILL.md format:

```yaml
---
name: skill-name
description: Description here
---
# Skill content
```

## Roadmap

- [ ] Persistent skill storage (database)
- [ ] Custom skill authoring UI
- [ ] Skill versioning and updates
- [ ] Skill execution sandboxing
- [ ] Usage analytics and recommendations
- [ ] Community skill marketplace
- [ ] Skill composition and chaining

## License

- Integration code: MIT
- Document skills: Proprietary (Anthropic)
- Example skills: Apache 2.0 (Anthropic)

See individual skill LICENSE files for details.

## Contributing

To add new skills or improve integration:

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Submit pull request

## Support

- GitHub Issues: https://github.com/the-new-fuse/the-new-fuse/issues
- Documentation: /docs/CLAUDE_SKILLS.md
- Package README: /packages/claude-skills/README.md

## Credits

- Skills source:
  [Anthropic Skills Repository](https://github.com/anthropics/skills)
- Integration: The New Fuse Team
- MCP Protocol: Anthropic
