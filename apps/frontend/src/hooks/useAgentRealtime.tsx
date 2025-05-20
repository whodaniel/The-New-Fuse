import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { Agent } from './useAgents.js';

type AgentEvent = 'agent:created' | 'agent:updated' | 'agent:deleted';

interface AgentEventData {
  agent: Agent;
}

interface UseAgentRealtimeOptions {
  enabled?: boolean;
  url?: string;
}

/**
 * Hook for real-time agent updates via WebSockets
 */
export function useAgentRealtime(options: UseAgentRealtimeOptions = {}) {
  const { enabled = true, url = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001' } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  // Initialize WebSocket connection
  useEffect(() => {
    if (!enabled) return;
    
    const socket = io(url, {
      transports: ['websocket'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    socketRef.current = socket;
    
    // Handle connection events
    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to agent real-time updates');
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from agent real-time updates');
    });
    
    socket.on('connect_error', (err: Error) => {
      setError(err);
      console.error('WebSocket connection error:', err);
    });
    
    // Clean up on unmount
    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [enabled, url]);
  
  // Subscribe to agent events
  const subscribeToAgentEvents = useCallback((
    onCreated?: (agent: Agent) => void,
    onUpdated?: (agent: Agent) => void,
    onDeleted?: (agent: Agent) => void
  ) => {
    if (!socketRef.current) return () => {};
    
    const handleCreated = (data: AgentEventData) => onCreated?.(data.agent);
    const handleUpdated = (data: AgentEventData) => onUpdated?.(data.agent);
    const handleDeleted = (data: AgentEventData) => onDeleted?.(data.agent);
    
    const eventHandlers: Record<AgentEvent, (data: AgentEventData) => void> = {
      'agent:created': handleCreated,
      'agent:updated': handleUpdated,
      'agent:deleted': handleDeleted
    };
    
    // Register event handlers
    Object.entries(eventHandlers).forEach(([event, handler]) => {
      socketRef.current?.on(event as AgentEvent, handler);
    });
    
    // Return cleanup function
    return () => {
      if (!socketRef.current) return;
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        socketRef.current?.off(event as AgentEvent, handler);
      });
    };
  }, []);
  
  return {
    isConnected,
    error,
    subscribeToAgentEvents,
    socket: socketRef.current,
  };
}