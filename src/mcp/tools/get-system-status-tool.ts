import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createSuccessTextResponse } from '../utils/response-utils.js';
import { getRuntimeState } from '../utils/runtime-state-util.js';

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';

export function registerGetSystemStatusTool(server: McpServer) {
  server.tool(
    'get_system_status',
    'Get the overall health and status of the TNF system.',
    {},
    async () => {
      const state = getRuntimeState();
      const status = {
        generatedAt: state?.generatedAt,
        counts: state?.counts,
        apiStatus: 'unknown',
      };

      // Try to ping API
      try {
        const res = await fetch(`${API_BASE_URL}/health`);
        if (res.ok) {
          status.apiStatus = 'online';
        } else {
          status.apiStatus = 'error';
        }
      } catch (e) {
        status.apiStatus = 'unreachable';
      }

      return createSuccessTextResponse(status);
    }
  );
}
