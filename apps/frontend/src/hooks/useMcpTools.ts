import { useState, useEffect, useCallback } from 'react';
import { mcpService, MCPServer, MCPTool } from '@/services/MCPService';

export const useMcpTools = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Load MCP servers from API
  const loadServers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchedServers = await mcpService.getServers();
      setServers(fetchedServers);

      // Flatten tools from all servers
      const allTools = fetchedServers.flatMap(server => server.tools);
      setTools(allTools);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load MCP servers'));
    } finally {
      setLoading(false);
    }
  }, []);

  // Load servers on mount
  useEffect(() => {
    loadServers();
  }, [loadServers]);

  // Execute a tool on an MCP server
  const executeTool = useCallback(async (
    toolId: string,
    parameters: Record<string, any>
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Find the server that contains the tool
      const server = servers.find(s => s.tools.some(t => t.id === toolId));
      const serverId = server?.id;

      const result = await mcpService.executeTool(toolId, parameters, serverId);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to execute tool'));
      throw err;
    } finally {
      setLoading(false);
    }
  }, [servers]);

  return {
    servers,
    tools,
    loading,
    error,
    loadServers,
    executeTool
  };
};

export default useMcpTools;
export type { MCPServer, MCPTool };
