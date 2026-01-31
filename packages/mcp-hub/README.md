# Unified MCP Hub

**Single Source of Truth for All MCP Server Configurations**

This system centralizes MCP server management across all AI clients,
implementing token-efficient loading patterns for maximum context efficiency.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MASTER REGISTRY                             │
│              config/master-registry.json                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Server Definitions (command, args, env, capabilities)│   │
│  │  • Profiles (minimal, core, google, development, full)  │   │
│  │  • Client Configs (paths, formats, features)            │   │
│  │  • Token Cost Metadata (low, medium, high)              │   │
│  │  • Skill Wrapper References                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CONFIG GENERATOR                              │
│              scripts/generate-configs.js                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  • Reads master registry                                 │   │
│  │  • Expands variables (${HOME}, ${TNF_PATH}, etc.)       │   │
│  │  • Generates client-specific formats                     │   │
│  │  • Backs up existing configs                             │   │
│  │  • Writes to client config paths                         │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT CONFIGS                                │
├─────────────────────────────────────────────────────────────────┤
│  Claude Desktop    │ ~/Library/.../claude_desktop_config.json  │
│  Claude Code       │ ~/.claude.json                             │
│  Gemini CLI        │ ~/.gemini/settings.json                    │
│  Gemini Antigravity│ ~/.gemini/antigravity/mcp_config.json     │
│  GitHub Copilot    │ ~/Library/.../mcp_config.json             │
│  Factory Bridge    │ ~/Library/.../mcp.json                    │
│  Cursor            │ ~/.cursor/mcp.json                        │
│  Theia IDE         │ ~/.theia/.../mcp_settings.json            │
└─────────────────────────────────────────────────────────────────┘
```

## Token Efficiency Innovations

### 1. Skill-Based Loading (~95% Token Reduction)

Instead of loading full MCP tool schemas upfront, lightweight skills act as
proxies:

| Component          | Tokens         | When Loaded   |
| ------------------ | -------------- | ------------- |
| Skill Description  | ~50            | Always        |
| Full Skill Content | ~500-2000      | On invocation |
| MCP Tool Schemas   | ~300-1000/tool | On demand     |

**Example**: Instead of loading 15 Google Docs tools (~4500 tokens), the
`/gdocs` skill loads only when needed.

### 2. Profile-Based Server Selection

Load only what you need:

```bash
# Minimal: ~500 tokens
./sync-all.sh minimal

# Core TNF: ~2000 tokens
./sync-all.sh core

# Full: ~10000+ tokens
./sync-all.sh full
```

### 3. Tool Search Integration

Claude Code's Tool Search automatically defers tool loading when context exceeds
10%.

Set in `~/.claude/settings.json`:

```json
{
  "env": {
    "ENABLE_TOOL_SEARCH": "auto"
  }
}
```

### 4. Deferred Loading Metadata

Servers marked with `"deferLoading": true` in the registry are optimized for
on-demand discovery:

```json
{
  "google-docs": {
    "deferLoading": true,
    "skillWrapper": "gdocs"
  }
}
```

## Quick Start

### First-Time Setup

```bash
# From The New Fuse project root
pnpm --filter @the-new-fuse/mcp-hub run setup

# Or run directly
./packages/mcp-hub/scripts/setup.sh
```

### Sync All Clients with Core Profile

```bash
# Using pnpm from project root
pnpm --filter @the-new-fuse/mcp-hub run sync:core

# Or using the script directly (from mcp-hub directory)
./scripts/sync-all.sh core --all
```

### Generate Specific Client Config

```bash
pnpm --filter @the-new-fuse/mcp-hub run generate -- development claude-desktop gemini-cli
```

### List Available Options

```bash
pnpm --filter @the-new-fuse/mcp-hub run list:profiles
pnpm --filter @the-new-fuse/mcp-hub run list:clients
pnpm --filter @the-new-fuse/mcp-hub run list:servers
```

## Profiles

| Profile          | Servers                                                   | Use Case                |
| ---------------- | --------------------------------------------------------- | ----------------------- |
| `minimal`        | filesystem                                                | Basic file ops, testing |
| `core`           | filesystem, tnf-skills, tnf-relay, tnf-mcp-config-manager | TNF development         |
| `google`         | google-docs, google-drive, youtube-curator                | Google Workspace        |
| `development`    | filesystem, github, chrome-devtools, sequential-thinking  | Coding                  |
| `infrastructure` | redis, cloudflare-\*                                      | Cloud/DevOps            |
| `full`           | All servers                                               | Maximum capability      |

## Adding New Servers

1. Add server definition to `config/master-registry.json`:

```json
{
  "servers": {
    "new-server": {
      "name": "New Server",
      "description": "What it does",
      "category": "category",
      "priority": 5,
      "tokenCost": "low|medium|high",
      "command": "node",
      "args": ["${MCP_SERVERS_PATH}/new-server/dist/index.js"],
      "env": {},
      "capabilities": ["tool1", "tool2"],
      "tags": ["tag1", "tag2"],
      "deferLoading": true,
      "skillWrapper": "new-server-skill"
    }
  }
}
```

2. (Optional) Create skill wrapper in `~/.claude/commands/new-server-skill.md`

3. Add to relevant profiles in the registry

4. Run sync: `./scripts/sync-all.sh core --all`

## Integration with The New Fuse

This hub integrates with TNF's existing MCP infrastructure:

- **tnf-mcp-config-manager**: Universal config management
- **tnf-skills**: Skills library as MCP tools
- **tnf-relay**: Inter-agent communication

The registry is designed to complement, not replace, TNF's config manager.

## Environment Variables

Set these for full functionality:

```bash
export GITHUB_TOKEN="your-github-token"
export REDIS_URL="redis://..."
```

Or add to `~/.zshrc` / `~/.bashrc`.

## File Structure

```
unified-mcp-hub/
├── config/
│   └── master-registry.json    # Single source of truth
├── generators/                  # Format-specific generators (future)
├── scripts/
│   ├── generate-configs.js     # Main generator
│   └── sync-all.sh             # Convenience sync script
├── skills/                      # Skill wrappers (future)
└── README.md
```

## Troubleshooting

### Server not appearing in client

1. Check if server is in the selected profile
2. Verify `requiresEnv` variables are set
3. Run sync again and restart the client

### Token usage still high

1. Use a smaller profile
2. Enable Tool Search: `ENABLE_TOOL_SEARCH=true`
3. Use skill wrappers instead of direct MCP access

### Config not updating

1. Check backup files for conflicts
2. Verify config path in registry
3. Ensure write permissions

## Related Skills

- `/mcp-sync` - Sync configs from Claude Code
- `/mcp-profile` - Switch between profiles
- `/youtube`, `/gdocs`, `/gdrive` - Skill wrappers
- `/dev-cache-cleanup` - Free disk space

---

**Version**: 2.0.0 **Last Updated**: January 2026 **Maintainer**: The New Fuse
Project
