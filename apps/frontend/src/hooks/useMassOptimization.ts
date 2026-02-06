import {
  MassOptimizationConfig,
  OptimizationJob,
  TopologyOptimizationConfig,
} from '@the-new-fuse/types';
import { useCallback, useState } from 'react';

export const useMassOptimization = () => {
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

  const optimizeAgent = useCallback(
    async (agentId: string, config: MassOptimizationConfig): Promise<{ job: OptimizationJob }> => {
      return apiCall(`/optimize/agent/${agentId}`, {
        method: 'POST',
        body: JSON.stringify(config),
      });
    },
    [apiCall]
  );

  const optimizeTopology = useCallback(
    async (
      agentIds: string[],
      config: TopologyOptimizationConfig
    ): Promise<{ job: OptimizationJob }> => {
      return apiCall('/optimize/topology', {
        method: 'POST',
        body: JSON.stringify({ agentIds, config }),
      });
    },
    [apiCall]
  );

  const optimizeWorkflow = useCallback(
    async (
      topologyId: string,
      config: MassOptimizationConfig
    ): Promise<{ job: OptimizationJob }> => {
      return apiCall(`/optimize/workflow/${topologyId}`, {
        method: 'POST',
        body: JSON.stringify(config),
      });
    },
    [apiCall]
  );

  const runFullOptimization = useCallback(
    async (
      agentIds: string[],
      config: TopologyOptimizationConfig
    ): Promise<{ finalTopologyId: string; jobIds: string[] }> => {
      return apiCall('/optimize/full', {
        method: 'POST',
        body: JSON.stringify({ agentIds, config }),
      });
    },
    [apiCall]
  );

  const createOptimizedAgent = useCallback(
    async (
      agentId: string,
      config: MassOptimizationConfig
    ): Promise<{ optimizedAgent: any; optimizationJob: OptimizationJob }> => {
      return apiCall(`/agents/${agentId}/create-optimized`, {
        method: 'POST',
        body: JSON.stringify(config),
      });
    },
    [apiCall]
  );

  const getOptimizationJob = useCallback(
    async (jobId: string): Promise<OptimizationJob> => {
      return apiCall(`/jobs/${jobId}`);
    },
    [apiCall]
  );

  const getUserOptimizationJobs = useCallback(
    async (status?: string, type?: string): Promise<OptimizationJob[]> => {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      if (type) params.append('type', type);

      const result = await apiCall(`/jobs?${params.toString()}`);
      return result.jobs;
    },
    [apiCall]
  );

  const getAgentOptimizationHistory = useCallback(
    async (agentId: string) => {
      return apiCall(`/agents/${agentId}/history`);
    },
    [apiCall]
  );

  const createValidationDataset = useCallback(
    async (datasetData: {
      name: string;
      description?: string;
      items: Array<{ input: any; expectedOutput: any }>;
    }) => {
      return apiCall('/validate/dataset', {
        method: 'POST',
        body: JSON.stringify(datasetData),
      });
    },
    [apiCall]
  );

  const getUserValidationDatasets = useCallback(async () => {
    const result = await apiCall('/validate/datasets');
    return result.datasets;
  }, [apiCall]);

  const getAgentPerformanceAnalytics = useCallback(
    async (agentId: string, timeRange?: string) => {
      const params = new URLSearchParams();
      if (timeRange) params.append('timeRange', timeRange);

      return apiCall(`/analytics/performance/${agentId}?${params.toString()}`);
    },
    [apiCall]
  );

  const getTopologyPerformanceAnalytics = useCallback(
    async (topologyId: string) => {
      return apiCall(`/analytics/topology/${topologyId}`);
    },
    [apiCall]
  );

  const exportOptimizedAgent = useCallback(
    async (agentId: string) => {
      return apiCall(`/export/agent/${agentId}`);
    },
    [apiCall]
  );

  const importOptimizedAgent = useCallback(
    async (importData: any) => {
      return apiCall('/import/agent', {
        method: 'POST',
        body: JSON.stringify(importData),
      });
    },
    [apiCall]
  );

  const exportOptimizedTopology = useCallback(
    async (topologyId: string) => {
      return apiCall(`/export/topology/${topologyId}`);
    },
    [apiCall]
  );

  const importOptimizedTopology = useCallback(
    async (importData: any) => {
      return apiCall('/import/topology', {
        method: 'POST',
        body: JSON.stringify(importData),
      });
    },
    [apiCall]
  );

  return {
    // Core optimization functions
    optimizeAgent,
    optimizeTopology,
    optimizeWorkflow,
    runFullOptimization,
    createOptimizedAgent,

    // Job management
    getOptimizationJob,
    getUserOptimizationJobs,
    getAgentOptimizationHistory,

    // Validation datasets
    createValidationDataset,
    getUserValidationDatasets,

    // Analytics
    getAgentPerformanceAnalytics,
    getTopologyPerformanceAnalytics,

    // Import/Export
    exportOptimizedAgent,
    importOptimizedAgent,
    exportOptimizedTopology,
    importOptimizedTopology,

    // State
    loading,
    error,
  };
};
