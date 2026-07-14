#!/usr/bin/env node
/**
 * TNF Enhanced MCP Server — real implementation.
 *
 * Routes identity, list_agents, list_models, get_agent_details and
 * get_system_status through the enhancedTnfTools tool-set. Replaces
 * the previous `process.exit(0)` echo placeholder.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { enhancedTnfTools } from './tool-sets.js';
import { initializeAndConnectMcpServer } from './utils/server-utils.js';

async function launch(): Promise<void> {
  const ok = await initializeAndConnectMcpServer(
    'enhanced-tnf',
    (server: McpServer) => {
      for (const tool of enhancedTnfTools) tool(server);
    },
    'Enhanced TNF MCP Server'
  );
  if (!ok) {
    console.error('[tnf-enhanced-mcp] failed to initialize; exiting non-zero');
    process.exit(1);
  }
}

launch().catch((err) => {
  console.error('[tnf-enhanced-mcp] fatal:', err);
  process.exit(1);
});
