import React, { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWizard } from './WizardProvider';

interface WizardWebSocketContextType {
  connected: boolean;
  lastMessage: unknown;
  sendMessage: (event: string, data: unknown) => void;
  subscribeToEvent: (event: string, callback: (data: unknown) => void) => void;
  unsubscribeFromEvent: (event: string, callback?: (data: unknown) => void) => void;
}

interface WizardWebSocketProviderProps {
  children: ReactNode;
  url?: string;
}

const WizardWebSocketContext = createContext<WizardWebSocketContextType | null>(null);

export function WizardWebSocketProvider({
  children,
  url = process.env.WEBSOCKET_URL || 'ws://localhost:5000',
}: WizardWebSocketProviderProps): React.ReactElement {
  const { state, updateAgents, addConversation } = useWizard();
  const [connected, setConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<unknown>(null);
  const socketRef = useRef<Socket | null>(null);
  const eventHandlersRef = useRef<Map<string, Set<(data: unknown) => void>>>(new Map());

  useEffect(() => {
    socketRef.current = io(url, {
      transports: ['websocket'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    setupSocketHandlers();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  const setupSocketHandlers = (): void => {
    if (!socketRef.current) return;

    socketRef.current.on('connect', () => {
      setConnected(true);
      if (state.session) {
        socketRef.current?.emit('init_session', {
          sessionId: state.session.data?.project_path,
        });
      }
    });

    socketRef.current.on('disconnect', () => {
      setConnected(false);
    });

    socketRef.current.on('agent_update', (data: { agents: Map<string, boolean> }) => {
      updateAgents(data.agents);
    });

    socketRef.current.on('knowledge_update', (data: unknown) => {
      setLastMessage(data);
      notifyEventHandlers('knowledge_update', data);
    });

    socketRef.current.on('system_metrics', (data: unknown) => {
      setLastMessage(data);
      notifyEventHandlers('system_metrics', data);
    });

    socketRef.current.on('error', (error: unknown) => {
      console.error('WebSocket error:', error);
      notifyEventHandlers('error', error);
    });

    socketRef.current.on(
      'conversation_update',
      (data: { role: 'user' | 'assistant' | 'system'; content: string }) => {
        addConversation(data);
        notifyEventHandlers('conversation_update', data);
      }
    );
  };

  const sendMessage = (event: string, data: unknown): void => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    } else {
      console.warn('WebSocket not connected. Message not sent:', { event, data });
    }
  };

  const subscribeToEvent = (event: string, callback: (data: unknown) => void): void => {
    if (!eventHandlersRef.current.has(event)) {
      eventHandlersRef.current.set(event, new Set());
    }
    eventHandlersRef.current.get(event)?.add(callback);
  };

  const unsubscribeFromEvent = (event: string, callback?: (data: unknown) => void): void => {
    if (callback) {
      eventHandlersRef.current.get(event)?.delete(callback);
    } else {
      eventHandlersRef.current.delete(event);
    }
  };

  const notifyEventHandlers = (event: string, data: unknown): void => {
    eventHandlersRef.current.get(event)?.forEach((handler) => handler(data));
  };

  return (
    <WizardWebSocketContext.Provider
      value={{
        connected,
        lastMessage,
        sendMessage,
        subscribeToEvent,
        unsubscribeFromEvent,
      }}
    >
      {children}
    </WizardWebSocketContext.Provider>
  );
}

export function useWizardWebSocket(): WizardWebSocketContextType {
  const context = useContext(WizardWebSocketContext);
  if (!context) {
    throw new Error('useWizardWebSocket must be used within a WizardWebSocketProvider');
  }
  return context;
}

export function useAgentUpdates(): Map<string, unknown> {
  const { subscribeToEvent, unsubscribeFromEvent } = useWizardWebSocket();
  const [agents, setAgents] = useState<Map<string, unknown>>(new Map());

  useEffect(() => {
    const handleAgentUpdate = (data: unknown): void => {
      const typedData = data as { agents: Map<string, unknown> };
      setAgents(typedData.agents);
    };
    subscribeToEvent('agent_update', handleAgentUpdate);
    return () => unsubscribeFromEvent('agent_update', handleAgentUpdate);
  }, [subscribeToEvent, unsubscribeFromEvent]);

  return agents;
}

export function useSystemMetrics(): unknown {
  const { subscribeToEvent, unsubscribeFromEvent } = useWizardWebSocket();
  const [metrics, setMetrics] = useState<unknown>(null);

  useEffect(() => {
    const handleMetricsUpdate = (data: unknown): void => {
      setMetrics(data);
    };
    subscribeToEvent('system_metrics', handleMetricsUpdate);
    return () => unsubscribeFromEvent('system_metrics', handleMetricsUpdate);
  }, [subscribeToEvent, unsubscribeFromEvent]);

  return metrics;
}

export function useKnowledgeUpdates(): unknown {
  const { subscribeToEvent, unsubscribeFromEvent } = useWizardWebSocket();
  const [knowledge, setKnowledge] = useState<unknown>(null);

  useEffect(() => {
    const handleKnowledgeUpdate = (data: unknown): void => {
      setKnowledge(data);
    };
    subscribeToEvent('knowledge_update', handleKnowledgeUpdate);
    return () => unsubscribeFromEvent('knowledge_update', handleKnowledgeUpdate);
  }, [subscribeToEvent, unsubscribeFromEvent]);

  return knowledge;
}
