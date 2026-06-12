import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { TNF_HELP_CONTENT } from '../constants.js';

export function registerTnfHelpTool(server: McpServer) {
  server.tool('tnf_help', 'Get help about using The New Fuse MCP ecosystem.', {}, async () => {
    return {
      content: [
        {
          type: 'text',
          text: TNF_HELP_CONTENT,
        },
      ],
    };
  });
}
