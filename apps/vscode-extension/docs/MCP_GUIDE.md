# The New Fuse MCP Guide

**For VS Code Extension v9.1.0+**

## 1. Overview

The Model Context Protocol (MCP) Configuration System in The New Fuse allows you
to seamlessly integrate, manage, and utilize various MCP servers across your
development workflow.

### Key Features

- **Rich Menu Interface**: Easy-to-use dropdowns and wizards.
- **Multi-Tenant Preferences**: Personalized settings for each user.
- **Per-Agent Logic**: Configure specific servers for individual AI agents.
- **Workflow Integration**: Assign servers to specific workflow steps.
- **Server Discovery**: Browse and connect to 10+ pre-configured servers.
- **Tool Discovery Protocol**: Dynamic tool loading with ~85% token reduction
  (v9.1.0+).

---

## 2. Quick Access

### Main Menu

Click the **shopping cart icon** (🛒) in the toolbar to open the MCP
Marketplace.

| Icon                | Option                   | Description                                  |
| ------------------- | ------------------------ | -------------------------------------------- |
| $(server)           | **Browse MCP Servers**   | View all available servers and their details |
| $(plug)             | **Connect to Server**    | Establish a connection to a server           |
| $(tools)            | **View Available Tools** | Browse capabilities across all servers       |
| $(person)           | **User Preferences**     | Manage your personal MCP settings            |
| $(robot)            | **Agent Configuration**  | Configure MCP for specific agents            |
| $(symbol-namespace) | **Workflow Integration** | setup MCP for workflows                      |
| $(add)              | **Add Custom Server**    | Register your own MCP server                 |

---

## 3. Global Configuration

The system automatically loads base server configurations from:
`/data/mcp_config.json`

### Core Available Servers

| Priority | Server                       | Description                    | Tag          |
| -------- | ---------------------------- | ------------------------------ | ------------ |
| 12       | **chrome-devtools**          | Browser automation & debugging | `automation` |
| 11       | **tnf-enhanced-mcp-server**  | Enhanced API integration       | `core`       |
| 10       | **tnf-complete-api-wrapper** | 80+ platform tools             | `api`        |
| 9        | **tnf-mcp-config-manager**   | Universal config management    | `config`     |

_Other servers include: `agent-communication`, `context7-server`, `browsermcp`,
and more._

---

## 4. User Preferences

Manage your personal settings via **$(person) User Preferences**.

### Quick Actions

- **Enable/Disable Servers**: Use the multi-select menu (✓ = enabled, ○ =
  disabled).
- **Set Default Server**: Choose a primary server for general tasks.
- **Server Overrides**: Customize command arguments or environment variables.
- **Export Preferences**: Save your settings to a JSON file for backup or
  sharing.

**Configuration Storage**: Preferences are stored securely in the VS Code
**Global State** (encrypted) and are isolated per user.

---

## 5. Agent Configuration

tailor MCP access for specific AI agents via **$(robot) Agent Configuration**.

### Creating an Agent Profile

1. Select **Create Agent Config**.
2. Enter a unique **Agent Name** (e.g., "Research Bot").
3. Select **Enabled Servers** from the list.
4. (Optional) Define **Required Capabilities** or **Tool Restrictions**.

### Configuration Fields

| Field                  | Description                              |
| ---------------------- | ---------------------------------------- |
| `agentId`              | Unique ID (auto-generated)               |
| `enabledServers`       | List of servers accessible to this agent |
| `requiredCapabilities` | Features the agent MUST have             |
| `priorityServers`      | Servers to prefer when tools overlap     |
| `toolRestrictions`     | Whitelist or blacklist specific tools    |

---

## 6. Workflow Integration

Assign MCP resources to workflow steps via **$(symbol-namespace) Workflow
Integration**.

### Setup Wizard

1. Select **Create Workflow Config**.
2. Enter **Workflow Name**.
3. Select **Required Servers** (critical for execution).
4. Select **Optional Servers** (nice-to-have features).

### Per-Step Configuration

You can granularly control which servers are active for each step of a workflow:

```typescript
// Example: "E-commerce Pipeline"
stepMCPConfig: {
  "step-1-scrape": ["chrome-devtools"],
  "step-2-process": ["tnf-complete-api-wrapper"],
  "step-3-db-save": ["tnf-enhanced-mcp-server"]
}
```

---

## 7. Server Management

### Browsing Servers

Select **$(server) Browse MCP Servers** to view rich details:

- **Description** & **Priority**
- **Tags** (e.g., `api`, `platform`, `automation`)
- **Capabilities** (searchable list of features)

### Connecting

Select **$(plug) Connect** to establish a connection. **Status Indicators**:

- ✓ **Active**: Connected and ready.
- ○ **Inactive**: Disconnected.
- ⚠ **Warning**: Configuration issue detected.
- 🔒 **Secure**: Connection is encrypted.

### Adding Custom Servers

Use the **$(add) Add Custom Server** wizard:

1. **ID**: Unique identifier (e.g., `my-custom-server`).
2. **Command**: Execution command (e.g., `npx`, `python`).
3. **Arguments**: Command flags (e.g., `-y @my/server start`).
4. **Environment**: Custom variables (e.g., `API_KEY=xyz`).

---

## 8. Configuration Hierarchy

When multiple configurations exist, the system applies settings in this order
(highest priority first):

1. **Workflow Step Config** (Overrides everything for that specific step)
2. **Agent Config** (Overrides user defaults for that agent)
3. **User Preferences** (Overrides system defaults)
4. **Global Config** (System-wide base settings)

---

## 9. Troubleshooting

| Problem                | Potential Solution                                                 |
| ---------------------- | ------------------------------------------------------------------ |
| **Server not showing** | Check "User Preferences" to ensure it's enabled.                   |
| **Connection failed**  | Verify command paths and environment variables in settings.        |
| **Config not saving**  | Ensure VS Code has permission to write to Global State.            |
| **Wrong server used**  | Check the Configuration Hierarchy; lower levels may be overridden. |

---

---

## 10. Tool Discovery Protocol (v9.1.0+)

The New Fuse now implements Anthropic's Tool Discovery Protocol for dynamic tool
loading, reducing token usage by ~85% when working with large tool libraries.

### How It Works

1. **Tool Deferral**: Tools are marked with `defer_loading: true` and not loaded
   into context initially.
2. **Tool Search**: When Claude needs a tool, it uses `tool_search_tool_*` to
   discover relevant tools.
3. **On-Demand Loading**: Discovered tools are loaded into the active context.

### Configuration

Configure tool search via VSCode settings (`theNewFuse.toolSearch.*`):

| Setting              | Default              | Description                            |
| -------------------- | -------------------- | -------------------------------------- |
| `enabled`            | `true`               | Enable/disable Tool Discovery Protocol |
| `maxResults`         | `5`                  | Maximum tools returned per search      |
| `defaultMethod`      | `bm25`               | Search algorithm (regex or bm25)       |
| `alwaysLoadedTools`  | `["read_file", ...]` | Tools never deferred                   |
| `deferredCategories` | `["google", ...]`    | Categories deferred by default         |

### Per-Server Configuration

Each MCP server can be configured for tool deferral:

```json
{
  "name": "my-server",
  "command": "npx",
  "args": ["@my/mcp-server"],
  "enabled": true,
  "default_defer_loading": true,
  "always_loaded_tools": ["critical_tool"]
}
```

### Search Methods

| Method    | Tool Name                         | Use Case                 |
| --------- | --------------------------------- | ------------------------ |
| **BM25**  | `tool_search_tool_bm25_20251119`  | Natural language queries |
| **Regex** | `tool_search_tool_regex_20251119` | Exact pattern matching   |

### Performance Benefits

- **~85% token reduction** for tool definitions
- **Improved accuracy** (Opus 4: 49%→74%, Opus 4.5: 79.5%→88.1%)
- **Scalable** to 10,000+ tools

### External Documentation

- [Anthropic Tool Search Docs](https://platform.claude.com/docs/en/agents-and-tools/tool-use/tool-search-tool)

---

## Support

- **Documentation**: Access full guides in the `docs/` folder.
- **Issues**: Report bugs via GitHub Issues.
- **Community**: Join The New Fuse developer forum.
