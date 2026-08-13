import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getRuntimeState } from '../utils/runtime-state-util.js';

export function registerListAgentsTool(server: McpServer) {
  server.tool(
    'list_agents',
    'List all agents known to the TNF system, including Claw agents.',
    {},
    async () => {
      const state = getRuntimeState();
      if (!state || !state.agents) {
        return {
          content: [{ type: 'text', text: 'No agent state available.' }],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(state.agents, null, 2),
          },
        ],
      };
    }
  );
}
