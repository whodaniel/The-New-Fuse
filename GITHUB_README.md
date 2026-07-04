<img src="https://thenewfuse.com/assets/brand/tnf-logo.png" alt="The New Fuse" width="80" height="80" align="left">

# The New Fuse

> **The AI Agent Orchestration Platform.** Build, deploy, and scale production-ready multi-agent systems with MCP and A2A protocols.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![Node.js 22+](https://img.shields.io/badge/Node.js-22+-green.svg)](https://nodejs.org/)
[![Discord](https://img.shields.io/badge/Discord-Join-5865F2?logo=discord)](https://discord.gg/thenewfuse)
[![Twitter](https://img.shields.io/badge/Twitter-@TheNewFuseAI-1DA1F2?logo=twitter)](https://x.com/TheNewFuseAI)

---

## Why The New Fuse?

AI agents are only as powerful as their **harness** — the software that gives them memory, tools, and the ability to coordinate. The New Fuse is that harness.

```typescript
import { Agent, Harness, MCPClient } from '@the-new-fuse/core';

const agent = new Agent({
  model: 'claude-4',
  harness: new Harness({
    memory: new CrossSessionMemory(),
    tools: await MCPClient.connect('/path/to/your/tools'),
  }),
});

await agent.run('Build me a full-stack app with auth');
```

## Key Features

| Feature | Description |
|---------|-------------|
| **🔗 MCP + A2A Protocols** | Native Model Context Protocol and Agent-to-Agent communication |
| **🧠 Cross-Session Memory** | Agents remember context across sessions, not just conversations |
| **⚡ Visual Workflow Builder** | Drag-and-drop interface for designing multi-agent workflows |
| **🌐 Federated Architecture** | Run agents anywhere — browser extension, desktop, cloud |
| **📦 90% Open Source** | Full platform available for self-hosting |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    The New Fuse Runtime                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   Agent 1   │  │   Agent 2   │  │   Agent N   │         │
│  │   (Claude)  │◄─┼─►  (Gemini) │◄─┼─►  (GPT-4)  │         │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘         │
│         │                │                │                 │
│  ┌──────▼────────────────▼────────────────▼──────┐         │
│  │              Redis Synaptic Bus               │         │
│  │         (Real-time Agent Communication)        │         │
│  └──────────────────────┬───────────────────────┘         │
│                         │                                   │
│  ┌──────────────────────▼───────────────────────┐         │
│  │              MCP Tool Registry               │         │
│  │         (Files, Browser, APIs, Database)     │         │
│  └──────────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Quick Start

### 1. Install

```bash
npm install @the-new-fuse/core
# or
pnpm add @the-new-fuse/core
```

### 2. Create Your First Agent

```typescript
import { Agent, Harness } from '@the-new-fuse/core';

const agent = new Agent({
  model: 'claude-4',
  harness: new Harness({
    memory: true,
    tools: ['filesystem', 'browser', 'websearch'],
  }),
});

// Ask your agent anything
const response = await agent.run(
  'Find all TypeScript files modified in the last week and summarize the changes'
);

console.log(response.content);
```

### 3. Connect Custom Tools via MCP

```typescript
import { MCPClient } from '@the-new-fuse/core';

// Connect to any MCP server
const mcp = await MCPClient.connect({
  command: 'npx',
  args: ['-y', '@modelcontextprotocol/server-filesystem', './my-project'],
});

const agent = new Agent({
  model: 'claude-4',
  harness: new Harness({
    tools: mcp,
  }),
});
```

## MCP Support

The New Fuse has **first-class MCP support**. Connect to any MCP server:

```bash
# Official MCP Servers
npx -y @modelcontextprotocol/server-filesystem
npx -y @modelcontextprotocol/server-brave-search
npx -y @modelcontextprotocol/server-slack
```

Or build your own:

```typescript
import { createMCPService } from '@the-new-fuse/mcp-server';

const server = createMCPService({
  name: 'my-tools',
  version: '1.0.0',
  tools: [
    {
      name: 'query_database',
      description: 'Execute a SQL query',
      inputSchema: {
        type: 'object',
        properties: {
          sql: { type: 'string' },
        },
      },
      handler: async ({ sql }) => {
        const results = await db.query(sql);
        return { content: JSON.stringify(results) };
      },
    },
  ],
});
```

## Self-Hosting

The entire open-source runtime is available for self-hosting:

```bash
# Clone the open runtime
git clone https://github.com/whodaniel/fuse-open-runtime.git
cd fuse-open-runtime

# Start with Docker
docker-compose up

# Or run manually
pnpm install
pnpm run dev
```

## Comparison

| Feature | The New Fuse | CrewAI | LangChain |
|---------|-------------|---------|-----------|
| MCP Support | ✅ Native | ⚠️ Partial | ✅ Native |
| Cross-Session Memory | ✅ | ❌ | ❌ |
| Visual Workflow Builder | ✅ | ✅ | ❌ |
| Open Source | 90% | ✅ | ✅ |
| A2A Protocol | ✅ | ❌ | ❌ |
| Chrome Extension Federation | ✅ | ❌ | ❌ |

## Resources

- 📖 [Documentation](https://thenewfuse.com/docs)
- 🎓 [Tutorials](https://thenewfuse.com/docs/tutorials)
- 💬 [Discord Community](https://discord.gg/thenewfuse)
- 📱 [Chrome Extension](https://chrome.google.com/webstore)
- 📊 [Status](https://status.thenewfuse.com)

## License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built with ❤️ by [The New Fuse](https://thenewfuse.com)**

*Give your AI agents the infrastructure they deserve.*

</div>