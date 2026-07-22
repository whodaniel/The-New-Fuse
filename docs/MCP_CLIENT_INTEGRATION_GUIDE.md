# TNF MCP Client Integration Guide

**Document Type:**
[CLASS:PRIME][STATUS:SYNCHRONIZED][DOC_TYPE:INTEGRATION_GUIDE][VISIBILITY:PUBLIC]

## Overview

This guide explains how AI agents connect to The New Fuse (TNF) via the Model
Context Protocol (MCP). The TNF MCP ecosystem provides standardized access to
agent coordination, swarm management, and system operations.

**Custom App Link for Getting Started:** https://your-app-link.com/mcp

---

## Available MCP Servers

### 1. TNF Core Server (`tnf-core-server`)

**Purpose:** Main entry point for TNF MCP functionality

**Location:** `src/mcp/server.ts`

**Default Port:** Local stdio (no network port)

**Available Tools:**

- `hermes_na10_mcp_command` - Generate commands for configuring MCP connections
- `tnf_help` - Get help about TNF MCP ecosystem

### 2. TNF Enhanced MCP Server (`tnf-enhanced-mcp-server`)

**Purpose:** Enhanced agent and system operations

**Location:** `src/mcp/enhanced-tnf-mcp-server.ts`

**Available Tools:**

- `list_agents` - List all agents known to the TNF system
- `get_agent_details` - Get detailed information about a specific agent
- `list_models` - List available LLM models
- `get_system_status` - Get current system health status

### 3. TNF Network Control Server (`tnf-network`)

**Purpose:** Network management and communication

**Location:** `apps/mcp-servers/tnf-network-mcp/src/index.ts`

**Available Tools:**

- `list_channels` - List all available communication channels
- `create_channel` - Create a new communication channel
- `list_agents` - List all registered agents
- `broadcast_message` - Send messages to agents
- `invite_agent` - Send channel invitations to agents

---

## Configuration

### MCP Client Configuration File

The TNF MCP configuration is stored in `data/mcp_config.json`. AI agents should
configure their MCP clients to connect to these servers.

**Example Configuration:**

```json
{
  "mcpServers": {
    "tnf-enhanced": {
      "command": "pnpm",
      "args": ["exec", "tsx", "src/mcp/enhanced-tnf-mcp-server.ts"]
    },
    "tnf-network": {
      "command": "pnpm",
      "args": ["exec", "tsx", "apps/mcp-servers/tnf-network-mcp/src/index.ts"]
    }
  }
}
```

### Environment Variables

| Variable                  | Purpose                           | Default              |
| ------------------------- | --------------------------------- | -------------------- |
| `MCP_MAIN_SERVER_NAME`    | Name for the main server          | `tnf-main`           |
| `MCP_MAIN_SERVER_VERSION` | Version string                    | `1.0.0`              |
| `NA10_MCP_URL`            | URL for NA10 MCP server           | Environment-specific |
| `NA10_MCP_TOKEN`          | Token for NA10 MCP authentication | Environment-specific |

---

## Connecting to TNF MCP

### Step 1: Locate the MCP Configuration

TNF provides multiple ways to access the MCP servers:

1. **Local Development:** Servers run via stdio protocol
2. **Docker/Container:** Access via configured endpoints
3. **Cloud Deployment:** Access via Network Control Server

### Step 2: Install TNF MCP Clients

```bash
# From the TNF repository root
pnpm install

# Install MCP server dependencies
pnpm --filter @the-new-fuse/mcp-skills-server install
```

### Step 3: Configure Your AI Agent

AI agents should be configured to:

1. Use the MCP configuration from `data/mcp_config.json`
2. Connect via stdio transport (local) or network transport
3. Authenticate using the TNF credential system

### Step 4: Access TNF Protocols

Once connected, agents can:

- Query the agent registry
- Submit tasks to specific agents
- Monitor system health
- Access the knowledge tree

---

## Key Operations

### Listing Agents

```typescript
// MCP Tool: list_agents
const agents = await list_agents();
console.log('Registered agents:', agents);
```

### Getting Agent Details

```typescript
// MCP Tool: get_agent_details
const details = await get_agent_details({ agentId: 'agent-123' });
console.log('Agent details:', details);
```

### Checking System Status

```typescript
// MCP Tool: get_system_status
const status = await get_system_status();
console.log('System health:', status);
```

### Using the Help Tool

```typescript
// MCP Tool: tnf_help
const help = await tnf_help();
console.log('TNF help:', help);
```

---

## Troubleshooting

### Common Issues

1. **Server Not Starting:**
   - Ensure `tsx` is available in your environment
   - Check that the `src/mcp/` files exist
   - Verify Node.js version compatibility (requires Node 18+)

2. **Connection Refused:**
   - Confirm the MCP server process is running
   - Check stdio transport is available for your environment
   - Verify port configuration if using network transport

3. **Tool Not Found:**
   - Ensure the correct server is loaded
   - Check that the tool is registered in the server file
   - Verify the MCP client is using the updated configuration

### Verification

To verify your MCP connection:

```bash
# Check if servers are running
curl -s http://localhost:4000/health

# List available MCP servers
pnpm exec tsx data/mcp_config.json

# Test tool access
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | pnpm exec tsx src/mcp/config-manager-server.cjs
```

---

## Network Endpoints

For deployed TNF instances, the following endpoints are available:

| Service      | Port | Description                                |
| ------------ | ---- | ------------------------------------------ |
| Frontend     | 3000 | React + Vite dev server                    |
| Backend API  | 3001 | NestJS API server                          |
| API Gateway  | 3005 | API Gateway                                |
| Relay Server | 3000 | WebSocket relay for agent communication    |
| MCP Server   | -    | Stdio transport (local) or configured port |

---

## Security Considerations

1. **Authentication:** All MCP connections should use proper authentication
   tokens
2. **Authorization:** Agents should have appropriate permissions for requested
   operations
3. **Encryption:** Network transport should use TLS encryption
4. **Rate Limiting:** Respect the MCP rate limits (100 msg/min, burst 20)

---

## References

- **MCP Specification:** https://spec.modelcontextprotocol.io/
- **TNF Master Schema:** See `TNF_MASTER_SCHEMA.md`
- **Agent Protocols:** See `docs/protocols/` directory
- **Integration Guide:** See `docs/EXTERNAL_AGENT_INTEGRATION.md`

**External Documentation Link:** https://thenewfuse.com/

---

## Support

For issues with MCP integration, please:

1. Check the troubleshooting section above
2. Review the MCP server source files in `src/mcp/`
3. Consult the TNF documentation in `docs/`
4. Run `tnf doctor` to check system health
