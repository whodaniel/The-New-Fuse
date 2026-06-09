// Placeholder for missing Enhanced TNF MCP Server
// This file is required to satisfy 'tnf doctor' checks.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { buildHermesNa10McpCommandPlan } from './hermes-na10-command.js';

const server = new McpServer({
  name: 'tnf-enhanced-mcp-server',
  version: '1.0.0',
});

// Basic identity tool
server.tool('identity', 'Returns the identity of this Enhanced MCP server', {}, async () => {
  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ name: 'tnf-enhanced-mcp-server', status: 'placeholder' }),
      },
    ],
  };
});

server.tool(
  'hermes_na10_mcp_command',
  'Generate the safe TNF-routed Hermes command template for connecting NA10 MCP credentials.',
  {
    serverName: z.string().optional().describe('MCP server name to register, default na10.'),
    configPath: z
      .string()
      .optional()
      .describe('Hermes MCP client config path, default data/mcp.clients/hermes.mcp.json.'),
  },
  async ({ serverName, configPath }) => {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(buildHermesNa10McpCommandPlan({ serverName, configPath }), null, 2),
        },
      ],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Enhanced TNF MCP Server (Placeholder) started');
}

main().catch((error) => {
  console.error('Fatal error in Enhanced TNF MCP Server:', error);
  process.exit(1);
});
