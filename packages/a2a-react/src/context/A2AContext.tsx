import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { A2AContextValue, A2AProviderProps, A2AAgent, A2AMessage } from '../types';

const A2AContext = createContext<A2AContextValue | undefined>(undefined);

export const useA2AContext = () => {
  const context = useContext(A2AContext);
  if (!context) {
    throw new Error('useA2AContext must be used within an A2AProvider');
  }
  return context;
};

export const A2AProvider: React.FC<A2AProviderProps> = ({
  url,
  children,
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [agents, setAgents] = useState<A2AAgent[]>([]);
  const [messages, setMessages] = useState<A2AMessage[]>([]);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setReconnectAttempts(0);
        console.log('Connected to A2A server');
      };

      ws.onclose = () => {
        setIsConnected(false);
        console.log('Disconnected from A2A server');
        
        if (reconnectAttempts < maxReconnectAttempts) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1);
            connect();
          }, reconnectInterval);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'agents') {
            setAgents(data.agents || []);
          } else if (data.type === 'message') {
            setMessages(prev => [...prev, data.message]);
          } else if (data.type === 'messages') {
            setMessages(data.messages || []);
          }
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      };
    } catch (error) {
      console.error('Error connecting to WebSocket:', error);
    }
  }, [url, reconnectAttempts, maxReconnectAttempts, reconnectInterval]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: Omit<A2AMessage, 'id' | 'timestamp'>) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    const fullMessage: A2AMessage = {
      ...message,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };

    wsRef.current.send(JSON.stringify({
      type: 'send_message',
      message: fullMessage,
    }));
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  const value: A2AContextValue = {
    url,
    isConnected,
    agents,
    messages,
    sendMessage,
    connect,
    disconnect,
  };

  return <A2AContext.Provider value={value}>{children}</A2AContext.Provider>;
};