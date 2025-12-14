# MCP Configuration Guide - The New Fuse v7.4.0

## 🎉 What's New in v7.4.0

### Comprehensive MCP Configuration System
Version 7.4.0 introduces a complete MCP (Model Context Protocol) configuration system with:
- ✅ **Rich dropdown menus** with pre-populated data from global MCP config
- ✅ **Multi-tenant user preferences** - Each user can customize their MCP settings
- ✅ **Per-agent MCP configuration** - Configure MCP servers for specific AI agents
- ✅ **Workflow builder integration** - Assign MCP servers to workflow steps
- ✅ **Server discovery and browsing** - Explore available MCP servers with full details
- ✅ **Custom server support** - Add your own MCP servers

---

## 📋 Table of Contents
1. [Accessing MCP Features](#accessing-mcp-features)
2. [Global MCP Configuration](#global-mcp-configuration)
3. [User Preferences](#user-preferences)
4. [Agent Configuration](#agent-configuration)
5. [Workflow Integration](#workflow-integration)
6. [Server Management](#server-management)
7. [Advanced Features](#advanced-features)

---

## 🚀 Accessing MCP Features

### Main Entry Point: Shopping Cart Icon
Click the **shopping cart icon** (🛒) in The New Fuse toolbar to access the comprehensive MCP marketplace and configuration menu.

### Main Menu Options:
```
$(server) Browse MCP Servers
  └─ View all available MCP servers with full details

$(plug) Connect to Server
  └─ Connect to an MCP server from the list

$(tools) View Available Tools
  └─ Browse tools and capabilities from all servers

$(person) User Preferences
  └─ Manage your personal MCP preferences

$(robot) Agent Configuration
  └─ Configure MCP for specific AI agents

$(symbol-namespace) Workflow Integration
  └─ Configure MCP for workflow builder

$(add) Add Custom Server
  └─ Add your own MCP server
```

---

## 🌐 Global MCP Configuration

### Configuration File Location
The system loads MCP servers from the global configuration:
```
/Users/<owner>/Desktop/A1-Inter-LLM-Com/The-New-Fuse/data/mcp_config.json
```

### Available Servers (from config)

#### 1. **TNF MCP Config Manager**
- **Priority**: 9
- **Description**: Universal MCP config management for any client
- **Capabilities**:
  - Universal MCP client configuration
  - TNF Agent Builder integration
  - Passthrough configuration generation
  - Multi-client support
  - Configuration validation

#### 2. **TNF Complete API Wrapper**
- **Priority**: 10
- **Description**: Complete API wrapper - 80+ MCP tools for full platform access
- **Capabilities**:
  - Authentication management
  - Agent CRUD operations
  - Chat session management
  - Webhook configuration
  - System monitoring

#### 3. **TNF Enhanced MCP Server**
- **Priority**: 11
- **Description**: Enhanced server combining existing functionality with API Gateway
- **Capabilities**:
  - Legacy MCP tool compatibility
  - Direct API Gateway integration
  - Real-time platform monitoring
  - Advanced webhook management

#### 4. **Chrome DevTools MCP**
- **Priority**: 12
- **Description**: Advanced browser automation and debugging
- **Capabilities**:
  - Input automation (click, drag, fill, hover)
  - Navigation automation
  - Performance tracing and Core Web Vitals
  - Network request monitoring
  - JavaScript evaluation
  - Screenshot capture

#### 5. **Additional Servers**
- Agent Communication Server
- Context7 Server
- AppleScript Execute
- Unified Config Server
- BrowserMCP
- MCP Docker

### Server Structure
Each server configuration includes:
```json
{
  "command": "node",                    // Execution command
  "args": ["--loader", "tsx/esm", "..."], // Arguments
  "env": {                              // Environment variables
    "TNF_API_BASE_URL": "...",
    "NODE_ENV": "development"
  },
  "description": "Server description",
  "managed_by": "system-name",
  "priority": 10,                       // Priority level (higher = more important)
  "tags": ["api", "wrapper"],           // Classification tags
  "capabilities": [                     // List of features
    "Authentication management",
    "Agent operations"
  ]
}
```

---

## 👤 User Preferences

### Managing Your Preferences
1. Click shopping cart icon 🛒
2. Select **"$(person) User Preferences"**
3. Choose from:
   - Enable/Disable Servers
   - Set Default Server
   - View Enabled Servers
   - Export Preferences

### Enable/Disable Servers
**Multi-select interface** allows you to choose which servers to enable:
- ✓ **Green checkmarks** = Currently enabled
- ○ **Empty circles** = Disabled
- Select multiple servers at once
- Changes saved automatically

### Default Server
Set your preferred default MCP server:
- Used for general tool calls
- Can be overridden per-agent or per-workflow
- Quick access to frequently-used server

### Server Overrides
Customize specific server settings:
- Override environment variables
- Modify command arguments
- Add custom tags

### Preference Export
Export your preferences as JSON:
- Backup your configuration
- Share with team members
- Migrate between workspaces

### Data Structure
```typescript
{
  userId: string;
  enabledServers: string[];           // List of enabled server IDs
  disabledServers: string[];          // Explicitly disabled servers
  defaultServer?: string;             // Default server ID
  customServers: {                    // User-added servers
    [id: string]: MCPServerConfig
  };
  serverOverrides: {                  // Per-server customizations
    [id: string]: Partial<MCPServerConfig>
  };
  lastModified: string;               // ISO timestamp
}
```

---

## 🤖 Agent Configuration

### Per-Agent MCP Setup
Configure MCP servers specifically for individual AI agents:

1. Click shopping cart icon 🛒
2. Select **"$(robot) Agent Configuration"**
3. Choose **"Create Agent Config"**

### Creating Agent Config
**Step-by-step wizard**:
1. **Enter agent name**
   - Input: "Customer Support Agent"

2. **Select MCP servers**
   - Multi-select from available servers
   - Pre-populated with descriptions
   - Filter by tags or capabilities

3. **Configure capabilities** (optional)
   - Required capabilities for this agent
   - Priority servers list
   - Custom tools selection

### Agent Config Features
```typescript
{
  agentId: string;                    // Unique identifier
  agentName: string;                  // Human-readable name
  enabledServers: string[];           // Servers available to agent
  requiredCapabilities: string[];     // Must-have features
  priorityServers: string[];          // Preferred servers
  customTools: string[];              // Agent-specific tools
  toolRestrictions: {                 // Optional restrictions
    allowedTools?: string[];          // Whitelist
    deniedTools?: string[];           // Blacklist
  };
  lastModified: string;
}
```

### Use Cases

#### Example 1: Research Agent
```typescript
{
  agentName: "Research Agent",
  enabledServers: [
    "chrome-devtools",      // For web scraping
    "context7-server",      // For context management
    "browsermcp"            // For browser automation
  ],
  requiredCapabilities: [
    "web scraping",
    "content extraction",
    "navigation"
  ]
}
```

#### Example 2: API Integration Agent
```typescript
{
  agentName: "API Integration Agent",
  enabledServers: [
    "tnf-complete-api-wrapper",
    "tnf-enhanced-mcp-server"
  ],
  requiredCapabilities: [
    "API Gateway integration",
    "Authentication management",
    "Webhook configuration"
  ]
}
```

---

## 🔄 Workflow Integration

### Workflow MCP Configuration
Assign MCP servers to specific workflow steps:

1. Click shopping cart icon 🛒
2. Select **"$(symbol-namespace) Workflow Integration"**
3. Choose **"Create Workflow Config"**

### Workflow Configuration Wizard
1. **Enter workflow name**
   - Input: "Customer Onboarding Workflow"

2. **Select required servers**
   - Multi-select servers that MUST be available
   - These will be validated before workflow execution

3. **Select optional servers**
   - Servers that enhance functionality but aren't critical

4. **Configure per-step servers** (advanced)
   - Assign specific servers to individual workflow steps

### Workflow Config Structure
```typescript
{
  workflowId: string;
  workflowName: string;
  requiredServers: string[];          // Must be available
  optionalServers: string[];          // Nice to have
  toolMappings: {                     // Tool name -> Server ID
    [toolName: string]: string
  };
  stepMCPConfig: {                    // Step-specific config
    [stepId: string]: string[]        // Enabled servers per step
  };
  lastModified: string;
}
```

### Per-Step Configuration
Assign different MCP servers to different workflow steps:

```typescript
{
  workflowName: "E-commerce Order Processing",
  stepMCPConfig: {
    "step-1-validate": [
      "tnf-complete-api-wrapper"      // For customer validation
    ],
    "step-2-inventory": [
      "tnf-complete-api-wrapper",     // For inventory check
      "context7-server"               // For context tracking
    ],
    "step-3-payment": [
      "tnf-complete-api-wrapper",     // For payment processing
      "tnf-enhanced-mcp-server"       // For enhanced security
    ],
    "step-4-fulfillment": [
      "chrome-devtools",              // For shipping label generation
      "tnf-complete-api-wrapper"      // For order updates
    ]
  }
}
```

### Tool Mappings
Map specific tools to servers:
```typescript
{
  toolMappings: {
    "validate_customer": "tnf-complete-api-wrapper",
    "check_inventory": "tnf-complete-api-wrapper",
    "process_payment": "tnf-enhanced-mcp-server",
    "generate_label": "chrome-devtools"
  }
}
```

---

## 🔍 Server Management

### Browse MCP Servers
Rich interface showing all available servers:

**Display Format:**
```
$(server) tnf-complete-api-wrapper
Description: Complete API wrapper for The New Fuse platform
Details: Priority: 10 | Tags: api, wrapper, platform | Capabilities: 11 features
```

### Server Actions Menu
When you select a server:
```
$(info) View Details
  └─ Show full server configuration in markdown

$(list-unordered) View Capabilities
  └─ Show detailed capability list

$(plug) Connect
  └─ Establish connection to this server

$(settings-gear) Configure
  └─ Customize server settings
```

### View Server Details
Opens a markdown document with complete information:
```markdown
**Server ID**: tnf-complete-api-wrapper

**Description**: Complete API wrapper for The New Fuse platform

**Command**: node

**Arguments**: --loader tsx/esm /path/to/server.ts

**Priority**: 10

**Managed By**: enhanced-mcp-config-manager

**Tags**: api, wrapper, platform, tools, core

**Environment Variables**: 2
```

### View Capabilities
Searchable list of all server capabilities:
```
$(check) Authentication management
$(check) Agent CRUD operations
$(check) Chat session management
$(check) Webhook configuration
$(check) MCP server management
$(check) Workflow execution
$(check) User management
$(check) Marketplace operations
```

### Connect to Server
Initiates connection:
- Validates server configuration
- Establishes connection
- Registers tools and resources
- Shows connection status

---

## 🛠️ Advanced Features

### Add Custom Server
**Interactive wizard** for adding your own MCP server:

1. **Server ID**: `my-custom-server`
2. **Command**: `npx`
3. **Arguments**: `my-mcp-server arg1 arg2`
4. **Description**: `My custom MCP server`
5. **Environment Variables** (optional):
   ```
   API_KEY=xxx
   BASE_URL=https://...
   ```

### Custom Server Storage
- Stored in user preferences (not global config)
- Marked with star icon $(star) in UI
- Can be shared via preference export
- Synced across workspaces

### Filter by Tags
Find servers by classification:
```typescript
// Get all API-related servers
const apiServers = configManager.getServersByTags(['api', 'wrapper']);

// Get all core platform servers
const coreServers = configManager.getServersByTags(['core', 'platform']);

// Get all automation servers
const automation = configManager.getServersByTags(['automation', 'browser']);
```

### Filter by Capabilities
Find servers with specific features:
```typescript
// Get servers with authentication
const authServers = configManager.getServersByCapabilities([
  'authentication',
  'user management'
]);

// Get servers with monitoring
const monitoringServers = configManager.getServersByCapabilities([
  'monitoring',
  'performance'
]);
```

### Configuration Export/Import
Export entire configuration:
```typescript
const config = configManager.exportConfiguration();
// Returns:
{
  globalServers: 10,
  users: 5,
  agents: 12,
  workflows: 8,
  configPath: "/path/to/mcp_config.json"
}
```

---

## 📊 Configuration Hierarchy

### Precedence Order
1. **Workflow Step Config** (highest priority)
   - Specific to workflow step
   - Overrides all other settings

2. **Agent Config**
   - Specific to agent
   - Overrides user and global

3. **User Preferences**
   - User-specific settings
   - Overrides global

4. **Global Config** (lowest priority)
   - System-wide defaults
   - Base configuration

### Example Scenario
```
Global Config: 10 servers enabled
  ↓
User Preferences: 7 servers enabled (user disabled 3)
  ↓
Agent Config: 4 servers enabled (agent needs specific subset)
  ↓
Workflow Step: 2 servers enabled (step requires only 2)
```

**Result**: Workflow step uses exactly 2 servers as configured, regardless of higher-level settings.

---

## 🔐 Security Considerations

### API Keys and Secrets
- Stored in VSCode encrypted secrets storage
- Never exposed in logs or UI
- Per-user encrypted storage

### Server Validation
- Command validation before execution
- Environment variable sanitization
- Connection security checks

### Permission Checks
- User must have `mcp.manage` permission
- Agent configs require `agent.configure` permission
- Workflow configs require `workflow.configure` permission

---

## 💡 Best Practices

### 1. Start with User Preferences
Configure your personal preferences first:
- Enable frequently-used servers
- Set a default server
- Disable unnecessary servers

### 2. Create Agent Profiles
Define agent configs for common use cases:
- Research Agent
- Customer Support Agent
- API Integration Agent
- Data Processing Agent

### 3. Use Tags Effectively
Organize servers with clear tags:
- `api` - API integration
- `automation` - Browser/process automation
- `core` - Core platform functionality
- `monitoring` - Monitoring and metrics

### 4. Document Custom Servers
When adding custom servers:
- Provide clear descriptions
- List all capabilities
- Tag appropriately
- Include usage examples

### 5. Workflow Planning
Before creating workflow configs:
- Identify required capabilities per step
- Map tools to specific servers
- Test with required servers only
- Add optional servers for enhanced functionality

---

## 🐛 Troubleshooting

### Server Not Appearing
**Problem**: Custom server not showing in list
**Solution**:
1. Check user preferences
2. Verify server was added successfully
3. Restart extension

### Connection Failed
**Problem**: Cannot connect to server
**Solution**:
1. Verify command and arguments
2. Check environment variables
3. Review server logs
4. Validate server configuration

### Configuration Not Saving
**Problem**: Changes not persisting
**Solution**:
1. Check VSCode storage permissions
2. Verify no errors in console
3. Try reloading window

### Server Priority Issues
**Problem**: Wrong server being used
**Solution**:
1. Check configuration hierarchy
2. Verify agent/workflow overrides
3. Review priority settings

---

## 📈 Future Enhancements

Planned features for future releases:
- [ ] Server dependency management
- [ ] Automatic capability detection
- [ ] Server health monitoring dashboard
- [ ] Configuration templates
- [ ] Bulk import/export
- [ ] Server groups
- [ ] Role-based access control

---

## 📞 Support

For issues or questions:
- **GitHub Issues**: https://github.com/the-new-fuse/vscode-extension/issues
- **Documentation**: Check the extension documentation
- **Community**: Join our community forums

---

## 🎓 Examples

### Example 1: Setting Up for Web Scraping
```
1. User Preferences → Enable Servers:
   - chrome-devtools
   - browsermcp
   - context7-server

2. Create Agent: "Web Scraper"
   - Select: chrome-devtools, browsermcp
   - Capabilities: Navigation, Content extraction

3. Create Workflow: "Data Collection"
   - Step 1: Navigate (chrome-devtools)
   - Step 2: Extract (browsermcp)
   - Step 3: Store (context7-server)
```

### Example 2: API Integration Agent
```
1. User Preferences → Enable:
   - tnf-complete-api-wrapper
   - tnf-enhanced-mcp-server

2. Create Agent: "API Integrator"
   - Select both TNF servers
   - Capabilities: Authentication, API calls

3. Test connection to each server
```

### Example 3: Multi-Tenant Setup
```
User A (Developer):
  - Enabled: All servers
  - Default: tnf-enhanced-mcp-server

User B (Support):
  - Enabled: chrome-devtools, tnf-complete-api-wrapper
  - Default: tnf-complete-api-wrapper

User C (Marketing):
  - Enabled: browsermcp, context7-server
  - Default: browsermcp
```

---

**Version**: 7.4.0
**Last Updated**: 2025-09-30
**Status**: ✅ Production Ready
