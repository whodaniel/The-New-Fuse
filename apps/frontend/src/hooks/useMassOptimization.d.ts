import { MassOptimizationConfig, TopologyOptimizationConfig, OptimizationJob } from '@the-new-fuse/types';
export declare const useMassOptimization: () => {
    optimizeAgent: (agentId: string, config: MassOptimizationConfig) => Promise<{
        job: OptimizationJob;
    }>;
    optimizeTopology: (agentIds: string[], config: TopologyOptimizationConfig) => Promise<{
        job: OptimizationJob;
    }>;
    optimizeWorkflow: (topologyId: string, config: MassOptimizationConfig) => Promise<{
        job: OptimizationJob;
    }>;
    runFullOptimization: (agentIds: string[], config: TopologyOptimizationConfig) => Promise<{
        finalTopologyId: string;
        jobIds: string[];
    }>;
    createOptimizedAgent: (agentId: string, config: MassOptimizationConfig) => Promise<{
        optimizedAgent: any;
        optimizationJob: OptimizationJob;
    }>;
    getOptimizationJob: (jobId: string) => Promise<OptimizationJob>;
    getUserOptimizationJobs: (status?: string, type?: string) => Promise<OptimizationJob[]>;
    getAgentOptimizationHistory: (agentId: string) => Promise<any>;
    createValidationDataset: (datasetData: {
        name: string;
        description?: string;
        items: Array<{
            input: any;
            expectedOutput: any;
        }>;
    }) => Promise<any>;
    getUserValidationDatasets: () => Promise<any>;
    getAgentPerformanceAnalytics: (agentId: string, timeRange?: string) => Promise<any>;
    getTopologyPerformanceAnalytics: (topologyId: string) => Promise<any>;
    exportOptimizedAgent: (agentId: string) => Promise<any>;
    importOptimizedAgent: (importData: any) => Promise<any>;
    exportOptimizedTopology: (topologyId: string) => Promise<any>;
    importOptimizedTopology: (importData: any) => Promise<any>;
    loading: boolean;
    error: string | null;
};
