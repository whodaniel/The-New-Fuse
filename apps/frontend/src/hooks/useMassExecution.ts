import { useCallback, useState } from 'react';

export const useMassExecution = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async (url: string, options: RequestInit = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/mass${url}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const executeAggregate = useCallback(
    async (
      agentIds: string[],
      input: any,
      config: {
        aggregationStrategy: 'majority_vote' | 'weighted_average' | 'consensus';
        parallelExecution?: boolean;
      }
    ) => {
      return apiCall('/execute/aggregate', {
        method: 'POST',
        body: JSON.stringify({
          agentIds,
          input,
          ...config,
        }),
      });
    },
    [apiCall]
  );

  const executeReflect = useCallback(
    async (
      predictorAgentId: string,
      reflectorAgentId: string,
      input: any,
      config: {
        maxRounds?: number;
      }
    ) => {
      return apiCall('/execute/reflect', {
        method: 'POST',
        body: JSON.stringify({
          predictorAgentId,
          reflectorAgentId,
          input,
          ...config,
        }),
      });
    },
    [apiCall]
  );

  const executeDebate = useCallback(
    async (
      debaterAgentIds: string[],
      input: any,
      config: {
        debateRounds?: number;
        votingStrategy?: 'majority' | 'weighted' | 'consensus';
      }
    ) => {
      return apiCall('/execute/debate', {
        method: 'POST',
        body: JSON.stringify({
          debaterAgentIds,
          input,
          ...config,
        }),
      });
    },
    [apiCall]
  );

  const executeCustomAgent = useCallback(
    async (agentId: string, input: any, config: any) => {
      return apiCall('/execute/custom', {
        method: 'POST',
        body: JSON.stringify({
          agentId,
          input,
          config,
        }),
      });
    },
    [apiCall]
  );

  const executeToolUse = useCallback(
    async (agentId: string, toolName: string, input: any, config: any) => {
      return apiCall('/execute/tool-use', {
        method: 'POST',
        body: JSON.stringify({
          agentId,
          toolName,
          input,
          config,
        }),
      });
    },
    [apiCall]
  );

  return {
    executeAggregate,
    executeReflect,
    executeDebate,
    executeCustomAgent,
    executeToolUse,
    loading,
    error,
  };
};
