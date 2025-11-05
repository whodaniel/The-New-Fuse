import { MassOptimizationConfig, TopologyOptimizationConfig, OptimizationJob } from '@the-new-fuse/types';
import { MassOrchestrationService } from './mass-orchestration.service';
import { PromptOptimizerService } from './prompt-optimizer.service';
import { TopologyOptimizerService } from './topology-optimizer.service';
import { WorkflowPromptOptimizerService } from './workflow-prompt-optimizer.service';
import { AggregateService } from './building-blocks/aggregate.service';
import { ReflectService } from './building-blocks/reflect.service';
import { DebateService } from './building-blocks/debate.service';
export declare class MassController {
    private readonly massOrchestration;
    private readonly promptOptimizer;
    private readonly topologyOptimizer;
    private readonly workflowOptimizer;
    private readonly aggregateService;
    private readonly reflectService;
    private readonly debateService;
    constructor(massOrchestration: MassOrchestrationService, promptOptimizer: PromptOptimizerService, topologyOptimizer: TopologyOptimizerService, workflowOptimizer: WorkflowPromptOptimizerService, aggregateService: AggregateService, reflectService: ReflectService, debateService: DebateService);
    optimizeAgentPrompt(agentId: string, config: MassOptimizationConfig, user: any): Promise<{
        job: OptimizationJob;
    }>;
    optimizeTopology(request: {
        agentIds: string[];
        config: TopologyOptimizationConfig;
    }, user: any): Promise<{
        job: OptimizationJob;
    }>;
    optimizeWorkflowPrompts(topologyId: string, config: MassOptimizationConfig, user: any): Promise<{
        job: OptimizationJob;
    }>;
    runFullOptimization(request: {
        agentIds: string[];
        config: TopologyOptimizationConfig;
    }, user: any): Promise<{
        finalTopologyId: string;
        jobIds: string[];
    }>;
    createOptimizedAgent(agentId: string, config: MassOptimizationConfig, user: any): Promise<{
        optimizedAgent: any;
        optimizationJob: OptimizationJob;
    }>;
    getOptimizationJob(jobId: string): Promise<OptimizationJob>;
    getUserOptimizationJobs(user: any, status?: string, type?: string): Promise<{
        jobs: OptimizationJob[];
    }>;
    getAgentOptimizationHistory(agentId: string, user: any): Promise<{
        promptVersions: any[];
        optimizationJobs: OptimizationJob[];
    }>;
    executeAggregate(request: {
        agentIds: string[];
        input: any;
        aggregationStrategy: 'majority_vote' | 'weighted_average' | 'consensus';
        parallelExecution?: boolean;
    }, user: any): Promise<{
        result: any;
        executionMetrics: any;
    }>;
    executeReflect(request: {
        predictorAgentId: string;
        reflectorAgentId: string;
        input: any;
        maxRounds?: number;
    }, user: any): Promise<{
        result: any;
        executionMetrics: any;
    }>;
    executeDebate(request: {
        debaterAgentIds: string[];
        input: any;
        debateRounds?: number;
        votingStrategy?: 'majority' | 'weighted' | 'consensus';
    }, user: any): Promise<{
        result: any;
        executionMetrics: any;
    }>;
    createValidationDataset(request: {
        name: string;
        description?: string;
        items: Array<{
            input: any;
            expectedOutput: any;
        }>;
    }, user: any): Promise<{
        datasetId: string;
    }>;
    getUserValidationDatasets(user: any): Promise<{
        datasets: any[];
    }>;
    getAgentPerformanceAnalytics(agentId: string, user: any, timeRange?: string): Promise<{
        performanceHistory: any[];
        improvementTrend: number;
        averageMetrics: any;
    }>;
    getTopologyPerformanceAnalytics(topologyId: string, user: any): Promise<{
        nodePerformance: Record<string, any>;
        bottlenecks: string[];
        optimizationSuggestions: string[];
    }>;
    exportOptimizedAgent(agentId: string, user: any): Promise<{
        exportData: any;
    }>;
    importOptimizedAgent(importData: any, user: any): Promise<{
        importedAgentId: string;
    }>;
    exportOptimizedTopology(topologyId: string, user: any): Promise<{
        exportData: any;
    }>;
    importOptimizedTopology(importData: any, user: any): Promise<{
        importedTopologyId: string;
    }>;
}
//# sourceMappingURL=mass.controller.d.ts.map