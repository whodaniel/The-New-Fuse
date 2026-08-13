import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export function registerIdentityTool(server: McpServer) {
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
}
