import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getTnfServerConfig } from '../config.js';

export async function initializeAndConnectMcpServer(
  serverType: string,
  registerTools: (server: McpServer) => void,
  serverDescription: string
) {
  let name: string;
  let version: string;

  try {
    ({ name, version } = getTnfServerConfig(serverType));
  } catch (configError) {
    console.error(`Fatal error getting server config for ${serverDescription}:`, configError);
    return false;
  }

  const server = new McpServer({
    name,
    version,
  });

  registerTools(server);

  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.log(`${serverDescription} started`);
    return true;
  } catch (error) {
    console.error(`Fatal error connecting ${serverDescription}:`, error);
    return false;
  }
}
