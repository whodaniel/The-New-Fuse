import { useState, useEffect, useCallback } from 'react';

export interface Agent {
  id: string;
  name: string;
  type: string;
  description?: string;
  capabilities: string[];
  metadata: Record<string, any>;
}

export const useAgentsWorkflow = () => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Load agents from API
  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      // In a real app, this would fetch agents from an API
      // For now, we'll just simulate a delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data
      const mockAgents: Agent[] = [
        {
          id: 'agent-1',
          name: 'Code Assistant',
          type: 'code',
          description: 'Helps with coding tasks and code analysis',
          capabilities: ['code-generation', 'code-review', 'bug-fixing'],
          metadata: {
            model: 'gpt-4',
            version: '1.0.0'
          }
        },
        {
          id: 'agent-2',
          name: 'Data Analyzer',
          type: 'data',
          description: 'Analyzes data and generates insights',
          capabilities: ['data-analysis', 'visualization', 'reporting'],
          metadata: {
            model: 'gpt-4',
            version: '1.0.0'
          }
        },
        {
          id: 'agent-3',
          name: 'Content Writer',
          type: 'content',
          description: 'Creates and edits content',
          capabilities: ['writing', 'editing', 'summarization'],
          metadata: {
            model: 'gpt-4',
            version: '1.0.0'
          }
        },
        {
          id: 'agent-4',
          name: 'Bug Hunter',
          type: 'code',
          description: 'Identifies and fixes bugs in code',
          capabilities: ['bug-detection', 'bug-fixing', 'testing'],
          metadata: {
            model: 'gpt-4',
            version: '1.0.0'
          }
        }
      ];
      
      setAgents(mockAgents);
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
