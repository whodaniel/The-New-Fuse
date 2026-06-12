import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ToolRegistrationFunction } from '../types/mcp.js';

/**
 * A placeholder tool for demonstration or future implementation.
 * When registered, it logs a message to the console.
 */
export const registerPlaceholderTool: ToolRegistrationFunction = (server: McpServer) => {
  server.registerTool({
    name: 'placeholder',
    description: 'A placeholder tool for future use.',
    parameters: {},
    execute: async () => {
      console.log('Placeholder tool executed.');
      return { message: 'Placeholder tool executed successfully.' };
    },
  });
};
