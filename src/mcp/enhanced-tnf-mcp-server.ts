#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { enhancedTnfTools } from './tool-sets.js';
import { initializeAndConnectMcpServer } from './utils/server-utils.js';

async function main() {
  const registerTools = (server: McpServer) => {
    for (const tool of enhancedTnfTools) {
      tool(server);
    }
  };

  await initializeAndConnectMcpServer('enhanced-tnf', registerTools, 'Enhanced TNF MCP Server');
}

main().catch(console.error);
