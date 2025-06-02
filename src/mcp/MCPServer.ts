// Re-export the main MCP server implementation
export * from './TheNewFuseMCPServer.js';
export { TheNewFuseMCPServer as MCPServer } from './TheNewFuseMCPServer.js';

// Legacy exports for compatibility
export default TheNewFuseMCPServer;
