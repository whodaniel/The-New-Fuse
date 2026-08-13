import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getRuntimeState } from '../utils/runtime-state-util.js';

export function registerListModelsTool(server: McpServer) {
  server.tool('list_models', 'List available LLM models in the ecosystem.', {}, async () => {
    const state = getRuntimeState();
    if (!state || !state.llmModels) {
      return {
        content: [{ type: 'text', text: 'No model state available.' }],
        isError: true,
      };
    }
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(state.llmModels, null, 2),
        },
      ],
    };
  });
}
