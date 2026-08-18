# TNF MCP Quick Reference

**Quick Start Link:** https://your-app-link.com/mcp **TNF Website:**
https://thenewfuse.com/

## MCP Servers

| Server            | File                                            | Tools                          |
| ----------------- | ----------------------------------------------- | ------------------------------ |
| `tnf-core-server` | `src/mcp/server.ts`                             | help, commands                 |
| `tnf-enhanced`    | `src/mcp/enhanced-tnf-mcp-server.ts`            | list_agents, get_agent_details |
| `tnf-network`     | `apps/mcp-servers/tnf-network-mcp/src/index.ts` | channels, messages             |

## How AI Agents Access TNF via MCP

### 1. Configuration

AI agents connect using MCP client configuration from `data/mcp_config.json`.

### 2. Connection Methods

- **Local:** stdio transport (default)
- **Docker:** Configure in container environment
- **Cloud:** Network transport via TNF Relay

### 3. Key Operations

```typescript
// List all agents
list_agents();

// Get agent details
get_agent_details({ agentId: 'id' });

// Check system status
get_system_status();

// List available channels
list_channels();
```

### 4. Authentication

- Use environment variables for tokens
- MCP servers validate through TNF Redis broker
- Agents register with role/purpose

### 5. Common Paths

- Config: `data/mcp_config.json`
- Servers: `src/mcp/`
- Docs: `docs/`
- Scripts: `scripts/`

## Troubleshooting

```bash
# Check health
curl -s http://localhost:4000/health

# Verify MCP config
pnpm exec tsx src/mcp/server.ts

# Test tools
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | pnpm exec tsx src/mcp/config-manager-server.cjs
```

## Next Steps

1. Review `docs/MCP_CLIENT_INTEGRATION_GUIDE.md`
2. Check `docs/EXTERNAL_AGENT_INTEGRATION.md`
3. Run `scripts/quick-start-mcp.sh`
