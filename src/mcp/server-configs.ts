import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export type ToolRegistrationFunction = (server: McpServer) => void;

export interface ServerConfig {
  name: string;
  toolSet: string; // Changed to string to represent the path to the toolset file
  description: string;
}

export const serverConfigurations: ServerConfig[] = [
  {
    name: 'main',
    toolSet: './tool-sets.js', // Path to the mainServerTools
    description: 'TNF Main Server',
  },
  {
    name: 'complete-api',
    toolSet: './tool-sets.js', // Path to the completeApiTools
    description: 'TNF Complete API Wrapper',
  },
  {
    name: 'enhanced-tnf',
    toolSet: './tool-sets.js', // Path to the enhancedTnfTools
    description: 'Enhanced TNF MCP Server (Placeholder)',
  },
];
