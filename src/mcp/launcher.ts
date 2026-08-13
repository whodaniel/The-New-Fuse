import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { completeApiTools, enhancedTnfTools, mainServerTools } from './tool-sets.js';
import { initializeAndConnectMcpServer } from './utils/server-utils.js';

import { ToolRegistrationFunction } from './types/mcp.js';

interface ServerConfig {
  name: string;
  toolSet: ToolRegistrationFunction[];
  description: string;
}

const serverConfigurations: ServerConfig[] = [
  {
    name: 'main',
    toolSet: mainServerTools,
    description: 'TNF Main Server',
  },
  {
    name: 'complete-api',
    toolSet: completeApiTools,
    description: 'TNF Complete API Wrapper',
  },
  {
    name: 'enhanced-tnf',
    toolSet: enhancedTnfTools,
    description: 'Enhanced TNF MCP Server (Placeholder)',
  },
];

async function launchMcpServers() {
  for (const config of serverConfigurations) {
    const registerTools = async (server: McpServer) => {
      for (const tool of config.toolSet) {
        tool(server);
      }
    };
    await initializeAndConnectMcpServer(config.name, registerTools, config.description);
  }
}

launchMcpServers();
