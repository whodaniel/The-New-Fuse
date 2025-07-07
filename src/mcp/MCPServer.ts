// Re-export the main MCP server implementation
export * from './TheNewFuseMCPServer';
export { TheNewFuseMCPServer as MCPServer } from './TheNewFuseMCPServer';

// Legacy exports for compatibility
import { TheNewFuseMCPServer } from './TheNewFuseMCPServer';
export default TheNewFuseMCPServer;

// MCP Server configuration interface
export interface MCPServerConfig {
  name?: string;
  version?: string;
  isRemote?: boolean;
  capabilities?: {
    tools?: any;
    resources?: any;
    prompts?: any;
  };
}
