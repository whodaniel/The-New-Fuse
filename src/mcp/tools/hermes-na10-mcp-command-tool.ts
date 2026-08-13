import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { buildHermesNa10McpCommandPlan } from '../hermes-na10-command.ts';

export function registerHermesNa10McpCommandTool(server: McpServer) {
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
            text: JSON.stringify(
              buildHermesNa10McpCommandPlan({ serverName, configPath }),
              null,
              2
            ),
          },
        ],
      };
    }
  );
}
