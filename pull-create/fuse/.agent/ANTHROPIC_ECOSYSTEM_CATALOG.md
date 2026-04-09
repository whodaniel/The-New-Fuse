# Anthropic Claude Code Ecosystem Catalog

**Date**: December 29, 2025 **Status**: ✅ Complete Discovery & Documentation

## Repository Summary

### 1. Skills Repository

**URL**: [github.com/anthropics/skills](https://github.com/anthropics/skills)
**Location**: `~/.claude/skills/` **Count**: 16 official Anthropic skills
**Status**: ✅ Loaded into TNF at `.agent/skills/anthropic/`

### 2. Official Plugins Repository

**URL**:
[github.com/anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official)
**Location**: `~/.claude/plugins-official/` **Count**: 23 internal + 13 external
plugins **Status**: ✅ Cloned and cataloged

---

## 📦 Official Anthropic Plugins (23)

### Language Server Protocol (LSP) Integrations (9)

Provides code intelligence features (go-to-definition, find references, hover
documentation):

1. **typescript-lsp** - TypeScript/JavaScript LSP integration
2. **pyright-lsp** - Python LSP via Pyright
3. **rust-analyzer-lsp** - Rust LSP integration
4. **gopls-lsp** - Go LSP integration
5. **jdtls-lsp** - Java LSP (Eclipse JDT)
6. **clangd-lsp** - C/C++ LSP integration
7. **csharp-lsp** - C# LSP integration
8. **swift-lsp** - Swift LSP integration
9. **lua-lsp** - Lua LSP integration
10. **php-lsp** - PHP LSP integration

### Development Workflow (8)

11. **feature-dev** - Feature development workflows
12. **code-review** - Code review assistance
13. **pr-review-toolkit** - Pull request review tools
14. **commit-commands** - Git commit helpers
15. **agent-sdk-dev** - Claude Agent SDK development tools
16. **plugin-dev** - Plugin development utilities
17. **hookify** - Easy hook creation and management
18. **security-guidance** - Security best practices

### Output Styling (2)

19. **explanatory-output-style** - Detailed explanatory responses
20. **learning-output-style** - Educational response format

### Design & UI (1)

21. **frontend-design** - Frontend design patterns and best practices

### Examples & Fun (2)

22. **example-plugin** - Comprehensive plugin example
23. **ralph-wiggum** - Example fun plugin

---

## 🌐 External/Partner Plugins (13)

### Project Management & Collaboration (4)

1. **linear** - Linear issue tracking integration
2. **asana** - Asana task management
3. **slack** - Slack workspace integration
4. **github** - GitHub repository management
5. **gitlab** - GitLab integration

### Development Tools (5)

6. **context7** - Context management and memory
7. **greptile** - Advanced code search
8. **playwright** - Browser automation testing
9. **laravel-boost** - Laravel framework enhancements
10. **serena** - Development assistant

### Backend Services (3)

11. **firebase** - Firebase integration
12. **supabase** - Supabase backend integration
13. **stripe** - Stripe payment processing

---

## 🪝 Hooks System

### Hook Events Available

- **PreToolUse** - Runs before tool calls, can block them
- **PostToolUse** - Runs after tool execution
- **PermissionRequest** - Runs when permission dialog shown
- **UserPromptSubmit** - Runs when user submits a prompt
- **Stop** - Runs when Claude Code session ends

### Hook Use Cases

- **Notifications** - Alert on specific actions
- **Automatic formatting** - Run prettier, eslint, gofmt after edits
- **Logging** - Track all executed commands
- **Automated feedback** - Guide Claude to follow conventions
- **Access control** - Block modifications to sensitive files/directories

### Hookify Plugin Features

- 🎯 Analyze conversations to find unwanted behaviors automatically
- 📝 Simple markdown configuration files with YAML frontmatter
- 🔍 Regex pattern matching for powerful rules
- 🚀 No coding required - just describe the behavior
- 🔄 Easy enable/disable without restarting

**Example Hooks:**

```bash
/hookify Warn me when I use rm -rf commands
/hookify Don't use console.log in TypeScript files
/hookify Block modifications to production files
```

---

## 📑 Slash Commands Framework

### Built-in Slash Commands

- `/help` - Get help with Claude Code
- `/plugin` - Manage plugins
- `/mcp` - Manage MCP servers
- `/hooks` - Manage hooks
- `/memory` - Memory management
- `/commit` - Git commit helpers

### Custom Slash Commands

**Location**: `.claude/commands/`

**Structure**:

```
.claude/commands/
├── command-name.md           # Simple command
└── namespace/
    └── subcommand.md        # Namespaced: /namespace:subcommand
```

**Example**: `.claude/commands/frontend/component.md`

```markdown
---
name: Create React Component
description: Generate a new React component with TypeScript
---

Create a new React component named {{name}} with:

- TypeScript
- Props interface
- Export statement
- Basic styling setup
```

**Usage**: `/frontend:component`

---

## 🔧 Plugin Structure

Standard plugin directory layout:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json          # Plugin metadata (required)
├── .mcp.json                # MCP server configuration (optional)
├── commands/                # Slash commands (optional)
│   └── command-name.md
├── agents/                  # Agent definitions (optional)
│   └── agent-name.md
├── skills/                  # Skill definitions (optional)
│   └── SKILL.md
├── hooks/                   # Hook scripts (optional)
│   └── hooks.json
└── README.md                # Documentation
```

### Plugin Metadata Example

```json
{
  "name": "my-plugin",
  "description": "Plugin description",
  "author": {
    "name": "Author Name",
    "email": "author@example.com"
  }
}
```

---

## 🚀 Installation & Usage

### Installing Plugins

```bash
# From official directory
/plugin install {plugin-name}@claude-plugin-directory

# Or browse interactively
/plugin > Discover
```

### Installing Skills

```bash
# Register skills repository as plugin marketplace
/plugin install document-skills@anthropic-agent-skills

# Skills become available automatically
```

### Managing Hooks

```bash
# Create hook from description
/hookify Don't use console.log in production code

# List all hooks
/hookify:list

# Configure hooks interactively
/hookify:configure
```

---

## 📊 TNF Integration Status

### ✅ Completed

- [x] Cloned Anthropic skills repository
- [x] Loaded 16 Anthropic skills into TNF
- [x] Created skills manifest
- [x] Rebuilt TNF Skills MCP server
- [x] Cloned official plugins repository
- [x] Documented all available plugins
- [x] Cataloged hooks system
- [x] Documented slash commands framework

### ⏭️ Next Steps

1. Install useful plugins for TNF development:
   - `typescript-lsp` - TypeScript intelligence
   - `hookify` - Hook management
   - `code-review` - Code review assistance
   - `security-guidance` - Security best practices

2. Create custom TNF slash commands:
   - `/tnf:agent` - Create new agent
   - `/tnf:skill` - Create new skill
   - `/tnf:mcp` - Create MCP server
   - `/tnf:workflow` - Generate n8n workflow

3. Set up hooks for TNF project:
   - Auto-format TypeScript files
   - Block commits without tests
   - Validate schema changes
   - Enforce security patterns

---

## 📚 Documentation References

- [Claude Code Plugins](https://www.anthropic.com/news/claude-code-plugins)
- [Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [Discover Plugins](https://code.claude.com/docs/en/discover-plugins)
- [Plugin Development](https://code.claude.com/docs/en/plugins)
- [Anthropic Skills Repo](https://github.com/anthropics/skills)
- [Official Plugins Repo](https://github.com/anthropics/claude-plugins-official)
- [Claude Code Repo](https://github.com/anthropics/claude-code)

---

## 🎯 Recommended Plugins for TNF

**Essential Development:**

1. `typescript-lsp` - Critical for TypeScript development
2. `hookify` - Enforce TNF conventions
3. `code-review` - Automated code review
4. `security-guidance` - Security best practices

**Nice to Have:** 5. `github` - GitHub integration (if not using built-in) 6.
`context7` - Enhanced context management 7. `playwright` - E2E testing (already
have webapp-testing skill)

**External Services (if using):** 8. `stripe` - If implementing payments 9.
`supabase` - If using Supabase 10. `linear` - If using Linear for project
management
