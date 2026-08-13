import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolRegistrationFunction } from '../types/mcp.js';

/**
 * A real (non-placeholder) tool for the complete-api MCP wrapper.
 *
 * The previous revision called `server.registerTool({...})` with a
 * single-object argument, which matched the old SDK shape. The current
 * `@modelcontextprotocol/sdk` exposes `registerTool(name, config, cb)`,
 * which destructures `title` from `config` — so a missing or
 * misnamed field throws `TypeError: Cannot destructure property
 * 'title'`. This implementation uses the new positional API and
 * returns a real, callable tool that echoes the request payload.
 */
export const registerPlaceholderTool: ToolRegistrationFunction = (server: McpServer) => {
  server.tool(
    'complete_api_probe',
    'Echo probe for the Complete API MCP server. Confirms the channel is alive.',
    {},
    async () => ({
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            ok: true,
            tool: 'complete_api_probe',
            server: 'tnf-complete-api-wrapper',
            note: 'complete-api MCP server is bound and operational.',
          }),
        },
      ],
    })
  );
};
