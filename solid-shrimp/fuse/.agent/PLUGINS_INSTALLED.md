# Installed Claude Code Plugins

**Date**: December 29, 2025 **Status**: ✅ All recommended plugins installed and
verified

---

## ✅ Installed Plugins (3)

### 1. typescript-lsp

**Status**: ✅ Installed and configured **Version**: 5.1.3 **Location**:
`~/.claude/plugins/typescript-lsp/` **Language Server**:
`typescript-language-server` (installed globally)

**Features**:

- Go-to-definition for TypeScript/JavaScript
- Find all references
- Hover documentation
- Error checking and diagnostics
- Autocomplete suggestions

**Supported Extensions**: `.ts`, `.tsx`, `.js`, `.jsx`, `.mts`, `.cts`, `.mjs`,
`.cjs`

**Verification**:

```bash
$ which typescript-language-server
/path/to/.nvm/versions/node/v24.12.0/bin/typescript-language-server

$ typescript-language-server --version
5.1.3
```

**Usage**: Automatically activated for TypeScript/JavaScript files. No commands
needed - just edit TypeScript files and enjoy enhanced code intelligence!

---

### 2. hookify

**Status**: ✅ Installed **Location**: `~/.claude/plugins/hookify/`

**Features**:

- 🎯 Analyze conversations to find unwanted behaviors automatically
- 📝 Simple markdown configuration files with YAML frontmatter
- 🔍 Regex pattern matching for powerful rules
- 🚀 No coding required - just describe the behavior
- 🔄 Easy enable/disable without restarting

**Commands Available**:

- `/hookify` - Create new hook from description
- `/hookify:list` - List all configured hooks
- `/hookify:configure` - Enable/disable hooks interactively
- `/hookify:help` - Get help with hookify

**Already Created Hooks** (in `~/.claude/`):

1. `hookify.format-typescript.local.md` - Remind to format TypeScript
2. `hookify.block-production-edits.local.md` - Block editing build artifacts
3. `hookify.dangerous-commands.local.md` - Prevent destructive commands
4. `hookify.require-tests.local.md` - Test reminder before commits
5. `hookify.schema-changes.local.md` - Guide DB migration process

**Quick Examples**:

```bash
# Create a new hook
/hookify Don't allow console.log in production code

# List all hooks
/hookify:list

# Configure hooks
/hookify:configure
```

**Note**: Hooks activate immediately - no restart required!

---

### 3. code-review

**Status**: ✅ Installed **Location**: `~/.claude/plugins/code-review/`

**Features**:

- Multiple independent agents for comprehensive review
- Confidence-based scoring (threshold: 80) reduces false positives
- CLAUDE.md compliance checking
- Bug detection focused on changes
- Historical context analysis via git blame
- Automatic skipping of closed/draft/already-reviewed PRs

**How It Works**:

1. Checks if review is needed
2. Gathers CLAUDE.md guideline files
3. Summarizes PR changes
4. Launches 4 parallel review agents:
   - **Agents #1 & #2**: CLAUDE.md compliance
   - **Agent #3**: Bug detection
   - **Agent #4**: Git history context analysis
5. Scores each issue 0-100 for confidence
6. Filters issues below 80 confidence
7. Posts review comment with high-confidence issues

**Command**:

```bash
# On a PR branch
/code-review
```

**Output**: Posts GitHub comment with actionable, high-confidence feedback only.

---

## 📊 Plugin Summary

| Plugin             | Type             | Features                      | Commands              |
| ------------------ | ---------------- | ----------------------------- | --------------------- |
| **typescript-lsp** | LSP Integration  | Code intelligence for TS/JS   | None (auto-activated) |
| **hookify**        | Development Tool | Easy hook creation/management | 4 commands            |
| **code-review**    | Automation       | Automated PR reviews          | 1 command             |

---

## 🚀 Usage Guide

### TypeScript LSP

**Automatic** - Just open or edit TypeScript/JavaScript files:

- Hover over symbols for documentation
- Click to go to definition
- Find all references
- See inline errors and warnings

### Hookify

**Interactive** - Use slash commands:

```bash
# Create hooks from natural language
/hookify Block commits without tests

# Manage existing hooks
/hookify:list
/hookify:configure
```

### Code Review

**On-demand** - Run when reviewing PRs:

```bash
# Switch to PR branch
git checkout feature-branch

# Run automated review
/code-review

# Review the posted GitHub comment
```

---

## 🔧 Configuration Locations

**Plugins**:

- Installed plugins: `~/.claude/plugins/`
- Plugin registry: `~/.claude/plugins/installed_plugins.json`

**Hookify Rules**:

- User hooks: `~/.claude/hookify.*.local.md`
- Plugin hooks: `~/.claude/plugins/hookify/hooks/`
- Examples: `~/.claude/plugins/hookify/examples/`

**TypeScript LSP**:

- Binary:
  `/path/to/.nvm/versions/node/v24.12.0/bin/typescript-language-server`
- Config: Auto-discovered from project's `tsconfig.json`

**Code Review**:

- Agents: `~/.claude/plugins/code-review/agents/`
- No additional configuration needed

---

## ✅ Verification

All plugins have been:

- ✅ Copied to `~/.claude/plugins/`
- ✅ Registered in `installed_plugins.json`
- ✅ Dependencies installed (TypeScript LSP)
- ✅ Commands verified as available
- ✅ Hooks created and ready to use

---

## 🎯 Next Steps

### Immediate Usage

1. **Test TypeScript LSP**:
   - Open any `.ts` file in The New Fuse
   - Hover over a symbol
   - You should see documentation!

2. **Test Hookify**:

   ```bash
   /hookify:list
   ```

   You should see the 5 pre-configured hooks

3. **Test Code Review**:
   ```bash
   # On a feature branch
   /code-review
   ```

### Create More Hooks

Add project-specific protections:

```bash
/hookify Don't modify .env files directly
/hookify Warn when adding new dependencies
/hookify Block commits to main branch
```

### Use Code Review

Make it part of your workflow:

1. Create a PR on GitHub
2. Check out the branch locally
3. Run `/code-review`
4. Review the automated feedback
5. Fix issues before merging

---

## 📚 Documentation

**TypeScript LSP**:

- [npm package](https://www.npmjs.com/package/typescript-language-server)
- [GitHub](https://github.com/typescript-language-server/typescript-language-server)

**Hookify**:

- Plugin README: `~/.claude/plugins/hookify/README.md`
- Examples: `~/.claude/plugins/hookify/examples/`

**Code Review**:

- Plugin README: `~/.claude/plugins/code-review/README.md`
- Agents directory: `~/.claude/plugins/code-review/agents/`

---

## 🎉 Installation Complete!

All three recommended plugins are now installed and ready to use:

✅ **typescript-lsp** - Enhanced TypeScript/JavaScript code intelligence ✅
**hookify** - Easy hook creation and management (5 hooks pre-configured) ✅
**code-review** - Automated PR review with confidence scoring

**Restart Claude Code to activate all plugins!**
