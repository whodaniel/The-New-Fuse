import { useState, useEffect, useCallback } from 'react';
import api from '../services/api.js';
import { useAgentRealtime } from './useAgentRealtime.js';

export interface Agent {
  id: string;
  name: string;
  type: string;
  status?: 'active' | 'inactive' | 'error';
  description?: string;
  capabilities?: string[];
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UseAgentsResult {
  agents: Agent[];
  loading: boolean;
  error: Error | null;
  fetchAgents: () => Promise<void>;
  getAgent: (id: string) => Promise<Agent | null>;
  createAgent: (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Agent>;
  updateAgent: (id: string, data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>) => Promise<Agent | null>;
  deleteAgent: (id: string) => Promise<boolean>;
  isRealtimeConnected: boolean;
}

export function useAgents(realtimeEnabled = true): UseAgentsResult {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  // Initialize real-time updates
  const { isConnected: isRealtimeConnected, subscribeToAgentEvents } = useAgentRealtime({
    enabled: realtimeEnabled
  });

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/api/agents');
      if (response.data.success) {
        setAgents(response.data.data);
      } else {
        throw new Error(response.data.error || 'Failed to fetch agents');
      }
    } catch (err) {
      console.error('Error fetching agents:', err);
      setError(err instanceof Error ? err : new Error('Unknown error occurred'));
    } finally {
      setLoading(false);
    }
  }, []);

  const getAgent = useCallback(async (id: string): Promise<Agent | null> => {
    try {
      const response = await api.get(`/api/agents/${id}`);
      if (response.data.success) {
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error(`Error fetching agent ${id}:`, err);
      return null;
    }
  }, []);

  const createAgent = useCallback(async (agent: Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>): Promise<Agent> => {
    try {
      const response = await api.post('/api/agents', agent);
      if (response.data.success) {
        // Note: No need to update local state here as the WebSocket will handle it
        return response.data.data;
      }
      throw new Error(response.data.error || 'Failed to create agent');
    } catch (err) {
      console.error('Error creating agent:', err);
      throw err instanceof Error ? err : new Error('Unknown error occurred');
    }
  }, []);

  const updateAgent = useCallback(async (
    id: string, 
    data: Partial<Omit<Agent, 'id' | 'createdAt' | 'updatedAt'>>
  ): Promise<Agent | null> => {
    try {
      const response = await api.put(`/api/agents/${id}`, data);
      if (response.data.success) {
        // Note: No need to update local state here as the WebSocket will handle it
        return response.data.data;
      }
      return null;
    } catch (err) {
      console.error(`Error updating agent ${id}:`, err);
      return null;
    }
  }, []);

  const deleteAgent = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await api.delete(`/api/agents/${id}`);
      if (response.data.success) {
        // Note: No need to update local state here as the WebSocket will handle it
        return true;
      }
      return false;
    } catch (err) {
      console.error(`Error deleting agent ${id}:`, err);
      return false;
    }
  }, []);

  // Setup real-time updates for agents
  useEffect(() => {
    if (!realtimeEnabled) return;
    
    const unsubscribe = subscribeToAgentEvents(
      // Handle agent creation
      (newAgent) => {
        setAgents(prevAgents => [...prevAgents, newAgent]);
      },
      // Handle agent update
      (updatedAgent) => {
        setAgents(prevAgents => 
          prevAgents.map(agent => 
            agent.id === updatedAgent.id ? updatedAgent : agent
          )
        );
      },
      // Handle agent deletion
      (deletedAgent) => {
        setAgents(prevAgents => 
          prevAgents.filter(agent => agent.id !== deletedAgent.id)
        );
      }
    );
    
    return unsubscribe;
  }, [realtimeEnabled, subscribeToAgentEvents]);

  // Initial data fetch
  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  return {
    agents,
    loading,
    error,
    fetchAgents,
    getAgent,
    createAgent,
    updateAgent,
    deleteAgent,
    isRealtimeConnected
  };
}