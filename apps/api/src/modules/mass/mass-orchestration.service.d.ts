import { PrismaService } from '@the-new-fuse/database';
import { MassOptimizationConfig, TopologyOptimizationConfig, OptimizationJob, AgentPromptVersion } from '@the-new-fuse/types';
import { PromptOptimizerService } from './prompt-optimizer.service';
import { TopologyOptimizerService } from './topology-optimizer.service';
import { WorkflowPromptOptimizerService } from './workflow-prompt-optimizer.service';
export declare class MassOrchestrationService {
    private readonly prisma;
    private readonly promptOptimizer;
    private readonly topologyOptimizer;
    private readonly workflowOptimizer;
    private readonly logger;
    constructor(prisma: PrismaService, promptOptimizer: PromptOptimizerService, topologyOptimizer: TopologyOptimizerService, workflowOptimizer: WorkflowPromptOptimizerService);
    optimizeAgentPrompt(agentId: string, config: MassOptimizationConfig): Promise<OptimizationJob>;
    optimizeWorkflowTopology(agentIds: string[], config: TopologyOptimizationConfig): Promise<OptimizationJob>;
    optimizeWorkflowPrompts(topologyId: string, config: MassOptimizationConfig): Promise<OptimizationJob>;
    runFullMassOptimization(agentIds: string[], config: TopologyOptimizationConfig): Promise<{
        finalTopologyId: string;
        jobIds: string[];
    }>;
    createOptimizedAgent(sourceAgentId: string, config: MassOptimizationConfig): Promise<{
        optimizedAgent: any;
        optimizationJob: OptimizationJob;
    }>;
    getOptimizationJob(jobId: string): Promise<OptimizationJob>;
    getUserOptimizationJobs(userId: string, status?: string, type?: string): Promise<OptimizationJob[]>;
    getAgentOptimizationHistory(agentId: string, userId: string): Promise<{
        promptVersions: AgentPromptVersion[];
        optimizationJobs: OptimizationJob[];
    }>;
    private createOptimizationJob;
    private updateJobStatus;
    private updateJobResults;
    private calculateImprovement;
    private waitForJobsCompletion;
}
//# sourceMappingURL=mass-orchestration.service.d.ts.map