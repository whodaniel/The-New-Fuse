import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { Agent } from '../types/agent.js';
import { createErrorTextResponse, createSuccessTextResponse } from '../utils/response-utils.js';
import { getRuntimeState } from '../utils/runtime-state-util.js';

export function registerGetAgentDetailsTool(server: McpServer) {
  server.tool(
    'get_agent_details',
    'Get detailed information about a specific agent by ID or name.',
    {
      identifier: z.string().describe('Agent ID (e.g., TNF:AGENT:...) or Name'),
    },
    async ({ identifier }) => {
      const state = getRuntimeState();
      if (!state || !state.agents) {
        return createErrorTextResponse('No state.');
      }

      const agent = state.agents.find(
        (a: Agent) => a.tnf_id === identifier || a.name.toLowerCase() === identifier.toLowerCase()
      );

      if (!agent) {
        return createErrorTextResponse(`Agent '${identifier}' not found.`);
      }

      return createSuccessTextResponse(agent);
    }
  );
}
