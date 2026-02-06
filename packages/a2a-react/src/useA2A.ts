import { A2AMessage, AgentRegistration } from '@the-new-fuse/a2a-core';
import { useCallback, useEffect, useRef, useState } from 'react';

export interface A2AConnectionConfig {
  url: string;
  agentId: string;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export interface A2AConnectionState {
  connected: boolean;
  connecting: boolean;
  authenticated: boolean;
  error: string | null;
  reconnectAttempts: number;
}

export interface A2AHookReturn {
  connectionState: A2AConnectionState;
  connect: () => Promise<void>;
  disconnect: () => void;
  registerAgent: (registration: AgentRegistration) => Promise<void>;
  sendMessage: (message: Partial<A2AMessage>) => Promise<void>;
  agents: any[];
  messages: A2AMessage[];
}

export function useA2A(config: A2AConnectionConfig): A2AHookReturn {
  const [connectionState, setConnectionState] = useState<A2AConnectionState>({
    connected: false,
    connecting: false,
    authenticated: false,
    error: null,
    reconnectAttempts: 0,
  });

  const [agents, setAgents] = useState<any[]>([]);
  const [messages, setMessages] = useState<A2AMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(async () => {
    if (connectionState.connecting || connectionState.connected) {
      return;
    }

    setConnectionState((prev) => ({ ...prev, connecting: true, error: null }));

    try {
      const ws = new WebSocket(config.url);
      wsRef.current = ws;

      ws.onopen = () => {
        setConnectionState((prev) => ({
          ...prev,
          connected: true,
          connecting: false,
          authenticated: true,
          reconnectAttempts: 0,
        }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'message') {
            setMessages((prev) => [...prev, data.payload]);
          } else if (data.type === 'agents') {
            setAgents(data.payload);
          }
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = () => {
        setConnectionState((prev) => ({
          ...prev,
          connected: false,
          connecting: false,
          authenticated: false,
        }));
        wsRef.current = null;
      };

      ws.onerror = (error) => {
        setConnectionState((prev) => ({
          ...prev,
          error: 'WebSocket connection failed',
          connecting: false,
        }));
      };
    } catch (error) {
      setConnectionState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Connection failed',
        connecting: false,
      }));
    }
  }, [config.url, connectionState.connecting, connectionState.connected]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState((prev) => ({
      ...prev,
      connected: false,
      connecting: false,
      authenticated: false,
    }));
  }, []);

  const registerAgent = useCallback(
    async (registration: AgentRegistration) => {
      if (!wsRef.current || !connectionState.connected) {
        throw new Error('Not connected to A2A service');
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'register',
          payload: registration,
        })
      );
    },
    [connectionState.connected]
  );

  const sendMessage = useCallback(
    async (message: Partial<A2AMessage>) => {
      if (!wsRef.current || !connectionState.connected) {
        throw new Error('Not connected to A2A service');
      }

      wsRef.current.send(
        JSON.stringify({
          type: 'message',
          payload: message,
        })
      );
    },
    [connectionState.connected]
  );

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    connect,
    disconnect,
    registerAgent,
    sendMessage,
    agents,
    messages,
  };
}
