import { useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.js';

export interface McpServer {
  id: string;
  name: string;
  description?: string;
  transport: 'stdio' | 'sse';
  port?: number;
  url?: string;
  authRequired: boolean;
}

export interface McpClient {
  id: string;
  serverUrl: string;
  transport: 'stdio' | 'sse';
  timeout?: number;
  authKey?: string;
}

export interface McpTool {
  name: string;
  description: string;
  parameters: any;
}

export interface McpResource {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export interface McpPrompt {
  name: string;
  description: string;
  template: string;
  parameters?: any;
}

export interface ServerCapabilities {
  server: {
    id: string;
    name: string;
    version: string;
    description: string;
  };
  capabilities: Array<McpTool | McpResource | McpPrompt>;
}

// Hook for managing MCP servers
export function useMcpServers(): any {
  const [servers, setServers] = useState<McpServer[]>([]);
  const [serverStatus, setServerStatus] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  const fetchServers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/mcp/servers');
      setServers(response.data.servers);
      setServerStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching MCP servers:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchServers();
    
    // Set up polling for server status updates
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/admin/mcp/servers/status');
        setServerStatus(response.data);
      } catch (error) {
        console.error('Error fetching server status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchServers]);

  const startServer = useCallback(async (serverId: string) => {
    try {
      await api.post(`/admin/mcp/servers/${serverId}/start`);
      fetchServers();
    } catch (error) {
      console.error('Error starting server:', error);
    }
  }, [fetchServers]);

  const stopServer = useCallback(async (serverId: string) => {
    try {
      await api.post(`/admin/mcp/servers/${serverId}/stop`);
      fetchServers();
    } catch (error) {
      console.error('Error stopping server:', error);
    }
  }, [fetchServers]);

  const createServer = useCallback(async (serverConfig: Omit<McpServer, 'id'>) => {
    try {
      await api.post('/admin/mcp/servers', serverConfig);
      fetchServers();
    } catch (error) {
      console.error('Error creating server:', error);
    }
  }, [fetchServers]);

  const deleteServer = useCallback(async (serverId: string) => {
    try {
      await api.delete(`/admin/mcp/servers/${serverId}`);
      fetchServers();
    } catch (error) {
      console.error('Error deleting server:', error);
    }
  }, [fetchServers]);

  const registerTool = useCallback(async (serverId: string, tool: Omit<McpTool, 'handler'>) => {
    try {
      await api.post(`/admin/mcp/servers/${serverId}/tools`, tool);
      return true;
    } catch (error) {
      console.error('Error registering tool:', error);
      return false;
    }
  }, []);

  const registerResource = useCallback(async (serverId: string, resource: Omit<McpResource, 'handler'>) => {
    try {
      await api.post(`/admin/mcp/servers/${serverId}/resources`, resource);
      return true;
    } catch (error) {
      console.error('Error registering resource:', error);
      return false;
    }
  }, []);

  const registerPrompt = useCallback(async (serverId: string, prompt: Omit<McpPrompt, 'handler'>) => {
    try {
      await api.post(`/admin/mcp/servers/${serverId}/prompts`, prompt);
      return true;
    } catch (error) {
      console.error('Error registering prompt:', error);
      return false;
    }
  }, []);

  return {
    servers,
    serverStatus,
    loading,
    fetchServers,
    startServer,
    stopServer,
    createServer,
    deleteServer,
    registerTool,
    registerResource,
    registerPrompt
  };
}

// Hook for managing MCP clients
export function useMcpClients(): any {
  const [clients, setClients] = useState<McpClient[]>([]);
  const [clientStatus, setClientStatus] = useState<Record<string, string>>({});
  const [clientCapabilities, setClientCapabilities] = useState<Record<string, ServerCapabilities>>({});
  const [loading, setLoading] = useState(true);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/mcp/clients');
      setClients(response.data.clients);
      setClientStatus(response.data.status);
    } catch (error) {
      console.error('Error fetching MCP clients:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
    
    // Set up polling for client status updates
    const interval = setInterval(async () => {
      try {
        const response = await api.get('/admin/mcp/clients/status');
        setClientStatus(response.data);
      } catch (error) {
        console.error('Error fetching client status:', error);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchClients]);

  const createClient = useCallback(async (clientConfig: Omit<McpClient, 'id'>) => {
    try {
      await api.post('/admin/mcp/clients', clientConfig);
      fetchClients();
    } catch (error) {
      console.error('Error creating client:', error);
    }
  }, [fetchClients]);

  const deleteClient = useCallback(async (clientId: string) => {
    try {
      await api.delete(`/admin/mcp/clients/${clientId}`);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  }, [fetchClients]);

  const connectClient = useCallback(async (clientId: string) => {
    try {
      await api.post(`/admin/mcp/clients/${clientId}/connect`);
      // Update status immediately for better UX
      setClientStatus((prev: any) => ({ ...prev, [clientId]: 'connecting' }));
      fetchClients();
    } catch (error) {
      console.error('Error connecting client:', error);
    }
  }, [fetchClients]);

  const disconnectClient = useCallback(async (clientId: string) => {
    try {
      await api.post(`/admin/mcp/clients/${clientId}/disconnect`);
      // Update status immediately for better UX
      setClientStatus((prev: any) => ({ ...prev, [clientId]: 'disconnecting' }));
      fetchClients();
    } catch (error) {
      console.error('Error disconnecting client:', error);
    }
  }, [fetchClients]);

  const discoverCapabilities = useCallback(async (clientId: string) => {
    try {
      const response = await api.get(`/admin/mcp/clients/${clientId}/capabilities`);
      setClientCapabilities((prev: any) => ({ ...prev, [clientId]: response.data }));
      return response.data;
    } catch (error) {
      console.error('Error discovering capabilities:', error);
      return null;
    }
  }, []);

  const callTool = useCallback(async (clientId: string, toolName: string, params: any) => {
    try {
      const response = await api.post(`/admin/mcp/clients/${clientId}/tools/${toolName}`, params);
      return response.data;
    } catch (error) {
      console.error('Error calling tool:', error);
      throw error;
    }
  }, []);

  const getResource = useCallback(async (clientId: string, resourceUri: string) => {
    try {
      const response = await api.get(`/admin/mcp/clients/${clientId}/resources/${resourceUri}`);
      return response.data;
    } catch (error) {
      console.error('Error getting resource:', error);
      throw error;
    }
  }, []);

  const getPrompt = useCallback(async (clientId: string, promptName: string, params: any) => {
    try {
      const response = await api.post(`/admin/mcp/clients/${clientId}/prompts/${promptName}`, params);
      return response.data;
    } catch (error) {
      console.error('Error getting prompt:', error);
      throw error;
    }
  }, []);

  return {
    clients,
    clientStatus,
    clientCapabilities,
    loading,
    fetchClients,
    createClient,
    deleteClient,
    connectClient,
    disconnectClient,
    discoverCapabilities,
    callTool,
    getResource,
    getPrompt
  };
}
