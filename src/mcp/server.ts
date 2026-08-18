#!/usr/bin/env node
/**
 * TNF Core MCP Server — real implementation.
 *
 * Wires the canonical `mainServerTools` tool-set (TNF help + the
 * Hermes NA-10 MCP command namespace) into the upstream
 * @the-new-fuse/mcp-core server harness. Replaces the previous
 * `process.exit(0)` echo placeholder that satisfied the doctor check
 * while providing zero functionality.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { mainServerTools } from './tool-sets.js';
import { initializeAndConnectMcpServer } from './utils/server-utils.js';

async function launch(): Promise<void> {
  const ok = await initializeAndConnectMcpServer(
    'main',
    (server: McpServer) => {
      for (const tool of mainServerTools) tool(server);
    },
    'TNF Main Server'
  );
  if (!ok) {
    console.error('[tnf-core-mcp] failed to initialize; exiting non-zero');
    process.exit(1);
  }
}

launch().catch((err) => {
  console.error('[tnf-core-mcp] fatal:', err);
  process.exit(1);
});
