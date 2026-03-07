# The New Fuse MCP Setup Guide

## Optimized for Google Antigravity IDE

Last Updated: 2025-01-07

## Overview

This guide helps you set up and configure MCP (Model Context Protocol) servers
for use with The New Fuse project and Google Antigravity IDE. The configuration
includes both official Anthropic servers and community-maintained servers.

## Configuration File

Location: `/data/mcp_config.json`

## Server Categories

### 1. TNF Core Servers (Priority 9-11)

These are custom servers specific to The New Fuse platform:

- **tnf-enhanced-mcp-server** (Priority 11) - Enhanced TNF MCP Server with full
  platform integration
- **tnf-complete-api-wrapper** (Priority 10) - 80+ tools for complete platform
  access
- **tnf-mcp-config-manager** (Priority 9) - Universal MCP configuration
  management

### 2. Official Anthropic Servers (Priority 4-8)

Production-ready reference implementations:

- **filesystem** (Priority 8) - Secure file operations
- **git** (Priority 8) - Git repository management
- **github** (Priority 8) - GitHub integration (requires PAT)
- **memory** (Priority 7) - Persistent knowledge graph
- **fetch** (Priority 7) - Web content fetching
- **postgres** (Priority 7) - Database operations
- **puppeteer** (Priority 6) - Browser automation
- **brave-search** (Priority 6) - Web search (requires API key)
- **sequential-thinking** (Priority 5) - Problem-solving sequences
- **slack** (Priority 5) - Slack integration (requires bot token)
- **time** (Priority 4) - Time/timezone conversions

### 3. Community Servers (Priority 3-6)

Community-maintained integrations:

- **browsermcp** (Priority 6) - Advanced browser automation
- **google-drive** (Priority 5) - Google Drive integration (requires OAuth)
- **applescript_execute** (Priority 4) - macOS automation
- **context7-server** (Priority 3) - Context management

## Required API Keys & Tokens

### GitHub Personal Access Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" (classic)
3. Select scopes: `repo`, `read:org`, `read:user`
4. Copy the token
5. Add to `.env`: `GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here`

### Brave Search API Key (FREE)

1. Go to https://brave.com/search/api/
2. Sign up for free tier (2,000 queries/month)
3. Get your API key
4. Add to `.env`: `BRAVE_API_KEY=your_key_here`

### Slack Bot Token

1. Go to https://api.slack.com/apps
2. Create a new app or select existing
3. Go to OAuth & Permissions
4. Add bot token scopes: `channels:history`, `channels:read`, `chat:write`
5. Install app to workspace
6. Copy Bot User OAuth Token
7. Add to `.env`:
   ```
   SLACK_BOT_TOKEN=<SLACK_BOT_TOKEN>
   SLACK_TEAM_ID=your_team_id
   ```

### Google Drive OAuth

1. Go to https://console.cloud.google.com/
2. Create a new project
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Follow setup guide from @piotr-agier/google-drive-mcp
6. Configure OAuth consent screen

## Installation & Usage

### Quick Start

All servers are configured to use `npx -y` which auto-installs packages on first
use. No manual installation needed!

### Testing Individual Servers

```bash
# Test filesystem server
npx -y @modelcontextprotocol/server-filesystem /path/to/project

# Test git server
npx -y @modelcontextprotocol/server-git --repository /path/to/project

# Test memory server
npx -y @modelcontextprotocol/server-memory

# Test fetch server
npx -y @modelcontextprotocol/server-fetch
```

### Google Antigravity IDE Configuration

If using Google Antigravity IDE, point it to your MCP config:

```bash
# Set environment variable
export MCP_CONFIG_PATH=/path/to/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/mcp_config.json

# Or add to .env file
echo "MCP_CONFIG_PATH=$(pwd)/data/mcp_config.json" >> .env
```

### Claude Desktop Configuration

If using Claude Desktop, create/update
`~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    // Copy servers from /data/mcp_config.json
  }
}
```

## Server Priorities Explained

- **Priority 11**: Critical TNF platform integration
- **Priority 10**: Complete platform API access
- **Priority 9**: Configuration management
- **Priority 8**: Essential development tools (filesystem, git, github)
- **Priority 7**: Core functionality (memory, fetch, postgres)
- **Priority 6**: Automation & search (puppeteer, browsermcp, brave-search)
- **Priority 5**: Communication & reasoning (slack, sequential-thinking,
  google-drive)
- **Priority 4**: Utilities (time, applescript)
- **Priority 3**: Examples & routing
- **Priority 2**: Infrastructure relays

## Troubleshooting

### Server Won't Start

```bash
# Check if server package exists
npx -y @modelcontextprotocol/server-<name> --version

# Clear npx cache
npm cache clean --force
```

### Permission Denied Errors

```bash
# Make sure paths in config are absolute
# Use full paths like: /path/to/Desktop/...
# Not relative paths like: ./data/...
```

### Missing API Keys

Check `.env` file has all required tokens. Servers with empty API keys will fail
silently.

### Postgres Connection Issues

```bash
# Verify postgres is running
docker-compose ps

# Check connection string
psql postgresql://localhost:5433/tnf_dev

# Update connection string in mcp_config.json if needed
```

## Best Practices

1. **Start Small**: Enable core servers first (filesystem, git, memory)
2. **Add API Keys Gradually**: Only add tokens for services you'll actively use
3. **Monitor Performance**: Too many active servers can slow down the IDE
4. **Regular Updates**: Run `npx -y <package>@latest` to get updates
5. **Backup Config**: Keep backup before making changes

## Security Notes

⚠️ **NEVER commit API keys or tokens to version control**

- Use `.env` files (already in .gitignore)
- Use environment variables
- Use secret management tools for production
- Rotate tokens regularly
- Use minimal required scopes

## Resources

- [Official MCP Documentation](https://modelcontextprotocol.io/docs)
- [Anthropic MCP Servers](https://github.com/modelcontextprotocol/servers)
- [MCP Server Directory](https://mcpservers.org/)
- [TNF Documentation](./docs/)

## Support

For TNF-specific issues, check:

- `./docs/DOCUMENTATION_MAP.md`
- `./docs/AGENT_COMMUNICATION_PROTOCOL.md`
- GitHub Issues: https://github.com/whodaniel/fuse/issues
