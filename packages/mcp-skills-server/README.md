# Skills MCP Server

Model Context Protocol server that exposes The New Fuse skills library for
dynamic agent skill discovery and loading.

## Overview

This MCP server enables AI agents to:

- **Discover** all available skills in the `.agent/skills/` directory
- **Load** skill documentation on demand
- **Access** onboarding flows and resource maps
- **Search** for specific skills by keyword

## Features

### Resources

- `skill://<skill-name>` - Access any skill's documentation
- Automatic skill scanning and caching
- Support for meta-skills, skills, and context resources

### Prompts

- All skills available as loadable prompts
- Meta-skills (skill-builder, library-of-living-knowledge)
- Context resources (onboarding, resource-map)

### Tools

- `list_skills` - List all skills (filterable by type)
- `get_skill_content` - Get full skill documentation
- `search_skills` - Search by keyword
- `get_onboarding_flow` - Get agent onboarding documentation
- `get_resource_map` - Get complete resource discovery map

## Installation

```bash
# From project root
pnpm install --filter @the-new-fuse/mcp-skills-server

# Build
pnpm --filter @the-new-fuse/mcp-skills-server build
```

## Usage

### Standalone Server

```bash
# Run as MCP server (stdio transport)
tnf-skills-mcp
```

### Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "tnf-skills": {
      "command": "/path/to/project/packages/mcp-skills-server/dist/index.js"
    }
  }
}
```

### Programmatic Usage

```typescript
import { SkillsMCPServer } from '@the-new-fuse/mcp-skills-server';

const server = new SkillsMCPServer('/path/to/.agent');
await server.start();
```

## Skill Discovery

The server automatically scans for:

1. **Meta-Skills** (`.agent/skills/*/SKILL.md`)
   - skill-builder
   - library-of-living-knowledge

2. **Skills** (`.agent/skills/*/SKILL.md`)
   - browser-automation
   - jules-delegation
   - relay-communication
   - etc.

3. **Context Resources** (`.agent/context/*.md`)
   - agent-onboarding.md
   - resource-map.md
   - etc.

4. **Supporting Scripts** (`.py`, `.sh`, `.js` in skill directories)

## MCP Interface

### List All Skills

```typescript
// Via MCP resources/list
{
  "resources": [
    {
      "uri": "skill://skill-builder",
      "name": "skill-builder",
      "description": "Meta-skill that creates other skills",
      "mimeType": "text/markdown",
      "metadata": {
        "type": "meta-skill",
        "scripts": 2
      }
    }
  ]
}
```

### Read a Skill

```typescript
// Via MCP resources/read
{
  "uri": "skill://browser-automation"
}

// Response
{
  "contents": [{
    "uri": "skill://browser-automation",
    "mimeType": "text/markdown",
    "text": "# Browser Automation Skill\n..."
  }]
}
```

### Get as Prompt

```typescript
// Via MCP prompts/get
{
  "name": "library-of-living-knowledge"
}

// Response - full skill content as prompt
{
  "messages": [{
    "role": "user",
    "content": {
      "type": "text",
      "text": "# Library of Living Knowledge\n..."
    }
  }]
}
```

## Integration with Self-Prompting

This server is a critical component of The New Fuse's self-prompting
infrastructure:

1. **Agent Bootstrap**: New agents load `library-of-living-knowledge` via MCP
2. **Skill Discovery**: Agents query `get_resource_map` to discover available
   skills
3. **Dynamic Loading**: Agents load specific skills as needed for tasks
4. **Meta-Learning**: `skill-builder` uses this server to create new skills

## Architecture

```
┌─────────────────────────────────────────────┐
│          Claude / AI Agent                  │
└─────────────────┬───────────────────────────┘
                  │ MCP Protocol
┌─────────────────▼───────────────────────────┐
│      Skills MCP Server                      │
│  ┌─────────────────────────────────────┐   │
│  │  Resource Handler                   │   │
│  │  • skill:// URIs                    │   │
│  │  • Dynamic discovery                │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Prompt Handler                     │   │
│  │  • Skills as prompts                │   │
│  │  • Meta-skills                      │   │
│  └─────────────────────────────────────┘   │
│  ┌─────────────────────────────────────┐   │
│  │  Tool Handler                       │   │
│  │  • list_skills                      │   │
│  │  • search_skills                    │   │
│  │  • get_onboarding_flow             │   │
│  └─────────────────────────────────────┘   │
└─────────────────┬───────────────────────────┘
                  │ File System
┌─────────────────▼───────────────────────────┐
│         .agent/ Directory                   │
│  ├── skills/                                │
│  │   ├── skill-builder/SKILL.md            │
│  │   ├── library-of-living-knowledge/      │
│  │   ├── browser-automation/               │
│  │   └── ...                               │
│  ├── context/                               │
│  │   ├── resource-map.md                   │
│  │   ├── agent-onboarding.md              │
│  │   └── ...                               │
│  └── scripts/                               │
└─────────────────────────────────────────────┘
```

## Development

```bash
# Watch mode
pnpm --filter @the-new-fuse/mcp-skills-server watch

# Run tests
pnpm --filter @the-new-fuse/mcp-skills-server test

# Clean build
pnpm --filter @the-new-fuse/mcp-skills-server clean
```

## License

MIT
