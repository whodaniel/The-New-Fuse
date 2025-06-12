import React, { createContext, useContext, useEffect, useState } from 'react';
import { useA2A, A2AConnectionConfig, A2AHookReturn } from './useA2A';
import { AgentRegistration, A2AMessage, AgentStatus } from '@the-new-fuse/a2a-core';

interface A2AContextType extends A2AHookReturn {
  agents: AgentRegistration[];
  refreshAgents: () => Promise<void>;
}

const A2AContext = createContext<A2AContextType | null>(null);

export interface A2AProviderProps {
  children: React.ReactNode;
  config: A2AConnectionConfig;
  autoConnect?: boolean;
  autoRegister?: boolean;
  agentRegistration?: Omit<AgentRegistration, 'agentId'>;
}

export function A2AProvider({ 
  children, 
  config, 
  autoConnect = true,
  autoRegister = false,
  agentRegistration 
}: A2AProviderProps) {
  const a2a = useA2A(config);
  const [agents, setAgents] = useState<AgentRegistration[]>([]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      a2a.connect().catch(console.error);
    }
  }, [autoConnect, a2a.connect]);

  // Auto-register agent if authenticated and registration provided
  useEffect(() => {
    if (autoRegister && agentRegistration && a2a.connectionState.authenticated) {
      registerCurrentAgent().catch(console.error);
    }
  }, [autoRegister, agentRegistration, a2a.connectionState.authenticated]);

  const registerCurrentAgent = async () => {
    if (!agentRegistration) return;

    const registration: AgentRegistration = {
      ...agentRegistration,
      agentId: config.agentId
    };

    try {
      const response = await fetch(`${config.url.replace('/a2a', '')}/a2a/agents/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(config.token && { 'Authorization': `Bearer ${config.token}` })
        },
        body: JSON.stringify(registration)
      });

      if (!response.ok) {
        throw new Error(`Registration failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to register agent:', error);
    }
  };

  const refreshAgents = async () => {
    try {
      const discoveredAgents = await a2a.discoverAgents();
      setAgents(discoveredAgents);
    } catch (error) {
      console.error('Failed to refresh agents:', error);
    }
  };

  // Refresh agents when authenticated
  useEffect(() => {
    if (a2a.connectionState.authenticated) {
      refreshAgents();
    }
  }, [a2a.connectionState.authenticated]);

  // Listen for agent registration events
  useEffect(() => {
    const unsubscribe = a2a.onAgentRegistered((agent) => {
      setAgents(prev => {
        const exists = prev.find(a => a.agentId === agent.agentId);
        if (exists) return prev;
        return [...prev, agent];
      });
    });

    return unsubscribe;
  }, [a2a.onAgentRegistered]);

  // Listen for agent disconnections
  useEffect(() => {
    const unsubscribe = a2a.onAgentDisconnected((agentId) => {
      setAgents(prev => prev.filter(a => a.agentId !== agentId));
    });

    return unsubscribe;
  }, [a2a.onAgentDisconnected]);

  const contextValue: A2AContextType = {
    ...a2a,
    agents,
    refreshAgents
  };

  return (
    <A2AContext.Provider value={contextValue}>
      {children}
    </A2AContext.Provider>
  );
}

export function useA2AContext(): A2AContextType {
  const context = useContext(A2AContext);
  if (!context) {
    throw new Error('useA2AContext must be used within an A2AProvider');
  }
  return context;
}

// Additional specialized hooks

export function useA2AAgents() {
  const { agents, refreshAgents, discoverAgents } = useA2AContext();
  
  const findAgentsByCapability = (capability: string) => {
    return agents.filter(agent => 
      agent.capabilities.some(cap => cap.name === capability)
    );
  };

  const findAgentsByType = (type: string) => {
    return agents.filter(agent => agent.type === type);
  };

  const getOnlineAgents = async () => {
    return discoverAgents({ status: AgentStatus.ONLINE });
  };

  return {
    agents,
    refreshAgents,
    findAgentsByCapability,
    findAgentsByType,
    getOnlineAgents
  };
}

export function useA2AMessages() {
  const { messages, sendMessage, sendRequest, broadcast, onMessage } = useA2AContext();
  const [filteredMessages, setFilteredMessages] = useState<A2AMessage[]>([]);
  const [filters, setFilters] = useState<{
    fromAgent?: string;
    toAgent?: string;
    conversationId?: string;
    type?: string;
  }>({});

  // Apply filters to messages
  useEffect(() => {
    let filtered = messages;

    if (filters.fromAgent) {
      filtered = filtered.filter(msg => msg.fromAgent === filters.fromAgent);
    }
    if (filters.toAgent) {
      filtered = filtered.filter(msg => msg.toAgent === filters.toAgent);
    }
    if (filters.conversationId) {
      filtered = filtered.filter(msg => msg.conversationId === filters.conversationId);
    }
    if (filters.type) {
      filtered = filtered.filter(msg => msg.type === filters.type);
    }

    setFilteredMessages(filtered);
  }, [messages, filters]);

  return {
    messages: filteredMessages,
    allMessages: messages,
    sendMessage,
    sendRequest,
    broadcast,
    onMessage,
    filters,
    setFilters
  };
}

export function useA2AConversations() {
  const { joinConversation, leaveConversation, messages } = useA2AContext();
  const [conversations, setConversations] = useState<Map<string, A2AMessage[]>>(new Map());

  // Group messages by conversation
  useEffect(() => {
    const convMap = new Map<string, A2AMessage[]>();
    
    messages.forEach(message => {
      if (message.conversationId) {
        if (!convMap.has(message.conversationId)) {
          convMap.set(message.conversationId, []);
        }
        convMap.get(message.conversationId)!.push(message);
      }
    });

    setConversations(convMap);
  }, [messages]);

  const getConversationMessages = (conversationId: string) => {
    return conversations.get(conversationId) || [];
  };

  return {
    conversations: Array.from(conversations.entries()).map(([id, msgs]) => ({
      id,
      messages: msgs,
      lastMessage: msgs[msgs.length - 1],
      participantCount: new Set(msgs.map(m => m.fromAgent)).size
    })),
    getConversationMessages,
    joinConversation,
    leaveConversation
  };
}
