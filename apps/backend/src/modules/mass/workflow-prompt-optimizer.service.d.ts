import { PrismaService } from '../../prisma/prisma.service';
import { MassOptimizationConfig, WorkflowTopology } from '@the-new-fuse/types';
import { EvaluationHarnessService } from './prompt-optimizer.service';
export declare class WorkflowPromptOptimizerService {
    private readonly prisma;
    private readonly evaluationHarness;
    private readonly logger;
    constructor(prisma: PrismaService, evaluationHarness: EvaluationHarnessService);
    optimizeWorkflowPrompts(topologyId: string, config: MassOptimizationConfig): Promise<WorkflowTopology>;
    private getTopology;
    private getValidationDataset;
    private optimizePromptsInContext;
    private optimizeNodePromptInWorkflow;
    private getUpstreamContext;
    private getNodePosition;
    private getWorkflowContext;
    private isLinearWorkflow;
    private hasParallelBranches;
    private generateWorkflowAwarePromptCandidates;
    private addWorkflowContextToInstruction;
    private evaluateNodeInWorkflowContext;
    private createWorkflowPromptVersion;
    private getLatestPrompt;
    private evaluateTopology;
    private calculateImprovement;
    private saveOptimizedWorkflow;
}
//# sourceMappingURL=workflow-prompt-optimizer.service.d.ts.map