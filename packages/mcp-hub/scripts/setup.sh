#!/bin/bash
# First-time setup for Unified MCP Hub
# This script helps users configure their environment for MCP server management

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
HUB_DIR="$(dirname "$SCRIPT_DIR")"
TNF_DIR="$(dirname "$(dirname "$HUB_DIR")")"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}        Unified MCP Hub - First Time Setup                  ${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Detect environment
echo -e "${YELLOW}Detecting environment...${NC}"
echo "  Home: $HOME"
echo "  TNF Path: $TNF_DIR"
echo "  Hub Path: $HUB_DIR"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js not found. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}Node.js 18+ required. Current: $(node -v)${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v) detected${NC}"

# Check for required environment variables
echo ""
echo -e "${YELLOW}Checking environment variables...${NC}"

check_env() {
    local var_name=$1
    local description=$2
    local required=$3

    if [ -n "${!var_name}" ]; then
        echo -e "${GREEN}✓ $var_name is set${NC}"
        return 0
    else
        if [ "$required" = "required" ]; then
            echo -e "${RED}✗ $var_name is NOT set ($description)${NC}"
            return 1
        else
            echo -e "${YELLOW}○ $var_name is optional ($description)${NC}"
            return 0
        fi
    fi
}

# Optional environment variables
check_env "GITHUB_TOKEN" "GitHub API access" "optional"
check_env "REDIS_URL" "Redis connection" "optional"
check_env "DRS_API_URL" "MCP Discovery Service" "optional"

echo ""

# Install Claude Code skills
echo -e "${YELLOW}Installing Claude Code skills...${NC}"
CLAUDE_COMMANDS="$HOME/.claude/commands"

if [ ! -d "$CLAUDE_COMMANDS" ]; then
    mkdir -p "$CLAUDE_COMMANDS"
    echo "  Created $CLAUDE_COMMANDS"
fi

# Create mcp-sync skill
cat > "$CLAUDE_COMMANDS/mcp-sync.md" << 'SKILL_EOF'
# Unified MCP Sync

Synchronize MCP server configurations across all AI clients from the master registry.

## Overview

The Unified MCP Hub maintains a single source of truth for all MCP server configurations. This skill generates client-specific configs for:

- Claude Desktop
- Claude Code
- Gemini CLI
- Gemini Antigravity
- GitHub Copilot
- Cursor
- Factory Bridge
- Theia IDE

## Usage

Run the sync with a profile:

```bash
# Sync core profile to all clients (default)
pnpm --filter @the-new-fuse/mcp-hub run sync:core

# Or use the script directly
$MCP_HUB_PATH/scripts/sync-all.sh core --all

# Sync minimal profile
pnpm --filter @the-new-fuse/mcp-hub run sync:minimal

# Sync full profile
pnpm --filter @the-new-fuse/mcp-hub run sync:full
```

## Available Profiles

| Profile | Description | Token Budget |
|---------|-------------|--------------|
| `minimal` | Filesystem only | Low |
| `core` | Core TNF servers (skills, relay, config) | Medium |
| `google` | Google Workspace (Docs, Drive, YouTube) | Medium |
| `development` | Dev tools (GitHub, DevTools, thinking) | Medium |
| `infrastructure` | Cloud (Redis, Cloudflare) | Low |
| `full` | All servers | High |

## Master Registry Location

`packages/mcp-hub/config/master-registry.json` in The New Fuse project.

## Token Efficiency Features

1. **Skill Wrappers**: Servers marked with `skillWrapper` have lightweight skills (~100 tokens) that load full context on-demand
2. **Deferred Loading**: Servers with `deferLoading: true` are discovered via Tool Search
3. **Profile System**: Only load servers you need for the current task
4. **Tool Search**: Automatically enabled in Claude Code settings

## Instructions

When the user wants to sync MCP configurations:

1. Ask which profile they want (or use `core` as default)
2. Run the sync script with the chosen profile
3. Remind them to restart their AI applications

$ARGUMENTS can be: profile name, client names, or flags like --all
SKILL_EOF

echo -e "${GREEN}✓ Created /mcp-sync skill${NC}"

# Create mcp-profile skill
cat > "$CLAUDE_COMMANDS/mcp-profile.md" << 'SKILL_EOF'
# MCP Profile Switcher

Quickly switch between MCP server profiles to optimize token usage.

## Profiles

| Profile | Servers | Token Cost | Best For |
|---------|---------|------------|----------|
| `minimal` | filesystem | ~500 | Quick file operations |
| `core` | filesystem, tnf-skills, tnf-relay, tnf-config | ~2000 | TNF development |
| `google` | google-docs, google-drive, youtube | ~3000 | Google Workspace |
| `development` | filesystem, github, devtools, sequential-thinking | ~3500 | Coding |
| `infrastructure` | redis, cloudflare-* | ~1500 | Cloud/DevOps |
| `full` | All servers | ~10000+ | Maximum capability |

## Usage

To switch profiles:

```bash
pnpm --filter @the-new-fuse/mcp-hub run sync:<profile>
```

Or with specific clients:

```bash
node packages/mcp-hub/scripts/generate-configs.js <profile> claude-desktop gemini-cli
```

## Current Profile

Check which servers are active in your current session with the `/mcp` command.

$ARGUMENTS should be the profile name to switch to
SKILL_EOF

echo -e "${GREEN}✓ Created /mcp-profile skill${NC}"

# Enable Tool Search in Claude Code
echo ""
echo -e "${YELLOW}Configuring Claude Code settings...${NC}"

CLAUDE_SETTINGS="$HOME/.claude/settings.json"
if [ -f "$CLAUDE_SETTINGS" ]; then
    # Check if ENABLE_TOOL_SEARCH is already set
    if grep -q "ENABLE_TOOL_SEARCH" "$CLAUDE_SETTINGS"; then
        echo -e "${GREEN}✓ Tool Search already configured${NC}"
    else
        # Use node to safely modify JSON
        node -e "
        const fs = require('fs');
        const settings = JSON.parse(fs.readFileSync('$CLAUDE_SETTINGS', 'utf8'));
        settings.env = settings.env || {};
        settings.env.ENABLE_TOOL_SEARCH = 'auto';
        fs.writeFileSync('$CLAUDE_SETTINGS', JSON.stringify(settings, null, 2));
        console.log('Added ENABLE_TOOL_SEARCH to settings');
        "
        echo -e "${GREEN}✓ Enabled Tool Search in Claude Code${NC}"
    fi
else
    # Create new settings file
    cat > "$CLAUDE_SETTINGS" << 'SETTINGS_EOF'
{
  "env": {
    "ENABLE_TOOL_SEARCH": "auto"
  }
}
SETTINGS_EOF
    echo -e "${GREEN}✓ Created Claude Code settings with Tool Search${NC}"
fi

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "  1. Run a sync to configure your AI clients:"
echo "     pnpm --filter @the-new-fuse/mcp-hub run sync:core"
echo ""
echo "  2. Restart your AI applications:"
echo "     - Claude Desktop: Quit and reopen"
echo "     - Gemini CLI: Close and reopen terminal"
echo "     - VS Code/Cursor: Reload window"
echo ""
echo "  3. Verify with: /mcp in any Claude session"
echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
