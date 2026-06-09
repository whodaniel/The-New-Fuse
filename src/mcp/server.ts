import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { buildHermesNa10McpCommandPlan } from './hermes-na10-command.js';

const server = new McpServer({
  name: 'tnf-main',
  version: '1.0.0',
});

server.tool('tnf_help', 'Get help about using The New Fuse MCP ecosystem.', {}, async () => {
  return {
    content: [
      {
        type: 'text',
        text: `
# The New Fuse (TNF) MCP Ecosystem

You are connected to the main TNF entry point.

## Available Servers
- **tnf-complete-api-wrapper**: Access system state, agents, and models.
- **tnf-relay**: Real-time communication with the agent swarm.
- **tnf-network-control**: Manage channels and agent capabilities.

## Quick Start
Use 'list_agents' (from api-wrapper) to see your swarm.
Use 'get_relay_messages' (from relay) to check communication.
        `,
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
  console.error('TNF Main Server started');
}

main().catch((error) => {
  console.error('Fatal error in Main Server:', error);
  process.exit(1);
});
