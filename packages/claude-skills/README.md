# @the-new-fuse/claude-skills

Integration layer for Anthropic's Claude Skills into The New Fuse ecosystem.

## Overview

This package provides a complete integration of Anthropic's official Claude
Skills repository, enabling The New Fuse agents and users to leverage
battle-tested skills for document processing, development, design, and more.

## Features

- **Skill Loader**: Auto-sync with Anthropic's skills repository
- **Skill Parser**: Parse SKILL.md files with YAML frontmatter validation
- **Skill Executor**: Execute skills with parameter validation and error
  handling
- **Skill Registry**: Fast in-memory storage with indexing and search
- **MCP Integration**: Expose skills as MCP resources and tools
- **Slash Commands**: Ready-to-use Claude Code commands

## Quick Start

```typescript
import { ClaudeSkillsManager } from '@the-new-fuse/claude-skills';

// Create manager instance
const manager = new ClaudeSkillsManager({
  autoInitialize: true,
  prioritySkills: ['pdf', 'xlsx', 'mcp-builder'],
});

// Wait for initialization
await manager.initialize();

// List loaded skills
const skills = await manager.listSkills();
console.log(`Loaded ${skills.length} skills`);

// Execute a skill
const result = await manager.executeSkill({
  skillId: 'anthropic.skill.pdf',
  parameters: {
    action: 'extract-text',
    file: '/path/to/document.pdf',
  },
});
```

## Available Skills

### Document Processing (4)

- **pdf** - PDF manipulation and processing
- **xlsx** - Excel spreadsheet creation and analysis
- **pptx** - PowerPoint presentation creation
- **docx** - Word document processing

### Development & Technical (3)

- **mcp-builder** - MCP server development guide
- **webapp-testing** - Automated web testing with Playwright
- **web-artifacts-builder** - Build HTML artifacts with React

### Creative & Design (4)

- **algorithmic-art** - Generative art with p5.js
- **canvas-design** - Visual art design
- **theme-factory** - Artifact styling and themes
- **slack-gif-creator** - Animated GIF creation

### Enterprise & Communication (2)

- **brand-guidelines** - Anthropic brand application
- **internal-comms** - Internal communications writing

### Meta Skills (2)

- **skill-creator** - Create custom skills
- **template-skill** - Basic skill template

## Installation

```bash
npm install @the-new-fuse/claude-skills
```

Or with yarn:

```bash
yarn add @the-new-fuse/claude-skills
```

## API Reference

### ClaudeSkillsManager

Main orchestrator for skill management.

```typescript
const manager = new ClaudeSkillsManager(config?: ClaudeSkillsManagerConfig);

await manager.initialize(prioritySkills?: string[]);
await manager.loadSkills(skillNames: string[]);
await manager.executeSkill(context: SkillExecutionContext);
await manager.searchSkills(query: string);
```

### Skill Types

```typescript
interface ClaudeSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  metadata: SkillMetadata;
  content: string;
  instructions: string;
  parameters: SkillParameter[];
}

interface SkillExecutionContext {
  skillId: string;
  parameters: Record<string, any>;
  userId?: string;
  sessionId?: string;
}

interface SkillExecutionResult {
  success: boolean;
  output?: any;
  error?: {
    code: string;
    message: string;
  };
}
```

## Examples

### Load Specific Skills

```typescript
const result = await manager.loadSkills(['pdf', 'xlsx', 'mcp-builder']);

console.log(`Loaded: ${result.imported}`);
console.log(`Failed: ${result.failed}`);
```

### Search Skills

```typescript
// Search by name
const pdfSkills = await manager.searchSkills('pdf');

// Get by category
const docSkills = await manager.getSkillsByCategory('document-processing');

// Get by tag
const pythonSkills = await manager.getSkillsByTag('python');
```

### MCP Integration

```typescript
const mcpProvider = manager.getMCPProvider();

// Get as MCP resources
const resources = await mcpProvider.getSkillResources();

// Get as MCP tools
const tools = await mcpProvider.getSkillTools();

// Execute via MCP
const output = await mcpProvider.executeSkillTool('skill_pdf', {
  action: 'extract',
  file: 'doc.pdf',
});
```

### Statistics

```typescript
const stats = manager.getStatistics();
console.log('Total skills:', stats.registry.totalSkills);
console.log('By category:', stats.registry.skillsByCategory);
console.log('Categories:', manager.getCategories());
console.log('Tags:', manager.getTags());
```

## Configuration

```typescript
interface ClaudeSkillsManagerConfig {
  loader?: {
    sourceRepositoryUrl?: string;
    localCachePath?: string;
    autoUpdate?: boolean;
    updateInterval?: number;
    categoriesFilter?: SkillCategory[];
    tagsFilter?: string[];
  };
  autoInitialize?: boolean;
  prioritySkills?: string[];
}
```

### Default Configuration

```typescript
{
  loader: {
    sourceRepositoryUrl: 'https://github.com/anthropics/skills.git',
    localCachePath: '.cache/anthropic-skills',
    autoUpdate: false,
    updateInterval: 24 * 60 * 60 * 1000 // 24 hours
  },
  autoInitialize: false,
  prioritySkills: []
}
```

## Testing

```bash
npm test
npm run test:coverage
npm run test:watch
```

## Development

```bash
# Build
npm run build

# Watch mode
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint
npm run lint:fix
```

## Integration with The New Fuse

### MCP Server

```typescript
import { MCPServer } from '@the-new-fuse/mcp-core';
import { ClaudeSkillsManager } from '@the-new-fuse/claude-skills';

const server = new MCPServer();
const manager = new ClaudeSkillsManager();

await manager.initialize();

const provider = manager.getMCPProvider();
const tools = await provider.getSkillTools();

for (const tool of tools) {
  server.registerTool(tool);
}
```

### Resource Registry

```typescript
import { ResourceRegistry } from '@the-new-fuse/resource-registry';
import { ClaudeSkillsManager } from '@the-new-fuse/claude-skills';

const registry = new ResourceRegistry();
const manager = new ClaudeSkillsManager();

await manager.initialize();

const skills = await manager.listSkills();
for (const skill of skills) {
  await registry.registerResource({
    id: skill.id,
    type: 'skill',
    name: skill.name,
    description: skill.description,
  });
}
```

## Slash Commands

Seven slash commands are included for Claude Code:

- `/skill-load` - Load skills from repository
- `/skill-search` - Search available skills
- `/skill-stats` - View statistics
- `/skill-pdf` - Activate PDF skill
- `/skill-xlsx` - Activate Excel skill
- `/skill-mcp-builder` - Activate MCP builder skill
- `/skill-webapp-testing` - Activate web testing skill

## Performance

- **Initialization**: ~2-3 seconds (clones repo + loads 16 skills)
- **Skill Execution**: <10ms (instructional only)
- **Search**: <5ms for 100 skills
- **Memory**: ~1MB per loaded skill

## Troubleshooting

### Clear Cache

```bash
rm -rf .cache/anthropic-skills
```

```typescript
await manager.cleanup();
await manager.initialize();
```

### Verify Git

```bash
git --version
# Git version 2.x.x
```

## License

- Integration code: MIT
- Document skills (pdf, xlsx, pptx, docx): Proprietary (Anthropic)
- Example skills: Apache 2.0 (Anthropic)

## Credits

- Skills: [Anthropic Skills Repository](https://github.com/anthropics/skills)
- Integration: The New Fuse Team

## Documentation

- Main docs: `/docs/CLAUDE_SKILLS.md`
- Slash commands: `/.claude/commands/skill-*.md`
- API reference: See main docs

## Support

- Issues: https://github.com/the-new-fuse/the-new-fuse/issues
- Discussions: https://github.com/the-new-fuse/the-new-fuse/discussions
