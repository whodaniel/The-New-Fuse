# TNF MCP Integration - Quick Start

**Custom App Link:** https://your-app-link.com/mcp  
**TNF Website:** https://thenewfuse.com/

## How AI Agents Access TNF Protocols via MCP

### 1. MCP Servers Available

| Server            | Purpose                      | Location                                        |
| ----------------- | ---------------------------- | ----------------------------------------------- |
| `tnf-core-server` | Core tools, help, commands   | `src/mcp/server.ts`                             |
| `tnf-enhanced`    | Agent listing, system status | `src/mcp/enhanced-tnf-mcp-server.ts`            |
| `tnf-network`     | Channels, messages, agents   | `apps/mcp-servers/tnf-network-mcp/src/index.ts` |

### 2. Getting Started

```bash
# Navigate to TNF repository
cd /Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse

# Install dependencies
pnpm install

# Run quick start guide
./scripts/quick-start-mcp.sh
```

### 3. Configuration File

**Location:** `data/mcp_config.json`

```json
{
  "mcpServers": {
    "tnf-enhanced-mcp-server": {
      "command": "pnpm",
      "args": ["exec", "tsx", "src/mcp/enhanced-tnf-mcp-server.ts"]
    }
  }
}
```

### 4. Key MCP Tools

```javascript
// List all agents in the TNF system
await list_agents();

// Get system health status
await get_system_status();

// Get details about a specific agent
await get_agent_details({ agentId: 'agent-123' });

// Get TNF help information
await tnf_help();
```

### 5. Connection Methods

1. **Stdio (Local)**: Default for local development
2. **Network**: Configure in `data/mcp_config.json` for remote access
3. **Docker**: Run MCP servers as containers

### 6. Environment Variables

| Variable                  | Default    | Purpose            |
| ------------------------- | ---------- | ------------------ |
| `NA10_MCP_URL`            | -          | MCP server URL     |
| `NA10_MCP_TOKEN`          | -          | MCP authentication |
| `MCP_MAIN_SERVER_NAME`    | `tnf-main` | Server name        |
| `MCP_MAIN_SERVER_VERSION` | `1.0.0`    | Server version     |

### 7. Quick Verification

```bash
# Check if MCP servers are running
curl -s http://localhost:4000/health

# Test MCP configuration
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | pnpm exec tsx src/mcp/config-manager-server.cjs
```

### 8. Documentation Links

- **Full Integration Guide:** `docs/MCP_CLIENT_INTEGRATION_GUIDE.md`
- **External Agent Integration:** `docs/EXTERNAL_AGENT_INTEGRATION.md`
- **Complete API Wrapping:** `docs/MCP-COMPLETE-API-WRAPPING.md`
- **TNF Master Schema:** `TNF_MASTER_SCHEMA.md`

### 9. MCP Client Example

For implementing an MCP client in your AI agent:

```typescript
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';

const client = new McpClient({
  name: 'my-agent',
  version: '1.0.0',
});

// Connect to TNF MCP server
await client.connect({
  transport: new StdioClientTransport({
    command: 'pnpm',
    args: ['exec', 'tsx', 'src/mcp/enhanced-tnf-mcp-server.ts'],
  }),
});

// Use available tools
const agents = await client.callTool('list_agents', {});
const status = await client.callTool('get_system_status', {});
```

### 10. Troubleshooting

1. **Server not starting:** Check file paths and Node.js version
2. **Connection refused:** Verify server is running and port is correct
3. **Tool not found:** Ensure server is properly loaded and tools are registered

**Support Links:**

- TNF Main Site: https://thenewfuse.com/
- MCP Protocol Spec: https://spec.modelcontextprotocol.io/
- Custom MCP Link: https://your-app-link.com/mcp
