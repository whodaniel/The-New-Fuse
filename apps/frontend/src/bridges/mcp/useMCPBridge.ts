import { useCallback, useEffect, useState } from 'react';
import { useRelay } from '../relay/RelayProvider';
import {
  BridgeState,
  createInitialBridgeState,
  createLoadingBridgeState,
  createSuccessBridgeState,
} from '../types/BridgeCommon';

export interface MCPServer {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: number;
  resources: number;
  prompts: number;
  latency?: number;
}

export interface MCPTool {
  name: string;
  description: string;
  serverName: string;
}

export interface UseMCPBridgeReturn {
  activeServers: BridgeState<MCPServer[]>;
  availableTools: BridgeState<MCPTool[]>;

  refreshServers: () => Promise<void>;
  connectServer: (config: any) => Promise<void>;
  disconnectServer: (serverId: string) => Promise<void>;
}

/**
 * Bridge hook for Pillar III: The MCP Hub.
 * Manages Model Context Protocol connections and tools.
 */
export function useMCPBridge(): UseMCPBridgeReturn {
  const { sendMessage, subscribeToMessages, connectionState } = useRelay();

  const [activeServers, setActiveServers] = useState<BridgeState<MCPServer[]>>(
    createInitialBridgeState()
  );

  const [availableTools, setAvailableTools] = useState<BridgeState<MCPTool[]>>(
    createInitialBridgeState()
  );

  const refreshServers = useCallback(async () => {
    setActiveServers((prev) => createLoadingBridgeState(prev.data));
    await sendMessage('MCP_SERVER_LIST_REQUEST', {});
  }, [sendMessage]);

  const connectServer = useCallback(
    async (config: any) => {
      await sendMessage('MCP_CONNECT_REQUEST', { config });
    },
    [sendMessage]
  );

  const disconnectServer = useCallback(
    async (serverId: string) => {
      await sendMessage('MCP_DISCONNECT_REQUEST', { serverId });
    },
    [sendMessage]
  );

  useEffect(() => {
    if (connectionState.status !== 'connected') return;

    const sub = subscribeToMessages(
      { messageType: ['MCP_SERVER_LIST_UPDATE', 'MCP_TOOL_LIST_UPDATE'] },
      (message) => {
        if (message.type === 'MCP_SERVER_LIST_UPDATE') {
          setActiveServers(createSuccessBridgeState(message.payload as MCPServer[]));
        }
        if (message.type === 'MCP_TOOL_LIST_UPDATE') {
          setAvailableTools(createSuccessBridgeState(message.payload as MCPTool[]));
        }
      }
    );

    refreshServers();

    return () => {
      sub.unsubscribe();
    };
  }, [connectionState.status, subscribeToMessages, refreshServers]);

  return {
    activeServers,
    availableTools,
    refreshServers,
    connectServer,
    disconnectServer,
  };
}
