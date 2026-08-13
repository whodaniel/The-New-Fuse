import { MCPServer, mcpService, MCPTool } from '@/services/MCPService';
import { useCallback, useEffect, useState } from 'react';

const SOURCE_STORAGE_KEY = 'tnf_mcp_source';
const DEFAULT_SOURCE: McpSource = 'tnf';

type McpSource = 'tnf' | 'registry';

const getStoredSource = (): McpSource => {
  if (typeof window === 'undefined') return DEFAULT_SOURCE;
  const stored = window.localStorage.getItem(SOURCE_STORAGE_KEY);
  return stored === 'registry' ? 'registry' : DEFAULT_SOURCE;
};

const storeSource = (source: McpSource) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SOURCE_STORAGE_KEY, source);
};

export const useMcpTools = () => {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [tools, setTools] = useState<MCPTool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [source, setSourceState] = useState<McpSource>(getStoredSource);

  // Load MCP servers from API
  const loadServers = useCallback(
    async (currentSource: McpSource = source) => {
      setLoading(true);
      setError(null);

      try {
        const fetchedServers = await mcpService.getServers(currentSource);
        setServers(fetchedServers);

        // Flatten tools from all servers
        const allTools = fetchedServers.flatMap((server) => server.tools || []);
        setTools(allTools);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load MCP servers'));
      } finally {
        setLoading(false);
      }
    },
    [source]
  );

  const setSource = useCallback((nextSource: McpSource) => {
    setSourceState(nextSource);
    storeSource(nextSource);
  }, []);

  const resetSource = useCallback(() => {
    setSource(DEFAULT_SOURCE);
  }, [setSource]);

  // Load servers on mount
  useEffect(() => {
    loadServers();
  }, [loadServers]);

  // Execute a tool on an MCP server
  const executeTool = useCallback(
    async (toolId: string, parameters: Record<string, any>) => {
      setLoading(true);
      setError(null);

      try {
        // Find the server that contains the tool
        const server = servers.find((s) => s.tools.some((t) => t.id === toolId));
        const serverId = server?.id;

        const result = await mcpService.executeTool(toolId, parameters, serverId);
        return result;
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to execute tool'));
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [servers]
  );

  return {
    servers,
    tools,
    loading,
    error,
    source,
    setSource,
    resetSource,
    loadServers,
    executeTool,
  };
};

export default useMcpTools;
export type { MCPServer, MCPTool };
