import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  A2AMessage,
  AgentRegistration,
  AgentHeartbeat,
  AgentStatus,
  MessageType,
  Priority,
  A2AError
} from '@the-new-fuse/a2a-core';

export interface A2AConnectionConfig {
  url: string;
  agentId: string;
  token?: string;
  signature?: string;
}

export interface A2AConnectionState {
  connected: boolean;
  authenticated: boolean;
  connecting: boolean;
  error: string | null;
  lastHeartbeat: Date | null;
}

export interface A2AHookReturn {
  // Connection state
  connectionState: A2AConnectionState;
  
  // Connection management
  connect: () => Promise<void>;
  disconnect: () => void;
  
  // Messaging
  sendMessage: (message: Omit<A2AMessage, 'id' | 'timestamp' | 'fromAgent'>) => Promise<void>;
  sendRequest: (toAgent: string, payload: any, options?: {
    timeout?: number;
    conversationId?: string;
  }) => Promise<A2AMessage>;
  broadcast: (payload: any, options?: {
    channel?: string;
    topic?: string;
  }) => Promise<void>;
  
  // Conversations
  joinConversation: (conversationId: string) => Promise<void>;
  leaveConversation: (conversationId: string) => Promise<void>;
  
  // Agent discovery
  discoverAgents: (criteria?: {
    type?: string;
    capabilities?: string[];
    status?: AgentStatus;
  }) => Promise<AgentRegistration[]>;
  
  // Health
  sendHeartbeat: (data: Omit<AgentHeartbeat, 'agentId' | 'timestamp'>) => Promise<void>;
  
  // Event listeners
  onMessage: (callback: (message: A2AMessage) => void) => () => void;
  onAgentRegistered: (callback: (agent: AgentRegistration) => void) => () => void;
  onAgentDisconnected: (callback: (agentId: string) => void) => () => void;
  onError: (callback: (error: A2AError) => void) => () => void;
  
  // Current data
  messages: A2AMessage[];
  connectedAgents: string[];
}

export function useA2A(config: A2AConnectionConfig): A2AHookReturn {
  const [connectionState, setConnectionState] = useState<A2AConnectionState>({
    connected: false,
    authenticated: false,
    connecting: false,
    error: null,
    lastHeartbeat: null
  });
  
  const [messages, setMessages] = useState<A2AMessage[]>([]);
  const [connectedAgents, setConnectedAgents] = useState<string[]>([]);
  
  const socketRef = useRef<Socket | null>(null);
  const eventListenersRef = useRef<Map<string, Set<Function>>>(new Map());
  const pendingRequestsRef = useRef<Map<string, {
    resolve: (value: A2AMessage) => void;
    reject: (reason: any) => void;
    timeout: NodeJS.Timeout;
  }>>(new Map());

  // Connection management
  const connect = useCallback(async () => {
    if (socketRef.current?.connected) {
      return;
    }

    setConnectionState(prev => ({ ...prev, connecting: true, error: null }));

    try {
      const socket = io(`${config.url}/a2a`, {
        transports: ['websocket', 'polling'],
        autoConnect: false
      });

      socketRef.current = socket;

      // Set up socket event listeners
      socket.on('connect', () => {
        setConnectionState(prev => ({ ...prev, connected: true, connecting: false }));
        
        // Authenticate immediately after connection
        socket.emit('authenticate', {
          agentId: config.agentId,
          token: config.token,
          signature: config.signature
        });
      });

      socket.on('disconnect', () => {
        setConnectionState(prev => ({ 
          ...prev, 
          connected: false, 
          authenticated: false,
          connecting: false 
        }));
        setConnectedAgents([]);
      });

      socket.on('authentication:success', () => {
        setConnectionState(prev => ({ ...prev, authenticated: true }));
      });

      socket.on('authentication:failed', (data: any) => {
        setConnectionState(prev => ({ 
          ...prev, 
          error: data.message || 'Authentication failed',
          connecting: false
        }));
        socket.disconnect();
      });

      socket.on('message:received', (message: A2AMessage) => {
        setMessages(prev => [...prev, message]);
        
        // Handle responses to pending requests
        if (message.type === MessageType.RESPONSE && message.requestId) {
          const pending = pendingRequestsRef.current.get(message.requestId);
          if (pending) {
            clearTimeout(pending.timeout);
            pendingRequestsRef.current.delete(message.requestId);
            pending.resolve(message);
          }
        }
        
        // Emit to listeners
        const listeners = eventListenersRef.current.get('message') || new Set();
        listeners.forEach(callback => callback(message));
      });

      socket.on('agent:registered', (agent: AgentRegistration) => {
        const listeners = eventListenersRef.current.get('agentRegistered') || new Set();
        listeners.forEach(callback => callback(agent));
      });

      socket.on('agent:disconnected', (data: { agentId: string }) => {
        setConnectedAgents(prev => prev.filter(id => id !== data.agentId));
        const listeners = eventListenersRef.current.get('agentDisconnected') || new Set();
        listeners.forEach(callback => callback(data.agentId));
      });

      socket.on('heartbeat:received', (heartbeat: AgentHeartbeat) => {
        setConnectionState(prev => ({ ...prev, lastHeartbeat: new Date() }));
      });

      socket.on('error', (error: any) => {
        const a2aError = new A2AError(error.message || 'Unknown error', error.code || 'UNKNOWN');
        setConnectionState(prev => ({ ...prev, error: a2aError.message }));
        
        const listeners = eventListenersRef.current.get('error') || new Set();
        listeners.forEach(callback => callback(a2aError));
      });

      // Connect the socket
      socket.connect();

    } catch (error) {
      setConnectionState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Connection failed',
        connecting: false
      }));
    }
  }, [config]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    // Clear pending requests
    pendingRequestsRef.current.forEach(({ reject, timeout }) => {
      clearTimeout(timeout);
      reject(new Error('Connection closed'));
    });
    pendingRequestsRef.current.clear();
    
    setConnectionState({
      connected: false,
      authenticated: false,
      connecting: false,
      error: null,
      lastHeartbeat: null
    });
    setMessages([]);
    setConnectedAgents([]);
  }, []);

  // Messaging functions
  const sendMessage = useCallback(async (messageData: Omit<A2AMessage, 'id' | 'timestamp' | 'fromAgent'>) => {
    if (!socketRef.current?.connected || !connectionState.authenticated) {
      throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
    }

    const message: A2AMessage = {
      ...messageData,
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      fromAgent: config.agentId,
      protocolVersion: '1.0.0'
    };

    socketRef.current.emit('send:message', message);
  }, [config.agentId, connectionState.authenticated]);

  const sendRequest = useCallback(async (
    toAgent: string, 
    payload: any, 
    options: { timeout?: number; conversationId?: string } = {}
  ): Promise<A2AMessage> => {
    if (!socketRef.current?.connected || !connectionState.authenticated) {
      throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
    }

    const requestId = crypto.randomUUID();
    const timeout = options.timeout || 30000;

    return new Promise((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        pendingRequestsRef.current.delete(requestId);
        reject(new A2AError(`Request timeout after ${timeout}ms`, 'TIMEOUT'));
      }, timeout);

      pendingRequestsRef.current.set(requestId, {
        resolve,
        reject,
        timeout: timeoutHandle
      });

      const message: A2AMessage = {
        id: crypto.randomUUID(),
        protocolVersion: '1.0.0',
        timestamp: new Date().toISOString(),
        fromAgent: config.agentId,
        toAgent,
        type: MessageType.REQUEST,
        priority: Priority.MEDIUM,
        requestId,
        conversationId: options.conversationId,
        payload
      };

      socketRef.current!.emit('send:message', message);
    });
  }, [config.agentId, connectionState.authenticated]);

  const broadcast = useCallback(async (payload: any, options: {
    channel?: string;
    topic?: string;
  } = {}) => {
    if (!socketRef.current?.connected || !connectionState.authenticated) {
      throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
    }

    socketRef.current.emit('send:broadcast', {
      payload,
      channel: options.channel,
      topic: options.topic
    });
  }, [connectionState.authenticated]);

  // Conversation management
  const joinConversation = useCallback(async (conversationId: string) => {
    if (!socketRef.current?.connected || !connectionState.authenticated) {
      throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
    }

    socketRef.current.emit('join:conversation', { conversationId });
  }, [connectionState.authenticated]);

  const leaveConversation = useCallback(async (conversationId: string) => {
    if (!socketRef.current?.connected || !connectionState.authenticated) {
      throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
    }

    socketRef.current.emit('leave:conversation', { conversationId });
  }, [connectionState.authenticated]);

  // Agent discovery
  const discoverAgents = useCallback(async (criteria?: {
    type?: string;
    capabilities?: string[];
    status?: AgentStatus;
  }): Promise<AgentRegistration[]> => {
    if (!socketRef.current?.connected || !connectionState.authenticated) {
      throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
    }

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new A2AError('Discovery timeout', 'TIMEOUT'));
      }, 10000);

      socketRef.current!.once('agents:discovered', (agents: AgentRegistration[]) => {
        clearTimeout(timeout);
        resolve(agents);
      });

      socketRef.current!.once('discovery:error', (error: any) => {
        clearTimeout(timeout);
        reject(new A2AError(error.message, error.code));
      });

      socketRef.current!.emit('discover:agents', criteria || {});
    });
  }, [connectionState.authenticated]);

  // Health management
  const sendHeartbeat = useCallback(async (data: Omit<AgentHeartbeat, 'agentId' | 'timestamp'>) => {
    if (!socketRef.current?.connected || !connectionState.authenticated) {
      throw new A2AError('Not connected or authenticated', 'NOT_CONNECTED');
    }

    socketRef.current.emit('send:heartbeat', data);
  }, [connectionState.authenticated]);

  // Event listener management
  const addEventListener = useCallback((event: string, callback: Function): (() => void) => {
    if (!eventListenersRef.current.has(event)) {
      eventListenersRef.current.set(event, new Set());
    }
    eventListenersRef.current.get(event)!.add(callback);

    return () => {
      eventListenersRef.current.get(event)?.delete(callback);
    };
  }, []);

  const onMessage = useCallback((callback: (message: A2AMessage) => void) => {
    return addEventListener('message', callback);
  }, [addEventListener]);

  const onAgentRegistered = useCallback((callback: (agent: AgentRegistration) => void) => {
    return addEventListener('agentRegistered', callback);
  }, [addEventListener]);

  const onAgentDisconnected = useCallback((callback: (agentId: string) => void) => {
    return addEventListener('agentDisconnected', callback);
  }, [addEventListener]);

  const onError = useCallback((callback: (error: A2AError) => void) => {
    return addEventListener('error', callback);
  }, [addEventListener]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connectionState,
    connect,
    disconnect,
    sendMessage,
    sendRequest,
    broadcast,
    joinConversation,
    leaveConversation,
    discoverAgents,
    sendHeartbeat,
    onMessage,
    onAgentRegistered,
    onAgentDisconnected,
    onError,
    messages,
    connectedAgents
  };
}
