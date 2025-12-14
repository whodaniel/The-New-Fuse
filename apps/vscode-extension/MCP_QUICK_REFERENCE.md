# MCP Quick Reference - The New Fuse v7.4.0

## 🚀 Quick Access

**Main Entry**: Click shopping cart icon 🛒 in toolbar

---

## 📋 Main Menu

```
🛒 MCP Marketplace
├─ $(server) Browse MCP Servers        → View all available servers
├─ $(plug) Connect to Server           → Connect to a server
├─ $(tools) View Available Tools       → Browse server capabilities
├─ $(person) User Preferences          → Manage your settings
├─ $(robot) Agent Configuration        → Configure agents
├─ $(symbol-namespace) Workflow        → Configure workflows
└─ $(add) Add Custom Server            → Add your own server
```

---

## 👤 User Preferences

### Quick Actions
| Action | Steps |
|--------|-------|
| **Enable Servers** | 🛒 → User Preferences → Enable/Disable Servers |
| **Set Default** | 🛒 → User Preferences → Set Default Server |
| **View Enabled** | 🛒 → User Preferences → View Enabled Servers |
| **Export Config** | 🛒 → User Preferences → Export Preferences |

### Configuration Storage
- Location: VSCode Global State
- Per-user isolation: ✅
- Sync across workspaces: ✅
- Encrypted storage: ✅

---

## 🤖 Agent Configuration

### Create Agent Config
```
1. 🛒 → Agent Configuration → Create Agent Config
2. Enter agent name
3. Select servers (multi-select)
4. Save
```

### Agent Config Fields
| Field | Description |
|-------|-------------|
| `agentId` | Unique identifier (auto-generated) |
| `agentName` | Human-readable name |
| `enabledServers` | List of accessible servers |
| `requiredCapabilities` | Must-have features |
| `priorityServers` | Preferred servers |
| `toolRestrictions` | Optional whitelist/blacklist |

---

## 🔄 Workflow Integration

### Create Workflow Config
```
1. 🛒 → Workflow Integration → Create Workflow Config
2. Enter workflow name
3. Select required servers
4. (Optional) Select optional servers
5. Save
```

### Per-Step Configuration
```typescript
{
  stepMCPConfig: {
    "step-1": ["server-a", "server-b"],
    "step-2": ["server-c"],
    "step-3": ["server-a", "server-c"]
  }
}
```

---

## 🔍 Browse Servers

### Available Servers (10)

| Priority | Server | Description |
|----------|--------|-------------|
| 12 | `chrome-devtools` | Browser automation & debugging |
| 11 | `tnf-enhanced-mcp-server` | Enhanced API integration |
| 10 | `tnf-complete-api-wrapper` | 80+ platform tools |
| 9 | `tnf-mcp-config-manager` | Universal config management |
| - | `agent-communication` | Inter-agent messaging |
| - | `context7-server` | Context management |
| - | `applescript_execute` | macOS automation |
| - | `unified-config-server` | HTTP config interface |
| - | `browsermcp` | Web automation |
| - | `MCP_DOCKER` | Container management |

### Server Details View
```
📄 View Details
  → Full configuration in markdown

📋 View Capabilities
  → Searchable capability list

🔌 Connect
  → Establish connection

⚙️ Configure
  → Customize settings
```

---

## ➕ Add Custom Server

### Quick Add
```
1. 🛒 → Add Custom Server
2. Server ID: my-server
3. Command: npx
4. Arguments: my-tool arg1 arg2
5. Description: (optional)
6. Save
```

### Custom Server Example
```typescript
{
  command: "npx",
  args: ["@mycompany/mcp-server", "--port", "8080"],
  description: "My Company MCP Server",
  env: {
    API_KEY: "xxx",
    BASE_URL: "https://api.example.com"
  }
}
```

---

## 🔧 Configuration Hierarchy

```
Priority (High to Low):
1. Workflow Step Config    (most specific)
2. Agent Config
3. User Preferences
4. Global Config           (default)
```

### Example
```
Global:     10 servers enabled
  ↓
User:       7 servers enabled (disabled 3)
  ↓
Agent:      4 servers enabled (subset)
  ↓
Workflow:   2 servers enabled (specific step)
```

Result: **2 servers** used for that workflow step

---

## 🏷️ Server Tags

### Common Tags
| Tag | Purpose | Example Servers |
|-----|---------|-----------------|
| `api` | API integration | tnf-complete-api-wrapper |
| `automation` | Process automation | chrome-devtools, browsermcp |
| `core` | Core platform | tnf-enhanced-mcp-server |
| `monitoring` | System monitoring | tnf-enhanced-mcp-server |
| `browser` | Browser control | chrome-devtools, browsermcp |
| `platform` | Platform features | tnf-complete-api-wrapper |

### Filter by Tags
```typescript
// Get automation servers
const servers = configManager.getServersByTags(['automation']);

// Get core + API servers
const servers = configManager.getServersByTags(['core', 'api']);
```

---

## 🎯 Common Use Cases

### Use Case 1: Research Agent
```
Agent: "Research Agent"
Servers:
  ✓ chrome-devtools (web scraping)
  ✓ browsermcp (navigation)
  ✓ context7-server (context tracking)
Capabilities:
  - Web navigation
  - Content extraction
  - Data collection
```

### Use Case 2: API Integration
```
Agent: "API Agent"
Servers:
  ✓ tnf-complete-api-wrapper
  ✓ tnf-enhanced-mcp-server
Capabilities:
  - Authentication
  - API calls
  - Webhook management
```

### Use Case 3: Data Processing Workflow
```
Workflow: "ETL Pipeline"
Step 1 (Extract):
  - chrome-devtools (web scraping)
Step 2 (Transform):
  - tnf-complete-api-wrapper (data processing)
Step 3 (Load):
  - tnf-enhanced-mcp-server (storage)
```

---

## 🔐 Security Quick Tips

### API Keys
- ✅ Stored in VSCode secrets (encrypted)
- ✅ Never logged or displayed
- ✅ Per-user isolated
- ❌ Never committed to git

### Permissions
```
User Permissions:
  - mcp.manage → Manage MCP settings
  - mcp.connect → Connect to servers

Agent Permissions:
  - agent.configure → Configure agent MCP
  - agent.execute → Use agent tools

Workflow Permissions:
  - workflow.configure → Configure workflow MCP
  - workflow.execute → Run workflows
```

---

## ⌨️ Keyboard Shortcuts

### Planned (Future Release)
```
Ctrl+Alt+M       → Open MCP Marketplace
Ctrl+Alt+U       → User Preferences
Ctrl+Alt+A       → Agent Configuration
Ctrl+Alt+W       → Workflow Configuration
Ctrl+Alt+C       → Connect to Server
```

---

## 📊 Status Indicators

### Server Status
| Icon | Status | Meaning |
|------|--------|---------|
| ✓ | Enabled | Server is active |
| ○ | Disabled | Server is inactive |
| ⚠ | Warning | Configuration issue |
| ✗ | Error | Connection failed |
| 🔒 | Secure | Encrypted connection |

### Configuration Status
| Icon | Status | Meaning |
|------|--------|---------|
| $(star) | Custom | User-added server |
| $(server) | Global | System server |
| $(check) | Active | Currently in use |
| $(circle-slash) | Disabled | Explicitly disabled |

---

## 🛠️ Troubleshooting

### Problem: Server not showing
```
Solution:
1. Check User Preferences → View Enabled Servers
2. Verify server in global config
3. Reload window (Ctrl+Shift+P → "Reload Window")
```

### Problem: Connection failed
```
Solution:
1. Check server command/args
2. Verify environment variables
3. Review console logs (Help → Toggle Developer Tools)
4. Test server manually: `npx [server-command]`
```

### Problem: Config not saving
```
Solution:
1. Check VSCode storage permissions
2. View Output → The New Fuse (for errors)
3. Try: Ctrl+Shift+P → "Developer: Reload Window"
```

---

## 📝 Configuration Files

### Global Config
```
Location: /path/to/The-New-Fuse/data/mcp_config.json
Format: JSON
Editable: Yes (requires reload)
```

### User Preferences
```
Storage: VSCode Global State
Format: Encrypted binary
Editable: Via UI only
Location: ~/.vscode/globalStorage/
```

### Agent/Workflow Configs
```
Storage: VSCode Global State
Format: Encrypted binary
Editable: Via UI only
Export: JSON format
```

---

## 🔄 Import/Export

### Export User Preferences
```
1. 🛒 → User Preferences → Export Preferences
2. Choose location
3. Save as JSON
```

### Import (Manual)
```json
{
  "userId": "user@example.com",
  "enabledServers": ["server-1", "server-2"],
  "defaultServer": "server-1",
  "customServers": {
    "my-server": {
      "command": "npx",
      "args": ["my-tool"]
    }
  }
}
```

---

## 📞 Quick Help

| Need Help With | Solution |
|----------------|----------|
| General usage | Read MCP_CONFIGURATION_GUIDE.md |
| Quick reference | This file |
| Release notes | V7.4.0_RELEASE_NOTES.md |
| Issues | GitHub Issues |
| Features | Documentation → FEATURES.md |

---

## 🎓 Training Resources

### Beginner
1. Browse available servers
2. Enable/disable servers in User Preferences
3. Set a default server

### Intermediate
1. Create agent configurations
2. Add custom servers
3. Export/import preferences

### Advanced
1. Create workflow configurations
2. Configure per-step MCP servers
3. Use tool mappings
4. Filter servers by capabilities

---

## 💡 Pro Tips

### Tip 1: Use Tags for Organization
```
Tag servers by purpose:
- Development servers: tag with 'dev'
- Production servers: tag with 'prod'
- Testing servers: tag with 'test'
```

### Tip 2: Create Agent Templates
```
Create base agent configs:
- "Web Agent" → browser automation
- "API Agent" → API integration
- "Data Agent" → data processing
```

### Tip 3: Workflow Planning
```
Plan workflows before creating configs:
1. List required steps
2. Identify needed capabilities per step
3. Map servers to steps
4. Test with minimal server set
```

### Tip 4: Server Priority
```
Higher priority = preferred in conflicts
- Core platform: priority 10-12
- Utilities: priority 5-9
- Optional: priority 1-4
```

### Tip 5: Regular Maintenance
```
Monthly tasks:
- Review enabled servers
- Update custom server configs
- Export backup of preferences
- Test agent configurations
```

---

## 📈 Metrics Dashboard

### Available Soon
```
- Server connection stats
- Tool usage frequency
- Agent performance metrics
- Workflow execution times
- Configuration history
```

---

## 🔮 Coming Soon

### v7.5.0 Features
- [ ] Server dependency resolution
- [ ] Auto-capability detection
- [ ] Health monitoring dashboard
- [ ] Configuration templates
- [ ] Bulk import/export

### v7.6.0 Features
- [ ] Server marketplace
- [ ] Community server sharing
- [ ] Advanced analytics
- [ ] Role-based access control

---

## 📦 Installation

```bash
# Install extension
code --install-extension the-new-fuse-7.4.0.vsix

# Reload VSCode
# Command Palette → "Reload Window"

# Verify installation
# Extensions → The New Fuse → Version 7.4.0
```

---

**Version**: 7.4.0
**Last Updated**: 2025-09-30
**Quick Start Time**: < 5 minutes

🎉 **You're ready to use The New Fuse MCP Configuration!**
