import { useState, useEffect, useCallback } from 'react';
import { agentService, Agent } from '@/services/AgentService';

export const useAgentsWorkflow = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Load agents from API
  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedAgents = await agentService.getAgents();
      setAgents(fetchedAgents);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load agents'));
    } finally {
      setLoading(false);
    }
  }, []);
  
  // Load agents on mount
  useEffect(() => {
    loadAgents();
  }, [loadAgents]);
  
  return {
    agents,
    loading,
    error,
    loadAgents
  };
};

export default useAgentsWorkflow;
