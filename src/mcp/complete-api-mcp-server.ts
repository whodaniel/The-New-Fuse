#!/usr/bin/env node
/**
 * TNF Complete API MCP Server — real implementation.
 *
 * Wraps the upstream TNF complete-API tool-set. Replaces the previous
 * `process.exit(0)` echo placeholder. The completeApiTools set is
 * intentionally minimal today (registerPlaceholderTool) — this entry
 * point provides the canonical wiring so an operator can extend it
 * by adding tools to tool-sets.ts without rebuilding server files.
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  completeApiTools,
} from './tool-sets.js';
import { initializeAndConnectMcpServer } from './utils/server-utils.js';

async function launch(): Promise<void> {
  const ok = await initializeAndConnectMcpServer(
    'complete-api',
    (server: McpServer) => {
      for (const tool of completeApiTools) tool(server);
    },
    'TNF Complete API Wrapper'
  );
  if (!ok) {
    console.error('[tnf-complete-api-mcp] failed to initialize; exiting non-zero');
    process.exit(1);
  }
}

launch().catch((err) => {
  console.error('[tnf-complete-api-mcp] fatal:', err);
  process.exit(1);
});
