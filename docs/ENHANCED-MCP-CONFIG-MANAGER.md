# Enhanced MCP Configuration Manager

## Overview

The Enhanced MCP Configuration Manager is a comprehensive upgrade to The New
Fuse's MCP server configuration system, integrating OAuth 2.1 authentication,
modern MCP protocol support, and advanced management capabilities. **Most
importantly, it gives AI the ability to autonomously manage MCP server
configurations, acting as a DevOps engineer for MCP infrastructure.**

## 🤖 AI Configuration Capabilities

### **AI as MCP DevOps Engineer**

With this enhanced system, AI can now:

- **Autonomously manage MCP servers** - Add, remove, update, and monitor servers
- **Fix broken configurations** - Detect and resolve server connection issues
- **Apply security best practices** - Automatically enhance servers with OAuth
  protection
- **Monitor infrastructure health** - Continuously check server status and
  performance
- **Backup configurations safely** - Ensure no data loss during changes
- **Discover new capabilities** - Find and integrate new MCP servers from TNF
  ecosystem

### **Real-World AI Use Cases**

```javascript
// AI can fix your failing mcp-config-manager server:
{
  "tool": "add_mcp_server",
  "params": {
    "name": "enhanced-mcp-config-manager",
    "command": "npx",
    "args": ["tsx", "./src/mcp/enhanced-config-manager.ts"],
    "template": "oauth-secure-server",
    "description": "AI-managed enhanced MCP configuration server"
  }
}

// AI can add new capabilities on demand:
{
  "tool": "add_mcp_server",
  "params": {
    "name": "weather-service",
    "command": "npx",
    "args": ["@weather/mcp-server"],
    "template": "basic-mcp-server",
    "tags": ["weather", "api", "utility"]
  }
}
```

## 🚀 New Features

### OAuth 2.1 Integration

- **Secure Configuration Management**: All configuration changes can be
  OAuth-protected
- **Role-Based Access Control**: Different scopes for read, write, and admin
  operations
- **Dynamic Client Registration**: Automatic OAuth client generation for MCP
  servers
- **Token-Based Authentication**: JWT tokens for secure API access

### Modern MCP Protocol Support

- **MCP Protocol 2025-06-18**: Latest specification compliance
- **Enhanced Server Discovery**: Automatic discovery of MCP servers with OAuth
  metadata
- **Health Monitoring**: Continuous monitoring of server health and OAuth token
  validity
- **Resource Management**: Advanced resource management with OAuth-protected
  endpoints

### Advanced Configuration Features

- **Configuration Templates**: Predefined templates for common server types
- **Validation Engine**: Comprehensive configuration validation with suggestions
- **Backup & Restore**: Automated backup creation and restoration capabilities
- **Health Checks**: Automated health monitoring for all configured servers

## 📁 Architecture

```
src/mcp/
├── enhanced-config-manager.ts      # Core MCP server with enhanced features
├── oauth-config-integration.ts     # OAuth integration layer
├── unified-config-server.ts        # Unified server combining MCP + HTTP APIs
└── simple-oauth-server.ts         # Testing OAuth server

src/auth/
└── MCPOAuthServer.ts              # OAuth 2.1 authorization server

enhanced_mcp_config.json           # Enhanced configuration file example
```

## 🔧 Installation & Setup

### 1. Install Dependencies

```bash
pnpm install @modelcontextprotocol/sdk express jsonwebtoken cors
```

### 2. Update Your MCP Configuration

Add the enhanced config manager to your `data/mcp_config.json`:

```json
{
  "mcpServers": {
    "enhanced-mcp-config-manager": {
      "command": "npx",
      "args": ["tsx", "./src/mcp/enhanced-config-manager.ts"],
      "env": {
        "LOG_LEVEL": "info",
        "CONFIG_PATH": "./data/mcp_config.json"
      }
    }
  }
}
```

### 3. Start the Enhanced Config Manager

#### Option A: MCP Protocol (for AI integration)

```bash
# Restart Claude Desktop - AI will now have config management tools
# The enhanced-mcp-config-manager will appear in your MCP server list
```

#### Option B: Standalone HTTP Server

```bash
# With OAuth enabled (default)
npx tsx src/mcp/unified-config-server.ts

# Without OAuth (public API)
npx tsx src/mcp/unified-config-server.ts --no-oauth

# Custom ports
npx tsx src/mcp/unified-config-server.ts --http-port 8080 --oauth-port 3002
```

### 4. Environment Configuration

```bash
# OAuth Settings
TNF_OAUTH_JWT_SECRET=your-secure-jwt-secret
TNF_OAUTH_ISSUER=https://api.thenewfuse.com
TNF_BASE_URL=http://localhost:3001

# Server Settings
HTTP_PORT=3773
OAUTH_PORT=3001
LOG_LEVEL=info
```

## 🤖 AI Management Interface

### **What AI Can Do Now**

Once the enhanced config manager is running, AI assistants (like Claude) gain
powerful MCP infrastructure management capabilities:

#### **1. Server Health Monitoring**

```javascript
// AI can check the health of all MCP servers
{
  "tool": "list_mcp_servers",
  "params": {
    "filter": { "health_status": "unhealthy" },
    "include_health": true
  }
}
// Returns servers that need attention with diagnostic info
```

#### **2. Automatic Problem Resolution**

```javascript
// AI can replace a failing server with a working one
{
  "tool": "remove_mcp_server",
  "params": {
    "name": "mcp-config-manager",  // Remove the failing one
    "create_backup": true
  }
}

{
  "tool": "add_mcp_server",
  "params": {
    "name": "enhanced-mcp-config-manager",
    "command": "npx",
    "args": ["tsx", "./src/mcp/enhanced-config-manager.ts"],
    "template": "oauth-secure-server"
  }
}
```

#### **3. Dynamic Capability Addition**

```javascript
// AI can add new services based on user needs
// User: "I need weather data"
{
  "tool": "add_mcp_server",
  "params": {
    "name": "weather-api",
    "command": "npx",
    "args": ["@openweather/mcp-server"],
    "env": { "API_KEY": "${OPENWEATHER_API_KEY}" },
    "template": "basic-mcp-server",
    "tags": ["weather", "api"],
    "description": "Weather data MCP server"
  }
}
```

#### **4. Security Enhancement**

```javascript
// AI can automatically enhance security across all servers
{
  "tool": "apply_template",
  "params": {
    "template_name": "oauth-secure-server",
    "server_name": "existing-unsecure-server"
  }
}
```

#### **5. Configuration Validation & Optimization**

```javascript
// AI can validate and suggest improvements
{
  "tool": "validate_configuration",
  "params": {
    "check_health": true,
    "check_oauth": true
  }
}
// Returns validation errors, warnings, and optimization suggestions
```

### **AI Workflow Examples**

#### **Fixing Your Current Issue**

```
User: "My mcp-config-manager is showing as failed"

AI Response:
1. Lists servers to identify the issue
2. Creates backup of current configuration
3. Removes the failing server
4. Adds the enhanced config manager
5. Validates the new configuration
6. Reports success and new capabilities available
```

#### **Adding New Capabilities**

```
User: "I want to add database access to my MCP setup"

AI Response:
1. Searches available database MCP servers
2. Suggests appropriate server (e.g., postgres-mcp)
3. Adds server with secure template
4. Configures environment variables
5. Tests connection and reports status
```

### **Available AI Tools**

| Tool                     | Purpose              | AI Use Case                  |
| ------------------------ | -------------------- | ---------------------------- |
| `list_mcp_servers`       | List/filter servers  | Health monitoring, inventory |
| `add_mcp_server`         | Add new server       | Capability expansion, fixes  |
| `remove_mcp_server`      | Remove server        | Cleanup, troubleshooting     |
| `validate_configuration` | Check config         | Proactive problem detection  |
| `backup_configuration`   | Create backup        | Safety before changes        |
| `restore_configuration`  | Restore from backup  | Disaster recovery            |
| `apply_template`         | Apply templates      | Security enhancement         |
| `health_check_servers`   | Check server health  | Infrastructure monitoring    |
| `discover_mcp_servers`   | Find new servers     | Capability discovery         |
| `generate_oauth_client`  | Create OAuth clients | Security setup               |

## 🔐 OAuth Integration

### Authorization Server Discovery

The system supports RFC 8414 and RFC 9728 compliant OAuth discovery:

```bash
# Authorization Server Metadata
curl http://localhost:3001/.well-known/oauth-authorization-server

# Protected Resource Metadata
curl http://localhost:3001/.well-known/oauth-protected-resource
```

### OAuth Scopes

| Scope               | Description                  | Operations                     |
| ------------------- | ---------------------------- | ------------------------------ |
| `mcp:read`          | Read MCP configurations      | List servers, view config      |
| `mcp:write`         | Modify MCP configurations    | Add/update servers             |
| `mcp:admin`         | Administrative operations    | Remove servers, backup/restore |
| `tnf:config:read`   | TNF-specific read access     | View TNF configurations        |
| `tnf:config:manage` | TNF configuration management | Manage TNF servers             |
| `tnf:config:admin`  | TNF administrative access    | Full TNF config control        |

### Getting OAuth Tokens

#### Client Credentials Flow

```bash
# Get access token
TOKEN=$(curl -s -X POST http://localhost:3001/oauth/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=client_credentials" \
  -d "client_id=tnf_default_mcp_client" \
  -d "client_secret=tnf_default_secret_change_in_production" \
  -d "scope=mcp:admin tnf:config:admin" \
  | jq -r '.access_token')

# Use token for protected API calls
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3773/api/config/servers
```

## 🛠️ API Reference

### HTTP API Endpoints

#### Server Management

```bash
# List all MCP servers
GET /api/config/servers
Authorization: Bearer <token>

# Add new MCP server
POST /api/config/servers
Authorization: Bearer <token>
{
  "name": "my-server",
  "command": "node",
  "args": ["server.js"],
  "oauth_config": {
    "required": true,
    "scopes": ["mcp:read"]
  }
}

# Remove MCP server
DELETE /api/config/servers/my-server
Authorization: Bearer <token>
```

#### Configuration Management

```bash
# Validate configuration
POST /api/config/validate
Authorization: Bearer <token>
{
  "config_path": "./mcp_config.json",
  "check_health": true,
  "check_oauth": true
}

# Backup configuration
POST /api/config/backup
Authorization: Bearer <token>
{
  "config_path": "./mcp_config.json",
  "backup_path": "./backups/config-backup.json"
}
```

#### Template Management

```bash
# List available templates
GET /api/config/templates
Authorization: Bearer <token>

# Apply template
POST /api/config/templates/oauth-secure-server/apply
Authorization: Bearer <token>
{
  "server_name": "my-secure-server",
  "template_vars": {
    "command": "node secure-server.js"
  }
}
```

### MCP Protocol Tools

#### Enhanced Tools

- `list_mcp_servers` - List servers with filtering and health info
- `add_mcp_server` - Add server with template support and OAuth config
- `remove_mcp_server` - Remove server with backup option
- `validate_configuration` - Comprehensive configuration validation
- `backup_configuration` - Create configuration backups
- `restore_configuration` - Restore from backups
- `health_check_servers` - Perform health checks
- `discover_mcp_servers` - Discover servers from endpoints
- `apply_template` - Apply configuration templates
- `generate_oauth_client` - Generate OAuth clients for servers

#### Resource Endpoints

- `config://templates` - Available configuration templates
- `config://schemas` - JSON schemas for validation
- `config://discovery-endpoints` - Discovery endpoints

## 📋 Configuration Templates

### OAuth-Secured Server Template

```json
{
  "oauth-secure-server": {
    "description": "Template for OAuth-secured MCP servers",
    "enabled": true,
    "oauth": {
      "required": true,
      "scopes": ["mcp:read"],
      "discovery_endpoint": "http://localhost:3001/.well-known/oauth-authorization-server"
    },
    "health_check": {
      "enabled": true,
      "interval": 30000,
      "oauth_protected": true
    },
    "priority": 7,
    "tags": ["secure", "oauth", "monitored"]
  }
}
```

### High-Priority Server Template

```json
{
  "high-priority-server": {
    "description": "High-priority server with enhanced monitoring",
    "enabled": true,
    "oauth": {
      "required": true,
      "scopes": ["mcp:read", "mcp:write"]
    },
    "health_check": {
      "enabled": true,
      "interval": 15000,
      "timeout": 3000
    },
    "priority": 9,
    "tags": ["critical", "production"]
  }
}
```

## 🔍 Discovery Integration

### MCP Discovery Response

```bash
curl http://localhost:3773/mcp/discovery
```

Response includes:

- Service capabilities and version information
- OAuth integration details
- Available endpoints (MCP stdio, HTTP API)
- Authentication requirements
- Supported scopes and operations

### Health Monitoring

The system provides comprehensive health monitoring:

```bash
# Check overall system health
curl http://localhost:3773/health

# Get detailed service information
curl http://localhost:3773/info
```

## 🔄 Migration from Legacy Config Manager

### Configuration File Migration

```bash
# The enhanced manager can read existing configurations
npx tsx src/mcp/unified-config-server.ts --config-path ./data/mcp_config.json

# Validate existing configuration
curl -X POST http://localhost:3773/api/config/validate \
  -H "Content-Type: application/json" \
  -d '{"config_path": "./data/mcp_config.json"}'
```

### Legacy Compatibility

- Existing `mcp_config.json` files are fully supported
- Legacy HTTP endpoints continue to work
- Gradual OAuth migration is supported
- Backward-compatible MCP protocol support

## 🔒 Security Features

### Authentication & Authorization

- OAuth 2.1 with PKCE support
- JWT token validation
- Scope-based access control
- Client isolation and audit logging

### Configuration Security

- Automatic backup creation before changes
- Configuration validation with security checks
- OAuth client credential management
- Secure default settings

### Monitoring & Alerting

- Health check failures
- OAuth token validation errors
- Configuration change auditing
- Security event logging

## 🚨 Troubleshooting

### **Fixing "mcp-config-manager ✘ failed" Issue**

If you see your `mcp-config-manager` showing as failed in Claude Desktop:

#### **Quick Fix (Manual)**

1. **Update your `data/mcp_config.json`** (already done above)
2. **Restart Claude Desktop**
3. **Verify** the new `enhanced-mcp-config-manager` shows as ✔ connected

#### **AI-Assisted Fix**

Once you have the enhanced config manager working, AI can fix issues
automatically:

```javascript
// AI detects the failed server
{
  "tool": "list_mcp_servers",
  "params": {
    "filter": { "health_status": "unhealthy" },
    "include_health": true
  }
}

// AI removes the broken server safely
{
  "tool": "remove_mcp_server",
  "params": {
    "name": "mcp-config-manager",
    "create_backup": true
  }
}

// AI adds the enhanced replacement
{
  "tool": "add_mcp_server",
  "params": {
    "name": "enhanced-mcp-config-manager",
    "command": "npx",
    "args": ["tsx", "./src/mcp/enhanced-config-manager.ts"],
    "template": "oauth-secure-server",
    "description": "Enhanced MCP config manager with AI capabilities"
  }
}
```

### **AI Troubleshooting Capabilities**

The AI can now:

- **Detect failed servers** automatically
- **Diagnose connection issues** with detailed error analysis
- **Suggest fixes** based on error patterns
- **Apply fixes automatically** with user permission
- **Validate repairs** to ensure they work
- **Monitor ongoing health** to prevent future issues

### Common Issues

#### OAuth Token Issues

```bash
# Check token validity
curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/oauth/userinfo

# Refresh expired token
curl -X POST http://localhost:3001/oauth/token \
  -d "grant_type=refresh_token&refresh_token=$REFRESH_TOKEN"
```

#### Configuration Validation Errors

```bash
# Validate configuration
curl -X POST http://localhost:3773/api/config/validate \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"check_health": true, "check_oauth": true}'
```

#### Health Check Failures

```bash
# Check individual server health
curl -X POST http://localhost:3773/api/config/health-check \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"server_names": ["problematic-server"]}'
```

### Debug Mode

```bash
# Start with debug logging
LOG_LEVEL=debug npx tsx src/mcp/unified-config-server.ts
```

## 📈 Performance & Scaling

### Caching

- Configuration file caching with change detection
- OAuth token caching and refresh
- Health check result caching

### Concurrent Operations

- Parallel health checks
- Asynchronous OAuth validation
- Non-blocking configuration updates

## 🤝 Integration Examples

### Adding OAuth-Protected Server

```bash
curl -X POST http://localhost:3773/api/config/servers \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "secure-agent-server",
    "command": "npx",
    "args": ["tsx", "./agents/secure-server.ts"],
    "template": "oauth-secure-server",
    "oauth_config": {
      "required": true,
      "scopes": ["mcp:read", "tnf:agents"]
    },
    "tags": ["agents", "secure"],
    "priority": 8
  }'
```

### Using with External MCP Clients

```javascript
// External MCP client discovery
const discoveryResponse = await fetch('http://localhost:3773/mcp/discovery');
const discovery = await discoveryResponse.json();

// Get OAuth token
const tokenResponse = await fetch('http://localhost:3001/oauth/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: 'your_client_id',
    client_secret: 'your_client_secret',
    scope: 'mcp:read',
  }),
});
const { access_token } = await tokenResponse.json();

// Access protected MCP resources
const serversResponse = await fetch(
  'http://localhost:3773/api/config/servers',
  {
    headers: { Authorization: `Bearer ${access_token}` },
  }
);
```

## 📝 Changelog

### Version 2.0.0 - AI DevOps Edition

- **🤖 NEW**: **AI Configuration Management** - AI can now autonomously manage
  MCP servers
- **🤖 NEW**: **AI Problem Resolution** - AI can detect and fix server issues
  automatically
- **🤖 NEW**: **AI Infrastructure Monitoring** - Continuous health monitoring
  and optimization
- **🔐 NEW**: OAuth 2.1 integration with RFC 8414/9728 compliance
- **📡 NEW**: Enhanced MCP protocol 2025-06-18 support
- **🛠️ NEW**: Configuration templates and validation engine
- **💓 NEW**: Health monitoring and discovery integration
- **💾 NEW**: Backup and restore capabilities
- **📝 NEW**: TypeScript implementation with improved type safety
- **🔒 ENHANCED**: Security with role-based access control
- **🌐 ENHANCED**: API with RESTful HTTP endpoints
- **📖 ENHANCED**: Documentation with AI workflow examples

### Migration Notes

- OAuth integration is optional and can be disabled
- Existing configurations are automatically migrated
- Legacy API endpoints remain functional
- New features are additive and non-breaking

## 🎯 Future Roadmap

### **AI-Driven Features**

- **🤖 Predictive Maintenance**: AI predicts and prevents server failures before
  they occur
- **🤖 Auto-Optimization**: AI automatically optimizes server configurations for
  performance
- **🤖 Smart Discovery**: AI discovers and suggests relevant MCP servers based
  on usage patterns
- **🤖 Intelligent Scaling**: AI-driven dynamic server scaling based on demand

### **Platform Enhancements**

- **Advanced Templates**: More sophisticated template system with variables
- **Metrics & Analytics**: Detailed usage metrics and analytics dashboard
- **Multi-Tenant Support**: Support for multiple organizations
- **External Integrations**: Integration with external OAuth providers
- **GUI Configuration**: Web-based configuration interface with AI assistance
- **Global Discovery**: Integration with global MCP server registries

## 🎉 Summary: AI as Your MCP DevOps Engineer

The Enhanced MCP Configuration Manager fundamentally changes how MCP
infrastructure is managed by **giving AI the ability to act as a DevOps
engineer**:

### **Before (Manual Management):**

❌ Manual server configuration through JSON editing  
❌ Manual troubleshooting of connection issues  
❌ Manual security configuration  
❌ Manual health monitoring  
❌ Manual backup management

### **After (AI Management):**

✅ **AI manages servers autonomously** - Add, remove, update servers on demand  
✅ **AI fixes problems automatically** - Detects and resolves issues without
human intervention  
✅ **AI enhances security** - Automatically applies OAuth templates and best
practices  
✅ **AI monitors infrastructure** - Continuous health checks and optimization  
✅ **AI handles backups** - Automatic backup creation before any changes

### **The Game Changer:**

Your AI assistant is no longer just a user of MCP servers—it's now the
**administrator, DevOps engineer, and infrastructure manager** for your entire
MCP ecosystem. It can:

- **React to your needs instantly**: "I need database access" → AI adds
  postgres-mcp server
- **Fix issues proactively**: Detects failing servers and replaces them
  automatically
- **Enhance security continuously**: Applies OAuth protection across all servers
- **Scale capabilities dynamically**: Adds new MCP servers as requirements
  evolve
- **Maintain infrastructure health**: Monitors and optimizes performance 24/7

This transforms MCP from a static configuration system into a **dynamic,
self-managing infrastructure platform** powered by AI intelligence.

---

For questions and support, please refer to the
[GitHub Issues](https://github.com/anthropics/the-new-fuse/issues) or contact
the development team.
